// extract.js — Rebuild content.json from Adlib-annotated HTML
//
// Usage:
//   node extract.js                  # reads index.html -> writes content.json
//   node extract.js some-page.html   # reads specific file -> stdout
//
// Zero dependencies beyond Node.js built-ins. Parses HTML with regex
// (safe here because we control the output format exactly).

const fs = require('fs');

const inputFile = process.argv[2] || 'index.html';
const writeToFile = !process.argv[2]; // only overwrite content.json when using default

const html = fs.readFileSync(inputFile, 'utf8');

// ─── Helpers ───

function setPath(obj, path, val) {
  const keys = path.split('.');
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = isNaN(keys[i]) ? keys[i] : parseInt(keys[i]);
    if (o[k] === undefined) {
      // Next key determines if we need an array or object
      o[k] = isNaN(keys[i + 1]) ? {} : [];
    }
    o = o[k];
  }
  const last = isNaN(keys[keys.length - 1]) ? keys[keys.length - 1] : parseInt(keys[keys.length - 1]);
  o[last] = val;
}

// Decode HTML entities back to plain text
function decode(s) {
  return decodeKeepSpaces(s).trim();
}

// Like decode but preserves leading/trailing whitespace
function decodeKeepSpaces(s) {
  return s
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&rsquo;/g, "'")
    .replace(/&mdash;/g, '--')
    .replace(/&middot;/g, '\u00B7')
    .replace(/&rarr;/g, '\u2192')
    .replace(/&emsp;/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\u00A0/g, ' ');
}

// Strip HTML tags to get text content
function textContent(s) {
  // Replace <br> with \n before stripping tags (preserves line breaks)
  let text = s.replace(/<br\s*\/?>/gi, '\n');
  // Remove all other tags
  text = text.replace(/<[^>]+>/g, '');
  return decode(text);
}

// Get innerHTML but preserve <em>, <strong>, and <a> tags for richtext
// richEsc in build.js encodes bare & to &amp; in text but preserves
// allowed tags (including their attributes) as-is, so we must preserve
// &amp; inside tag attributes while decoding &amp; in text nodes.
function richContent(s) {
  // For richtext, preserve <em>, <strong>, and <a> tags but strip everything else
  let text = s.replace(/<(?!\/?(?:em|strong|a)\b)[^>]+>/g, '');
  // Strip rel="noopener" added automatically by build.js
  text = text.replace(/ rel="noopener"/g, '');
  // Decode entities only in text nodes, not inside tag attributes
  // Split on tags, decode text segments only
  const parts = text.split(/(<[^>]+>)/g);
  for (let i = 0; i < parts.length; i++) {
    if (!parts[i].startsWith('<')) {
      // Text node — decode entities but preserve whitespace
      parts[i] = decodeKeepSpaces(parts[i]);
    }
  }
  return parts.join('').trim();
}

// ─── Extract meta fields from <head> ───

const metaFields = {};

// <title>...</title>
const titleMatch = html.match(/<title>([^<]*)<\/title>/);
if (titleMatch) metaFields.title = decode(titleMatch[1]);

// <meta name="description" content="...">
const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
if (descMatch) metaFields.description = decode(descMatch[1]);

// <meta property="og:title" content="...">
const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/);
if (ogTitleMatch) metaFields.ogTitle = decode(ogTitleMatch[1]);

// <meta property="og:description" content="...">
const ogDescMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/);
if (ogDescMatch) metaFields.ogDescription = decode(ogDescMatch[1]);

// <meta property="og:image" content="...">
const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/);
if (ogImageMatch) metaFields.ogImage = decode(ogImageMatch[1]);

// <meta name="twitter:card" content="...">
const twCardMatch = html.match(/<meta\s+name="twitter:card"\s+content="([^"]*)"/);
if (twCardMatch) metaFields.twitterCard = decode(twCardMatch[1]);

// <meta property="og:url" content="...">
const ogUrlMatch = html.match(/<meta\s+property="og:url"\s+content="([^"]*)"/);
if (ogUrlMatch) metaFields.siteUrl = decode(ogUrlMatch[1]);

// <meta property="og:site_name" content="...">
const ogSiteMatch = html.match(/<meta\s+property="og:site_name"\s+content="([^"]*)"/);
if (ogSiteMatch) metaFields.siteName = decode(ogSiteMatch[1]);

// ─── Extract all data-adlib-cms elements ───

const content = {};

// Find all data-adlib-cms attributes
const attrPattern = /data-adlib-cms="([^"]+)"/g;
const positions = [];
let match;
while ((match = attrPattern.exec(html)) !== null) {
  positions.push({ path: match[1], pos: match.index });
}

