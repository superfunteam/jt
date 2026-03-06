/* ═══════════════════════════════════════════════════════════
   Main — Entry point, orchestrates initialization
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // Register GSAP plugins
  gsap.registerPlugin(ScrollTrigger);

  function initAll() {
    // 1. Smooth scroll (Lenis + GSAP sync)
    SmoothScroll.init();

    // 2. WebGL noise field (before animations so it's behind)
    WebGLScene.init();

    // 3. Navigation (scroll spy, mobile menu, header)
    Navigation.init();

    // 4. Scroll animations & hero sequence
    Animations.init();

    // Handle initial URL path (e.g. /book, /bio)
    setTimeout(() => {
      Navigation.scrollToCurrentPath();
    }, 100);
  }

  // Guard against DOMContentLoaded already having fired
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Refresh ScrollTrigger on full load (images, fonts)
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });
})();
