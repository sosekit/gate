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

  document.querySelectorAll("[data-portfolio-entry-label]").forEach((element) => {
    element.textContent = siteContent.landing.portfolioLabel;
  });

  const page = document.body.dataset.page;
  const pageName = page === "home" ? "" : siteContent.pageLabels[page];
  document.title = pageName ? `${pageName} - ${siteContent.siteName}` : siteContent.siteName;

  const video = document.querySelector("[data-landing-video]");
  const source = document.querySelector("[data-landing-source]");

  if (video && source) {
    const changed = source.getAttribute("src") !== siteContent.landing.video;
    const revealProgress = siteContent.landing.revealProgress ?? 0.58;
    let isRevealed = false;

    const revealEntry = () => {
      if (isRevealed) return;
      isRevealed = true;
      document.querySelector(".landing-frame")?.classList.add("is-open");
    };

    const syncRevealToVideo = () => {
      if (video.duration && video.currentTime / video.duration >= revealProgress) {
        revealEntry();
      }
    };

    source.setAttribute("src", siteContent.landing.video);
    video.setAttribute("poster", siteContent.landing.poster);
    video.addEventListener("timeupdate", syncRevealToVideo);
    video.addEventListener("ended", revealEntry);
    window.setTimeout(revealEntry, siteContent.landing.fallbackRevealMs ?? 6500);
    if (changed) video.load();
    syncRevealToVideo();
  }
}
