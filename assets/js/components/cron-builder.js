/* EpochPilot — cron-builder component */

export function init(container, config) {
  container.innerHTML = `
    <h3 style="color:var(--accent);margin-bottom:1rem;">Cron Expression Builder</h3>

    <div style="margin-bottom:1rem;">
      <label>Presets</label>
      <div class="actions" style="margin-top:0.25rem;">
        <button class="btn btn-outline cron-preset" data-expr="*/5 * * * *">Every 5 min</button>
        <button class="btn btn-outline cron-preset" data-expr="0 * * * *">Hourly</button>
        <button class="btn btn-outline cron-preset" data-expr="0 0 * * *">Daily midnight</button>
        <button class="btn btn-outline cron-preset" data-expr="0 0 * * 0">Weekly (Sun)</button>
        <button class="btn btn-outline cron-preset" data-expr="0 0 1 * *">Monthly (1st)</button>
      </div>
    </div>

    <div style="margin-bottom:1rem;">
      <label>Build interactively</label>
      <div class="row" style="margin-top:0.25rem;">
        <div>
          <label for="cron-f-min">Minute (0-59)</label>
          <input type="text" id="cron-f-min" value="*" placeholder="* or */5 or 0,30">
        </div>
        <div>
          <label for="cron-f-hr">Hour (0-23)</label>
          <input type="text" id="cron-f-hr" value="*" placeholder="* or 0 or 9,17">
        </div>
        <div>
          <label for="cron-f-dom">Day of Month (1-31)</label>
          <input type="text" id="cron-f-dom" value="*" placeholder="* or 1 or 1,15">
        </div>
        <div>
          <label for="cron-f-mon">Month (1-12)</label>
          <input type="text" id="cron-f-mon" value="*" placeholder="* or 1 or 1-6">
        </div>
        <div>
          <label for="cron-f-dow">Weekday (0-6, 0=Sun)</label>
          <input type="text" id="cron-f-dow" value="*" placeholder="* or 1-5 or 0,6">
        </div>
      </div>
    </div>

    <div style="margin-bottom:0.75rem;">
      <label for="cron-expr">Cron Expression</label>
      <input type="text" id="cron-expr" placeholder="e.g. */5 * * * *" style="font-size:1.1rem;">
    </div>

    <div class="actions">
      <button class="btn" id="cron-parse-btn">Parse & Show Next Runs</button>
    </div>

    <div id="cron-description" style="margin-top:1rem;padding:0.8rem;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);font-size:0.95rem;display:none;"></div>

    <div id="cron-next-runs" style="margin-top:1rem;display:none;">
      <h3 style="color:var(--accent);margin-bottom:0.5rem;">Next 5 Runs</h3>
      <ul class="cron-list" id="cron-runs-list"></ul>
    </div>
  `;

  const fieldIds = ['cron-f-min', 'cron-f-hr', 'cron-f-dom', 'cron-f-mon', 'cron-f-dow'];
  const exprInput = document.getElementById('cron-expr');

  // Sync fields -> expression
  function syncFieldsToExpr() {
    exprInput.value = fieldIds.map(id => document.getElementById(id).value.trim() || '*').join(' ');
  }

  // Sync expression -> fields
  function syncExprToFields() {
    const parts = exprInput.value.trim().split(/\s+/);
    if (parts.length === 5) {
      parts.forEach((v, i) => { document.getElementById(fieldIds[i]).value = v; });
    }
  }

  fieldIds.forEach(id => {
    document.getElementById(id).addEventListener('input', syncFieldsToExpr);
  });

  exprInput.addEventListener('input', syncExprToFields);

  // Presets
  container.querySelectorAll('.cron-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      exprInput.value = btn.dataset.expr;
      syncExprToFields();
      doParse();
    });
  });

  function describeCron(parts) {
    const [min, hr, dom, mon, dow] = parts;
    const segments = [];

    if (min === '*' && hr === '*') segments.push('Every minute');
    else if (min.includes('/')) segments.push('Every ' + min.split('/')[1] + ' minutes');
    else if (hr === '*') segments.push('At minute ' + min + ' of every hour');
    else if (hr.includes('/')) segments.push('At minute ' + min + ', every ' + hr.split('/')[1] + ' hours');
    else if (hr.includes(',')) segments.push('At ' + hr.split(',').map(h => h.padStart(2,'0') + ':' + min.padStart(2,'0')).join(' and '));
    else segments.push('At ' + hr.padStart(2,'0') + ':' + min.padStart(2,'0'));

    if (dom !== '*') segments.push('on day ' + dom + ' of the month');
    if (mon !== '*') {
      const months = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
      if (mon.includes('-')) {
        const [a,b] = mon.split('-');
        segments.push('in ' + (months[parseInt(a)]||a) + ' through ' + (months[parseInt(b)]||b));
      } else {
        segments.push('in ' + (months[parseInt(mon)] || mon));
      }
    }
    if (dow !== '*') {
      const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      if (dow.includes('-')) {
        const [a,b] = dow.split('-');
        segments.push('on ' + (days[parseInt(a)]||a) + ' through ' + (days[parseInt(b)]||b));
      } else if (dow.includes(',')) {
        segments.push('on ' + dow.split(',').map(d => days[parseInt(d)]||d).join(' and '));
      } else {
        segments.push('on ' + (days[parseInt(dow)] || dow));
      }
    }

    return segments.join(', ');
  }

  function fieldMatches(field, value, min, max) {
    if (field === '*') return true;
    const alternatives = field.split(',');
    for (const part of alternatives) {
      if (part.includes('/')) {
        const [range, stepStr] = part.split('/');
        const step = parseInt(stepStr);
        if (isNaN(step) || step <= 0) return false;
        const rangeStart = range === '*' ? min : parseInt(range);
        if ((value - rangeStart) >= 0 && (value - rangeStart) % step === 0) return true;
        continue;
      }
      if (part.includes('-')) {
        const [lo, hi] = part.split('-').map(Number);
        if (value >= lo && value <= hi) return true;
        continue;
      }
      if (parseInt(part) === value) return true;
    }
    return false;
  }

  function cronMatches(parts, d) {
    return fieldMatches(parts[0], d.getMinutes(), 0, 59) &&
           fieldMatches(parts[1], d.getHours(), 0, 23) &&
           fieldMatches(parts[2], d.getDate(), 1, 31) &&
           fieldMatches(parts[3], d.getMonth() + 1, 1, 12) &&
           fieldMatches(parts[4], d.getDay(), 0, 6);
  }

  function getNextRuns(parts, count) {
    const results = [];
    let d = new Date();
    d.setSeconds(0, 0);
    d = new Date(d.getTime() + 60000);
    const maxIter = 525600;
    for (let i = 0; i < maxIter && results.length < count; i++) {
      if (cronMatches(parts, d)) results.push(new Date(d));
      d = new Date(d.getTime() + 60000);
    }
    return results;
  }

  function doParse() {
    const expr = exprInput.value.trim();
    const parts = expr.split(/\s+/);
    const descEl = document.getElementById('cron-description');
    const runsEl = document.getElementById('cron-next-runs');
    const listEl = document.getElementById('cron-runs-list');

    if (parts.length !== 5) {
      descEl.style.display = 'block';
      descEl.textContent = 'Invalid expression. Expected 5 space-separated fields: minute hour day month weekday';
      descEl.style.color = '#ef4444';
      runsEl.style.display = 'none';
      return;
    }

    descEl.style.display = 'block';
    descEl.style.color = 'var(--text)';
    descEl.textContent = describeCron(parts);

    const runs = getNextRuns(parts, 5);
    if (runs.length === 0) {
      listEl.innerHTML = '<li style="color:var(--text-muted);">No runs found within the next year.</li>';
    } else {
      listEl.innerHTML = runs.map(r =>
        `<li>${r.toISOString().replace('T',' ').replace(/\.\d+Z/,' UTC')} <span style="color:var(--text-muted);">(${r.toLocaleString()})</span></li>`
      ).join('');
    }
    runsEl.style.display = 'block';
  }

  document.getElementById('cron-parse-btn').addEventListener('click', doParse);
  exprInput.addEventListener('keydown', e => { if (e.key === 'Enter') doParse(); });
}
