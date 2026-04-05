/* EpochPilot — Epoch & Timestamp Converter */

// ===== Timezone list =====
var TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires',
  'America/Mexico_City',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Amsterdam',
  'Europe/Moscow',
  'Europe/Istanbul',
  'Europe/Warsaw',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Seoul',
  'Asia/Taipei',
  'Asia/Bangkok',
  'Asia/Jakarta',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Pacific/Auckland',
  'Pacific/Honolulu',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos'
];

(function initTimezoneSelects() {
  var fromSel = document.getElementById('tz-from');
  var toSel = document.getElementById('tz-to');
  if (!fromSel || !toSel) return;
  TIMEZONES.forEach(function(tz) {
    var o1 = document.createElement('option');
    o1.value = tz; o1.textContent = tz.replace(/_/g, ' ');
    var o2 = o1.cloneNode(true);
    fromSel.appendChild(o1);
    toSel.appendChild(o2);
  });
  // Default: local timezone for "from", UTC for "to"
  var localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (fromSel.querySelector('option[value="' + localTz + '"]')) {
    fromSel.value = localTz;
  }
  toSel.value = 'UTC';
})();

// ===== Live Clock =====
function updateClock() {
  var now = new Date();
  var epoch = Math.floor(now.getTime() / 1000);
  var el = document.getElementById('live-epoch');
  if (!el) return;
  el.textContent = epoch;
  document.getElementById('live-utc').textContent = now.toUTCString();
  document.getElementById('live-local').textContent = now.toLocaleString();
  document.getElementById('live-iso').textContent = now.toISOString();
}
updateClock();
setInterval(updateClock, 1000);

// ===== Epoch to Human =====
function epochToHuman() {
  var raw = document.getElementById('epoch-input').value.trim();
  var num = parseFloat(raw);
  if (isNaN(num)) {
    document.getElementById('epoch-result').innerHTML = '<span style="color:#ef4444">Invalid timestamp</span>';
    return;
  }
  // Detect ms vs s: if > 1e12, assume ms
  var ms = num > 1e12 ? num : num * 1000;
  var d = new Date(ms);
  if (isNaN(d.getTime())) {
    document.getElementById('epoch-result').innerHTML = '<span style="color:#ef4444">Invalid date</span>';
    return;
  }
  var html = '';
  html += gridRow('ISO 8601', d.toISOString());
  html += gridRow('RFC 2822', d.toUTCString());
  html += gridRow('Locale', d.toLocaleString());
  html += gridRow('UTC', d.toUTCString());
  html += gridRow('Epoch (s)', Math.floor(ms / 1000));
  html += gridRow('Epoch (ms)', ms);
  html += gridRow('Day of Week', d.toLocaleDateString('en-US', { weekday: 'long' }));
  html += gridRow('Week of Year', getWeekNumber(d));
  document.getElementById('epoch-result').innerHTML = html;
}

function gridRow(label, value) {
  return '<span class="result-label">' + label + '</span><span class="result-value">' + value + '</span>';
}

function getWeekNumber(d) {
  var oneJan = new Date(d.getFullYear(), 0, 1);
  var days = Math.floor((d - oneJan) / 86400000);
  return Math.ceil((days + oneJan.getDay() + 1) / 7);
}

// ===== Human to Epoch =====
function humanToEpoch() {
  var raw = document.getElementById('human-input').value.trim();
  var d = new Date(raw);
  if (isNaN(d.getTime())) {
    document.getElementById('human-result').innerHTML = '<span style="color:#ef4444">Could not parse date. Try ISO 8601 format: 2025-04-02T12:00:00Z</span>';
    return;
  }
  var html = '';
  html += gridRow('Epoch (seconds)', Math.floor(d.getTime() / 1000));
  html += gridRow('Epoch (milliseconds)', d.getTime());
  html += gridRow('ISO 8601', d.toISOString());
  html += gridRow('RFC 2822', d.toUTCString());
  document.getElementById('human-result').innerHTML = html;
}

