const carousel = document.querySelector("[data-object-carousel]");

if (carousel) {
  const stage = carousel.querySelector("[data-object-stage]");
  const track = carousel.querySelector("[data-product-track]");
  const previous = carousel.querySelector("[data-previous]");
  const next = carousel.querySelector("[data-next]");
  const info = document.querySelector("[data-product-info]");
  const name = document.querySelector("[data-product-name]");
  const price = document.querySelector("[data-product-price]");
  const description = document.querySelector("[data-product-description]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const products = window.FOOLS_GATE_CONTENT?.products || [];
  const dimensions = {
    "canvas-portrait": [182, 242],
    "canvas-square": [214, 214],
    "canvas-landscape": [252, 168],
    "canvas-tall": [155, 273],
    "canvas-wide": [273, 148]
  };
  let activeIndex = 0;
  let pointerStart = null;
  let infoTimer;
  let pointerFrame;

  function createProduct(product, index) {
    const item = document.createElement("div");
    const object = document.createElement("div");
    const [width, height] = dimensions[product.shape] || dimensions["canvas-portrait"];

    item.className = "product-object";
    object.className = "canvas-object";
    item.setAttribute("aria-hidden", "true");
    item.style.setProperty("--canvas-width", `${width}px`);
    item.style.setProperty("--canvas-height", `${height}px`);
    item.style.setProperty("--canvas-color", product.color || "#f8f7f2");
    item.style.setProperty("--float-delay", `${index * -1.35}s`);

    ["front", "back", "left", "right", "top", "bottom"].forEach((face) => {
      const surface = document.createElement("span");
      surface.className = `canvas-face canvas-face-${face}`;
      object.appendChild(surface);
    });

    item.appendChild(object);
    return item;
  }

  const objects = products.map(createProduct);
  track.append(...objects);

  function signedDistance(index) {
    let distance = index - activeIndex;
    const midpoint = products.length / 2;

    if (distance > midpoint) distance -= products.length;
    if (distance < -midpoint) distance += products.length;
    return distance;
  }

  function positionProducts() {
    const spacing = Math.min(Math.max(stage.clientWidth * 0.2, 128), 220);

    objects.forEach((object, index) => {
      const distance = signedDistance(index);
      const depth = Math.abs(distance);
      object.style.setProperty("--carousel-x", `${distance * spacing}px`);
      object.style.setProperty("--carousel-y", `${depth * 10}px`);
      object.style.setProperty("--carousel-z", `${depth * -155}px`);
      object.style.setProperty("--carousel-scale", depth === 0 ? "1" : depth === 1 ? "0.72" : "0.52");
      object.style.setProperty("--carousel-rotation", `${distance * -26}deg`);
      object.style.zIndex = String(10 - depth);
      object.classList.toggle("is-active", depth === 0);
    });
  }

  function updateInfo() {
    const product = products[activeIndex];
    if (!product) return;
    name.textContent = product.name;
    price.textContent = product.price;
    description.textContent = product.description;
  }

  function showProduct(index, immediate = false) {
    if (!products.length) return;
    activeIndex = (index + products.length) % products.length;
    positionProducts();
    clearTimeout(infoTimer);

    if (immediate || reducedMotion) {
      updateInfo();
      info.classList.remove("is-changing");
      requestAnimationFrame(() => carousel.classList.add("is-ready"));
      return;
    }

    info.classList.add("is-changing");
    infoTimer = window.setTimeout(() => {
      updateInfo();
      info.classList.remove("is-changing");
    }, 150);
  }

  function setPointerTilt(event) {
    if (reducedMotion) return;
    const bounds = stage.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    const y = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
    cancelAnimationFrame(pointerFrame);
    pointerFrame = requestAnimationFrame(() => {
      track.style.setProperty("--stage-tilt-x", `${y * -1.5}deg`);
      track.style.setProperty("--stage-tilt-y", `${x * 2.8}deg`);
    });
  }

  previous.addEventListener("click", () => showProduct(activeIndex - 1));
  next.addEventListener("click", () => showProduct(activeIndex + 1));
  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showProduct(activeIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showProduct(activeIndex + 1);
    }
  });

  stage.addEventListener("pointermove", setPointerTilt, { passive: true });
  stage.addEventListener("pointerleave", () => {
    track.style.setProperty("--stage-tilt-x", "0deg");
    track.style.setProperty("--stage-tilt-y", "0deg");
  });
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

  new ResizeObserver(positionProducts).observe(stage);
  showProduct(0, true);
}
