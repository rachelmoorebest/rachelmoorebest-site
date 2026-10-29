// Weekday availability grid for /calendar.
// busy.json lists each weekday's visible window (8 AM–6 PM Eastern) and the busy
// blocks inside it, as Unix seconds. Columns are always Rachel's Eastern
// weekdays; the "Your time" switch only relabels times in the visitor's zone.
(function () {
  var HOME_ZONE = 'America/New_York';
  var STALE_AFTER = 3 * 3600;     // seconds before the data counts as out of date
  var REFRESH_EVERY = 10 * 60000; // re-fetch while the page stays open
  var MIN_OPEN = 15 * 60;         // shorter gaps aren't offered as open time

  var root = document.getElementById('availability');
  var grid = root.querySelector('.cal-grid');
  var range = root.querySelector('.cal-range');
  var detail = root.querySelector('.cal-detail');
  var updated = root.querySelector('.cal-updated');
  var zoneGroup = root.querySelector('.cal-zone');
  var navButtons = root.querySelectorAll('[data-step]');
  var zoneButtons = root.querySelectorAll('[data-zone]');

  var localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || HOME_ZONE;
  var data = null;
  var weeks = [];
  var week = 0;
  var zone = HOME_ZONE;
  var defaultDetail = detail.textContent;

  // Formatting -------------------------------------------------------------

  function fmt(options, z) {
    options.timeZone = z || zone;
    return new Intl.DateTimeFormat('en-US', options);
  }
  function time(t) {
    return fmt({ hour: 'numeric', minute: '2-digit' }).format(t * 1000).replace(':00', '');
  }
  function timeRange(s, e) {
    var a = time(s), b = time(e);
    var am = / [AP]M$/.exec(a), bm = / [AP]M$/.exec(b);
    if (am && bm && am[0] === bm[0]) a = a.slice(0, -3); // "10:30 – 11:15 AM"
    return a + ' – ' + b;
  }
  // Abbreviation in effect at time t (seconds), so November shows EST, not EDT.
  function zoneName(z, style, t) {
    try {
      var parts = fmt({ timeZoneName: style || 'short' }, z).formatToParts(t ? t * 1000 : Date.now());
      for (var i = 0; i < parts.length; i++) if (parts[i].type === 'timeZoneName') return parts[i].value;
    } catch (err) { /* older browsers lack longGeneric */ }
    return style === 'longGeneric' ? zoneName(z, 'short', t) : z;
  }
  // Day labels come from the Eastern date string, so they never shift with the visitor's zone.
  function dateOf(day) { return new Date(day.date + 'T12:00:00Z'); }
  function dayLabel(day, options) {
    options.timeZone = 'UTC';
    return new Intl.DateTimeFormat('en-US', options).format(dateOf(day));
  }
  function ago(seconds) {
    var m = Math.round(seconds / 60);
    if (m < 1) return 'just now';
    if (m < 60) return m + ' min ago';
    var h = Math.round(m / 60);
    return h + (h === 1 ? ' hour ago' : ' hours ago');
  }

  // Rendering --------------------------------------------------------------

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  function block(kind, day, s, e) {
    var span = day.end - day.start;
    var b = el('button', 'cal-block cal-block--' + kind);
    b.type = 'button';
    b.style.top = ((s - day.start) / span * 100) + '%';
    b.style.height = ((e - s) / span * 100) + '%';
    var label = dayLabel(day, { weekday: 'short', month: 'short', day: 'numeric' }) +
      ' · ' + (kind === 'busy' ? 'Busy ' : 'Open ') + timeRange(s, e) + ' ' + zoneName(zone, 'short', s);
    b.setAttribute('aria-label', label);
    b.dataset.detail = label;
    if (kind === 'busy' && e - s >= 30 * 60) b.appendChild(el('span', null, timeRange(s, e)));
    return b;
  }

  function render() {
    var days = weeks[week];
    var now = Date.now() / 1000;
    var first = days[0], last = days[days.length - 1];
    var hours = (first.end - first.start) / 3600;
    var todayEastern = fmt({ year: 'numeric', month: '2-digit', day: '2-digit' }, HOME_ZONE)
      .formatToParts(Date.now()).reduce(function (o, p) { o[p.type] = p.value; return o; }, {});
    var todayDate = todayEastern.year + '-' + todayEastern.month + '-' + todayEastern.day;

    var sameMonth = first.date.slice(0, 7) === last.date.slice(0, 7);
    range.textContent = dayLabel(first, { month: 'short', day: 'numeric' }) + ' – ' +
      dayLabel(last, sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' }) +
      ', ' + last.date.slice(0, 4); // "Oct 26 – 30, 2026" or "Oct 29 – Nov 2, 2026"
    navButtons[0].disabled = week === 0;
    navButtons[1].disabled = week === 0;
    navButtons[2].disabled = week === weeks.length - 1;

    grid.textContent = '';
    grid.style.setProperty('--rows', hours);

    grid.appendChild(el('div', 'cal-corner', zoneName(zone, 'short', first.start)));
    days.forEach(function (day) {
      var head = el('div', 'cal-dayhead' + (day.date === todayDate ? ' is-today' : ''));
      head.appendChild(el('span', 'cal-weekday', dayLabel(day, { weekday: 'short' })));
      head.appendChild(el('span', 'cal-date', dayLabel(day, { day: 'numeric' })));
      grid.appendChild(head);
    });

    // Hour labels use the first day of the week; each block's own label is exact.
    var axis = el('div', 'cal-hours');
    for (var h = 0; h <= hours; h++) {
      var tick = el('span', 'cal-hour', time(first.start + h * 3600));
      tick.style.top = (h / hours * 100) + '%';
      axis.appendChild(tick);
    }
    grid.appendChild(axis);

    days.forEach(function (day) {
      var col = el('div', 'cal-col' + (day.date === todayDate ? ' is-today' : ''));
      var cursor = day.start;
      day.busy.concat([[day.end, day.end]]).forEach(function (b) {
        if (b[0] - cursor >= MIN_OPEN) col.appendChild(block('open', day, cursor, b[0]));
        if (b[1] > b[0]) col.appendChild(block('busy', day, b[0], b[1]));
        cursor = Math.max(cursor, b[1]);
      });
      if (now > day.start) {
        var past = el('div', 'cal-past');
        past.style.height = (Math.min(now, day.end) - day.start) / (day.end - day.start) * 100 + '%';
        col.appendChild(past);
      }
      if (now > day.start && now < day.end) {
        var line = el('div', 'cal-now');
        line.style.top = (now - day.start) / (day.end - day.start) * 100 + '%';
        col.appendChild(line);
      }
      grid.appendChild(col);
    });

    var age = now - data.generated;
    updated.textContent = age > STALE_AFTER
      ? 'Last updated ' + ago(age) + '. Please confirm times with Rachel.'
      : 'Updated ' + ago(age);
    updated.classList.toggle('is-stale', age > STALE_AFTER);
  }

  function showDetail(e) {
    var b = e.target.closest('.cal-block');
    if (b) detail.textContent = b.dataset.detail;
  }
  grid.addEventListener('mouseover', showDetail);
  grid.addEventListener('focusin', showDetail);
  grid.addEventListener('click', showDetail);
  grid.addEventListener('mouseleave', function () {
    if (!grid.contains(document.activeElement)) detail.textContent = defaultDetail;
  });

  navButtons.forEach(function (b) {
    b.addEventListener('click', function () {
      var step = Number(b.dataset.step);
      week = step === 0 ? 0 : Math.min(Math.max(week + step, 0), weeks.length - 1);
      detail.textContent = defaultDetail;
      render();
    });
  });

  function setZone(which) {
    zone = which === 'local' ? localZone : HOME_ZONE;
    zoneButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.zone === which)); });
    try { localStorage.setItem('cal-zone', which); } catch (err) { /* storage blocked */ }
    detail.textContent = defaultDetail;
    if (data) render();
  }
  zoneButtons.forEach(function (b) {
    b.addEventListener('click', function () { setZone(b.dataset.zone); });
  });
  if (localZone !== HOME_ZONE) {
    zoneGroup.hidden = false;
    zoneButtons[1].textContent = 'Your time (' + zoneName(localZone, 'longGeneric') + ')';
    var saved = null;
    try { saved = localStorage.getItem('cal-zone'); } catch (err) { /* storage blocked */ }
    if (saved === 'local') setZone('local');
  }

  // Data -------------------------------------------------------------------

  function load() {
    return fetch('busy.json', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        return res.json();
      })
      .then(function (json) {
        var now = Date.now() / 1000;
        data = json;
        weeks = [];
        for (var i = 0; i < json.days.length; i += 5) weeks.push(json.days.slice(i, i + 5));
        // Drop weeks that are already over (the data may be a few hours old on Monday).
        while (weeks.length > 1 && weeks[0][4].end < now) weeks.shift();
        week = Math.min(week, weeks.length - 1);
        render();
      });
  }

  load().catch(function () {
    grid.textContent = '';
    var msg = el('p', 'cal-message', 'The calendar couldn’t load. Please refresh, or email ');
    var a = el('a', null, 'rmb@rachelmoorebest.com');
    a.href = 'mailto:rmb@rachelmoorebest.com';
    msg.appendChild(a);
    msg.appendChild(document.createTextNode(' for availability.'));
    grid.appendChild(msg);
  });
  setInterval(function () { load().catch(function () { /* keep showing the last data */ }); }, REFRESH_EVERY);
})();
