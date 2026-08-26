/* EpochPilot — date-calculator component */

export function init(container, config) {
  const mode = config.mode || 'diff';

  if (mode === 'add') {
    renderAddMode(container);
  } else {
    renderDiffMode(container);
  }
}

function renderDiffMode(container) {
  const today = new Date();
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth()+1).padStart(2,'0') + '-' +
    String(today.getDate()).padStart(2,'0');

  container.innerHTML = `
    <h3 style="color:var(--accent);margin-bottom:1rem;">Date Difference Calculator</h3>
    <div class="row">
      <div>
        <label for="dc-start">Start Date</label>
        <input type="date" id="dc-start" style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);padding:0.6rem 0.8rem;font-family:var(--font-display);font-size:0.85rem;">
      </div>
      <div>
        <label for="dc-end">End Date</label>
        <input type="date" id="dc-end" value="${todayStr}" style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);padding:0.6rem 0.8rem;font-family:var(--font-display);font-size:0.85rem;">
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="dc-calc-btn">Calculate</button>
      <button class="btn btn-outline" id="dc-today-btn">End = Today</button>
    </div>
    <div class="result-grid" id="dc-result" style="margin-top:1rem;"></div>
  `;

  function gridRow(label, value) {
    return `<span class="result-label">${label}</span><span class="result-value">${value}</span>`;
  }

  function doCalc() {
    const startStr = document.getElementById('dc-start').value;
    const endStr = document.getElementById('dc-end').value;
    if (!startStr || !endStr) {
      document.getElementById('dc-result').innerHTML = '<span style="color:#ef4444;grid-column:1/-1;">Please select both dates.</span>';
      return;
    }

    const start = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      document.getElementById('dc-result').innerHTML = '<span style="color:#ef4444;grid-column:1/-1;">Invalid date.</span>';
      return;
    }

    const diffMs = Math.abs(end - start);
    const totalDays = Math.round(diffMs / 86400000);
    const totalWeeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;
    const totalHours = Math.round(diffMs / 3600000);
    const totalMinutes = Math.round(diffMs / 60000);

    // Calculate years, months, days
    let s = new Date(Math.min(start, end));
    let e = new Date(Math.max(start, end));

    let years = e.getFullYear() - s.getFullYear();
    let months = e.getMonth() - s.getMonth();
    let days = e.getDate() - s.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(e.getFullYear(), e.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    /* Business days (weekdays).
       The date inputs are "YYYY-MM-DD", which parses as UTC midnight, so the whole
       count must run on the UTC calendar. Reading getDay()/setDate() — which are
       LOCAL — off a UTC-midnight instant shifts the weekday by one for every visitor
       west of UTC, and the count came out one short on many ranges
       (2026-08-24 to 2026-09-24 gave 22 in America/Los_Angeles against 23 in UTC). */
    let businessDays = 0;
    const iter = new Date(Math.min(start, end));
    const endTime = Math.max(start, end);
    while (iter < endTime) {
      const dow = iter.getUTCDay();
      if (dow !== 0 && dow !== 6) businessDays++;
      iter.setUTCDate(iter.getUTCDate() + 1);
    }

    const direction = end >= start ? 'later' : 'earlier';

    let html = '';
    html += gridRow('Exact Difference', `${years} year${years!==1?'s':''}, ${months} month${months!==1?'s':''}, ${days} day${days!==1?'s':''}`);
    html += gridRow('Total Days', totalDays.toLocaleString());
    html += gridRow('Total Weeks', `${totalWeeks} week${totalWeeks!==1?'s':''} and ${remainingDays} day${remainingDays!==1?'s':''}`);
    html += gridRow('Business Days', businessDays.toLocaleString() + ' (weekdays only)');
    html += gridRow('Total Hours', totalHours.toLocaleString());
    html += gridRow('Total Minutes', totalMinutes.toLocaleString());
    html += gridRow('Direction', `End date is ${direction} than start date`);

    document.getElementById('dc-result').innerHTML = html;
  }

  document.getElementById('dc-calc-btn').addEventListener('click', doCalc);
  document.getElementById('dc-today-btn').addEventListener('click', () => {
    const now = new Date();
    document.getElementById('dc-end').value = now.getFullYear() + '-' +
      String(now.getMonth()+1).padStart(2,'0') + '-' +
      String(now.getDate()).padStart(2,'0');
  });
}

