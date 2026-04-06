/* EpochPilot — timezone-pair component */

const TIMEZONES = [
  'UTC',
  'America/New_York','America/Chicago','America/Denver','America/Los_Angeles',
  'America/Anchorage','America/Sao_Paulo','America/Argentina/Buenos_Aires',
  'America/Mexico_City','America/Toronto','America/Vancouver',
  'Europe/London','Europe/Paris','Europe/Berlin','Europe/Madrid','Europe/Rome',
  'Europe/Amsterdam','Europe/Moscow','Europe/Istanbul','Europe/Warsaw',
  'Asia/Tokyo','Asia/Shanghai','Asia/Hong_Kong','Asia/Singapore','Asia/Kolkata',
  'Asia/Dubai','Asia/Seoul','Asia/Taipei','Asia/Bangkok','Asia/Jakarta',
  'Australia/Sydney','Australia/Melbourne','Australia/Perth',
  'Pacific/Auckland','Pacific/Honolulu',
  'Africa/Cairo','Africa/Johannesburg','Africa/Lagos'
];

export function init(container, config) {
  const fromDefault = config.from || 'America/New_York';
  const toDefault = config.to || 'UTC';

  container.innerHTML = `
    <div style="margin-bottom:1.5rem;text-align:center;">
      <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem;">Current time in each zone</div>
      <div class="clock-row">
        <div class="clock-item">
          <span class="clock-label" id="tz-from-label">${fromDefault.replace(/_/g,' ')}</span>
          <span class="clock-value" id="tz-from-clock">&mdash;</span>
        </div>
        <div class="clock-item">
          <span class="clock-label" id="tz-to-label">${toDefault.replace(/_/g,' ')}</span>
          <span class="clock-value" id="tz-to-clock">&mdash;</span>
        </div>
      </div>
    </div>

    <h3 style="color:var(--accent);margin-bottom:1rem;">Convert Time Between Zones</h3>
    <div class="row">
      <div>
        <label for="tz-from-select">From Timezone</label>
        <select id="tz-from-select"></select>
      </div>
      <div>
        <label for="tz-time-input">Time (HH:MM or full date)</label>
        <input type="text" id="tz-time-input" placeholder="e.g. 14:30 or 2025-04-02 14:30">
      </div>
      <div>
        <label for="tz-to-select">To Timezone</label>
        <select id="tz-to-select"></select>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="tz-convert-btn">Convert</button>
      <button class="btn btn-outline" id="tz-now-btn">Now</button>
      <button class="btn btn-outline" id="tz-swap-btn">Swap</button>
    </div>
    <div class="output-box" id="tz-result" style="margin-top:1rem;min-height:60px;"></div>
  `;

  // Populate selects
  const fromSel = document.getElementById('tz-from-select');
  const toSel = document.getElementById('tz-to-select');
  TIMEZONES.forEach(tz => {
    const o1 = document.createElement('option');
    o1.value = tz; o1.textContent = tz.replace(/_/g, ' ');
    const o2 = o1.cloneNode(true);
    fromSel.appendChild(o1);
    toSel.appendChild(o2);
  });
  fromSel.value = fromDefault;
  toSel.value = toDefault;

  function formatInTz(date, tz) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: true, timeZoneName: 'short'
    }).format(date);
  }

  function shortTime(date, tz) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: true, timeZoneName: 'short'
    }).format(date);
  }

  // Live clocks
  function updateClocks() {
    const now = new Date();
    const fromTz = fromSel.value;
    const toTz = toSel.value;
    document.getElementById('tz-from-clock').textContent = shortTime(now, fromTz);
    document.getElementById('tz-to-clock').textContent = shortTime(now, toTz);
    document.getElementById('tz-from-label').textContent = fromTz.replace(/_/g, ' ');
    document.getElementById('tz-to-label').textContent = toTz.replace(/_/g, ' ');
  }
  updateClocks();
  setInterval(updateClocks, 1000);

  fromSel.addEventListener('change', updateClocks);
  toSel.addEventListener('change', updateClocks);

  function doConvert() {
    const fromTz = fromSel.value;
    const toTz = toSel.value;
    let timeStr = document.getElementById('tz-time-input').value.trim();

    // If just HH:MM, prefix with today's date
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      const today = new Date();
      timeStr = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0') + 'T' + timeStr + ':00';
    }

    try {
      const inputDate = new Date(timeStr);
      if (isNaN(inputDate.getTime())) {
        document.getElementById('tz-result').textContent = 'Could not parse date/time. Try: 2025-04-02 14:30 or just 14:30';
        return;
      }

      // Interpret the input as being in fromTz
      const naiveInFrom = new Date(inputDate.toLocaleString('en-US', { timeZone: fromTz }));
      const naiveInLocal = new Date(inputDate.toLocaleString('en-US'));
      const offset = naiveInLocal - naiveInFrom;
      const corrected = new Date(inputDate.getTime() + offset);

      const fromStr = formatInTz(corrected, fromTz);
      const toStr = formatInTz(corrected, toTz);

      document.getElementById('tz-result').textContent = fromStr + '\n  =\n' + toStr;
    } catch (e) {
      document.getElementById('tz-result').textContent = 'Error: ' + e.message;
    }
  }

  document.getElementById('tz-convert-btn').addEventListener('click', doConvert);
  document.getElementById('tz-time-input').addEventListener('keydown', e => { if (e.key === 'Enter') doConvert(); });

  document.getElementById('tz-now-btn').addEventListener('click', () => {
    const now = new Date();
    const fromTz = fromSel.value;
    const nowInFrom = new Intl.DateTimeFormat('en-CA', {
      timeZone: fromTz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).format(now).replace(',', '');
    document.getElementById('tz-time-input').value = nowInFrom;
    doConvert();
  });

  document.getElementById('tz-swap-btn').addEventListener('click', () => {
    const tmp = fromSel.value;
    fromSel.value = toSel.value;
    toSel.value = tmp;
    updateClocks();
  });
}
