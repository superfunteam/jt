#!/usr/bin/env node
/**
 * build.js — Reads content.json and generates index.html
 * with data-adlib-cms attributes stamped on every content element.
 */

const fs = require('fs');
const path = require('path');

const content = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'content.json'), 'utf8')
);

/* ── Helpers ── */

/** HTML-encode dangerous chars; also convert ' to &rsquo; and -- to &mdash; */
function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/--/g, '&mdash;');
}

/**
 * Like esc but allows <strong>, <em>, <a ...> through.
 * Escapes bare & that are not already part of an HTML entity,
 * and escapes stray < > that are not part of allowed tags.
 */
function richEsc(s) {
  if (s == null) return '';
  // Temporarily replace allowed tags with placeholders
  const allowed = [];
  let tmp = String(s).replace(
    /<(\/?(?:strong|em|a|br)\b[^>]*)>/gi,
    (match) => {
      allowed.push(match);
      return `\x00SAFE${allowed.length - 1}\x00`;
    }
  );
  // Escape bare & not already part of an entity (e.g. &amp; &mdash; &#123;)
  tmp = tmp.replace(/&(?!(?:#\d+|#x[\da-fA-F]+|[a-zA-Z]\w*);)/g, '&amp;');
  // Escape stray < and > (not part of allowed tags, which are already placeholders)
  tmp = tmp.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  tmp = tmp.replace(/--/g, '&mdash;');
  // Restore allowed tags
  tmp = tmp.replace(/\x00SAFE(\d+)\x00/g, (_, i) => allowed[Number(i)]);
  return tmp;
}

/* ── Destructure content ── */
const { hero, book, bio, journalism, speaking, media, backstory, contact, footer, meta } = content;

/* ── Build HTML ── */
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(meta.title)}</title>
  <meta name="description" content="${esc(meta.description)}">

  <!-- Favicon -->
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%231a1a1a'/%3E%3Ctext x='16' y='22' font-family='monospace' font-size='16' font-weight='700' fill='%23f7f7f7' text-anchor='middle'%3EJT%3C/text%3E%3C/svg%3E" type="image/svg+xml">

  <!-- Open Graph -->
  <meta property="og:title" content="${esc(meta.ogTitle)}">
  <meta property="og:description" content="${esc(meta.ogDescription)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${esc(meta.siteUrl)}">
  <meta property="og:image" content="${esc(meta.ogImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="${esc(meta.siteName)}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="${esc(meta.twitterCard)}">
  <meta name="twitter:title" content="${esc(meta.ogTitle)}">
  <meta name="twitter:description" content="${esc(meta.ogDescription)}">
  <meta name="twitter:image" content="${esc(meta.ogImage)}">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

  <!-- Styles -->
  <link rel="stylesheet" href="css/style.css?v=${Date.now()}">

  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "name": "Josh Tyrangiel",
        "url": "https://joshtyrangiel.com",
        "jobTitle": "Journalist, Producer, Author",
        "description": "Author of AI for Good. Former head of Bloomberg Media and editorial director of The Atlantic.",
        "sameAs": [
          "https://twitter.com/joshtyrangiel",
          "https://www.linkedin.com/in/joshtyrangiel"
        ]
      },
      {
        "@type": "Book",
        "name": "AI for Good",
        "author": {
          "@type": "Person",
          "name": "Josh Tyrangiel"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Simon & Schuster"
        },
        "bookFormat": "https://schema.org/Hardcover",
        "url": "https://joshtyrangiel.com/#book"
      }
    ]
  }
  </script>
</head>
<body>

  <!-- Navigation -->
  <header class="site-header" role="banner">
    <div class="site-header__name">Josh Tyrangiel</div>
    <nav class="nav" role="navigation" aria-label="Main navigation">
      <button class="nav__toggle" aria-label="Open menu" aria-expanded="false" aria-controls="nav-menu">
        <span class="nav__toggle-bar"></span>
        <span class="nav__toggle-bar"></span>
      </button>

      <select class="nav__select" aria-label="Jump to section">
        <option value="hero">Top</option>
        <option value="book">Book</option>
        <option value="journalism">Journalism</option>
        <option value="speaking">Speaking</option>
        <option value="bio">Bio</option>
        <option value="backstory">Backstory Partners</option>
        <option value="contact">Contact</option>
      </select>

      <ul id="nav-menu" class="nav__menu" role="list">
        <li><a href="/book" class="nav__link" data-section="book">Book</a></li>
        <li><a href="/journalism" class="nav__link" data-section="journalism">Journalism</a></li>
        <li><a href="/speaking" class="nav__link" data-section="speaking">Speaking</a></li>
        <li><a href="/bio" class="nav__link" data-section="bio">Bio</a></li>
        <li><a href="/backstory" class="nav__link" data-section="backstory">Backstory Partners</a></li>
        <li><a href="/contact" class="nav__link" data-section="contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <!-- Mobile Nav Overlay -->
  <div class="nav-overlay" aria-hidden="true">
    <ul class="nav-overlay__menu" role="list">
      <li><a href="/book" class="nav-overlay__link" data-section="book">Book</a></li>
      <li><a href="/journalism" class="nav-overlay__link" data-section="journalism">Journalism</a></li>
      <li><a href="/speaking" class="nav-overlay__link" data-section="speaking">Speaking</a></li>
      <li><a href="/bio" class="nav-overlay__link" data-section="bio">Bio</a></li>
      <li><a href="/backstory" class="nav-overlay__link" data-section="backstory">Backstory Partners</a></li>
      <li><a href="/contact" class="nav-overlay__link" data-section="contact">Contact</a></li>
    </ul>
  </div>

  <main>

  <!-- Hero -->
  <section id="hero" class="section section--hero" aria-label="Introduction" data-adlib-section="hero">
    <div class="hero">
      <div class="hero__text">
        <div>