// ===== Timezone Converter =====
function convertTimezone() {
  var fromTz = document.getElementById('tz-from').value;
  var toTz = document.getElementById('tz-to').value;
  var timeStr = document.getElementById('tz-time').value.trim();

  // If just HH:MM, prefix with today's date
  var dateStr = timeStr;
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    var today = new Date();
    dateStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0') + 'T' + timeStr + ':00';
  }

  try {
    // Parse the input as if it's in the "from" timezone
    // Create a formatter for the source timezone to find the offset
    var fromFmt = new Intl.DateTimeFormat('en-US', {
      timeZone: fromTz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    });

    // Parse the user input as a local date first
    var inputDate = new Date(dateStr);
    if (isNaN(inputDate.getTime())) {
      document.getElementById('tz-result').textContent = 'Could not parse date/time. Try: 2025-04-02 14:30 or just 14:30';
      return;
    }

    // Get what that date looks like in the source timezone
    var fromParts = getDateParts(inputDate, fromTz);
    var toParts = getDateParts(inputDate, toTz);

    // However, we want to interpret the INPUT as being in fromTz.
    // Find the difference between local interpretation and fromTz interpretation
    var localStr = formatParts(getDateParts(inputDate, Intl.DateTimeFormat().resolvedOptions().timeZone));
    var fromStr = formatParts(fromParts);

    // Reconstruct: the user typed a time meaning it's in fromTz
    // We parse it naively, then adjust
    var naiveDate = new Date(dateStr);
    var naiveInFrom = new Date(naiveDate.toLocaleString('en-US', { timeZone: fromTz }));
    var naiveInLocal = new Date(naiveDate.toLocaleString('en-US'));
    var offset = naiveInLocal - naiveInFrom;
    var corrected = new Date(naiveDate.getTime() + offset);

    var resultFmt = new Intl.DateTimeFormat('en-US', {
      timeZone: toTz,
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: true, timeZoneName: 'long'
    });

    var fromFmtDisplay = new Intl.DateTimeFormat('en-US', {
      timeZone: fromTz,
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: true, timeZoneName: 'long'
    });

    var result = fromFmtDisplay.format(corrected) + '\n  =\n' + resultFmt.format(corrected);
    document.getElementById('tz-result').textContent = result;
  } catch (e) {
    document.getElementById('tz-result').textContent = 'Error: ' + e.message;
  }
}

function getDateParts(date, tz) {
  var f = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  var parts = {};
  f.formatToParts(date).forEach(function(p) { parts[p.type] = p.value; });
  return parts;
}

function formatParts(p) {
  return p.year + '-' + p.month + '-' + p.day + ' ' + p.hour + ':' + p.minute + ':' + p.second;
}

// ===== Time Difference =====
function calcTimeDiff() {
  var startRaw = document.getElementById('diff-start').value.trim();
  var endRaw = document.getElementById('diff-end').value.trim();
  var startMs = parseToMs(startRaw);
  var endMs = parseToMs(endRaw);

  if (startMs === null || endMs === null) {
    document.getElementById('diff-result').textContent = 'Could not parse one or both inputs. Use epoch (seconds/ms) or a date string.';
    return;
  }

  var diffMs = Math.abs(endMs - startMs);
  var seconds = Math.floor(diffMs / 1000);
  var minutes = Math.floor(seconds / 60);
  var hours = Math.floor(minutes / 60);
  var days = Math.floor(hours / 24);
  var years = Math.floor(days / 365.25);

  var remDays = days - Math.floor(years * 365.25);
  var remHours = hours % 24;
  var remMinutes = minutes % 60;
  var remSeconds = seconds % 60;

  var dir = endMs >= startMs ? 'later' : 'earlier';
  var result = '';
  result += 'Total: ' + days + ' days, ' + remHours + ' hours, ' + remMinutes + ' minutes, ' + remSeconds + ' seconds\n';
  result += 'Or: ' + hours + ' hours / ' + minutes + ' minutes / ' + seconds + ' seconds\n';
  if (years > 0) { result += 'Approximately: ' + years + ' years and ' + remDays + ' days\n'; }
  result += '\nEnd is ' + dir + ' than start.';
  result += '\nDifference in ms: ' + diffMs;

  document.getElementById('diff-result').textContent = result;
}

function parseToMs(raw) {
  var num = parseFloat(raw);
  if (!isNaN(num) && /^\d+(\.\d+)?$/.test(raw)) {
    return num > 1e12 ? num : num * 1000;
  }
  var d = new Date(raw);
  return isNaN(d.getTime()) ? null : d.getTime();
}

// ===== Cron Parser =====
function applyCronPreset() {
  var val = document.getElementById('cron-preset').value;
  if (val) {
    document.getElementById('cron-input').value = val;
    parseCron();
  }
}

function parseCron() {
  var expr = document.getElementById('cron-input').value.trim();
  var parts = expr.split(/\s+/);
  if (parts.length !== 5) {
    document.getElementById('cron-description').textContent = 'Invalid: expected 5 fields (minute hour day month weekday)';
    document.getElementById('cron-results').innerHTML = '';
    return;
  }

  var desc = describeCron(parts);
  document.getElementById('cron-description').textContent = desc;

  // Calculate next 5 execution times
  var nextRuns = getNextCronRuns(parts, 5);
  var html = '';
  for (var i = 0; i < nextRuns.length; i++) {
    html += '<li>' + nextRuns[i].toISOString().replace('T', ' ').replace(/\.\d+Z/, ' UTC') + ' (' + nextRuns[i].toLocaleString() + ')</li>';
  }
  document.getElementById('cron-results').innerHTML = html;
}

