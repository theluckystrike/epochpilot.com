#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ANSWERS_DIR = path.join(__dirname, '..', 'answers');
const BASE_URL = 'https://epochpilot.com';

// ─── SKIP LIST: existing V30 pages ───
const SKIP_EPOCHS = new Set([0, 1000000000, 1609459200, 1672531200, 1700000000, 1704067200, 1712345678, 1800000000]);
const SKIP_CRON = new Set([
  'cron-every-5-minutes', 'cron-every-hour', 'cron-every-day-at-midnight',
  'cron-every-monday-9am', 'cron-every-30-seconds', 'cron-first-day-of-month',
  'cron-last-day-of-month', 'cron-weekdays-only'
]);

// ─── SHARED TEMPLATE PARTS ───
const HEADER = `<header class="site-header">
  <a href="/" class="site-logo">EpochPilot</a>
  <nav class="site-nav">
    <a href="/">Home</a>
    <a href="/tools/">Tools</a>
    <a href="/blog/">Blog</a>
    <a href="/about.html">About</a>
    <div class="nav-right">
      <a href="https://zovo.one/pricing?utm_source=epochpilot.com&amp;utm_medium=satellite&amp;utm_campaign=nav-link" class="nav-pro" target="_blank">Go Pro &#10022;</a>
      <a href="https://zovo.one/tools" class="nav-zovo">Zovo Tools</a>
    </div>
  </nav>
</header>`;

const FOOTER = `<footer class="site-footer">
    <div class="footer-inner">
        <div class="footer-brand">Zovo Tools</div>
        <div class="footer-tagline">Free developer tools by a solo dev. No tracking.</div>
        <a href="https://zovo.one/pricing?utm_source=epochpilot.com&utm_medium=satellite&utm_campaign=footer-link" class="footer-cta">Zovo Lifetime &mdash; $99 once, free forever &rarr;</a>
        <div class="footer-copy">&copy; 2026 <a href="https://zovo.one">Zovo</a></div>
    </div>
</footer>

<nav class="zovo-network" aria-label="Zovo Tools Network">
    <div class="zovo-network-inner">
        <h3 class="zovo-network-title">Explore More Tools</h3>
        <div class="zovo-network-links">
            <a href="https://abwex.com">ABWex &mdash; A/B Testing</a>
            <a href="https://claudflow.com">ClaudFlow &mdash; Workflows</a>
            <a href="https://claudhq.com">ClaudHQ &mdash; AI Code Tools & Fixes</a>
            <a href="https://claudkit.com">ClaudKit &mdash; API</a>
            <a href="https://enhio.com">Enhio &mdash; Text Tools</a>
            <a href="https://gen8x.com">Gen8X &mdash; Color Tools</a>
            <a href="https://gpt0x.com">GPT0X &mdash; AI Models</a>
            <a href="https://heytensor.com">HeyTensor &mdash; ML Tools</a>
            <a href="https://invokebot.com">InvokeBot &mdash; Webhooks</a>
            <a href="https://kappafy.com">Kappafy &mdash; JSON</a>
            <a href="https://kappakit.com">KappaKit &mdash; Dev Toolkit</a>
            <a href="https://kickllm.com">KickLLM &mdash; LLM Costs</a>
            <a href="https://krzen.com">Krzen &mdash; Image Tools</a>
            <a href="https://lochbot.com">LochBot &mdash; Security</a>
            <a href="https://lockml.com">LockML &mdash; ML Compare</a>
            <a href="https://ml3x.com">ML3X &mdash; Matrix Math</a>
        </div>
    </div>
</nav>

<script src="/assets/js/share.js"></script>`;

function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escAttr(s) { return escHtml(s); }

function pageShell({ title, desc, canonical, breadcrumbLabel, h1, faqJson, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(title)} | EpochPilot</title>
<meta name="description" content="${escAttr(desc)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="en" href="${canonical}">
<link rel="alternate" hreflang="x-default" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escAttr(title)} | EpochPilot">
<meta property="og:description" content="${escAttr(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="EpochPilot">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escAttr(title)}">
<meta name="twitter:description" content="${escAttr(desc)}">
<link rel="stylesheet" href="/assets/style.css">
<script type="application/ld+json">
${JSON.stringify(faqJson, null, 2)}
</script>
</head>
<body>
${HEADER}

<main>
  <div class="hero">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> <span>/</span> <a href="/answers/">Answers</a> <span>/</span> <span>${escHtml(breadcrumbLabel)}</span></nav>
    <h1>${escHtml(h1)}</h1>
  </div>
${body}
</main>

${FOOTER}
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════
// PATTERN A: Epoch pages
// ═══════════════════════════════════════════════════════════════

const EPOCH_SEEDS = [
  1100000000, 1200000000, 1300000000, 1400000000, 1500000000,
  1600000000, 1650000000, 1680000000, 1690000000, 1710000000,
  1720000000, 1730000000, 1740000000, 1750000000, 1760000000,
  1770000000, 1780000000, 1790000000, 1900000000, 2000000000,
  946684800, 1000211160, 1577836800, 1640995200, 2147483647,
  1710000000, 1715000000, 1725000000, 1735689600, 1767225600, 1893456000,
  1, 86400, 1000000, 1234567890
];

// de-dup
const uniqueEpochs = [...new Set(EPOCH_SEEDS)].filter(e => !SKIP_EPOCHS.has(e));

