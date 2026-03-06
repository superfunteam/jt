/* ═══════════════════════════════════════════════════════════
   Smooth Scroll — Lenis + GSAP ScrollTrigger sync
   ═══════════════════════════════════════════════════════════ */

const SmoothScroll = (() => {
  let lenis = null;

  function init() {
    // Skip Lenis if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return null;
    }

    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return lenis;
  }

  function scrollTo(target, options = {}) {
    if (lenis) {
      lenis.scrollTo(target, {
        offset: options.offset || -80,
        duration: options.duration || 1.2,
        ...options,
      });
    } else {
      // Fallback for reduced motion
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el) {
        el.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
    }
  }

  function stop() {
    if (lenis) lenis.stop();
  }

  function start() {
    if (lenis) lenis.start();
  }

  function destroy() {
    if (lenis) {
      lenis.destroy();
      lenis = null;
    }
  }

  function getInstance() {
    return lenis;
  }

  return { init, scrollTo, stop, start, destroy, getInstance };
})();