for (const { path, pos } of positions) {
  // Walk backwards to find the opening < of this element
  let tagStart = pos;
  while (tagStart > 0 && html[tagStart] !== '<') tagStart--;

  // Find the end of the opening tag
  let tagEnd = pos;
  while (tagEnd < html.length && html[tagEnd] !== '>') tagEnd++;
  tagEnd++; // include the >

  const openingTag = html.slice(tagStart, tagEnd);

  // Extract tag name
  const tagName = openingTag.match(/^<(\w+)/)?.[1]?.toLowerCase();

  // Extract data-adlib-type
  const typeMatch = openingTag.match(/data-adlib-type="([^"]+)"/);
  const type = typeMatch ? typeMatch[1] : 'text';

  // Extract data-target (for number types)
  const targetMatch = openingTag.match(/data-target="([^"]+)"/);

  // Self-closing / void elements
  if (['img', 'source', 'input', 'br', 'hr', 'meta', 'link'].includes(tagName)) {
    if (type === 'image') {
      const srcMatch = openingTag.match(/\bsrc="([^"]+)"/);
      setPath(content, path, srcMatch ? srcMatch[1] : '');
    } else if (type === 'video') {
      const srcMatch = openingTag.match(/\bsrc="([^"]+)"/);
      setPath(content, path, srcMatch ? srcMatch[1] : '');
    }
    continue;
  }

  // For href type, extract the href attribute from the opening tag
  if (type === 'href') {
    const hrefMatch = openingTag.match(/\bhref="([^"]+)"/);
    setPath(content, path, hrefMatch ? hrefMatch[1] : '');
    continue;
  }

  // For number type, prefer data-target
  if (type === 'number') {
    setPath(content, path, targetMatch ? Number(targetMatch[1]) : 0);
    continue;
  }

  // Content elements: find the inner HTML up to the closing tag
  let depth = 1;
  let cursor = tagEnd;
  const closeTag = `</${tagName}`;

  while (cursor < html.length && depth > 0) {
    const nextOpen = html.indexOf(`<${tagName}`, cursor);
    const nextClose = html.indexOf(closeTag, cursor);

    if (nextClose === -1) break;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      cursor = nextOpen + 1;
    } else {
      depth--;
      if (depth === 0) {
        const innerHTML = html.slice(tagEnd, nextClose);

        if (type === 'richtext') {
          setPath(content, path, richContent(innerHTML));
        } else {
          setPath(content, path, textContent(innerHTML));
        }
      }
      cursor = nextClose + 1;
    }
  }
}

// ─── Extract data-adlib-each array items ───

const eachPattern = /data-adlib-each="([^"]+)"\s+data-adlib-index="(\d+)"/g;
const eachPositions = [];
while ((match = eachPattern.exec(html)) !== null) {
  eachPositions.push({ arrayPath: match[1], index: parseInt(match[2]), pos: match.index });
}

for (const { arrayPath, index, pos } of eachPositions) {
  // Walk backwards to find the opening < of this element
  let tagStart = pos;
  while (tagStart > 0 && html[tagStart] !== '<') tagStart--;

  // Find the end of the opening tag
  let tagEnd = pos;
  while (tagEnd < html.length && html[tagEnd] !== '>') tagEnd++;
  tagEnd++;

  const openingTag = html.slice(tagStart, tagEnd);
  const tagName = openingTag.match(/^<(\w+)/)?.[1]?.toLowerCase();

  // Find the innerHTML
  let depth = 1;
  let cursor = tagEnd;
  const closeTag = `</${tagName}`;
  let innerHTML = '';

  while (cursor < html.length && depth > 0) {
    const nextOpen = html.indexOf(`<${tagName}`, cursor);
    const nextClose = html.indexOf(closeTag, cursor);

    if (nextClose === -1) break;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      cursor = nextOpen + 1;
    } else {
      depth--;
      if (depth === 0) {
        innerHTML = html.slice(tagEnd, nextClose);
      }
      cursor = nextClose + 1;
    }
  }

  // Also extract href if it's an <a> tag
  const hrefMatch = openingTag.match(/\bhref="([^"]+)"/);

  // Parse based on the array path
  if (arrayPath === 'book.buyLinks') {
    const label = textContent(innerHTML);
    const url = hrefMatch ? hrefMatch[1].replace(/&amp;/g, '&') : '';
    setPath(content, `book.buyLinks.${index}`, { label, url });
  } else if (arrayPath === 'book.events') {
    // Format: "Name — Location — Date"
    const text = textContent(innerHTML);
    const parts = text.split(/\s*--\s*/);
    setPath(content, `book.events.${index}`, {
      name: (parts[0] || '').trim(),
      location: (parts[1] || '').trim(),
      date: (parts[2] || '').trim()
    });
  } else if (arrayPath === 'bio.cv') {
    // Format: "Role — Org"
    const text = textContent(innerHTML);
    const parts = text.split(/\s*--\s*/);
    setPath(content, `bio.cv.${index}`, {
      role: (parts[0] || '').trim(),
      org: (parts[1] || '').trim()
    });
  } else if (arrayPath === 'journalism.articles') {
    // Contains: <a href="url">title</a><br> &emsp;source, year
    const titleMatch = innerHTML.match(/<a[^>]*>([^<]*)<\/a>/);
    const title = titleMatch ? decode(titleMatch[1]) : '';
    const url = hrefMatch ? '' : ''; // href is on child <a>, not the <p>
    // Extract href from inner <a>
    const innerHref = innerHTML.match(/<a\s+href="([^"]+)"/);
    const articleUrl = innerHref ? innerHref[1] : '#';
    // Extract source and year after <br>
    const afterBr = innerHTML.replace(/.*<br\s*\/?>/i, '');
    const sourceYear = textContent(afterBr).replace(/^\s*/, '');
    const syParts = sourceYear.split(/,\s*/);
    setPath(content, `journalism.articles.${index}`, {
      title,
      url: articleUrl,
      source: (syParts[0] || '').trim(),
      year: (syParts[1] || '').trim()
    });
  } else if (arrayPath === 'speaking.topics') {
    setPath(content, `speaking.topics.${index}`, textContent(innerHTML));
  } else if (arrayPath === 'media.appearances') {
    // Contains: <a href="url">title</a><br>&emsp;type — description
    const titleMatch = innerHTML.match(/<a[^>]*>([^<]*)<\/a>/);
    const title = titleMatch ? decode(titleMatch[1]) : '';
    const innerHref = innerHTML.match(/<a\s+href="([^"]+)"/);
    const itemUrl = innerHref ? innerHref[1] : '#';
    const afterBr = innerHTML.replace(/.*<br\s*\/?>/i, '');
    const typeDesc = textContent(afterBr).replace(/^\s*/, '');
    const tdParts = typeDesc.split(/\s*--\s*/);
    setPath(content, `media.appearances.${index}`, {
      title,
      url: itemUrl,
      type: (tdParts[0] || '').trim(),
      description: (tdParts[1] || '').trim()
    });
  } else if (arrayPath === 'contact.socialLinks') {
    const label = textContent(innerHTML);
    const url = hrefMatch ? hrefMatch[1] : '';
    setPath(content, `contact.socialLinks.${index}`, { label, url });
  }
}