// contextual facts keyed by epoch
const EPOCH_CONTEXT = {
  1: 'This is one second after the Unix epoch began. It represents the very first tick of Unix time, making it the smallest meaningful positive Unix timestamp.',
  86400: 'This timestamp marks exactly 24 hours (one full day) after the Unix epoch. It equals 60 seconds times 60 minutes times 24 hours, a convenient round number for testing day-level calculations.',
  1000000: 'One million seconds after the epoch. Reaching this milestone took just 11 days, 13 hours, 46 minutes, and 40 seconds from January 1, 1970.',
  946684800: 'This is the Y2K moment: midnight on January 1, 2000 UTC. The Y2K bug scare feared that two-digit year fields would roll from 99 to 00, causing widespread system failures. Most systems survived thanks to extensive remediation.',
  1000211160: 'This timestamp falls on September 11, 2001, the day of the devastating terrorist attacks on the World Trade Center and Pentagon in the United States, an event that reshaped global politics and security.',
  1100000000: 'The 1.1 billion seconds milestone. By late 2004, Unix time had been ticking for nearly 35 years, and the internet was entering the Web 2.0 era with the rise of social networking sites.',
  1200000000: 'The 1.2 billion mark arrived in January 2008, right as the global financial crisis was beginning to unfold. Smartphones were becoming mainstream with the first iPhone having launched the previous year.',
  1234567890: 'A famous sequential timestamp (1-2-3-4-5-6-7-8-9-0) that fell on Friday the 13th of February 2009. Developers and sysadmins celebrated "Unix time 1234567890" parties worldwide.',
  1300000000: 'The 1.3 billion milestone hit in March 2011, just days after the Tohoku earthquake and tsunami in Japan. The tech world was witnessing the rapid rise of cloud computing.',
  1400000000: 'Reached in May 2014, as the world embraced mobile-first design. Docker containers were revolutionizing deployment, and Node.js was gaining mainstream adoption.',
  1500000000: 'The 1.5 billion mark landed in July 2017. Bitcoin was surging toward its first major peak, and machine learning frameworks like TensorFlow were transforming software development.',
  1577836800: 'Midnight on January 1, 2020 UTC. This year would become defined by the global COVID-19 pandemic, which fundamentally changed how software teams work with the shift to remote collaboration.',
  1600000000: 'September 2020, deep in the pandemic era. Remote work tools like Zoom and Slack saw unprecedented adoption, and cloud infrastructure usage skyrocketed.',
  1640995200: 'Midnight on January 1, 2022 UTC. The post-pandemic tech boom was in full swing, with cryptocurrency markets, NFTs, and the metaverse dominating tech headlines.',
  1650000000: 'April 2022. The tech industry was at peak valuations before a significant correction. Elon Musk had just made his initial bid to acquire Twitter.',
  1680000000: 'March 2023. ChatGPT had launched just months earlier, sparking an AI revolution. GPT-4 was released, and generative AI became the dominant topic in technology.',
  1690000000: 'July 2023. The AI boom was accelerating with open-source models like Llama 2 being released. Threads launched as a Twitter competitor, reaching 100 million users in days.',
  1710000000: 'March 2024. AI agents and multimodal models were advancing rapidly. Claude 3 Opus was released, and Sora demonstrated impressive video generation capabilities.',
  1715000000: 'May 2024. Apple announced Apple Intelligence at WWDC, integrating AI deeply into its operating systems. The AI infrastructure buildout was driving massive data center investment.',
  1720000000: 'July 2024. The summer of AI continued with open-weight models becoming increasingly capable. Llama 3.1 405B was released as the largest open model at the time.',
  1725000000: 'August 2024. AI coding assistants were becoming standard tools for developers. The semiconductor industry was booming with AI chip demand outstripping supply.',
  1730000000: 'October 2024. The US presidential election was approaching, with AI-generated content raising concerns about misinformation. Claude 3.5 Sonnet set new benchmarks.',
  1735689600: 'Midnight on January 1, 2025 UTC. AI systems were being deployed across industries at scale, and reasoning models were pushing the boundaries of what AI could accomplish.',
  1740000000: 'February 2025. DeepSeek R1 had demonstrated that competitive AI models could be built more efficiently, challenging assumptions about compute requirements.',
  1750000000: 'This timestamp falls in June 2025. By this point, AI-powered development tools had become integral to most software engineering workflows.',
  1760000000: 'This timestamp falls in October 2025. The tech industry continued its rapid AI integration, with autonomous coding agents handling increasingly complex tasks.',
  1767225600: 'Midnight on January 1, 2026 UTC. A new year begins with AI capabilities that would have seemed like science fiction just a few years earlier.',
  1770000000: 'This timestamp falls in February 2026, as AI systems reach new levels of autonomy and capability in software development and scientific research.',
  1780000000: 'This timestamp falls in May 2026. Autonomous AI systems are increasingly handling end-to-end development workflows across the industry.',
  1790000000: 'This timestamp falls in September 2026. The continued advancement of AI has reshaped virtually every aspect of software development and deployment.',
  1893456000: 'This timestamp falls in 2029, approaching the end of the decade. The tech landscape will have been transformed by a full decade of rapid AI advancement.',
  1900000000: 'The 1.9 billion milestone falls in 2030. By this point, the Y2038 problem (when 32-bit signed integer timestamps overflow) will be just 8 years away.',
  2000000000: 'The 2 billion mark arrives in May 2033. This is getting close to the maximum value of a 32-bit signed integer (2,147,483,647), making the Y2038 problem increasingly urgent.',
  2147483647: 'This is the maximum value of a 32-bit signed integer: 2^31 - 1. On January 19, 2038, at 03:14:07 UTC, 32-bit Unix timestamps will overflow, potentially causing the Y2038 bug, often called the "Unix Millennium Bug." Systems still using 32-bit time_t will wrap around to negative numbers, interpreting the date as December 13, 1901.'
};

function formatEpochDate(epoch) {
  const d = new Date(epoch * 1000);
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return {
    utcString: d.toUTCString(),
    iso: d.toISOString().replace('.000Z','Z'),
    dayOfWeek: days[d.getUTCDay()],
    year: d.getUTCFullYear(),
    month: months[d.getUTCMonth()],
    day: d.getUTCDate(),
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes(),
    seconds: d.getUTCSeconds(),
    humanDate: `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`,
    humanTime: `${d.getUTCHours()}:${String(d.getUTCMinutes()).padStart(2,'0')}:${String(d.getUTCSeconds()).padStart(2,'0')} UTC`,
    humanFull: `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}, ${d.getUTCHours()}:${String(d.getUTCMinutes()).padStart(2,'0')}:${String(d.getUTCSeconds()).padStart(2,'0')} UTC`,
    ms: epoch * 1000,
    date: d
  };
}

function getEasternTime(d) {
  // Compute US Eastern offset (EST=-5, EDT=-4) using Intl
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year:'numeric', month:'long', day:'numeric', hour:'numeric', minute:'2-digit', second:'2-digit', hour12:true, weekday:'long', timeZoneName:'short' });
  return fmt.format(d);
}

function epochNeighbors(epoch, allEpochs) {
  const sorted = allEpochs.filter(e => e !== epoch).sort((a,b) => Math.abs(a - epoch) - Math.abs(b - epoch));
  return sorted.slice(0, 3);
}

function humanNumber(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(n % 1e9 === 0 ? 0 : 1) + ' billion';
  if (n >= 1e6) return (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1) + ' million';
  return n.toLocaleString('en-US');
}

function daysHoursFromEpoch(epoch) {
  const totalSec = epoch;
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const parts = [];
  if (d > 0) parts.push(`${d.toLocaleString('en-US')} day${d!==1?'s':''}`);
  if (h > 0) parts.push(`${h} hour${h!==1?'s':''}`);
  if (m > 0) parts.push(`${m} minute${m!==1?'s':''}`);
  if (s > 0) parts.push(`${s} second${s!==1?'s':''}`);
  return parts.join(', ');
}

