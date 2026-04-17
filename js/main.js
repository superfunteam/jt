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

    // 5. Smooth image fade-in on load
    document.querySelectorAll('img:not(.hero__photo-img)').forEach((img) => {
      if (img.complete) {
        requestAnimationFrame(() => img.classList.add('is-loaded'));
      } else {
        img.addEventListener('load', () => img.classList.add('is-loaded'));
        img.addEventListener('error', () => img.classList.add('is-loaded'));
      }
    });

  }

  function setupContactForm() {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const data = new FormData(form);
      data.append('form-name', 'contact');

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
        '<svg class="form-confirmation__check" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="m423.23-309.85 268.92-268.92L650-620.92 423.23-394.15l-114-114L267.08-466l156.15 156.15ZM480.07-100q-78.84 0-148.21-29.92t-120.68-81.21q-51.31-51.29-81.25-120.63Q100-401.1 100-479.93q0-78.84 29.92-148.21t81.21-120.68q51.29-51.31 120.63-81.25Q401.1-860 479.93-860q78.84 0 148.21 29.92t120.68 81.21q51.31 51.29 81.25 120.63Q860-558.9 860-480.07q0 78.84-29.92 148.21t-81.21 120.68q-51.29 51.31-120.63 81.25Q558.9-100 480.07-100Zm-.07-60q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>' +
        'Message sent. I will be in touch.' +
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

  // Refresh ScrollTrigger on full load (images, fonts), then scroll to path
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
    Navigation.scrollToCurrentPath();
  });
})();
