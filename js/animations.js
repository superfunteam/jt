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

  /* ── Text Reveals — typewriter effect with blinking cursor */

  function textReveals() {
    const headings = document.querySelectorAll('.anim-reveal');

    headings.forEach((heading) => {
      const fullText = heading.textContent;
      heading.textContent = '';
      heading.style.opacity = '1';
      heading.classList.add('typewriter-cursor');

      let triggered = false;

      ScrollTrigger.create({
        trigger: heading,
        start: 'top 75%',
        once: true,
        onEnter: () => {
          if (triggered) return;
          triggered = true;
          let i = 0;
          const speed = 40;

          function type() {
            if (i < fullText.length) {
              heading.textContent += fullText.charAt(i);
              i++;
              setTimeout(type, speed);
            } else {
              // One extra blink then hide
              setTimeout(() => {
                heading.classList.remove('typewriter-cursor');
              }, 600);
            }
          }
          type();
        },
      });
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
          scrub: 0.15,
        },
      });
    }

    // Book cover — slow gentle drift
    const bookCover = document.querySelector('.book-layout__cover');
    if (bookCover) {
      gsap.to(bookCover, {
        y: 30,
        ease: 'none',
        scrollTrigger: {
          trigger: '.book-layout',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.25,
        },
      });
    }


    // Speaking headshot — scrolls faster than surroundings, starts low
    const speakingPhoto = document.querySelector('.speaking-grid__photo');
    if (speakingPhoto) {
      gsap.fromTo(speakingPhoto,
        { y: 300 },
        {
          y: 140,
          ease: 'none',
          scrollTrigger: {
            trigger: '#speaking',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.15,
          },
        }
      );
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
