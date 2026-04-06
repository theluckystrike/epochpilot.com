/* EpochPilot — language-reference component */

const SNIPPETS = {
  python: {
    name: 'Python',
    sections: [
      {
        title: 'Get Current Timestamp',
        code: `import time

# Seconds (integer)
timestamp = int(time.time())
print(timestamp)  # e.g. 1712000000

# Milliseconds
timestamp_ms = int(time.time() * 1000)
print(timestamp_ms)  # e.g. 1712000000000

# Using datetime
from datetime import datetime, timezone
now = datetime.now(timezone.utc)
epoch = int(now.timestamp())
print(epoch)`
      },
      {
        title: 'Convert Timestamp to Date',
        code: `from datetime import datetime, timezone

ts = 1712000000

# Local time
dt_local = datetime.fromtimestamp(ts)
print(dt_local)  # 2024-04-01 20:00:00 (varies by timezone)

# UTC
dt_utc = datetime.fromtimestamp(ts, tz=timezone.utc)
print(dt_utc)  # 2024-04-02 00:00:00+00:00

# ISO 8601
print(dt_utc.isoformat())  # 2024-04-02T00:00:00+00:00`
      },
      {
        title: 'Convert Date to Timestamp',
        code: `from datetime import datetime, timezone

# From a specific date (UTC)
dt = datetime(2025, 4, 2, 12, 0, 0, tzinfo=timezone.utc)
ts = int(dt.timestamp())
print(ts)  # 1743566400

# From a date string
dt = datetime.strptime("2025-04-02 12:00:00", "%Y-%m-%d %H:%M:%S")
dt = dt.replace(tzinfo=timezone.utc)
ts = int(dt.timestamp())
print(ts)`
      },
      {
        title: 'Format Dates',
        code: `from datetime import datetime

now = datetime.now()

# Common formats
print(now.strftime("%Y-%m-%d"))          # 2025-04-02
print(now.strftime("%Y-%m-%d %H:%M:%S")) # 2025-04-02 12:00:00
print(now.strftime("%B %d, %Y"))         # April 02, 2025
print(now.strftime("%a, %d %b %Y"))      # Wed, 02 Apr 2025
print(now.strftime("%I:%M %p"))          # 12:00 PM

# ISO 8601
print(now.isoformat())  # 2025-04-02T12:00:00.000000`
      },
      {
        title: 'Parse Date Strings',
        code: `from datetime import datetime

# strptime — parse string to datetime
dt = datetime.strptime("2025-04-02", "%Y-%m-%d")
dt = datetime.strptime("Apr 2, 2025 12:00 PM", "%b %d, %Y %I:%M %p")

# ISO 8601 (Python 3.7+)
dt = datetime.fromisoformat("2025-04-02T12:00:00+00:00")

# Common format codes:
# %Y = 4-digit year  %m = month (01-12)  %d = day (01-31)
# %H = hour 24h      %M = minute         %S = second
# %I = hour 12h      %p = AM/PM          %Z = timezone name`
      }
    ]
  },
  javascript: {
    name: 'JavaScript',
    sections: [
      {
        title: 'Get Current Timestamp',
        code: `// Milliseconds (native)
const tsMs = Date.now();
console.log(tsMs);  // e.g. 1712000000000

// Seconds
const tsSec = Math.floor(Date.now() / 1000);
console.log(tsSec);  // e.g. 1712000000

// Alternative
const ts = new Date().getTime();  // milliseconds
const ts2 = +new Date();          // milliseconds (shorthand)`
      },
      {
        title: 'Convert Timestamp to Date',
        code: `// From seconds (multiply by 1000)
const date = new Date(1712000000 * 1000);

// From milliseconds (use directly)
const date2 = new Date(1712000000000);

console.log(date.toISOString());      // 2024-04-02T00:00:00.000Z
console.log(date.toUTCString());      // Tue, 02 Apr 2024 00:00:00 GMT
console.log(date.toLocaleString());   // 4/1/2024, 8:00:00 PM (varies)
console.log(date.toLocaleDateString()); // 4/1/2024`
      },
      {
        title: 'Convert Date to Timestamp',
        code: `// From a Date object
const ts = new Date('2025-04-02T12:00:00Z').getTime(); // ms
const tsSec = Math.floor(ts / 1000);                    // sec

// From components (months are 0-indexed!)
const date = new Date(Date.UTC(2025, 3, 2, 12, 0, 0)); // April = 3
const epoch = date.getTime(); // 1743566400000

// Parse various formats
new Date('2025-04-02');                    // ISO date
new Date('April 2, 2025 12:00:00');        // Natural
Date.parse('Wed, 02 Apr 2025 12:00:00 GMT'); // ms`
      },
      {
        title: 'Format Dates',
        code: `const date = new Date();

// Built-in methods
date.toISOString();     // 2025-04-02T12:00:00.000Z
date.toUTCString();     // Wed, 02 Apr 2025 12:00:00 GMT
date.toLocaleString();  // locale-dependent

// Intl.DateTimeFormat (full control)
new Intl.DateTimeFormat('en-US', {
  year: 'numeric', month: 'long', day: 'numeric',
  hour: '2-digit', minute: '2-digit',
  timeZone: 'America/New_York'
}).format(date);
// "April 2, 2025, 08:00 AM"

// Template literal approach
const pad = n => String(n).padStart(2, '0');
const fmt = \`\${date.getFullYear()}-\${pad(date.getMonth()+1)}-\${pad(date.getDate())}\`;`
      },
      {
        title: 'Timezone Conversions',
        code: `const date = new Date();

// Get time in a specific timezone
const options = {
  timeZone: 'Asia/Tokyo',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false
};
console.log(new Intl.DateTimeFormat('en-US', options).format(date));

// Get timezone offset in minutes
const offset = date.getTimezoneOffset(); // -300 for EST (UTC-5)

// Supported IANA timezones
Intl.supportedValuesOf('timeZone'); // full list (modern browsers)`
      }
    ]
  },
  java: {
    name: 'Java',
    sections: [
      {
        title: 'Get Current Timestamp',
        code: `import java.time.Instant;

// Seconds
long epochSec = Instant.now().getEpochSecond();
System.out.println(epochSec);  // e.g. 1712000000

// Milliseconds
long epochMs = System.currentTimeMillis();
System.out.println(epochMs);   // e.g. 1712000000000

// Using Instant
Instant now = Instant.now();
System.out.println(now);  // 2025-04-02T12:00:00.000Z`
      },
      {
        title: 'Convert Timestamp to Date',
        code: `import java.time.*;
import java.time.format.DateTimeFormatter;

long epochSec = 1712000000L;

// To Instant
Instant instant = Instant.ofEpochSecond(epochSec);
System.out.println(instant);  // 2024-04-02T00:00:00Z

// To LocalDateTime (UTC)
LocalDateTime utcDt = LocalDateTime.ofInstant(instant, ZoneId.of("UTC"));
System.out.println(utcDt);  // 2024-04-02T00:00

// To ZonedDateTime
ZonedDateTime zdt = instant.atZone(ZoneId.of("America/New_York"));
System.out.println(zdt);  // 2024-04-01T20:00-04:00[America/New_York]

// From milliseconds
Instant fromMs = Instant.ofEpochMilli(1712000000000L);`
      },
      {
        title: 'Convert Date to Timestamp',
        code: `import java.time.*;

// From LocalDateTime (UTC)
LocalDateTime dt = LocalDateTime.of(2025, 4, 2, 12, 0, 0);
long epoch = dt.toEpochSecond(ZoneOffset.UTC);
System.out.println(epoch);  // 1743566400

// From ZonedDateTime
ZonedDateTime zdt = ZonedDateTime.of(2025, 4, 2, 12, 0, 0, 0,
    ZoneId.of("America/New_York"));
long epochSec = zdt.toEpochSecond();

// From string
LocalDateTime parsed = LocalDateTime.parse("2025-04-02T12:00:00");
long ts = parsed.toEpochSecond(ZoneOffset.UTC);`
      },
      {
        title: 'Format Dates',
        code: `import java.time.*;
import java.time.format.DateTimeFormatter;

LocalDateTime dt = LocalDateTime.now();

// Predefined formatters
dt.format(DateTimeFormatter.ISO_LOCAL_DATE);       // 2025-04-02
dt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);  // 2025-04-02T12:00:00

// Custom pattern
DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
System.out.println(dt.format(fmt));  // 2025-04-02 12:00:00

DateTimeFormatter fmt2 = DateTimeFormatter.ofPattern("MMMM d, yyyy h:mm a");
System.out.println(dt.format(fmt2)); // April 2, 2025 12:00 PM

// Thread-safe (unlike SimpleDateFormat)`
      }
    ]
  },
  php: {
    name: 'PHP',
    sections: [
      {
        title: 'Get Current Timestamp',
        code: `<?php
// Seconds
$timestamp = time();
echo $timestamp;  // e.g. 1712000000

// Milliseconds
$timestampMs = (int)(microtime(true) * 1000);
echo $timestampMs;  // e.g. 1712000000000

// Using DateTime
$now = new DateTime();
$epoch = $now->getTimestamp();
echo $epoch;`
      },
      {
        title: 'Convert Timestamp to Date',
        code: `<?php
$ts = 1712000000;

// Using date()
echo date('Y-m-d H:i:s', $ts);        // 2024-04-01 20:00:00 (local)
echo gmdate('Y-m-d H:i:s', $ts);      // 2024-04-02 00:00:00 (UTC)
echo date('c', $ts);                    // ISO 8601
echo date('r', $ts);                    // RFC 2822
echo date('l, F j, Y g:i A', $ts);    // Monday, April 1, 2024 8:00 PM

// Using DateTime
$dt = new DateTime("@$ts");
$dt->setTimezone(new DateTimeZone('UTC'));
echo $dt->format('Y-m-d H:i:s');      // 2024-04-02 00:00:00`
      },
      {
        title: 'Convert Date to Timestamp',
        code: `<?php
// Using strtotime()
$ts = strtotime('2025-04-02 12:00:00');
echo $ts;  // 1743566400

// strtotime handles many formats
echo strtotime('April 2, 2025');
echo strtotime('next Monday');
echo strtotime('+1 week');
echo strtotime('2025-04-02T12:00:00Z');

// Using DateTime
$dt = new DateTime('2025-04-02 12:00:00', new DateTimeZone('UTC'));
$ts = $dt->getTimestamp();
echo $ts;

// Using mktime (local timezone)
$ts = mktime(12, 0, 0, 4, 2, 2025); // H, M, S, month, day, year`
      },
      {
        title: 'Format Dates',
        code: `<?php
// date() format characters
echo date('Y-m-d');          // 2025-04-02
echo date('Y-m-d H:i:s');   // 2025-04-02 12:00:00
echo date('F j, Y');         // April 2, 2025
echo date('D, d M Y');      // Wed, 02 Apr 2025
echo date('g:i A');          // 12:00 PM
echo date('U');              // Unix timestamp

// Common format characters:
// Y = 4-digit year  m = month (01-12)  d = day (01-31)
// H = hour 24h      i = minute         s = second
// g = hour 12h      A = AM/PM          l = day name
// F = month name    j = day (1-31)     D = short day name`
      },
      {
        title: 'DateTime Class',
        code: `<?php
// Create
$dt = new DateTime();                               // now
$dt = new DateTime('2025-04-02');                   // from string
$dt = new DateTime('@1712000000');                  // from epoch

// Timezone
$dt = new DateTime('now', new DateTimeZone('Asia/Tokyo'));
$dt->setTimezone(new DateTimeZone('UTC'));

// Arithmetic
$dt->modify('+1 day');
$dt->modify('-2 hours');
$dt->modify('+3 months');

// Difference
$dt1 = new DateTime('2025-01-01');
$dt2 = new DateTime('2025-04-02');
$diff = $dt1->diff($dt2);
echo $diff->days;  // 91`
      }
    ]
  },
  go: {
    name: 'Go',
    sections: [
      {
        title: 'Get Current Timestamp',
        code: `package main

import (
    "fmt"
    "time"
)

func main() {
    // Seconds
    ts := time.Now().Unix()
    fmt.Println(ts)  // e.g. 1712000000

    // Milliseconds
    tsMs := time.Now().UnixMilli()
    fmt.Println(tsMs)  // e.g. 1712000000000

    // Nanoseconds
    tsNano := time.Now().UnixNano()
    fmt.Println(tsNano)
}`
      },
      {
        title: 'Convert Timestamp to Date',
        code: `package main

import (
    "fmt"
    "time"
)

func main() {
    ts := int64(1712000000)

    // From seconds
    t := time.Unix(ts, 0)
    fmt.Println(t)         // 2024-04-02 00:00:00 +0000 UTC
    fmt.Println(t.UTC())   // explicit UTC

    // From milliseconds
    tMs := time.UnixMilli(1712000000000)
    fmt.Println(tMs)

    // Formatted output
    fmt.Println(t.Format(time.RFC3339))     // 2024-04-02T00:00:00Z
    fmt.Println(t.Format(time.RFC1123))     // Tue, 02 Apr 2024 00:00:00 UTC
    fmt.Println(t.Format("2006-01-02"))     // 2024-04-02
}`
      },
      {
        title: 'Convert Date to Timestamp',
        code: `package main

import (
    "fmt"
    "time"
)

func main() {
    // From components
    t := time.Date(2025, time.April, 2, 12, 0, 0, 0, time.UTC)
    fmt.Println(t.Unix())      // 1743566400
    fmt.Println(t.UnixMilli()) // 1743566400000

    // Parse a string
    layout := "2006-01-02 15:04:05"
    t2, err := time.Parse(layout, "2025-04-02 12:00:00")
    if err == nil {
        fmt.Println(t2.Unix())
    }

    // Parse with timezone
    loc, _ := time.LoadLocation("America/New_York")
    t3, _ := time.ParseInLocation(layout, "2025-04-02 12:00:00", loc)
    fmt.Println(t3.Unix())
}`
      },
      {
        title: 'Format Dates (Reference Time)',
        code: `package main

import (
    "fmt"
    "time"
)

func main() {
    t := time.Now()

    // Go uses a reference time: Mon Jan 2 15:04:05 MST 2006
    // Each number is unique: 01=month, 02=day, 15/03=hour, 04=min, 05=sec

    fmt.Println(t.Format("2006-01-02"))           // 2025-04-02
    fmt.Println(t.Format("2006-01-02 15:04:05"))  // 2025-04-02 12:00:00
    fmt.Println(t.Format("January 2, 2006"))      // April 2, 2025
    fmt.Println(t.Format("Mon, 02 Jan 2006"))     // Wed, 02 Apr 2025
    fmt.Println(t.Format("3:04 PM"))              // 12:00 PM
    fmt.Println(t.Format(time.RFC3339))           // 2025-04-02T12:00:00Z
    fmt.Println(t.Format(time.Kitchen))           // 12:00PM
}`
      },
      {
        title: 'Timezone & Duration',
        code: `package main

import (
    "fmt"
    "time"
)

func main() {
    // Timezone conversion
    t := time.Now().UTC()
    loc, _ := time.LoadLocation("Asia/Tokyo")
    tokyo := t.In(loc)
    fmt.Println(tokyo)  // time in JST

    // Duration arithmetic
    t2 := t.Add(24 * time.Hour)       // +1 day
    t3 := t.Add(-2 * time.Hour)       // -2 hours
    t4 := t.AddDate(0, 1, 0)          // +1 month

    // Difference between times
    d := t2.Sub(t)
    fmt.Println(d.Hours())   // 24
    fmt.Println(d.Minutes()) // 1440
    fmt.Println(d.Seconds()) // 86400
}`
      }
    ]
  }
};

