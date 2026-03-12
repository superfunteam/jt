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

    // 2. Navigation (scroll spy, mobile menu, header)
    Navigation.init();

    // 3. Scroll animations & hero sequence
    Animations.init();

    // 4. Contact form — inline confirmation
    setupContactForm();

    // Handle initial URL path (e.g. /book, /bio)
    setTimeout(() => {
      Navigation.scrollToCurrentPath();
    }, 100);
  }

  function setupContactForm() {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const data = new FormData(form);

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString(),
      })
        .then(() => showConfirmation(form))
        .catch(() => showConfirmation(form));
    });
  }

  function showConfirmation(form) {
    // Fade out form fields
    const fields = form.querySelectorAll('.form-field, .form-submit, .hidden');
    fields.forEach((el) => {
      el.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
    });

    setTimeout(() => {
      // Collapse form height smoothly
      const currentHeight = form.offsetHeight;
      form.style.height = currentHeight + 'px';
      form.style.transition = 'height 0.4s ease';

      // Clear form contents and insert confirmation
      form.innerHTML = '<div class="form-confirmation"><div class="form-confirmation__inner">' +
        '<span class="form-confirmation__check">\u2713 </span>Message sent. We\u2019ll be in touch.' +
        '</div></div>';

      // Animate to new height
      requestAnimationFrame(() => {
        form.style.height = form.scrollHeight + 'px';
        // Trigger confirmation fade in
        requestAnimationFrame(() => {
          form.querySelector('.form-confirmation__inner').classList.add('is-visible');
        });
      });

      // Remove fixed height after transition
      setTimeout(() => {
        form.style.height = '';
        form.style.transition = '';
      }, 500);
    }, 400);
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
