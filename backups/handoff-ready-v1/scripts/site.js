const siteContent = window.FOOLS_GATE_CONTENT;

if (siteContent) {
  document.querySelectorAll("[data-site-name]").forEach((element) => {
    element.textContent = siteContent.siteName;
  });

  document.querySelectorAll("[data-portfolio-label]").forEach((element) => {
    element.textContent = siteContent.pageLabels.portfolio;
  });

  document.querySelectorAll("[data-shop-label]").forEach((element) => {
    element.textContent = siteContent.pageLabels.shop;
  });

  document.querySelectorAll("[data-enter-label]").forEach((element) => {
    element.textContent = siteContent.pageLabels.enter;
  });

  const page = document.body.dataset.page;
  const pageName = page === "home" ? "" : siteContent.pageLabels[page];
  document.title = pageName ? `${pageName} - ${siteContent.siteName}` : siteContent.siteName;

  const video = document.querySelector("[data-landing-video]");
  const source = document.querySelector("[data-landing-source]");

  if (video && source) {
    const changed = source.getAttribute("src") !== siteContent.landing.video;
    source.setAttribute("src", siteContent.landing.video);
    video.setAttribute("poster", siteContent.landing.poster);
    if (changed) video.load();
  }
}