function generateEpochPage(epoch, allEpochs) {
  const info = formatEpochDate(epoch);
  const slug = `what-is-epoch-${epoch}`;
  const filePath = path.join(ANSWERS_DIR, `${slug}.html`);

  if (fs.existsSync(filePath)) {
    console.log(`  SKIP (exists): ${slug}.html`);
    return null;
  }

  const context = EPOCH_CONTEXT[epoch] || `This timestamp represents ${humanNumber(epoch)} seconds after the Unix epoch origin point of January 1, 1970, 00:00:00 UTC.`;
  const neighbors = epochNeighbors(epoch, allEpochs);
  const eastern = getEasternTime(info.date);
  const durationStr = daysHoursFromEpoch(epoch);
  const billionFraction = (epoch / 1e9).toFixed(3);

  const title = `What Is Epoch ${epoch}?`;
  const directAnswer = `Epoch ${epoch} is ${info.humanDate}, ${info.humanTime} (${info.dayOfWeek}).`;
  const desc = `Epoch ${epoch} is ${info.humanDate}, ${info.humanTime}. Free tool to verify and explore.`;
  const canonical = `${BASE_URL}/answers/${slug}.html`;

  const faqJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": title,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Unix epoch timestamp ${epoch} converts to ${info.humanFull} (${info.dayOfWeek}). This is ${humanNumber(epoch)} seconds after the Unix epoch (January 1, 1970, 00:00:00 UTC). In ISO 8601 format it is ${info.iso}.`
        }
      },
      {
        "@type": "Question",
        "name": `How do I convert epoch ${epoch} in Python?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `In Python, use datetime.utcfromtimestamp(${epoch}) to get the UTC datetime, or datetime.fromtimestamp(${epoch}) for local time. The result is ${info.humanFull}.`
        }
      },
      {
        "@type": "Question",
        "name": `What is epoch ${epoch} in milliseconds?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Epoch ${epoch} in milliseconds is ${info.ms}. Multiply any Unix timestamp in seconds by 1000 to get milliseconds, which is the format used by JavaScript's Date.now() and Java's System.currentTimeMillis().`
        }
      }
    ]
  };

  const body = `  <div style="max-width:720px;margin:2rem auto;padding:1.5rem;background:var(--bg-card,#161b22);border:1px solid var(--border,#30363d);border-radius:8px;border-left:4px solid var(--accent,#58a6ff);">
    <p style="font-size:1.2rem;font-weight:700;margin:0;">${escHtml(directAnswer)}</p>
  </div>

  <div style="max-width:720px;margin:2rem auto;line-height:1.7;">
    <h2>Breakdown</h2>
    <p>The Unix timestamp <strong>${epoch}</strong> represents exactly <strong>${humanNumber(epoch)} seconds</strong> (${durationStr}) after the Unix epoch (January 1, 1970, 00:00:00 UTC). In ISO 8601 format, this is <code>${info.iso}</code>. The timestamp equals ${billionFraction} billion seconds, and in milliseconds it is ${info.ms}.</p>
    <p>${context}</p>

    <table style="width:100%;border-collapse:collapse;margin:1rem 0;">
      <tr><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);color:var(--text-muted,#8b949e);">UTC</td><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);">${escHtml(info.utcString)}</td></tr>
      <tr><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);color:var(--text-muted,#8b949e);">ISO 8601</td><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);">${info.iso}</td></tr>
      <tr><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);color:var(--text-muted,#8b949e);">Day of Week</td><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);">${info.dayOfWeek}</td></tr>
      <tr><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);color:var(--text-muted,#8b949e);">US Eastern</td><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);">${escHtml(eastern)}</td></tr>
      <tr><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);color:var(--text-muted,#8b949e);">Milliseconds</td><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);">${info.ms}</td></tr>
      <tr><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);color:var(--text-muted,#8b949e);">Seconds Since Epoch</td><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);">${epoch.toLocaleString('en-US')}</td></tr>
    </table>

    <h2>Code Examples</h2>
    <h3>Python</h3>
    <pre style="background:var(--bg-code,#0d1117);padding:1rem;border-radius:6px;overflow-x:auto;"><code>from datetime import datetime, timezone

# Convert epoch ${epoch} to UTC datetime
dt = datetime.fromtimestamp(${epoch}, tz=timezone.utc)
print(dt)  # ${info.iso.replace('Z','+00:00')}

# Format as human-readable string
print(dt.strftime("%A, %B %d, %Y %H:%M:%S UTC"))
# ${info.dayOfWeek}, ${info.humanFull}</code></pre>

    <h3>JavaScript</h3>
    <pre style="background:var(--bg-code,#0d1117);padding:1rem;border-radius:6px;overflow-x:auto;"><code>// Convert epoch ${epoch} to Date
const date = new Date(${epoch} * 1000);
console.log(date.toISOString());  // ${info.iso}
console.log(date.toUTCString());  // ${info.utcString}

// Get individual components
console.log(date.getUTCFullYear());  // ${info.year}
console.log(date.getUTCMonth() + 1); // ${info.date.getUTCMonth() + 1}</code></pre>

    <h3>Go</h3>
    <pre style="background:var(--bg-code,#0d1117);padding:1rem;border-radius:6px;overflow-x:auto;"><code>package main

import (
    "fmt"
    "time"
)

func main() {
    t := time.Unix(${epoch}, 0).UTC()
    fmt.Println(t.Format(time.RFC3339)) // ${info.iso}
    fmt.Println(t.Weekday())            // ${info.dayOfWeek}
}</code></pre>

    <h2>Frequently Asked Questions</h2>
    <details style="margin:1rem 0;padding:0.75rem;background:var(--bg-card,#161b22);border:1px solid var(--border,#30363d);border-radius:6px;">
      <summary style="cursor:pointer;font-weight:600;">How do I convert epoch ${epoch} in Python?</summary>
      <p style="margin-top:0.75rem;">Use <code>datetime.fromtimestamp(${epoch}, tz=timezone.utc)</code> from the <code>datetime</code> module. This returns a timezone-aware datetime object representing ${info.humanFull}. For naive datetimes, use <code>datetime.utcfromtimestamp(${epoch})</code>, though the timezone-aware version is preferred in modern Python.</p>
    </details>
    <details style="margin:1rem 0;padding:0.75rem;background:var(--bg-card,#161b22);border:1px solid var(--border,#30363d);border-radius:6px;">
      <summary style="cursor:pointer;font-weight:600;">What is epoch ${epoch} in milliseconds?</summary>
      <p style="margin-top:0.75rem;">Epoch ${epoch} in milliseconds is <strong>${info.ms}</strong>. JavaScript, Java, and many APIs use millisecond timestamps. To convert, multiply the seconds-based timestamp by 1000. To go back, divide by 1000 and drop the remainder.</p>
    </details>
    <details style="margin:1rem 0;padding:0.75rem;background:var(--bg-card,#161b22);border:1px solid var(--border,#30363d);border-radius:6px;">
      <summary style="cursor:pointer;font-weight:600;">Is epoch ${epoch} in the past or future?</summary>
      <p style="margin-top:0.75rem;">${epoch < (Date.now() / 1000) ? `Epoch ${epoch} is in the <strong>past</strong>. It occurred on ${info.humanDate}, which was ${Math.floor((Date.now()/1000 - epoch) / 86400).toLocaleString('en-US')} days ago.` : `Epoch ${epoch} is in the <strong>future</strong>. It will occur on ${info.humanDate}, which is ${Math.floor((epoch - Date.now()/1000) / 86400).toLocaleString('en-US')} days from now.`}</p>
    </details>

    <p><a href="/tools/epoch-converter.html">Try the full Epoch Converter</a> to convert any timestamp instantly.</p>

    <h2>Related Questions</h2>
    <ul>
${neighbors.map(n => `      <li><a href="/answers/what-is-epoch-${n}.html">What is epoch ${n}?</a></li>`).join('\n')}
      <li><a href="/answers/unix-timestamp-now.html">What is the Unix timestamp right now?</a></li>
    </ul>
  </div>`;

  const html = pageShell({ title, desc, canonical, breadcrumbLabel: `Epoch ${epoch}`, h1: title, faqJson, body });
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  WROTE: ${slug}.html`);
  return slug;
}

// ═══════════════════════════════════════════════════════════════
// PATTERN B: Timezone pair pages
// ═══════════════════════════════════════════════════════════════