function renderAddMode(container) {
  const today = new Date();
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth()+1).padStart(2,'0') + '-' +
    String(today.getDate()).padStart(2,'0');

  container.innerHTML = `
    <h3 style="color:var(--accent);margin-bottom:1rem;">Add or Subtract from Date</h3>
    <div class="row">
      <div>
        <label for="da-start">Start Date</label>
        <input type="date" id="da-start" value="${todayStr}" style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);padding:0.6rem 0.8rem;font-family:var(--font-display);font-size:0.85rem;">
      </div>
      <div>
        <label for="da-amount">Amount (use negative to subtract)</label>
        <input type="number" id="da-amount" value="30" style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);padding:0.6rem 0.8rem;font-family:var(--font-display);font-size:0.85rem;">
      </div>
      <div>
        <label for="da-unit">Unit</label>
        <select id="da-unit" style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);padding:0.6rem 0.8rem;font-family:var(--font-display);font-size:0.85rem;">
          <option value="days">Days</option>
          <option value="weeks">Weeks</option>
          <option value="months">Months</option>
          <option value="years">Years</option>
        </select>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="da-calc-btn">Calculate</button>
      <button class="btn btn-outline" id="da-today-btn">Start = Today</button>
    </div>
    <div class="result-grid" id="da-result" style="margin-top:1rem;"></div>
  `;

  function gridRow(label, value) {
    return `<span class="result-label">${label}</span><span class="result-value">${value}</span>`;
  }

  function doCalc() {
    const startStr = document.getElementById('da-start').value;
    const amount = parseInt(document.getElementById('da-amount').value);
    const unit = document.getElementById('da-unit').value;

    if (!startStr || isNaN(amount)) {
      document.getElementById('da-result').innerHTML = '<span style="color:#ef4444;grid-column:1/-1;">Please enter a date and amount.</span>';
      return;
    }

    const start = new Date(startStr + 'T00:00:00');
    if (isNaN(start.getTime())) {
      document.getElementById('da-result').innerHTML = '<span style="color:#ef4444;grid-column:1/-1;">Invalid date.</span>';
      return;
    }

    const result = new Date(start);

    switch (unit) {
      case 'days':
        result.setDate(result.getDate() + amount);
        break;
      case 'weeks':
        result.setDate(result.getDate() + (amount * 7));
        break;
      case 'months':
        result.setMonth(result.getMonth() + amount);
        break;
      case 'years':
        result.setFullYear(result.getFullYear() + amount);
        break;
    }

    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    const diffMs = Math.abs(result - start);
    const diffDays = Math.round(diffMs / 86400000);

    let html = '';
    html += gridRow('Result Date', result.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    html += gridRow('ISO Format', result.getFullYear() + '-' + String(result.getMonth()+1).padStart(2,'0') + '-' + String(result.getDate()).padStart(2,'0'));
    html += gridRow('Day of Week', dayNames[result.getDay()]);
    html += gridRow('Days from Start', diffDays.toLocaleString() + ' calendar days');
    html += gridRow('Operation', `${amount >= 0 ? 'Added' : 'Subtracted'} ${Math.abs(amount)} ${unit} ${amount >= 0 ? 'to' : 'from'} ${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`);

    document.getElementById('da-result').innerHTML = html;
  }

  document.getElementById('da-calc-btn').addEventListener('click', doCalc);
  document.getElementById('da-today-btn').addEventListener('click', () => {
    const now = new Date();
    document.getElementById('da-start').value = now.getFullYear() + '-' +
      String(now.getMonth()+1).padStart(2,'0') + '-' +
      String(now.getDate()).padStart(2,'0');
  });
}
