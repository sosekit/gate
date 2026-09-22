import * as THREE from "../vendor/three.module.min.js";

const CAROUSEL_SETTINGS = {
  cameraDepth: 8.2,
  spacing: 3.15,
  depth: 2.15,
  activeScale: 0.656,
  inactiveScale: 0.4,
  transitionSpeed: 4.6,
  floatHeight: 0.12,
  floatSpeed: 0.72,
  rotationSpeed: 0.11
};

function createGeometry(shape) {
  const geometries = {
    "torus-knot": () => new THREE.TorusKnotGeometry(0.92, 0.24, 180, 28, 2, 3),
    icosahedron: () => new THREE.IcosahedronGeometry(1.08, 3),
    shell: () => {
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
    sphere: () => new THREE.SphereGeometry(1.02, 72, 48),
    octahedron: () => new THREE.OctahedronGeometry(1.08, 2),
    torus: () => new THREE.TorusGeometry(0.86, 0.28, 36, 120),
    box: () => new THREE.BoxGeometry(1.65, 1.65, 1.65, 8, 8, 8)
  };

  return (geometries[shape] || geometries.sphere)();
}

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
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const products = window.FOOLS_GATE_CONTENT?.products?.length
    ? window.FOOLS_GATE_CONTENT.products
    : [{ name: "sdjhkdhfd", price: "$00.00", description: "jshdf kjshdfk dhfksj.", shape: "sphere", color: "#f8f7f2", roughness: 0.2, metalness: 0.5 }];

  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (error) {
    stage.classList.add("is-unavailable");
  }

  if (renderer) {
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffffff, 8, 18);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    const clock = new THREE.Clock();
    const pointer = new THREE.Vector2();
    const pointerCurrent = new THREE.Vector2();
    let activeIndex = 0;
    let pointerStart = null;
    let infoTimer;

    camera.position.set(0, 0, CAROUSEL_SETTINGS.cameraDepth);
    renderer.setClearColor(0xffffff, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;

    scene.add(new THREE.HemisphereLight(0xffffff, 0xf7f3ff, 2.5));
    scene.add(new THREE.AmbientLight(0xffffff, 1.4));

    const keyLight = new THREE.DirectionalLight(0xffffff, 4);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf3edff, 3);
    fillLight.position.set(-4, -2, 5);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xd7e8ff, 24, 18, 2);
    rimLight.position.set(-4.5, 1.2, 3.2);
    scene.add(rimLight);

    const lavenderLight = new THREE.PointLight(0xe5d5ff, 22, 16, 2);
    lavenderLight.position.set(4, -2.5, 1.5);
    scene.add(lavenderLight);

    const carouselGroup = new THREE.Group();
    scene.add(carouselGroup);

    const objects = products.map((product, index) => {
      const group = new THREE.Group();
      const material = new THREE.MeshPhysicalMaterial({
        color: product.color,
        metalness: product.metalness * 0.22,
        roughness: Math.max(product.roughness, 0.26),
        emissive: product.color,
        emissiveIntensity: 0.13,
        sheen: 0.8,
        sheenColor: product.color,
        sheenRoughness: 0.48,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        iridescence: 0.34,
        iridescenceIOR: 1.32,
        transparent: false
      });
      const mesh = new THREE.Mesh(createGeometry(product.shape), material);
      mesh.rotation.set(index * 0.35, index * 0.72, index * 0.18);
      group.add(mesh);
      group.userData = {
        mesh,
        phase: index * 2.1,
        targetX: 0,
        targetY: 0,
        targetZ: 0,
        targetScale: 1,
        targetRotationY: 0
      };
      carouselGroup.add(group);
      return group;
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

        data.targetX = distance * CAROUSEL_SETTINGS.spacing;
        data.targetY = -0.35 + depth * -0.1;
        data.targetZ = depth * -CAROUSEL_SETTINGS.depth;
        data.targetScale = depth === 0 ? CAROUSEL_SETTINGS.activeScale : CAROUSEL_SETTINGS.inactiveScale;
        data.targetRotationY = distance * -0.72;

        if (immediate) {
          object.position.set(data.targetX, data.targetY, data.targetZ);
          object.scale.setScalar(data.targetScale);
          object.rotation.y = data.targetRotationY;
        }
      });
    }

    function showProduct(index, immediate = false) {
      activeIndex = (index + products.length) % products.length;
      setTargets(immediate || reducedMotion);

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
      const ease = 1 - Math.exp(-delta * CAROUSEL_SETTINGS.transitionSpeed);

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

        if (!reducedMotion) {
          data.mesh.position.y = Math.sin(elapsed * CAROUSEL_SETTINGS.floatSpeed + data.phase) * CAROUSEL_SETTINGS.floatHeight;
          data.mesh.rotation.x += delta * CAROUSEL_SETTINGS.rotationSpeed;
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
