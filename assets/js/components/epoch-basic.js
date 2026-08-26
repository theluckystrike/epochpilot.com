/* EpochPilot — epoch-basic component */

export function init(container, config) {
  container.innerHTML = `
    <div class="live-clock" style="margin-bottom:1.5rem;">
      <div class="clock-epoch" id="ep-live-epoch">&mdash;</div>
      <div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.25rem;">Current Unix Epoch (seconds)</div>
      <div class="clock-row">
        <div class="clock-item">
          <span class="clock-label">UTC</span>
          <span class="clock-value" id="ep-live-utc">&mdash;</span>
        </div>
        <div class="clock-item">
          <span class="clock-label">Local</span>
          <span class="clock-value" id="ep-live-local">&mdash;</span>
        </div>
        <div class="clock-item">
          <span class="clock-label">ISO 8601</span>
          <span class="clock-value" id="ep-live-iso">&mdash;</span>
        </div>
      </div>
    </div>

    <h3 style="color:var(--accent);margin-bottom:1rem;">Epoch / Date Converter</h3>
    <label for="ep-input">Enter a Unix timestamp (seconds or milliseconds) or a date string</label>
    <input type="text" id="ep-input" placeholder="e.g. 1712000000, 1712000000000, or 2025-04-02T12:00:00Z">
    <div class="actions" style="margin-top:0.75rem;">
      <button class="btn" id="ep-convert-btn">Convert</button>
      <button class="btn btn-outline" id="ep-now-btn">Now</button>
      <button class="btn btn-outline" id="ep-clear-btn">Clear</button>
    </div>
    <div class="result-grid" id="ep-result" style="margin-top:1rem;"></div>
  `;

  // Live clock
  function updateClock() {
    const now = new Date();
    const epoch = Math.floor(now.getTime() / 1000);
    const elEpoch = document.getElementById('ep-live-epoch');
    if (!elEpoch) return;
    elEpoch.textContent = epoch;
    document.getElementById('ep-live-utc').textContent = now.toUTCString();
    document.getElementById('ep-live-local').textContent = now.toLocaleString();
    document.getElementById('ep-live-iso').textContent = now.toISOString();
  }
  updateClock();
  setInterval(updateClock, 1000);

  function gridRow(label, value) {
    return `<span class="result-label">${label}</span><span class="result-value">${escHtml(String(value))} <button class="btn btn-outline" style="padding:0.15rem 0.5rem;font-size:0.75rem;margin-left:0.5rem;" data-copy="${escAttr(String(value))}">Copy</button></span>`;
  }

  function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escAttr(s) { return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

  /* ISO-8601 week number: weeks start Monday and week 1 is the week holding
     the first Thursday of the year. The previous version used a Sunday-start
     count derived from an elapsed-milliseconds subtraction, which disagreed
     with ISO at every year boundary and was additionally off by one on the
     34 days a year when the local clock shifts for DST. Everything here runs
     on the UTC calendar date, so no offset change can move the day. */
  function getWeekNumber(d) {
    let t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const dayOfWeek = new Date(t).getUTCDay() || 7;   // Mon = 1 ... Sun = 7
    t += (4 - dayOfWeek) * 86400000;                  // step to that week's Thursday
    const isoYear = new Date(t).getUTCFullYear();
    const jan1 = Date.UTC(isoYear, 0, 1);
    return Math.ceil(((t - jan1) / 86400000 + 1) / 7);
  }

  function doConvert() {
    const raw = document.getElementById('ep-input').value.trim();
    if (!raw) { document.getElementById('ep-result').innerHTML = ''; return; }

    let d;
    const num = parseFloat(raw);
    if (!isNaN(num) && /^-?\d+(\.\d+)?$/.test(raw)) {
      // Numeric input — epoch
      const ms = Math.abs(num) > 1e12 ? num : num * 1000;
      d = new Date(ms);
    } else {
      // Try parsing as date string
      d = new Date(raw);
    }

    if (!d || isNaN(d.getTime())) {
      document.getElementById('ep-result').innerHTML = '<span style="color:#ef4444;grid-column:1/-1;">Invalid input. Enter an epoch timestamp or a date string.</span>';
      return;
    }

    const ms = d.getTime();
    const epochS = Math.floor(ms / 1000);

    let html = '';
    html += gridRow('Epoch (seconds)', epochS);
    html += gridRow('Epoch (milliseconds)', ms);
    html += gridRow('ISO 8601', d.toISOString());
    html += gridRow('RFC 2822', d.toUTCString());
    html += gridRow('UTC', d.toUTCString());
    html += gridRow('Local Time', d.toLocaleString());
    html += gridRow('Day of Week', d.toLocaleDateString('en-US', { weekday: 'long' }));
    html += gridRow('Week of Year (ISO 8601)', getWeekNumber(d));
    document.getElementById('ep-result').innerHTML = html;
  }

  document.getElementById('ep-convert-btn').addEventListener('click', doConvert);
  document.getElementById('ep-input').addEventListener('keydown', e => { if (e.key === 'Enter') doConvert(); });

  document.getElementById('ep-now-btn').addEventListener('click', () => {
    document.getElementById('ep-input').value = Math.floor(Date.now() / 1000);
    doConvert();
  });

  document.getElementById('ep-clear-btn').addEventListener('click', () => {
    document.getElementById('ep-input').value = '';
    document.getElementById('ep-result').innerHTML = '';
  });

  // Copy buttons (delegated)
  container.addEventListener('click', e => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    navigator.clipboard.writeText(btn.dataset.copy).then(() => {
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = orig, 1200);
    });
  });
}
