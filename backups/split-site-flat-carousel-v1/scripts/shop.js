const carousel = document.querySelector("[data-carousel]");

if (carousel) {
  const products = Array.from(carousel.querySelectorAll("[data-product]"));
  const previous = carousel.querySelector("[data-previous]");
  const next = carousel.querySelector("[data-next]");
  const status = document.querySelector("[data-status]");
  const dots = document.querySelector("[data-dots]");
  let activeIndex = 0;

  const productDots = products.map((product, index) => {
    const dot = document.createElement("button");
    dot.className = "carousel-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Show product ${index + 1}`);
    dot.addEventListener("click", () => showProduct(index));
    dots.appendChild(dot);
    return dot;
  });

  function showProduct(index) {
    activeIndex = (index + products.length) % products.length;

    products.forEach((product, productIndex) => {
      const isActive = productIndex === activeIndex;
      product.classList.toggle("is-active", isActive);
      product.setAttribute("aria-hidden", String(!isActive));
      productDots[productIndex].classList.toggle("is-active", isActive);
      productDots[productIndex].setAttribute("aria-current", isActive ? "true" : "false");
    });

    status.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(products.length).padStart(2, "0")}`;
  }

  previous.addEventListener("click", () => showProduct(activeIndex - 1));
  next.addEventListener("click", () => showProduct(activeIndex + 1));

  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      showProduct(activeIndex - 1);
    }

    if (event.key === "ArrowRight") {
      showProduct(activeIndex + 1);
    }
  });

  showProduct(0);
}