${(Array.isArray(hero.intro) ? hero.intro : [hero.intro]).map((para, i) => {
  const hasMarkup = /<(em|strong|a|br)\b/.test(para);
  const typeAttr = hasMarkup ? ' data-adlib-type="richtext"' : '';
  const rendered = hasMarkup ? richEsc(para) : esc(para);
  return `          <p class="hero__intro" data-adlib-cms="hero.intro.${i}"${typeAttr}>${rendered}</p>`;
}).join('\n')}
        </div>
      </div>

      <div class="hero__photo">
        <picture>
          <source srcset="${esc(hero.image)}" type="image/webp">
          <img
            data-adlib-cms="hero.image" data-adlib-type="image"
            src="${esc(hero.image)}"
            alt="Josh Tyrangiel"
            class="hero__photo-img"
            width="800"
            height="1000"
          >
        </picture>
      </div>
    </div>
  </section>


  <!-- Book -->
  <section id="book" class="section" aria-label="About the book" data-adlib-section="book">
    <div class="section__inner">
      <h2 class="section__heading anim-reveal" data-adlib-cms="book.heading">${esc(book.heading)}</h2>

      <div class="book-layout">
        <div class="book-layout__cover anim-fade">
          <picture>
            <source srcset="${esc(book.coverImage)}" type="image/webp">
            <img data-adlib-cms="book.coverImage" data-adlib-type="image" src="${esc(book.coverImage)}" alt="AI for Good by Josh Tyrangiel" class="book-cover__img" width="400" height="600">
          </picture>
        </div>

        <div class="book-layout__text">
${book.synopsis.map((para, i) => {
  const hasMarkup = /<(em|strong|a|br)\b/.test(para);
  const typeAttr = hasMarkup ? ' data-adlib-type="richtext"' : '';
  const rendered = hasMarkup ? richEsc(para) : esc(para);
  return `          <p class="anim-fade" data-adlib-cms="book.synopsis.${i}"${typeAttr}>${rendered}</p>`;
}).join('\n\n')}

          <div class="book-praise anim-fade">
            <p data-adlib-cms="book.praise" data-adlib-type="richtext">${richEsc(book.praise)}</p>
          </div>

          <p class="book-buy anim-fade">
            Buy: ${book.buyLinks.map((link, i) =>
              `<a href="${esc(link.url)}" target="_blank" rel="noopener" data-adlib-each="book.buyLinks" data-adlib-index="${i}">${esc(link.label)}</a>`
            ).join(', ')}
          </p>

          <div class="book-events anim-fade">
            <p>Upcoming events:</p>
            <p>${book.events.map((evt, i) =>
              `<span data-adlib-each="book.events" data-adlib-index="${i}">${esc(evt.name)} &mdash; ${esc(evt.location)} &mdash; ${esc(evt.date)}</span>`
            ).join('<br>\n              ')}</p>
          </div>

          <div class="book-media anim-fade">
            <p data-adlib-cms="book.mediaAssets" data-adlib-type="richtext">${richEsc(book.mediaAssets)}</p>
          </div>
        </div>
      </div>
    </div>
  </section>


  <!-- Biography -->
  <section id="bio" class="section" aria-label="Biography" data-adlib-section="bio">
    <div class="bio-layout">
      <div class="section__inner">
        <h2 class="section__heading anim-reveal" data-adlib-cms="bio.heading">${esc(bio.heading)}</h2>
${bio.paragraphs.map((para, i) => {
  const hasMarkup = /<(em|strong|a|br)\b/.test(para);
  const typeAttr = hasMarkup ? ' data-adlib-type="richtext"' : '';
  const rendered = hasMarkup ? richEsc(para) : esc(para);
  return `        <p class="anim-fade" data-adlib-cms="bio.paragraphs.${i}"${typeAttr}>${rendered}</p>`;
}).join('\n')}
        <div class="cv anim-fade">
          <p>${bio.cv.map((item, i) =>
            `<span data-adlib-each="bio.cv" data-adlib-index="${i}">${esc(item.role)} &mdash; ${esc(item.org)}</span>`
          ).join('<br>\n            ')}</p>
        </div>
      </div>
    </div>
  </section>


  <!-- Journalism -->
  <section id="journalism" class="section" aria-label="Journalism" data-adlib-section="journalism">
    <div class="section__inner">
      <h2 class="section__heading anim-reveal" data-adlib-cms="journalism.heading">${esc(journalism.heading)}</h2>
      <p class="anim-fade" data-adlib-cms="journalism.outlets">${esc(journalism.outlets).replace(/,\s*/g, ', ').replace(/(The Washington Post),/, '$1,<br>')}</p>
      <div class="article-list anim-fade">