const TZ_DATA = {
  utc:  { name: 'UTC',  full: 'Coordinated Universal Time', offset: 0,    iana: 'UTC',               dst: false },
  est:  { name: 'EST',  full: 'Eastern Standard Time',      offset: -5,   iana: 'America/New_York',   dst: true, dstName: 'EDT', dstOffset: -4 },
  pst:  { name: 'PST',  full: 'Pacific Standard Time',      offset: -8,   iana: 'America/Los_Angeles',dst: true, dstName: 'PDT', dstOffset: -7 },
  cst:  { name: 'CST',  full: 'Central Standard Time',      offset: -6,   iana: 'America/Chicago',    dst: true, dstName: 'CDT', dstOffset: -5 },
  ist:  { name: 'IST',  full: 'Indian Standard Time',       offset: 5.5,  iana: 'Asia/Kolkata',       dst: false },
  gmt:  { name: 'GMT',  full: 'Greenwich Mean Time',        offset: 0,    iana: 'Europe/London',      dst: true, dstName: 'BST', dstOffset: 1 },
  cet:  { name: 'CET',  full: 'Central European Time',      offset: 1,    iana: 'Europe/Berlin',      dst: true, dstName: 'CEST', dstOffset: 2 },
  jst:  { name: 'JST',  full: 'Japan Standard Time',        offset: 9,    iana: 'Asia/Tokyo',         dst: false },
  aest: { name: 'AEST', full: 'Australian Eastern Standard Time', offset: 10, iana: 'Australia/Sydney', dst: true, dstName: 'AEDT', dstOffset: 11 },
};

const TZ_SEEDS = [
  'utc-to-est-right-now', 'utc-to-pst-right-now', 'utc-to-cst-right-now',
  'utc-to-ist-right-now', 'est-to-ist-right-now', 'pst-to-ist-right-now',
  'utc-to-gmt-right-now', 'utc-to-cet-right-now', 'est-to-gmt-right-now',
  'utc-to-jst-right-now', 'utc-to-aest-right-now', 'est-to-cet-right-now',
  'pst-to-est-right-now', 'ist-to-est-right-now', 'ist-to-pst-right-now'
];

function formatOffset(offset) {
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  const h = Math.floor(abs);
  const m = (abs - h) * 60;
  return `UTC${sign}${h}${m > 0 ? ':' + String(m).padStart(2, '0') : ''}`;
}

function formatOffsetDiff(from, to) {
  const diff = to - from;
  const sign = diff >= 0 ? '+' : '-';
  const abs = Math.abs(diff);
  const h = Math.floor(abs);
  const m = (abs - h) * 60;
  let parts = [];
  if (h > 0) parts.push(`${h} hour${h!==1?'s':''}`);
  if (m > 0) parts.push(`${m} minute${m!==1?'s':''}`);
  return { sign: diff >= 0 ? 'add' : 'subtract', text: parts.join(' and '), hours: diff };
}

function convertHour(hour, fromOffset, toOffset) {
  const diff = toOffset - fromOffset;
  let h = hour + diff;
  let dayShift = '';
  if (h >= 24) { h -= 24; dayShift = ' (+1 day)'; }
  else if (h < 0) { h += 24; dayShift = ' (-1 day)'; }
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  const period = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  return `${h12}:${String(mm).padStart(2,'0')} ${period}${dayShift}`;
}

