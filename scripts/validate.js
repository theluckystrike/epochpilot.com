#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ANSWERS_DIR = path.join(__dirname, '..', 'answers');
const GENERATED_LIST = path.join(__dirname, '..', '.generated-pages.json');
const MIN_WORDS = 400;
const REQUIRED_ELEMENTS = ['<h1', 'FAQPage', 'canonical', '<footer'];
const FORBIDDEN = ['{{', 'undefined', 'NaN'];

// Only validate pages from the current generation run
let targetFiles;
if (fs.existsSync(GENERATED_LIST)) {
  const generated = JSON.parse(fs.readFileSync(GENERATED_LIST, 'utf8'));
  targetFiles = generated.map(slug => slug + '.html');
  console.log(`Validating ${targetFiles.length} generated pages (skipping pre-existing V30 pages)\n`);
} else {
  // Fallback: validate all
  targetFiles = fs.readdirSync(ANSWERS_DIR).filter(f => f.endsWith('.html'));
  console.log(`No .generated-pages.json found, validating all ${targetFiles.length} pages\n`);
}

let pass = 0;
let fail = 0;
const titles = new Set();
const errors = [];

for (const file of targetFiles) {
  const filePath = path.join(ANSWERS_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP (not found): ${file}`);
    continue;
  }
  const html = fs.readFileSync(filePath, 'utf8');
  const fileErrors = [];

  // Strip HTML tags for word count
  const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/&\w+;/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

  if (wordCount < MIN_WORDS) {
    fileErrors.push(`Word count ${wordCount} < ${MIN_WORDS}`);
  }

  // Check required elements
  for (const el of REQUIRED_ELEMENTS) {
    if (!html.includes(el)) {
      fileErrors.push(`Missing required element: ${el}`);
    }
  }

  // Check for template artifacts
  for (const f of FORBIDDEN) {
    if (f === 'undefined') {
      const stripped = html.replace(/<code[^>]*>[\s\S]*?<\/code>/gi, '')
                          .replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, '');
      if (/(?:^|[=:>"\s])undefined(?:[<"'\s,.]|$)/i.test(stripped)) {
        fileErrors.push(`Template artifact found: ${f}`);
      }
    } else if (f === 'NaN') {
      const stripped = html.replace(/<code[^>]*>[\s\S]*?<\/code>/gi, '')
                          .replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, '');
      if (/(?:^|[=:>"\s])NaN(?:[<"'\s,.]|$)/.test(stripped)) {
        fileErrors.push(`Template artifact found: ${f}`);
      }
    } else {
      if (html.includes(f)) {
        fileErrors.push(`Template artifact found: ${f}`);
      }
    }
  }

  // Extract title for uniqueness check
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  if (titleMatch) {
    const title = titleMatch[1].trim();
    if (titles.has(title)) {
      fileErrors.push(`Duplicate title: ${title}`);
    }
    titles.add(title);
  } else {
    fileErrors.push('Missing <title> tag');
  }

  if (fileErrors.length > 0) {
    fail++;
    errors.push({ file, errors: fileErrors });
    console.log(`FAIL: ${file}`);
    fileErrors.forEach(e => console.log(`  - ${e}`));
    // Delete failing generated pages
    fs.unlinkSync(filePath);
    console.log(`  DELETED: ${file}`);
  } else {
    pass++;
  }
}

console.log(`\n=== Validation Summary ===`);
console.log(`Pass: ${pass}`);
console.log(`Fail: ${fail} (deleted)`);
console.log(`Total checked: ${targetFiles.length}`);

if (fail > 0) {
  process.exit(1);
}