${journalism.articles.map((art, i) =>
  `        <p data-adlib-each="journalism.articles" data-adlib-index="${i}"><a href="${esc(art.url)}">${esc(art.title)}</a><br>\n          &emsp;${esc(art.source)}, ${esc(art.year)}</p>`
).join('\n')}
      </div>
    </div>
  </section>


  <!-- Speaking -->
  <section id="speaking" class="section" aria-label="Speaking" data-adlib-section="speaking">
    <div class="speaking-grid">
      <div class="speaking-grid__text">
        <h2 class="section__heading anim-reveal" data-adlib-cms="speaking.heading">${esc(speaking.heading)}</h2>
        <p class="anim-fade" data-adlib-cms="speaking.description">${esc(speaking.description)}</p>
        <p class="anim-fade">
          Topics:<br>
${speaking.topics.map((topic, i) =>
  `          &emsp;<span data-adlib-each="speaking.topics" data-adlib-index="${i}">${esc(topic)}</span>`
).join('<br>\n')}
        </p>
        <p class="anim-fade" data-adlib-cms="speaking.inquiryCta" data-adlib-type="richtext">${richEsc(speaking.inquiryCta)}</p>
      </div>
      <div class="speaking-grid__photo anim-fade">
        <img
          data-adlib-cms="speaking.image" data-adlib-type="image"
          src="${esc(speaking.image)}"
          alt="Josh Tyrangiel"
          class="speaking-photo__img"
          width="500"
          height="500"
        >
      </div>
    </div>
  </section>


  <!-- Backstory Partners -->
  <section id="backstory" class="section section--dark" aria-label="Backstory Partners" data-adlib-section="backstory">
    <a href="${esc(backstory.url)}" target="_blank" rel="noopener" class="section__inner backstory-link" data-adlib-cms="backstory.url" data-adlib-type="href">
      <h2 class="section__heading anim-reveal" data-adlib-cms="backstory.heading">${esc(backstory.heading)}</h2>
      <p class="anim-fade" data-adlib-cms="backstory.description">${esc(backstory.description).replace(/ of /, '<br>of ')}</p>
      <img data-adlib-cms="backstory.logo" data-adlib-type="image" src="${esc(backstory.logo)}" alt="Backstory Partners" class="backstory-logo anim-fade">
    </a>
  </section>


  <!-- Contact -->
  <section id="contact" class="section" aria-label="Contact" data-adlib-section="contact">
    <div class="section__inner">
      <h2 class="section__heading anim-reveal" data-adlib-cms="contact.heading">${esc(contact.heading)}</h2>
      <form class="contact-form" name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field">
        <p class="hidden" style="display:none;"><label>Don't fill this out: <input name="bot-field"></label></p>
        <div class="form-field anim-fade">
          <label for="contact-name">Name</label>
          <input type="text" id="contact-name" name="name" required autocomplete="name">
        </div>

        <div class="form-field anim-fade">
          <label for="contact-email">Email</label>
          <input type="email" id="contact-email" name="email" required autocomplete="email">
        </div>

        <div class="form-field anim-fade">
          <label for="contact-type">Inquiry Type</label>
          <select id="contact-type" name="inquiry_type" required>
            <option value="" disabled selected>Select one</option>
            <option value="media">Media / Press</option>
            <option value="speaking">Speaking Engagement</option>
            <option value="book">Book / Publishing</option>
            <option value="backstory">Backstory Partners</option>
            <option value="general">General Inquiry</option>
          </select>
        </div>

        <div class="form-field anim-fade">
          <label for="contact-message">Message</label>
          <textarea id="contact-message" name="message" rows="5" required></textarea>
        </div>

        <button type="submit" class="form-submit anim-fade">Send</button>
      </form>
      <p class="contact-links anim-fade">
        ${contact.socialLinks.map((link, i) =>
          `<a href="${esc(link.url)}" target="_blank" rel="noopener" data-adlib-each="contact.socialLinks" data-adlib-index="${i}">${esc(link.label)}</a>`
        ).join(' /\n        ')}
      </p>
    </div>
  </section>

  </main>

  <!-- Footer -->
  <footer class="site-footer" role="contentinfo" data-adlib-section="footer">
    <div class="site-footer__inner">
      <span class="site-footer__copy" data-adlib-cms="footer.copy">${esc(footer.copy)}</span>
    </div>
  </footer>


  <!-- Scripts -->
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
  <script src="https://unpkg.com/lenis@1.1.18/dist/lenis.min.js"></script>
  <script src="js/smooth-scroll.js"></script>
  <script src="js/navigation.js"></script>
  <script src="js/animations.js"></script>
  <script src="js/main.js?v=${Date.now()}"></script>


</body>
</html>
`;

/* ── Write output ── */
const outPath = path.join(__dirname, 'index.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log(`Built ${outPath} (${html.length} bytes)`);