function formatHour12(hour) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:00 ${period}`;
}

function generateTimezonePage(slug) {
  const filePath = path.join(ANSWERS_DIR, `${slug}.html`);
  if (fs.existsSync(filePath)) {
    console.log(`  SKIP (exists): ${slug}.html`);
    return null;
  }

  const match = slug.match(/^(\w+)-to-(\w+)-right-now$/);
  if (!match) return null;
  const fromKey = match[1];
  const toKey = match[2];
  const from = TZ_DATA[fromKey];
  const to = TZ_DATA[toKey];
  if (!from || !to) { console.log(`  SKIP (unknown tz): ${slug}`); return null; }

  const diff = formatOffsetDiff(from.offset, to.offset);
  const fromFmt = formatOffset(from.offset);
  const toFmt = formatOffset(to.offset);

  const title = `${from.name} to ${to.name} Right Now`;
  const h1 = `Convert ${from.name} to ${to.name} Right Now`;
  const desc = `Convert ${from.name} (${from.full}) to ${to.name} (${to.full}) instantly. ${from.name} is ${fromFmt}, ${to.name} is ${toFmt}.`;
  const canonical = `${BASE_URL}/answers/${slug}.html`;
  const directAnswer = `To convert from ${from.name} to ${to.name}, ${diff.sign} ${diff.text}. ${from.name} is ${fromFmt} and ${to.name} is ${toFmt}. The difference is ${Math.abs(diff.hours)} hours${Math.abs(diff.hours) % 1 !== 0 ? ' and 30 minutes' : ''}.`;

  const dstNote = (from.dst || to.dst)
    ? `<p><strong>Daylight saving time note:</strong> ${from.dst ? `${from.name} observes DST (becomes ${from.dstName}, ${formatOffset(from.dstOffset)}).` : `${from.name} does not observe DST.`} ${to.dst ? `${to.name} observes DST (becomes ${to.dstName}, ${formatOffset(to.dstOffset)}).` : `${to.name} does not observe DST.`} During DST periods, the offset between these zones may change by 1 hour. The table below shows standard time offsets.</p>`
    : `<p>Neither ${from.name} nor ${to.name} observes daylight saving time, so this offset is fixed year-round.</p>`;

  // Build conversion table for key hours
  const hours = [0, 3, 6, 8, 9, 10, 12, 14, 15, 17, 18, 20, 21, 23];
  let tableRows = hours.map(h => {
    const fromStr = formatHour12(h);
    const toStr = convertHour(h, from.offset, to.offset);
    return `      <tr><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);">${fromStr} ${from.name}</td><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);">${toStr} ${to.name}</td></tr>`;
  }).join('\n');

  // Related: other tz pairs
  const related = TZ_SEEDS.filter(s => s !== slug).slice(0, 4);

  const faqJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What is the time difference between ${from.name} and ${to.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${from.name} (${from.full}) is ${fromFmt} and ${to.name} (${to.full}) is ${toFmt}. The difference is ${Math.abs(diff.hours)} hours${Math.abs(diff.hours) % 1 !== 0 ? ' and 30 minutes' : ''}. To convert from ${from.name} to ${to.name}, ${diff.sign} ${diff.text}.`
        }
      },
      {
        "@type": "Question",
        "name": `Does ${from.name} or ${to.name} observe daylight saving time?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${from.dst ? from.name + ' observes DST.' : from.name + ' does not observe DST.'} ${to.dst ? to.name + ' observes DST.' : to.name + ' does not observe DST.'}`
        }
      },
      {
        "@type": "Question",
        "name": `How do I convert ${from.name} to ${to.name} in code?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `In JavaScript, use Intl.DateTimeFormat with the timeZone option set to the IANA zone name. For ${from.name} use '${from.iana}' and for ${to.name} use '${to.iana}'.`
        }
      }
    ]
  };

  const body = `  <div style="max-width:720px;margin:2rem auto;padding:1.5rem;background:var(--bg-card,#161b22);border:1px solid var(--border,#30363d);border-radius:8px;border-left:4px solid var(--accent,#58a6ff);">
    <p style="font-size:1.2rem;font-weight:700;margin:0;">${escHtml(directAnswer)}</p>
  </div>

  <div style="max-width:720px;margin:2rem auto;line-height:1.7;">
    <h2>Understanding the ${from.name} to ${to.name} Offset</h2>
    <p><strong>${from.name}</strong> (${from.full}) has a UTC offset of <strong>${fromFmt}</strong>. <strong>${to.name}</strong> (${to.full}) has a UTC offset of <strong>${toFmt}</strong>. The net difference between these two zones is <strong>${Math.abs(diff.hours)} hours${Math.abs(diff.hours) % 1 !== 0 ? ' and 30 minutes' : ''}</strong>. When it is noon in ${from.name}, it is ${convertHour(12, from.offset, to.offset)} in ${to.name}.</p>
    ${dstNote}
    <p>The IANA timezone identifiers for these zones are <code>${from.iana}</code> (${from.name}) and <code>${to.iana}</code> (${to.name}). These identifiers are used by programming languages and operating systems to handle timezone conversions correctly, including automatic DST adjustments.</p>

    <h2>${from.name} to ${to.name} Conversion Table</h2>
    <table style="width:100%;border-collapse:collapse;margin:1rem 0;">
      <tr><th style="padding:0.5rem;border-bottom:2px solid var(--border,#30363d);text-align:left;">${from.name}</th><th style="padding:0.5rem;border-bottom:2px solid var(--border,#30363d);text-align:left;">${to.name}</th></tr>
${tableRows}
    </table>

    <h2>Code Examples</h2>
    <h3>Python</h3>
    <pre style="background:var(--bg-code,#0d1117);padding:1rem;border-radius:6px;overflow-x:auto;"><code>from datetime import datetime
from zoneinfo import ZoneInfo

# Current time in ${from.name}
now_from = datetime.now(ZoneInfo("${from.iana}"))
# Convert to ${to.name}
now_to = now_from.astimezone(ZoneInfo("${to.iana}"))
print(f"${from.name}: {now_from.strftime('%I:%M %p')}")
print(f"${to.name}: {now_to.strftime('%I:%M %p')}")</code></pre>

    <h3>JavaScript</h3>
    <pre style="background:var(--bg-code,#0d1117);padding:1rem;border-radius:6px;overflow-x:auto;"><code>// Convert current time from ${from.name} to ${to.name}
const now = new Date();
const from = now.toLocaleString("en-US", { timeZone: "${from.iana}" });
const to = now.toLocaleString("en-US", { timeZone: "${to.iana}" });
console.log("${from.name}:", from);
console.log("${to.name}:", to);</code></pre>

    <h3>Go</h3>
    <pre style="background:var(--bg-code,#0d1117);padding:1rem;border-radius:6px;overflow-x:auto;"><code>package main

import (
    "fmt"
    "time"
)

func main() {
    fromLoc, _ := time.LoadLocation("${from.iana}")
    toLoc, _ := time.LoadLocation("${to.iana}")
    now := time.Now().In(fromLoc)
    converted := now.In(toLoc)
    fmt.Printf("${from.name}: %s\\n", now.Format("3:04 PM"))
    fmt.Printf("${to.name}: %s\\n", converted.Format("3:04 PM"))
}</code></pre>

    <h2>Frequently Asked Questions</h2>
    <details style="margin:1rem 0;padding:0.75rem;background:var(--bg-card,#161b22);border:1px solid var(--border,#30363d);border-radius:6px;">
      <summary style="cursor:pointer;font-weight:600;">What is the time difference between ${from.name} and ${to.name}?</summary>
      <p style="margin-top:0.75rem;">${from.name} (${from.full}) is ${fromFmt} and ${to.name} (${to.full}) is ${toFmt}. The standard time difference is ${Math.abs(diff.hours)} hours${Math.abs(diff.hours) % 1 !== 0 ? ' and 30 minutes' : ''}. ${from.dst && to.dst ? 'This difference may change during daylight saving time transitions if the two zones do not switch on the same dates.' : ''}</p>
    </details>
    <details style="margin:1rem 0;padding:0.75rem;background:var(--bg-card,#161b22);border:1px solid var(--border,#30363d);border-radius:6px;">
      <summary style="cursor:pointer;font-weight:600;">Does daylight saving time affect the ${from.name} to ${to.name} conversion?</summary>
      <p style="margin-top:0.75rem;">${from.dst ? `Yes, ${from.name} observes DST and shifts to ${from.dstName} (${formatOffset(from.dstOffset)}) during summer months.` : `No, ${from.name} does not observe DST.`} ${to.dst ? `${to.name} observes DST and shifts to ${to.dstName} (${formatOffset(to.dstOffset)}) during summer months.` : `${to.name} does not observe DST.`} ${(from.dst || to.dst) ? 'Always use IANA timezone identifiers in code to automatically handle these transitions.' : 'The offset is constant year-round.'}</p>
    </details>
    <details style="margin:1rem 0;padding:0.75rem;background:var(--bg-card,#161b22);border:1px solid var(--border,#30363d);border-radius:6px;">
      <summary style="cursor:pointer;font-weight:600;">What are the best overlap hours for ${from.name} and ${to.name} meetings?</summary>
      <p style="margin-top:0.75rem;">For scheduling meetings between ${from.name} and ${to.name}, look for hours when both zones are in typical business hours (9 AM to 5 PM). When it is 9:00 AM in ${from.name}, it is ${convertHour(9, from.offset, to.offset)} in ${to.name}. When it is 5:00 PM in ${from.name}, it is ${convertHour(17, from.offset, to.offset)} in ${to.name}. The best overlap window depends on the specific zones and whether DST is active.</p>
    </details>

    <p><a href="/tools/timezone-converter.html">Try the full Timezone Converter</a> for any time and zone pair.</p>

    <h2>Related Questions</h2>
    <ul>
${related.map(s => {
  const m = s.match(/^(\w+)-to-(\w+)-right-now$/);
  const f = TZ_DATA[m[1]], t = TZ_DATA[m[2]];
  return `      <li><a href="/answers/${s}.html">${f.name} to ${t.name} right now</a></li>`;
}).join('\n')}
    </ul>
  </div>`;

  const html = pageShell({ title, desc, canonical, breadcrumbLabel: `${from.name} to ${to.name}`, h1, faqJson, body });
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  WROTE: ${slug}.html`);
  return slug;
}

// ═══════════════════════════════════════════════════════════════
// PATTERN C: Cron pages
// ═══════════════════════════════════════════════════════════════

