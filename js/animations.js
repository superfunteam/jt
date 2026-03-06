/* ═══════════════════════════════════════════════════════════
   Animations — Typewriter Brutal
   Simple opacity fades + differential parallax
   ═══════════════════════════════════════════════════════════ */

const Animations = (() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init() {
    if (reducedMotion) {
      showAllImmediately();
      return;
    }

    heroSequence();
    scrollReveals();
    textReveals();
    parallaxEffects();
  }

  /* ── Hero — simple opacity, line by line ────────────────── */

  function heroSequence() {
    const tl = gsap.timeline({ delay: 0.15 });

    tl.fromTo('.hero__intro',
      { opacity: 0 },
      { opacity: 1, duration: 0.4 }
    );

    tl.fromTo('.hero__photo',
      { opacity: 0 },
      { opacity: 1, duration: 0.6 },
      0.2
    );
  }

  /* ── Scroll Reveals — opacity only, no Y translation ───── */

  function scrollReveals() {
    const elements = document.querySelectorAll('.anim-fade');

    elements.forEach((el) => {
      gsap.fromTo(el,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.3,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top 80%',
            once: true,
          },
        }
      );
    });
  }

  /* ── Text Reveals — simple fade, no word splitting ─────── */

  function textReveals() {
    const headings = document.querySelectorAll('.anim-reveal');

    headings.forEach((heading) => {
      gsap.set(heading, { opacity: 1 });

      gsap.fromTo(heading,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.4,
          ease: 'none',
          scrollTrigger: {
            trigger: heading,
            start: 'top 75%',
            once: true,
          },
        }
      );
    });
  }

  /* ── Differential Parallax — three photos, three speeds ── */

  function parallaxEffects() {
    // Hero photo — slow drift
    const heroPhoto = document.querySelector('.hero__photo-img');
    if (heroPhoto) {
      gsap.to(heroPhoto, {
        y: 60,
        ease: 'none',
        scrollTrigger: {
          trigger: '.section--hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.3,
        },
      });
    }

    // Book cover — medium drift
    const bookCover = document.querySelector('.book-cover__img');
    if (bookCover) {
      gsap.to(bookCover, {
        y: 40,
        ease: 'none',
        scrollTrigger: {
          trigger: '.book-cover',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6,
        },
      });
    }

    // Speaking headshot — faster drift
    const speakingPhoto = document.querySelector('.speaking-photo__img');
    if (speakingPhoto) {
      gsap.to(speakingPhoto, {
        y: 50,
        ease: 'none',
        scrollTrigger: {
          trigger: '.speaking-photo',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.9,
        },
      });
    }
  }

  /* ── Reduced Motion Fallback ────────────────────────────── */

  function showAllImmediately() {
    const allAnimated = document.querySelectorAll(
      '.anim-reveal, .anim-fade, .hero__intro, .hero__photo'
    );
    allAnimated.forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  return { init };
})();
