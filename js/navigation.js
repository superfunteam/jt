/* ═══════════════════════════════════════════════════════════
   Navigation — Scroll spy, mobile menu, clean URL routing
   ═══════════════════════════════════════════════════════════ */

const Navigation = (() => {
  const SECTIONS = ['hero', 'book', 'bio', 'journalism', 'speaking', 'media', 'backstory', 'contact'];
  const HEADER_OFFSET = 80;
  let currentSection = '';
  let isMenuOpen = false;

  // Map section IDs to URL paths
  function sectionToPath(id) {
    return id === 'hero' ? '/' : '/' + id;
  }

  function pathToSection(path) {
    const clean = path.replace(/^\//, '').replace(/\/$/, '');
    if (!clean || clean === '') return 'hero';
    return SECTIONS.includes(clean) ? clean : null;
  }

  function init() {
    setupScrollSpy();
    setupMobileMenu();
    setupMobileSelect();
    setupSmoothNavLinks();
    setupHeaderBackground();
    handlePopState();
  }

  /* ── Scroll to section from current URL ────────────────── */

  function scrollToCurrentPath() {
    const sectionId = pathToSection(window.location.pathname);
    if (sectionId && sectionId !== 'hero') {
      const target = document.getElementById(sectionId);
      if (target) {
        SmoothScroll.scrollTo(target, { offset: -HEADER_OFFSET, immediate: true });
      }
    }
  }

  /* ── Scroll Spy ──────────────────────────────────────── */

  function setupScrollSpy() {
    SECTIONS.forEach((id) => {
      const section = document.getElementById(id);
      if (!section) return;

      ScrollTrigger.create({
        trigger: section,
        start: 'top 40%',
        end: 'bottom 40%',
        onEnter: () => setActiveSection(id),
        onEnterBack: () => setActiveSection(id),
      });
    });
  }

  function setActiveSection(id) {
    if (id === currentSection) return;
    currentSection = id;

    // Update nav links
    document.querySelectorAll('.nav__link').forEach((link) => {
      link.classList.toggle('nav__link--active', link.dataset.section === id);
    });

    // Update mobile select
    const select = document.querySelector('.nav__select');
    if (select) select.value = id;

    // Update URL with clean path (no reload)
    const newPath = sectionToPath(id);
    if (window.location.pathname !== newPath) {
      history.replaceState({ section: id }, '', newPath);
    }
  }

  /* ── Handle browser back/forward ───────────────────────── */

  function handlePopState() {
    window.addEventListener('popstate', (e) => {
      const sectionId = e.state?.section || pathToSection(window.location.pathname);
      if (sectionId) {
        const target = document.getElementById(sectionId);
        if (target) {
          SmoothScroll.scrollTo(target, { offset: -HEADER_OFFSET });
        }
      }
    });
  }

  /* ── Mobile Menu ─────────────────────────────────────── */

  function setupMobileMenu() {
    const toggle = document.querySelector('.nav__toggle');
    const overlay = document.querySelector('.nav-overlay');

    if (!toggle || !overlay) return;

    function closeMenu() {
      isMenuOpen = false;
      toggle.classList.remove('nav__toggle--open');
      toggle.setAttribute('aria-expanded', false);
      toggle.setAttribute('aria-label', 'Open menu');
      overlay.classList.remove('nav-overlay--open');
      overlay.setAttribute('aria-hidden', true);
      SmoothScroll.start();
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', () => {
      isMenuOpen = !isMenuOpen;
      toggle.classList.toggle('nav__toggle--open', isMenuOpen);
      toggle.setAttribute('aria-expanded', isMenuOpen);
      toggle.setAttribute('aria-label', isMenuOpen ? 'Close menu' : 'Open menu');
      overlay.classList.toggle('nav-overlay--open', isMenuOpen);
      overlay.setAttribute('aria-hidden', !isMenuOpen);

      // Lock/unlock scroll
      if (isMenuOpen) {
        SmoothScroll.stop();
        document.body.style.overflow = 'hidden';
      } else {
        SmoothScroll.start();
        document.body.style.overflow = '';
      }
    });

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isMenuOpen) {
        closeMenu();
        toggle.focus();
      }
    });

    // Close menu on overlay link click
    overlay.querySelectorAll('.nav-overlay__link').forEach((link) => {
      link.addEventListener('click', () => {
        if (isMenuOpen) closeMenu();
      });
    });
  }

  /* ── Mobile Select Nav ──────────────────────────────── */

  function setupMobileSelect() {
    const select = document.querySelector('.nav__select');
    if (!select) return;

    // Hide until user reaches the book section
    const book = document.getElementById('book');
    if (book) {
      ScrollTrigger.create({
        trigger: book,
        start: 'top 80%',
        onEnter: () => select.classList.add('nav__select--visible'),
        onLeaveBack: () => select.classList.remove('nav__select--visible'),
      });
    }

    select.addEventListener('change', () => {
      const sectionId = select.value;
      const target = document.getElementById(sectionId);
      if (!target) return;

      const newPath = sectionToPath(sectionId);
      history.pushState({ section: sectionId }, '', newPath);
      SmoothScroll.scrollTo(target, { offset: -HEADER_OFFSET });
    });
  }

  /* ── Smooth Nav Links ────────────────────────────────── */

  function setupSmoothNavLinks() {
    const allNavLinks = document.querySelectorAll('[data-section]');

    allNavLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.dataset.section;
        const target = document.getElementById(sectionId);
        if (!target) return;

        // Push clean URL
        const newPath = sectionToPath(sectionId);
        history.pushState({ section: sectionId }, '', newPath);

        SmoothScroll.scrollTo(target, { offset: -HEADER_OFFSET });
      });
    });

    // Also handle any remaining hash links (e.g. inline "get in touch" links)
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      if (link.dataset.section) return; // already handled above
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        const sectionId = href.replace('#', '');
        const newPath = sectionToPath(sectionId);
        history.pushState({ section: sectionId }, '', newPath);
        SmoothScroll.scrollTo(target, { offset: -HEADER_OFFSET });
      });
    });
  }

  /* ── Header Background on Scroll ─────────────────────── */

  function setupHeaderBackground() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    ScrollTrigger.create({
      start: 'top -80',
      end: 99999,
      onEnter: () => header.classList.add('site-header--scrolled'),
      onLeaveBack: () => header.classList.remove('site-header--scrolled'),
    });
  }

  return { init, scrollToCurrentPath };
})();