// ─── Post-processing ───

// backstory.description has "<br>of " inserted during build — reconstruct the original
if (content.backstory && content.backstory.description) {
  content.backstory.description = content.backstory.description.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

// journalism.outlets has <br> inserted during build — reconstruct the original
if (content.journalism && content.journalism.outlets) {
  content.journalism.outlets = content.journalism.outlets.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

// Ensure key ordering matches original content.json convention
if (content.hero) {
  const h = content.hero;
  content.hero = {
    intro: h.intro,
    image: h.image || ''
  };
}

if (content.book) {
  const b = content.book;
  content.book = {
    heading: b.heading,
    synopsis: b.synopsis || [],
    praise: b.praise,
    buyLinks: b.buyLinks || [],
    events: b.events || [],
    mediaAssets: b.mediaAssets,
    coverImage: b.coverImage || ''
  };
}

if (content.bio) {
  const b = content.bio;
  content.bio = {
    heading: b.heading,
    paragraphs: b.paragraphs || [],
    cv: b.cv || []
  };
}

if (content.journalism) {
  const j = content.journalism;
  content.journalism = {
    heading: j.heading,
    outlets: j.outlets,
    articles: j.articles || []
  };
}

if (content.speaking) {
  const s = content.speaking;
  content.speaking = {
    heading: s.heading,
    description: s.description,
    topics: s.topics || [],
    inquiryCta: s.inquiryCta,
    image: s.image || ''
  };
}

if (content.media) {
  const m = content.media;
  content.media = {
    heading: m.heading,
    appearances: m.appearances || []
  };
}

if (content.backstory) {
  const b = content.backstory;
  content.backstory = {
    heading: b.heading,
    description: b.description,
    url: b.url || '',
    logo: b.logo || ''
  };
}

if (content.contact) {
  const c = content.contact;
  content.contact = {
    heading: c.heading,
    socialLinks: c.socialLinks || []
  };
}

if (content.footer) {
  const f = content.footer;
  content.footer = {
    copy: f.copy
  };
}

// Attach meta from <head> extraction
if (Object.keys(metaFields).length > 0) {
  content.meta = {
    title: metaFields.title || '',
    description: metaFields.description || '',
    ogTitle: metaFields.ogTitle || '',
    ogDescription: metaFields.ogDescription || '',
    ogImage: metaFields.ogImage || '',
    twitterCard: metaFields.twitterCard || '',
    siteUrl: metaFields.siteUrl || '',
    siteName: metaFields.siteName || ''
  };
}

// ─── Output ───

const json = JSON.stringify(content, null, 2) + '\n';

if (writeToFile) {
  fs.writeFileSync('content.json', json);
  console.log(`Extracted content.json (${Object.keys(content).length} sections)`);
} else {
  process.stdout.write(json);
}
