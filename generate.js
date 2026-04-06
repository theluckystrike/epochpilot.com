#!/usr/bin/env node
/**
 * EpochPilot — Static Page Generator
 * Reads data/_tools.json + templates/_template.html
 * Generates one HTML file per tool into tools/
 * Updates sitemap.xml
 *
 * Usage: node generate.js [domain]
 */

const fs = require('fs');
const path = require('path');

const domain = process.argv[2] || 'epochpilot.com';
const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

const ROOT = __dirname;
const TOOLS_DIR = path.join(ROOT, 'tools');
const DATA_FILE = path.join(ROOT, 'data', '_tools.json');
const TEMPLATE_FILE = path.join(ROOT, 'templates', '_template.html');
const SITEMAP_FILE = path.join(ROOT, 'sitemap.xml');

// Read inputs
const tools = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');

// Build a slug->title map for related links
const slugMap = {};
tools.forEach(t => { slugMap[t.slug] = t.title; });

// Ensure tools/ directory exists
if (!fs.existsSync(TOOLS_DIR)) {
  fs.mkdirSync(TOOLS_DIR, { recursive: true });
}

let generated = 0;

tools.forEach(tool => {
  const canonical = `https://${domain}/tools/${tool.slug}.html`;

  // Build FAQ HTML (details/summary)
  const faqHtml = tool.faq.map(f => `
    <details>
      <summary>${escHtml(f.q)}</summary>
      <p>${escHtml(f.a)}</p>
    </details>`).join('\n');

  // Build FAQ JSON-LD
  const faqSchema = tool.faq.map(f => `
    {
      "@type": "Question",
      "name": ${JSON.stringify(f.q)},
      "acceptedAnswer": {
        "@type": "Answer",
        "text": ${JSON.stringify(f.a)}
      }
    }`).join(',');

  // Build related links HTML
  const relatedLinks = (tool.related || [])
    .filter(slug => slugMap[slug])
    .map(slug => `<a href="/tools/${slug}.html" class="btn btn-outline" style="font-size:0.85rem;">${escHtml(slugMap[slug])}</a>`)
    .join('\n      ');

  // Config as JSON string (for data attribute)
  const configStr = JSON.stringify(tool.config);

  // Apply template
  let html = template;
  html = html.replace(/\{\{TITLE\}\}/g, escHtml(tool.title));
  html = html.replace(/\{\{H1\}\}/g, escHtml(tool.h1));
  html = html.replace(/\{\{DESCRIPTION\}\}/g, escHtml(tool.description));
  html = html.replace(/\{\{KEYWORD\}\}/g, escHtml(tool.keyword));
  html = html.replace(/\{\{SLUG\}\}/g, tool.slug);
  html = html.replace(/\{\{DOMAIN\}\}/g, domain);
  html = html.replace(/\{\{DATE\}\}/g, date);
  html = html.replace(/\{\{FAQ_HTML\}\}/g, faqHtml);
  html = html.replace(/\{\{FAQ_SCHEMA\}\}/g, faqSchema);
  html = html.replace(/\{\{RELATED_LINKS\}\}/g, relatedLinks);
  html = html.replace(/\{\{COMPONENT\}\}/g, tool.component);
  html = html.replace(/\{\{CONFIG\}\}/g, escAttr(configStr));
  html = html.replace(/\{\{CANONICAL\}\}/g, canonical);

  // Write file
  const outPath = path.join(TOOLS_DIR, `${tool.slug}.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  generated++;
  console.log(`  Generated: tools/${tool.slug}.html`);
});

console.log(`\n  Total: ${generated} tool pages generated.\n`);

// Update sitemap.xml
updateSitemap(tools, domain, date);

function updateSitemap(tools, domain, date) {
  // Read existing sitemap to preserve existing URLs
  let existingUrls = [];
  if (fs.existsSync(SITEMAP_FILE)) {
    const content = fs.readFileSync(SITEMAP_FILE, 'utf8');
    const urlRegex = /<url>\s*<loc>(.*?)<\/loc>\s*<lastmod>(.*?)<\/lastmod>\s*<changefreq>(.*?)<\/changefreq>\s*<priority>(.*?)<\/priority>\s*<\/url>/g;
    let match;
    while ((match = urlRegex.exec(content)) !== null) {
      existingUrls.push({
        loc: match[1],
        lastmod: match[2],
        changefreq: match[3],
        priority: match[4]
      });
    }
  }

  // Remove any existing tool URLs (we'll re-add them)
  existingUrls = existingUrls.filter(u => !u.loc.includes('/tools/'));

  // Add tools hub page
  existingUrls.push({
    loc: `https://${domain}/tools/`,
    lastmod: date,
    changefreq: 'weekly',
    priority: '0.9'
  });

  // Add each tool page
  tools.forEach(tool => {
    existingUrls.push({
      loc: `https://${domain}/tools/${tool.slug}.html`,
      lastmod: date,
      changefreq: 'monthly',
      priority: '0.8'
    });
  });

  // Build sitemap XML
  let xml = `<?xml version='1.0' encoding='UTF-8'?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  existingUrls.forEach(u => {
    xml += `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n<changefreq>${u.changefreq}</changefreq>\n<priority>${u.priority}</priority>\n</url>\n`;
  });
  xml += `</urlset>`;

  fs.writeFileSync(SITEMAP_FILE, xml, 'utf8');
  console.log(`  Sitemap updated with ${existingUrls.length} URLs (${tools.length} tool pages + existing pages).`);
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