const CRON_SEEDS_DATA = {
  'cron-every-10-minutes': {
    expr: '*/10 * * * *',
    humanTitle: 'Every 10 Minutes',
    humanDesc: 'The cron expression for every 10 minutes is */10 * * * *.',
    runsPerDay: 144,
    runsPerHour: 6,
    fields: { minute: '*/10', hour: '*', dom: '*', month: '*', dow: '*' },
    fieldExplain: {
      minute: '*/10 — every 10th minute (0, 10, 20, 30, 40, 50)',
      hour: '* — every hour',
      dom: '* — every day of the month',
      month: '* — every month',
      dow: '* — every day of the week'
    },
    useCases: [
      'Health checks and heartbeat monitoring',
      'Cache invalidation and refresh cycles',
      'Polling external APIs for updated data',
      'Syncing files between systems at regular intervals'
    ],
    nextRuns: function() {
      const runs = [];
      const now = new Date('2026-04-11T00:00:00Z');
      for (let i = 0; runs.length < 5; i++) {
        const candidate = new Date(now.getTime() + i * 60000);
        if (candidate.getUTCMinutes() % 10 === 0) runs.push(candidate);
      }
      return runs;
    }
  },
  'cron-every-15-minutes': {
    expr: '*/15 * * * *',
    humanTitle: 'Every 15 Minutes',
    humanDesc: 'The cron expression for every 15 minutes is */15 * * * *.',
    runsPerDay: 96,
    runsPerHour: 4,
    fields: { minute: '*/15', hour: '*', dom: '*', month: '*', dow: '*' },
    fieldExplain: {
      minute: '*/15 — every 15th minute (0, 15, 30, 45)',
      hour: '* — every hour',
      dom: '* — every day of the month',
      month: '* — every month',
      dow: '* — every day of the week'
    },
    useCases: [
      'Dashboard data refresh and metrics collection',
      'Email queue processing and delivery',
      'Database replication lag monitoring',
      'Social media feed polling and aggregation'
    ],
    nextRuns: function() {
      const runs = [];
      const now = new Date('2026-04-11T00:00:00Z');
      for (let i = 0; runs.length < 5; i++) {
        const candidate = new Date(now.getTime() + i * 60000);
        if (candidate.getUTCMinutes() % 15 === 0) runs.push(candidate);
      }
      return runs;
    }
  },
  'cron-every-30-minutes': {
    expr: '*/30 * * * *',
    humanTitle: 'Every 30 Minutes',
    humanDesc: 'The cron expression for every 30 minutes is */30 * * * *.',
    runsPerDay: 48,
    runsPerHour: 2,
    fields: { minute: '*/30', hour: '*', dom: '*', month: '*', dow: '*' },
    fieldExplain: {
      minute: '*/30 — every 30th minute (0, 30)',
      hour: '* — every hour',
      dom: '* — every day of the month',
      month: '* — every month',
      dow: '* — every day of the week'
    },
    useCases: [
      'Report generation and automated summaries',
      'Inventory sync between e-commerce platforms',
      'DNS record propagation checks',
      'Automated backup verification and integrity checks'
    ],
    nextRuns: function() {
      const runs = [];
      const now = new Date('2026-04-11T00:00:00Z');
      for (let i = 0; runs.length < 5; i++) {
        const candidate = new Date(now.getTime() + i * 60000);
        if (candidate.getUTCMinutes() % 30 === 0) runs.push(candidate);
      }
      return runs;
    }
  },
  'cron-every-2-hours': {
    expr: '0 */2 * * *',
    humanTitle: 'Every 2 Hours',
    humanDesc: 'The cron expression for every 2 hours is 0 */2 * * *.',
    runsPerDay: 12,
    runsPerHour: 0.5,
    fields: { minute: '0', hour: '*/2', dom: '*', month: '*', dow: '*' },
    fieldExplain: {
      minute: '0 — at the top of the hour',
      hour: '*/2 — every 2nd hour (0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22)',
      dom: '* — every day of the month',
      month: '* — every month',
      dow: '* — every day of the week'
    },
    useCases: [
      'SSL certificate expiration monitoring',
      'Automated sitemap regeneration for SEO',
      'Data warehouse ETL pipeline triggers',
      'System resource usage reporting and alerting'
    ],
    nextRuns: function() {
      const runs = [];
      const now = new Date('2026-04-11T00:00:00Z');
      for (let i = 0; runs.length < 5; i++) {
        const candidate = new Date(now.getTime() + i * 3600000);
        if (candidate.getUTCHours() % 2 === 0 && candidate.getUTCMinutes() === 0) runs.push(candidate);
      }
      return runs;
    }
  },
  'cron-every-4-hours': {
    expr: '0 */4 * * *',
    humanTitle: 'Every 4 Hours',
    humanDesc: 'The cron expression for every 4 hours is 0 */4 * * *.',
    runsPerDay: 6,
    runsPerHour: 0.25,
    fields: { minute: '0', hour: '*/4', dom: '*', month: '*', dow: '*' },
    fieldExplain: {
      minute: '0 — at the top of the hour',
      hour: '*/4 — every 4th hour (0, 4, 8, 12, 16, 20)',
      dom: '* — every day of the month',
      month: '* — every month',
      dow: '* — every day of the week'
    },
    useCases: [
      'CDN cache purge and content refresh',
      'Incremental database backup snapshots',
      'API rate limit reset monitoring',
      'Scheduled search index rebuilds for large datasets'
    ],
    nextRuns: function() {
      const runs = [];
      const now = new Date('2026-04-11T00:00:00Z');
      for (let i = 0; runs.length < 5; i++) {
        const candidate = new Date(now.getTime() + i * 3600000);
        if (candidate.getUTCHours() % 4 === 0 && candidate.getUTCMinutes() === 0) runs.push(candidate);
      }
      return runs;
    }
  },
  'cron-every-6-hours': {
    expr: '0 */6 * * *',
    humanTitle: 'Every 6 Hours',
    humanDesc: 'The cron expression for every 6 hours is 0 */6 * * *.',
    runsPerDay: 4,
    runsPerHour: null,
    fields: { minute: '0', hour: '*/6', dom: '*', month: '*', dow: '*' },
    fieldExplain: {
      minute: '0 — at the top of the hour',
      hour: '*/6 — every 6th hour (0, 6, 12, 18)',
      dom: '* — every day of the month',
      month: '* — every month',
      dow: '* — every day of the week'
    },
    useCases: [
      'Full site crawl and broken link detection',
      'Analytics aggregation and dashboard updates',
      'Rotating log file compression and archival',
      'Third-party data feed synchronization'
    ],
    nextRuns: function() {
      const runs = [];
      const now = new Date('2026-04-11T00:00:00Z');
      for (let i = 0; runs.length < 5; i++) {
        const candidate = new Date(now.getTime() + i * 3600000);
        if (candidate.getUTCHours() % 6 === 0 && candidate.getUTCMinutes() === 0) runs.push(candidate);
      }
      return runs;
    }
  },
  'cron-every-12-hours': {
    expr: '0 */12 * * *',
    humanTitle: 'Every 12 Hours',
    humanDesc: 'The cron expression for every 12 hours is 0 */12 * * *.',
    runsPerDay: 2,
    runsPerHour: null,
    fields: { minute: '0', hour: '*/12', dom: '*', month: '*', dow: '*' },
    fieldExplain: {
      minute: '0 — at the top of the hour',
      hour: '*/12 — every 12th hour (0, 12)',
      dom: '* — every day of the month',
      month: '* — every month',
      dow: '* — every day of the week'
    },
    useCases: [
      'Twice-daily full database backup',
      'DNS zone transfer and propagation verification',
      'Compliance report generation for auditing',
      'Long-running data pipeline orchestration'
    ],
    nextRuns: function() {
      const runs = [];
      const now = new Date('2026-04-11T00:00:00Z');
      for (let i = 0; runs.length < 5; i++) {
        const candidate = new Date(now.getTime() + i * 3600000);
        if (candidate.getUTCHours() % 12 === 0 && candidate.getUTCMinutes() === 0) runs.push(candidate);
      }
      return runs;
    }
  },
  'cron-daily-9am': {
    expr: '0 9 * * *',
    humanTitle: 'Daily at 9 AM',
    humanDesc: 'The cron expression for daily at 9 AM is 0 9 * * *.',
    runsPerDay: 1,
    runsPerHour: null,
    fields: { minute: '0', hour: '9', dom: '*', month: '*', dow: '*' },
    fieldExplain: {
      minute: '0 — at the top of the hour',
      hour: '9 — at 9 AM (server time)',
      dom: '* — every day of the month',
      month: '* — every month',
      dow: '* — every day of the week'
    },
    useCases: [
      'Daily team standup reminder notifications',
      'Morning dashboard report delivery via email',
      'Daily database integrity checks before business hours',
      'Automated deployment status summary for operations teams'
    ],
    nextRuns: function() {
      const runs = [];
      const now = new Date('2026-04-11T00:00:00Z');
      for (let d = 0; runs.length < 5; d++) {
        const candidate = new Date(now.getTime() + d * 86400000);
        candidate.setUTCHours(9, 0, 0, 0);
        if (candidate >= now) runs.push(candidate);
      }
      return runs;
    }
  },
  'cron-every-sunday': {
    expr: '0 0 * * 0',
    humanTitle: 'Every Sunday at Midnight',
    humanDesc: 'The cron expression for every Sunday at midnight is 0 0 * * 0.',
    runsPerDay: null,
    runsPerHour: null,
    fields: { minute: '0', hour: '0', dom: '*', month: '*', dow: '0' },
    fieldExplain: {
      minute: '0 — at the top of the hour',
      hour: '0 — at midnight (00:00)',
      dom: '* — every day of the month',
      month: '* — every month',
      dow: '0 — Sunday only'
    },
    useCases: [
      'Weekly full database backup before the new work week',
      'Weekly analytics digest email to stakeholders',
      'Clearing temporary files and expired cache entries',
      'Weekly dependency vulnerability scanning for security'
    ],
    nextRuns: function() {
      const runs = [];
      const now = new Date('2026-04-11T00:00:00Z');
      for (let d = 0; runs.length < 5; d++) {
        const candidate = new Date(now.getTime() + d * 86400000);
        candidate.setUTCHours(0, 0, 0, 0);
        if (candidate.getUTCDay() === 0 && candidate >= now) runs.push(candidate);
      }
      return runs;
    }
  },
  'cron-every-monday': {
    expr: '0 0 * * 1',
    humanTitle: 'Every Monday at Midnight',
    humanDesc: 'The cron expression for every Monday at midnight is 0 0 * * 1.',
    runsPerDay: null,
    runsPerHour: null,
    fields: { minute: '0', hour: '0', dom: '*', month: '*', dow: '1' },
    fieldExplain: {
      minute: '0 — at the top of the hour',
      hour: '0 — at midnight (00:00)',
      dom: '* — every day of the month',
      month: '* — every month',
      dow: '1 — Monday only'
    },
    useCases: [
      'Start-of-week automated reporting and KPI summaries',
      'Weekly CI/CD pipeline health checks',
      'Rotating API keys and secrets on a weekly schedule',
      'Weekly sitemap submission to search engines for SEO'
    ],
    nextRuns: function() {
      const runs = [];
      const now = new Date('2026-04-11T00:00:00Z');
      for (let d = 0; runs.length < 5; d++) {
        const candidate = new Date(now.getTime() + d * 86400000);
        candidate.setUTCHours(0, 0, 0, 0);
        if (candidate.getUTCDay() === 1 && candidate >= now) runs.push(candidate);
      }
      return runs;
    }
  }
};

