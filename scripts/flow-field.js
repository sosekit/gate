import * as THREE from "../vendor/three.module.min.js";

const canvas = document.querySelector("#organic-field");
const root = document.documentElement;

if (canvas) {
  try {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, 1, 1, 1800);
    const ecosystem = new THREE.Group();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const particleCount = window.innerWidth < 720 ? 1050 : 2100;
    const contourCount = 4;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const opacity = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);
    const tones = new Float32Array(particleCount);
    const angles = new Float32Array(particleCount);
    const layers = new Uint8Array(particleCount);
    const offsets = new Float32Array(particleCount);
    const seeds = new Float32Array(particleCount);
    const pointer = new THREE.Vector2();
    const pointerTarget = new THREE.Vector2();
    const clock = new THREE.Clock();
    const surfaceTarget = new Float32Array(3);
    let scrollTarget = 0;
    let scrollDepth = 0;
    let animationFrame = 0;
    let particleInversion = 0;
    let darkBlending = false;

    camera.position.z = 540;
    scene.add(ecosystem);

    for (let index = 0; index < particleCount; index += 1) {
      const offset = index * 3;
      const layer = index % contourCount;
      const angle = Math.random() * Math.PI * 2;

      layers[index] = layer;
      angles[index] = angle;
      offsets[index] = (Math.random() - 0.5) * (54 + layer * 18);
      seeds[index] = Math.random() * 1000;
      positions[offset] = (Math.random() - 0.5) * 760;
      positions[offset + 1] = (Math.random() - 0.5) * 520;
      positions[offset + 2] = -420 + Math.random() * 780;
      sizes[index] = 2.2 + Math.random() * 5.4 + layer * 0.45;
      opacity[index] = 0;
      tones[index] = (layer / contourCount + Math.random() * 0.22) % 1;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("aOpacity", new THREE.BufferAttribute(opacity, 1));
    particleGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    particleGeometry.setAttribute("aTone", new THREE.BufferAttribute(tones, 1));

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uInversion: { value: 0 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float aOpacity;
        attribute float aSize;
        attribute float aTone;
        varying float vOpacity;
        varying float vTone;

        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * viewPosition;
          gl_PointSize = clamp(aSize * (420.0 / max(80.0, -viewPosition.z)), 1.0, 18.0);
          vOpacity = aOpacity;
          vTone = aTone;
        }
      `,
      fragmentShader: `
        uniform float uInversion;
        varying float vOpacity;
        varying float vTone;

        void main() {
          vec2 point = gl_PointCoord - 0.5;
          float radius = length(point);
          float body = smoothstep(0.5, 0.06, radius);
          float halo = exp(-radius * radius * 15.0);
          vec3 pearl = vec3(1.0, 0.995, 0.98);
          vec3 ice = vec3(0.72, 0.9, 1.0);
          vec3 lavender = vec3(0.87, 0.8, 1.0);
          vec3 color = mix(pearl, ice, smoothstep(0.12, 0.58, vTone));
          color = mix(color, lavender, smoothstep(0.62, 1.0, vTone) * 0.56);
          color = mix(color, vec3(0.008, 0.01, 0.014), uInversion);
          gl_FragColor = vec4(color, vOpacity * (body * 0.66 + halo * 0.72));
        }
      `
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.frustumCulled = false;
    ecosystem.add(particles);

    function calculateSurface(target, layer, angle, time, scroll, radialOffset = 0) {
      const phase = layer * 1.73;
      const breath = 0.82 + Math.sin(time * 0.34 + phase) * 0.18;
      const fold = 0.5 + Math.sin(time * 0.19 + phase * 0.7 + scroll * 2.2) * 0.5;
      const radius = (108 + layer * 32 + radialOffset) * breath
        * (1 + Math.sin(angle * 3 + time * 0.23 + phase) * 0.17
          + Math.sin(angle * 5 - time * 0.14 + phase) * 0.08);
      const centerX = Math.sin(time * 0.105 + phase) * 132 + Math.sin(scroll * 2.4 + phase) * 76;
      const centerY = Math.cos(time * 0.087 + phase * 1.2) * 82 - scroll * 92;
      const x = centerX
        + Math.cos(angle) * radius * (1.34 - fold * 0.18)
        + Math.sin(angle * 2 - time * 0.18 + phase) * 38 * fold;
      const y = centerY
        + Math.sin(angle) * radius * (0.62 + fold * 0.28)
        + Math.cos(angle * 3 + time * 0.16 + phase) * 24;
      const z = -390 + layer * 198
        + Math.sin(angle * 2 + time * 0.12 + phase) * 72
        + scroll * (layer - 1.5) * 88;

      target[0] = x;
      target[1] = y;
      target[2] = z;
    }

    function updateScrollTarget() {
      const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollTarget = THREE.MathUtils.clamp(window.scrollY / scrollRange, 0, 1);
    }

    function resize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      updateScrollTarget();
    }

    function updateParticles(time, frameStep) {
      const pointerX = pointer.x * 310;
      const pointerY = pointer.y * 205;

      for (let index = 0; index < particleCount; index += 1) {
        const offset = index * 3;
        const layer = layers[index];
        const seed = seeds[index];
        const angle = angles[index] + time * (0.018 + layer * 0.004);
        calculateSurface(surfaceTarget, layer, angle, time, scrollDepth, offsets[index]);
        const surfaceX = surfaceTarget[0];
        const surfaceY = surfaceTarget[1];
        const surfaceZ = surfaceTarget[2];
        const x = positions[offset];
        const y = positions[offset + 1];
        const z = positions[offset + 2];
        const targetForce = 0.00072 + layer * 0.00007;
        const flowAngle = Math.sin(y * 0.006 + time * 0.21 + seed)
          + Math.cos(x * 0.004 - time * 0.13 + layer);

        velocities[offset] += (surfaceX - x) * targetForce * frameStep;
        velocities[offset + 1] += (surfaceY - y) * targetForce * frameStep;
        velocities[offset + 2] += (surfaceZ - z) * targetForce * 0.72 * frameStep;
        velocities[offset] += Math.cos(flowAngle) * 0.017 * frameStep;
        velocities[offset + 1] += Math.sin(flowAngle) * 0.017 * frameStep;
        velocities[offset + 2] += Math.sin(flowAngle * 0.7 + seed) * 0.009 * frameStep;

        const cursorDX = x - pointerX;
        const cursorDY = y - pointerY;
        const cursorDistance = Math.hypot(cursorDX, cursorDY);

        if (cursorDistance < 165) {
          const influence = (1 - cursorDistance / 165) * 0.075 * frameStep;
          const inverseDistance = 1 / Math.max(12, cursorDistance);
          const direction = Math.sin(time * 0.72 + seed) > -0.16 ? 1 : -1;
          velocities[offset] += (-cursorDY * inverseDistance * influence * direction)
            + cursorDX * inverseDistance * influence * 0.16;
          velocities[offset + 1] += (cursorDX * inverseDistance * influence * direction)
            + cursorDY * inverseDistance * influence * 0.16;
          velocities[offset + 2] += Math.sin(time + seed) * influence * 0.7;
        }

        const damping = Math.pow(0.974, frameStep);
        velocities[offset] *= damping;
        velocities[offset + 1] *= damping;
        velocities[offset + 2] *= damping;
        positions[offset] += velocities[offset] * frameStep;
        positions[offset + 1] += velocities[offset + 1] * frameStep;
        positions[offset + 2] += velocities[offset + 2] * frameStep;

        const cohesion = Math.max(0, 1 - Math.hypot(surfaceX - x, surfaceY - y) / 240);
        const densityPulse = Math.max(0, Math.sin(angle * 4 - time * 0.3 + seed) * 0.5 + 0.5);
        const depthLight = THREE.MathUtils.clamp((positions[offset + 2] + 520) / 760, 0.18, 1);
        opacity[index] = (0.035 + cohesion * 0.32 + densityPulse * cohesion * 0.24) * depthLight;
        tones[index] = (layer * 0.21 + Math.sin(time * 0.08 + seed) * 0.08 + 1) % 1;
      }

      particleGeometry.attributes.position.needsUpdate = true;
      particleGeometry.attributes.aOpacity.needsUpdate = true;
      particleGeometry.attributes.aTone.needsUpdate = true;
    }

    function render() {
      const delta = Math.min(0.034, clock.getDelta());
      const time = clock.elapsedTime;
      const frameStep = Math.min(2, delta * 60);
      pointer.lerp(pointerTarget, 1 - Math.pow(0.002, delta));
      scrollDepth += (scrollTarget - scrollDepth) * (1 - Math.pow(0.004, delta));
      const atmosphere = window.foolsGateAtmosphere;
      const inversionTarget = atmosphere
        && atmosphere.washOpacity > 0.5
        && atmosphere.washChannel > 127 ? 1 : 0;
      particleInversion += (inversionTarget - particleInversion)
        * (1 - Math.pow(0.006, delta));
      particleMaterial.uniforms.uInversion.value = particleInversion;

      const shouldUseDarkBlending = particleInversion > 0.08;
      if (shouldUseDarkBlending !== darkBlending) {
        darkBlending = shouldUseDarkBlending;
        particleMaterial.blending = darkBlending
          ? THREE.NormalBlending
          : THREE.AdditiveBlending;
        particleMaterial.needsUpdate = true;
      }

      updateParticles(time, frameStep);

      ecosystem.rotation.y = scrollDepth * 0.72 + pointer.x * 0.08;
      ecosystem.rotation.x = scrollDepth * 0.34 - pointer.y * 0.055;
      ecosystem.rotation.z = Math.sin(time * 0.055) * 0.035;
      ecosystem.position.z = scrollDepth * 92;
      camera.position.z = 540 - scrollDepth * 86;
      root.style.setProperty("--scroll-tilt-x", `${(scrollDepth * 11).toFixed(2)}deg`);
      root.style.setProperty("--scroll-tilt-y", `${(scrollDepth * -14).toFixed(2)}deg`);
      root.style.setProperty("--scroll-shift", `${(scrollDepth * -5).toFixed(2)}vmax`);
      renderer.render(scene, camera);

      if (!reducedMotion.matches) {
        animationFrame = requestAnimationFrame(render);
      }
    }

    window.addEventListener("pointermove", (event) => {
      pointerTarget.x = event.clientX / window.innerWidth * 2 - 1;
      pointerTarget.y = -(event.clientY / window.innerHeight * 2 - 1);
    }, { passive: true });
    window.addEventListener("pointerleave", () => pointerTarget.set(0, 0), { passive: true });
    window.addEventListener("scroll", updateScrollTarget, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrame);
      } else if (!reducedMotion.matches) {
        clock.getDelta();
        animationFrame = requestAnimationFrame(render);
      }
    });

    resize();
    render();
  } catch (error) {
    canvas.hidden = true;
  }
}