function describeCron(p) {
  var min = p[0], hr = p[1], day = p[2], mon = p[3], dow = p[4];
  var parts = [];

  if (min === '*' && hr === '*') parts.push('Every minute');
  else if (min.indexOf('/') !== -1) parts.push('Every ' + min.split('/')[1] + ' minutes');
  else if (hr === '*') parts.push('At minute ' + min + ' of every hour');
  else parts.push('At ' + hr.padStart(2, '0') + ':' + min.padStart(2, '0'));

  if (day !== '*') parts.push('on day ' + day);
  if (mon !== '*') {
    var months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    parts.push('in ' + (months[parseInt(mon)] || mon));
  }
  if (dow !== '*') {
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    if (dow.indexOf('-') !== -1) {
      var range = dow.split('-');
      parts.push('on ' + (days[parseInt(range[0])] || range[0]) + ' through ' + (days[parseInt(range[1])] || range[1]));
    } else {
      parts.push('on ' + (days[parseInt(dow)] || dow));
    }
  }

  return parts.join(', ');
}

function getNextCronRuns(parts, count) {
  var results = [];
  var d = new Date();
  d.setSeconds(0, 0);
  d = new Date(d.getTime() + 60000); // start from next minute

  var maxIter = 525600; // max 1 year of minutes
  for (var i = 0; i < maxIter && results.length < count; i++) {
    if (cronMatches(parts, d)) {
      results.push(new Date(d));
    }
    d = new Date(d.getTime() + 60000);
  }
  return results;
}

function cronMatches(parts, d) {
  return fieldMatches(parts[0], d.getMinutes(), 0, 59) &&
         fieldMatches(parts[1], d.getHours(), 0, 23) &&
         fieldMatches(parts[2], d.getDate(), 1, 31) &&
         fieldMatches(parts[3], d.getMonth() + 1, 1, 12) &&
         fieldMatches(parts[4], d.getDay(), 0, 6);
}

function fieldMatches(field, value, min, max) {
  if (field === '*') return true;

  // Handle comma-separated values
  var alternatives = field.split(',');
  for (var a = 0; a < alternatives.length; a++) {
    var part = alternatives[a];

    // Handle step values: */n or n-m/s
    if (part.indexOf('/') !== -1) {
      var stepParts = part.split('/');
      var step = parseInt(stepParts[1]);
      if (isNaN(step) || step <= 0) return false;
      var rangeStart = stepParts[0] === '*' ? min : parseInt(stepParts[0]);
      if ((value - rangeStart) >= 0 && (value - rangeStart) % step === 0) return true;
      continue;
    }

    // Handle ranges: n-m
    if (part.indexOf('-') !== -1) {
      var range = part.split('-');
      var lo = parseInt(range[0]);
      var hi = parseInt(range[1]);
      if (value >= lo && value <= hi) return true;
      continue;
    }

    // Simple value
    if (parseInt(part) === value) return true;
  }
  return false;
}

// ===== Relative Time =====
function relativeTime() {
  var raw = document.getElementById('rel-input').value.trim();
  var ms = parseToMs(raw);
  if (ms === null) {
    document.getElementById('rel-result').textContent = 'Could not parse input.';
    return;
  }
  var now = Date.now();
  var diffMs = now - ms;
  var abs = Math.abs(diffMs);
  var past = diffMs > 0;

  var seconds = Math.floor(abs / 1000);
  var minutes = Math.floor(seconds / 60);
  var hours = Math.floor(minutes / 60);
  var days = Math.floor(hours / 24);
  var months = Math.floor(days / 30.44);
  var years = Math.floor(days / 365.25);

  var relative;
  if (seconds < 60) relative = seconds + ' second' + (seconds !== 1 ? 's' : '');
  else if (minutes < 60) relative = minutes + ' minute' + (minutes !== 1 ? 's' : '');
  else if (hours < 24) relative = hours + ' hour' + (hours !== 1 ? 's' : '') + ' and ' + (minutes % 60) + ' minutes';
  else if (days < 30) relative = days + ' day' + (days !== 1 ? 's' : '') + ' and ' + (hours % 24) + ' hours';
  else if (months < 12) relative = months + ' month' + (months !== 1 ? 's' : '') + ' and ' + (days % 30) + ' days';
  else relative = years + ' year' + (years !== 1 ? 's' : '') + ' and ' + Math.floor((days % 365.25) / 30.44) + ' months';

  var suffix = past ? ' ago' : ' from now';
  var dateStr = new Date(ms).toISOString();
  document.getElementById('rel-result').textContent = relative + suffix + '\n(' + dateStr + ')';
}