const CRON_SEED_KEYS = Object.keys(CRON_SEEDS_DATA);

function generateCronPage(slug) {
  const filePath = path.join(ANSWERS_DIR, `${slug}.html`);
  if (fs.existsSync(filePath)) {
    console.log(`  SKIP (exists): ${slug}.html`);
    return null;
  }
  if (SKIP_CRON.has(slug)) {
    console.log(`  SKIP (V30): ${slug}.html`);
    return null;
  }

  const data = CRON_SEEDS_DATA[slug];
  if (!data) { console.log(`  SKIP (no data): ${slug}`); return null; }

  const title = `Cron Expression for ${data.humanTitle}`;
  const desc = `${data.humanDesc} Free tool to verify and explore.`;
  const canonical = `${BASE_URL}/answers/${slug}.html`;
  const nextRuns = data.nextRuns();

  const faqJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What is the cron expression for ${data.humanTitle.toLowerCase()}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${data.humanDesc} ${data.runsPerDay ? `This schedule runs ${data.runsPerDay} time${data.runsPerDay !== 1 ? 's' : ''} per day.` : 'This schedule runs once per week.'}`
        }
      },
      {
        "@type": "Question",
        "name": `How do I set up a cron job for ${data.humanTitle.toLowerCase()}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Open your crontab with 'crontab -e' and add a line starting with '${data.expr}' followed by the command you want to run. For example: ${data.expr} /path/to/script.sh`
        }
      },
      {
        "@type": "Question",
        "name": `What does each field in ${data.expr} mean?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `A cron expression has 5 fields: minute (${data.fields.minute}), hour (${data.fields.hour}), day of month (${data.fields.dom}), month (${data.fields.month}), and day of week (${data.fields.dow}). In ${data.expr}: ${data.fieldExplain.minute}; ${data.fieldExplain.hour}.`
        }
      }
    ]
  };

  const related = CRON_SEED_KEYS.filter(s => s !== slug).slice(0, 3);
  const existingCronPages = ['cron-every-5-minutes', 'cron-every-hour', 'cron-every-day-at-midnight'];
  const relatedLinks = [...related, ...existingCronPages.filter(s => !related.includes(s))].slice(0, 4);

  const body = `  <div style="max-width:720px;margin:2rem auto;padding:1.5rem;background:var(--bg-card,#161b22);border:1px solid var(--border,#30363d);border-radius:8px;border-left:4px solid var(--accent,#58a6ff);">
    <p style="font-size:1.2rem;font-weight:700;margin:0;"><code style="background:var(--bg-code,#0d1117);padding:0.2rem 0.5rem;border-radius:4px;">${data.expr}</code></p>
  </div>

  <div style="max-width:720px;margin:2rem auto;line-height:1.7;">
    <h2>Expression Breakdown</h2>
    <p>The cron expression <code>${data.expr}</code> schedules a job to run <strong>${data.humanTitle.toLowerCase()}</strong>. A standard cron expression consists of five fields representing minute, hour, day of month, month, and day of week. Here is what each field means in this expression:</p>
    <table style="width:100%;border-collapse:collapse;margin:1rem 0;">
      <tr><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);color:var(--text-muted,#8b949e);">Minute</td><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);"><code>${data.fields.minute}</code> &mdash; ${data.fieldExplain.minute.split(' — ')[1]}</td></tr>
      <tr><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);color:var(--text-muted,#8b949e);">Hour</td><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);"><code>${data.fields.hour}</code> &mdash; ${data.fieldExplain.hour.split(' — ')[1]}</td></tr>
      <tr><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);color:var(--text-muted,#8b949e);">Day of Month</td><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);"><code>${data.fields.dom}</code> &mdash; ${data.fieldExplain.dom.split(' — ')[1]}</td></tr>
      <tr><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);color:var(--text-muted,#8b949e);">Month</td><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);"><code>${data.fields.month}</code> &mdash; ${data.fieldExplain.month.split(' — ')[1]}</td></tr>
      <tr><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);color:var(--text-muted,#8b949e);">Day of Week</td><td style="padding:0.5rem;border-bottom:1px solid var(--border,#30363d);"><code>${data.fields.dow}</code> &mdash; ${data.fieldExplain.dow.split(' — ')[1]}</td></tr>
    </table>
    <p>This schedule runs <strong>${data.runsPerDay ? data.runsPerDay + ' time' + (data.runsPerDay !== 1 ? 's' : '') + ' per day' : 'once per week'}</strong>${data.runsPerHour ? ` (${data.runsPerHour} time${data.runsPerHour !== 1 ? 's' : ''} per hour)` : ''}, which amounts to <strong>${data.runsPerDay ? (data.runsPerDay * 7) + ' times per week' : '1 time per week'}</strong> and approximately <strong>${data.runsPerDay ? (data.runsPerDay * 30) + ' times per month' : '4-5 times per month'}</strong>.</p>

    <h2>Next 5 Run Times</h2>
    <p>Starting from April 11, 2026 00:00 UTC, the next five executions are:</p>
    <ol>
${nextRuns.map(d => `      <li><code>${d.toISOString().replace('.000Z','Z')}</code> &mdash; ${d.toUTCString()}</li>`).join('\n')}
    </ol>

    <h2>Common Use Cases</h2>
    <p>Running a task ${data.humanTitle.toLowerCase()} is a popular cron schedule. Here are some typical applications:</p>
    <ul>
${data.useCases.map(u => `      <li><strong>${u.split(' ').slice(0,2).join(' ')}</strong>: ${u}</li>`).join('\n')}
    </ul>

    <h2>Code Examples</h2>
    <h3>Linux / macOS Crontab</h3>
    <pre style="background:var(--bg-code,#0d1117);padding:1rem;border-radius:6px;overflow-x:auto;"><code># Open crontab editor
crontab -e

# Add this line to run your script ${data.humanTitle.toLowerCase()}
${data.expr} /usr/local/bin/my-task.sh

# With logging
${data.expr} /usr/local/bin/my-task.sh >> /var/log/my-task.log 2>&1</code></pre>

    <h3>Python (schedule library alternative)</h3>
    <pre style="background:var(--bg-code,#0d1117);padding:1rem;border-radius:6px;overflow-x:auto;"><code># Using APScheduler with cron trigger
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

scheduler = BlockingScheduler()
trigger = CronTrigger.from_crontab("${data.expr}")
scheduler.add_job(my_function, trigger)
scheduler.start()</code></pre>

    <h3>JavaScript (Node.js with node-cron)</h3>
    <pre style="background:var(--bg-code,#0d1117);padding:1rem;border-radius:6px;overflow-x:auto;"><code>const cron = require('node-cron');

// Run task ${data.humanTitle.toLowerCase()}
cron.schedule('${data.expr}', () => {
  console.log('Task running at', new Date().toISOString());
  // Your task logic here
});</code></pre>

    <h2>Frequently Asked Questions</h2>
    <details style="margin:1rem 0;padding:0.75rem;background:var(--bg-card,#161b22);border:1px solid var(--border,#30363d);border-radius:6px;">
      <summary style="cursor:pointer;font-weight:600;">What does each field in <code>${data.expr}</code> mean?</summary>
      <p style="margin-top:0.75rem;">A cron expression has five fields separated by spaces: <strong>minute</strong> (0-59), <strong>hour</strong> (0-23), <strong>day of month</strong> (1-31), <strong>month</strong> (1-12), and <strong>day of week</strong> (0-7, where 0 and 7 are Sunday). The <code>*/n</code> syntax means "every nth interval." In <code>${data.expr}</code>, the fields are: ${data.fieldExplain.minute}; ${data.fieldExplain.hour}; ${data.fieldExplain.dom}.</p>
    </details>
    <details style="margin:1rem 0;padding:0.75rem;background:var(--bg-card,#161b22);border:1px solid var(--border,#30363d);border-radius:6px;">
      <summary style="cursor:pointer;font-weight:600;">How do I verify that <code>${data.expr}</code> is correct?</summary>
      <p style="margin-top:0.75rem;">Use the <a href="/tools/cron-expression-builder.html">EpochPilot Cron Expression Builder</a> to paste your expression and see the next run times visually. You can also use the <code>crontab -l</code> command to list your current crontab entries, or test with a simple echo command: <code>${data.expr} echo "test" >> /tmp/cron-test.log</code>.</p>
    </details>
    <details style="margin:1rem 0;padding:0.75rem;background:var(--bg-card,#161b22);border:1px solid var(--border,#30363d);border-radius:6px;">
      <summary style="cursor:pointer;font-weight:600;">What timezone does cron use?</summary>
      <p style="margin-top:0.75rem;">By default, cron uses the system timezone configured on your server. On most cloud servers this is UTC. You can check your system timezone with <code>timedatectl</code> on Linux or <code>date +%Z</code>. Some cron implementations (like Kubernetes CronJobs) let you specify a timezone explicitly. Always verify your server's timezone to ensure jobs run at the expected times.</p>
    </details>

    <p><a href="/tools/cron-expression-builder.html">Try the Cron Expression Builder</a> to create and test cron schedules.</p>

    <h2>Related Questions</h2>
    <ul>
${relatedLinks.map(s => {
  const d = CRON_SEEDS_DATA[s];
  const label = d ? `Cron expression for ${d.humanTitle.toLowerCase()}` : `Cron expression: ${s.replace('cron-', '').replace(/-/g, ' ')}`;
  return `      <li><a href="/answers/${s}.html">${label}</a></li>`;
}).join('\n')}
    </ul>
  </div>`;

  const html = pageShell({ title, desc, canonical, breadcrumbLabel: data.humanTitle, h1: title, faqJson, body });
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  WROTE: ${slug}.html`);
  return slug;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

function main() {
  if (!fs.existsSync(ANSWERS_DIR)) fs.mkdirSync(ANSWERS_DIR, { recursive: true });

  const generated = [];
  console.log('=== Pattern A: Epoch pages ===');
  const allEpochList = [...uniqueEpochs, ...Array.from(SKIP_EPOCHS)];
  for (const epoch of uniqueEpochs) {
    const slug = generateEpochPage(epoch, allEpochList);
    if (slug) generated.push(slug);
  }

  console.log('\n=== Pattern B: Timezone pages ===');
  for (const slug of TZ_SEEDS) {
    const result = generateTimezonePage(slug);
    if (result) generated.push(result);
  }

  console.log('\n=== Pattern C: Cron pages ===');
  for (const slug of CRON_SEED_KEYS) {
    const result = generateCronPage(slug);
    if (result) generated.push(result);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Generated: ${generated.length} new pages`);
  console.log(`Skipped: ${uniqueEpochs.length + TZ_SEEDS.length + CRON_SEED_KEYS.length - generated.length} pages (already exist or V30)`);
  return generated;
}

const generated = main();
// Write list for sitemap updater
fs.writeFileSync(path.join(__dirname, '..', '.generated-pages.json'), JSON.stringify(generated, null, 2));
