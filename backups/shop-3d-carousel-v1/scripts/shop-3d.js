import * as THREE from "../vendor/three.module.min.js";

const carousel = document.querySelector("[data-object-carousel]");

if (carousel) {
  const canvas = carousel.querySelector("[data-product-scene]");
  const stage = carousel.querySelector("[data-object-stage]");
  const previous = carousel.querySelector("[data-previous]");
  const next = carousel.querySelector("[data-next]");
  const info = document.querySelector("[data-product-info]");
  const name = document.querySelector("[data-product-name]");
  const price = document.querySelector("[data-product-price]");
  const description = document.querySelector("[data-product-description]");
  const status = document.querySelector("[data-status]");
  const dots = document.querySelector("[data-dots]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const products = [
    {
      name: "Object 01",
      price: "$00.00",
      description: "Placeholder object, polished alloy, open edition.",
      geometry: () => new THREE.TorusKnotGeometry(0.92, 0.24, 180, 28, 2, 3),
      color: 0xf8f7f2,
      roughness: 0.16,
      metalness: 0.68
    },
    {
      name: "Object 02",
      price: "$00.00",
      description: "Placeholder object, pearl composite, open edition.",
      geometry: () => new THREE.IcosahedronGeometry(1.08, 3),
      color: 0xdde8ef,
      roughness: 0.28,
      metalness: 0.42
    },
    {
      name: "Object 03",
      price: "$00.00",
      description: "Placeholder object, translucent resin, open edition.",
      geometry: () => {
        const profile = [
          new THREE.Vector2(0.08, -1.2),
          new THREE.Vector2(0.54, -0.98),
          new THREE.Vector2(0.88, -0.34),
          new THREE.Vector2(0.48, 0.16),
          new THREE.Vector2(0.78, 0.76),
          new THREE.Vector2(0.16, 1.22)
        ];
        return new THREE.LatheGeometry(profile, 96);
      },
      color: 0xe7e0f0,
      roughness: 0.2,
      metalness: 0.3
    }
  ];

  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (error) {
    stage.classList.add("is-unavailable");
  }

  if (renderer) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    const clock = new THREE.Clock();
    const pointer = new THREE.Vector2();
    const pointerCurrent = new THREE.Vector2();
    let activeIndex = 0;
    let pointerStart = null;
    let infoTimer;

    camera.position.set(0, 0, 8.2);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

    scene.add(new THREE.HemisphereLight(0xf3f7ff, 0x08080d, 1.7));

    const keyLight = new THREE.DirectionalLight(0xffffff, 5.2);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xcfdfff, 34, 18, 2);
    rimLight.position.set(-4.5, 1.2, 3.2);
    scene.add(rimLight);

    const lavenderLight = new THREE.PointLight(0xe5d9ff, 22, 16, 2);
    lavenderLight.position.set(4, -2.5, 1.5);
    scene.add(lavenderLight);

    const carouselGroup = new THREE.Group();
    scene.add(carouselGroup);

    const objects = products.map((product, index) => {
      const group = new THREE.Group();
      const material = new THREE.MeshPhysicalMaterial({
        color: product.color,
        metalness: product.metalness,
        roughness: product.roughness,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        iridescence: 0.22,
        iridescenceIOR: 1.32,
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(product.geometry(), material);
      mesh.rotation.set(index * 0.35, index * 0.72, index * 0.18);
      group.add(mesh);
      group.userData = {
        material,
        mesh,
        phase: index * 2.1,
        targetX: 0,
        targetY: 0,
        targetZ: 0,
        targetScale: 1,
        targetOpacity: 1,
        targetRotationY: 0
      };
      carouselGroup.add(group);
      return group;
    });

    const productDots = products.map((product, index) => {
      const dot = document.createElement("button");
      dot.className = "object-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `Show ${product.name}`);
      dot.addEventListener("click", () => showProduct(index));
      dots.appendChild(dot);
      return dot;
    });

    function signedDistance(index) {
      let distance = index - activeIndex;
      const midpoint = products.length / 2;

      if (distance > midpoint) distance -= products.length;
      if (distance < -midpoint) distance += products.length;
      return distance;
    }

    function setTargets(immediate = false) {
      objects.forEach((object, index) => {
        const distance = signedDistance(index);
        const depth = Math.abs(distance);
        const data = object.userData;

        data.targetX = distance * 3.65;
        data.targetY = depth * -0.15;
        data.targetZ = depth * -2.5;
        data.targetScale = depth === 0 ? 1 : 0.58;
        data.targetOpacity = depth === 0 ? 1 : 0.17;
        data.targetRotationY = distance * -0.72;

        if (immediate) {
          object.position.set(data.targetX, data.targetY, data.targetZ);
          object.scale.setScalar(data.targetScale);
          object.rotation.y = data.targetRotationY;
          data.material.opacity = data.targetOpacity;
        }
      });
    }

    function showProduct(index, immediate = false) {
      activeIndex = (index + products.length) % products.length;
      setTargets(immediate || reducedMotion);

      productDots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === activeIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-current", isActive ? "true" : "false");
      });

      status.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(products.length).padStart(2, "0")}`;
      clearTimeout(infoTimer);

      if (immediate || reducedMotion) {
        updateInfo();
      } else {
        info.classList.add("is-changing");
        infoTimer = window.setTimeout(() => {
          updateInfo();
          info.classList.remove("is-changing");
        }, 180);
      }
    }

    function updateInfo() {
      const product = products[activeIndex];
      name.textContent = product.name;
      price.textContent = product.price;
      description.textContent = product.description;
    }

    function resize() {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function animate() {
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      const ease = 1 - Math.exp(-delta * 2.6);

      pointerCurrent.lerp(pointer, 1 - Math.exp(-delta * 2.2));
      carouselGroup.rotation.y += ((pointerCurrent.x * 0.08) - carouselGroup.rotation.y) * ease;
      carouselGroup.rotation.x += ((pointerCurrent.y * -0.045) - carouselGroup.rotation.x) * ease;

      objects.forEach((object) => {
        const data = object.userData;
        object.position.x += (data.targetX - object.position.x) * ease;
        object.position.y += (data.targetY - object.position.y) * ease;
        object.position.z += (data.targetZ - object.position.z) * ease;
        object.scale.setScalar(object.scale.x + (data.targetScale - object.scale.x) * ease);
        object.rotation.y += (data.targetRotationY - object.rotation.y) * ease;
        data.material.opacity += (data.targetOpacity - data.material.opacity) * ease;

        if (!reducedMotion) {
          data.mesh.position.y = Math.sin(elapsed * 0.72 + data.phase) * 0.12;
          data.mesh.rotation.x += delta * 0.11;
          data.mesh.rotation.z += delta * 0.075;
        }
      });

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    previous.addEventListener("click", () => showProduct(activeIndex - 1));
    next.addEventListener("click", () => showProduct(activeIndex + 1));

    carousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") showProduct(activeIndex - 1);
      if (event.key === "ArrowRight") showProduct(activeIndex + 1);
    });

    stage.addEventListener("pointermove", (event) => {
      const bounds = stage.getBoundingClientRect();
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        ((event.clientY - bounds.top) / bounds.height) * 2 - 1
      );
    });

    stage.addEventListener("pointerleave", () => pointer.set(0, 0));
    stage.addEventListener("pointerdown", (event) => {
      pointerStart = event.clientX;
      stage.setPointerCapture(event.pointerId);
    });
    stage.addEventListener("pointerup", (event) => {
      if (pointerStart !== null) {
        const distance = event.clientX - pointerStart;
        if (Math.abs(distance) > 42) showProduct(activeIndex + (distance < 0 ? 1 : -1));
      }
      pointerStart = null;
    });

    new ResizeObserver(resize).observe(stage);
    showProduct(0, true);
    resize();
    animate();
  }
}
