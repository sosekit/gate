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

  document.querySelectorAll("[data-shop-entry-label]").forEach((element) => {
    element.textContent = siteContent.landing.shopLabel;
  });

  document.querySelectorAll("[data-contact-entry-label]").forEach((element) => {
    element.textContent = siteContent.landing.contactLabel;
  });

  document.querySelectorAll("[data-contact-entry]").forEach((element) => {
    element.setAttribute("href", siteContent.landing.contactHref);
  });

  const page = document.body.dataset.page;
  const pageName = page === "home" ? "" : siteContent.pageLabels[page];
  document.title = pageName ? `${pageName} - ${siteContent.siteName}` : siteContent.siteName;

  const video = document.querySelector("[data-landing-video]");
  const source = document.querySelector("[data-landing-source]");

  if (video && source) {
    const changed = source.getAttribute("src") !== siteContent.landing.video;
    const revealProgress = siteContent.landing.revealProgress ?? 0.5;
    const revealStartedAt = performance.now();
    const minimumRevealMs = siteContent.landing.minimumRevealMs ?? 4300;
    let isRevealed = false;
    let revealTimer;

    const revealEntry = () => {
      if (isRevealed) return;
      const remainingDelay = minimumRevealMs - (performance.now() - revealStartedAt);

      if (remainingDelay > 0) {
        clearTimeout(revealTimer);
        revealTimer = window.setTimeout(revealEntry, remainingDelay);
        return;
      }

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
    revealTimer = window.setTimeout(revealEntry, siteContent.landing.fallbackRevealMs ?? 5500);
    if (changed) video.load();
    syncRevealToVideo();
  }
}