export function init(container, config) {
  const lang = config.language || 'python';
  const data = SNIPPETS[lang];

  if (!data) {
    container.innerHTML = `<p style="color:#ef4444;">Unknown language: ${lang}</p>`;
    return;
  }

  let html = `<h3 style="color:var(--accent);margin-bottom:1rem;">${data.name} Timestamp Reference</h3>`;

  data.sections.forEach(section => {
    html += `
      <div style="margin-bottom:1.5rem;">
        <h3 style="font-size:1rem;margin-bottom:0.5rem;">${section.title}</h3>
        <div style="position:relative;">
          <pre style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;overflow-x:auto;font-family:var(--font-display);font-size:0.82rem;line-height:1.6;"><code class="lang-${lang}">${escapeHtml(section.code)}</code></pre>
          <button class="btn btn-outline copy-snippet" style="position:absolute;top:0.5rem;right:0.5rem;padding:0.2rem 0.6rem;font-size:0.72rem;" data-code="${escapeAttr(section.code)}">Copy</button>
        </div>
      </div>`;
  });

  container.innerHTML = html;

  // Apply syntax highlighting
  container.querySelectorAll('code').forEach(block => {
    block.innerHTML = highlight(block.textContent, lang);
  });

  // Copy buttons
  container.querySelectorAll('.copy-snippet').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.code).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = orig, 1200);
      });
    });
  });
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlight(code, lang) {
  // Simple CSS-based syntax highlighting without external libraries
  let html = escapeHtml(code);

  // Comments
  if (lang === 'python' || lang === 'php') {
    html = html.replace(/(#.*)$/gm, '<span style="color:#6b7280;">$1</span>');
  }
  if (lang === 'javascript' || lang === 'java' || lang === 'go') {
    html = html.replace(/(\/\/.*)$/gm, '<span style="color:#6b7280;">$1</span>');
  }
  if (lang === 'php') {
    html = html.replace(/(&lt;\?php)/g, '<span style="color:#c084fc;">$1</span>');
  }

  // Strings (double-quoted)
  html = html.replace(/(&quot;[^&]*?&quot;)/g, '<span style="color:#34d399;">$1</span>');
  // Strings (single-quoted)
  html = html.replace(/(&#39;[^&]*?&#39;)/g, '<span style="color:#34d399;">$1</span>');

  // Keywords
  const keywords = {
    python: ['import', 'from', 'def', 'return', 'print', 'if', 'else', 'for', 'in', 'True', 'False', 'None', 'class', 'with', 'as'],
    javascript: ['const', 'let', 'var', 'function', 'return', 'new', 'if', 'else', 'for', 'of', 'in', 'true', 'false', 'null', 'undefined', 'console', 'import', 'export'],
    java: ['import', 'public', 'private', 'static', 'void', 'class', 'new', 'return', 'if', 'else', 'for', 'long', 'int', 'String', 'final', 'throws', 'try', 'catch', 'null', 'true', 'false'],
    php: ['echo', 'new', 'function', 'return', 'if', 'else', 'for', 'foreach', 'true', 'false', 'null', 'class', 'public', 'private'],
    go: ['package', 'import', 'func', 'main', 'var', 'const', 'return', 'if', 'else', 'for', 'range', 'nil', 'true', 'false', 'err', 'defer']
  };

  const kw = keywords[lang] || [];
  kw.forEach(k => {
    const re = new RegExp('\\b(' + k + ')\\b', 'g');
    html = html.replace(re, '<span style="color:#c084fc;">$1</span>');
  });

  // Numbers
  html = html.replace(/\b(\d+)\b/g, '<span style="color:#f59e0b;">$1</span>');

  return html;
}
