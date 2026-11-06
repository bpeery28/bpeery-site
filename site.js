// bpeery.com shared behavior
(function () {
  // sticky header rule
  var head = document.querySelector('.site-head');
  if (head) {
    var onScroll = function () { head.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  // mobile menu
  var btn = document.querySelector('.menu-btn'), nav = document.getElementById('nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Close' : 'Menu';
    });
  }
  // year
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // forms -> opens the visitor's email app addressed to Brian
  document.querySelectorAll('form[data-mail]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');
      var missing = [].slice.call(form.querySelectorAll('[required]')).filter(function (f) {
        return f.type === 'checkbox' ? !f.checked : !f.value.trim();
      });
      if (missing.length) {
        if (status) status.textContent = 'Please fill in: ' + missing.map(function (f) { return f.dataset.label || f.name; }).join(', ') + '.';
        missing[0].focus(); return;
      }
      var lines = [];
      [].slice.call(form.elements).forEach(function (f) {
        if (!f.name || f.type === 'submit') return;
        if (f.type === 'checkbox') { lines.push((f.dataset.label || f.name) + ': ' + (f.checked ? 'Yes' : 'No')); return; }
        if (f.value.trim()) lines.push((f.dataset.label || f.name) + ': ' + f.value.trim());
      });
      lines.push('', 'Sent from ' + location.pathname + ' on bpeery.com');
      var subject = form.dataset.mail;
      var url = 'mailto:brian@bpeery.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
      window.location.href = url;
      if (status) status.textContent = 'Your email app should open with this message ready to send. If it doesn\'t, email brian@bpeery.com directly.';
    });
  });

  // number helpers
  var money = function (n) { return isFinite(n) ? '$' + Math.round(n).toLocaleString('en-US') : '—'; };
  var num = function (id) { var el = document.getElementById(id); return el ? parseFloat(String(el.value).replace(/[^0-9.]/g, '')) || 0 : 0; };
  var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };

  // mortgage payment
  function payment(principal, ratePct, years) {
    var r = ratePct / 100 / 12, n = years * 12;
    if (!principal || !n) return 0;
    return r ? principal * r / (1 - Math.pow(1 + r, -n)) : principal / n;
  }
  function calcMortgage() {
    if (!document.getElementById('m-price')) return;
    var price = num('m-price'), down = num('m-down'), rate = num('m-rate'), yrs = num('m-years') || 30;
    var tax = num('m-tax'), ins = num('m-ins'), hoa = num('m-hoa');
    var loan = Math.max(price - down, 0), pi = payment(loan, rate, yrs);
    var total = pi + tax / 12 + ins / 12 + hoa;
    set('m-total', money(total) + ' a month');
    set('m-pi', money(pi)); set('m-taxm', money(tax / 12)); set('m-insm', money(ins / 12)); set('m-hoam', money(hoa)); set('m-loan', money(loan));
  }
  // affordability (housing cost at a chosen share of gross income)
  function calcAfford() {
    if (!document.getElementById('a-income')) return;
    var inc = num('a-income'), debts = num('a-debts'), down = num('a-down'), rate = num('a-rate'), share = (num('a-share') || 28) / 100;
    var monthlyBudget = Math.max(inc / 12 * share, 0);
    var backEnd = Math.max(inc / 12 * 0.36 - debts, 0);
    var budget = Math.min(monthlyBudget, backEnd) * 0.8; // leave about 20% of the budget for taxes, insurance and HOA
    var r = rate / 100 / 12, n = 360;
    var loan = r ? budget * (1 - Math.pow(1 + r, -n)) / r : budget * n;
    set('a-price', money(loan + down)); set('a-pay', money(Math.min(monthlyBudget, backEnd))); set('a-loan', money(loan));
  }
  // seller net proceeds
  function calcNet() {
    if (!document.getElementById('n-price')) return;
    var price = num('n-price'), owed = num('n-owed'), comm = num('n-comm') / 100, close = num('n-close') / 100, other = num('n-other');
    var c = price * comm, cl = price * close, net = price - owed - c - cl - other;
    set('n-net', money(net)); set('n-commv', money(c)); set('n-closev', money(cl)); set('n-otherv', money(other)); set('n-owedv', money(owed));
  }
  // 1031 deadlines
  function calc1031() {
    var el = document.getElementById('x-date'); if (!el) return;
    if (!el.value) { set('x-45', '—'); set('x-180', '—'); set('x-left', ''); return; }
    var d = new Date(el.value + 'T12:00:00');
    var add = function (days) { var x = new Date(d); x.setDate(x.getDate() + days); return x; };
    var fmt = function (x) { return x.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }); };
    var d45 = add(45), d180 = add(180), today = new Date(); today.setHours(12, 0, 0, 0);
    var left = Math.round((d45 - today) / 864e5);
    set('x-45', fmt(d45)); set('x-180', fmt(d180));
    set('x-left', left >= 0 ? left + ' days left to identify replacement property.' : 'The 45-day identification window has passed.');
  }
  ['input', 'change'].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      var id = e.target && e.target.id || '';
      if (id.indexOf('m-') === 0) calcMortgage();
      if (id.indexOf('a-') === 0) calcAfford();
      if (id.indexOf('n-') === 0) calcNet();
      if (id.indexOf('x-') === 0) calc1031();
    });
  });
  calcMortgage(); calcAfford(); calcNet(); calc1031();
})();

/* Community picker feeds the calculators */
(function () {
  var pick = document.getElementById('c-pick');
  if (!pick) return;
  var info = document.getElementById('c-info');
  function fmt(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function short(n) { return n >= 1e6 ? '$' + (n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace(/\.?0+$/, '') + 'M' : '$' + Math.round(n / 1000) + 'K'; }
  function setv(id, v) { var el = document.getElementById(id); if (el) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); } }
  window.__setRate = window.__setRate || function () {};
  function usePrice(p) {
    setv('m-price', p); setv('m-down', Math.round(p * 0.2)); setv('n-price', p);
    info.querySelectorAll('[data-p]').forEach(function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-p') === p ? 'true' : 'false'); });
  }
  function show() {
    var o = pick.options[pick.selectedIndex], id = pick.value;
    if (!id) { info.hidden = true; return; }
    try { history.replaceState(null, '', '#' + id); } catch (e) {}
    info.hidden = false;
    var line = info.querySelector('.c-line'), pts = info.querySelector('.c-points'), more = info.querySelector('.c-more');
    more.innerHTML = '<a href="/' + id + '">Full market snapshot and map for ' + o.text + '</a>';
    if (o.getAttribute('data-none')) { window.__setRate(2.9328, 'unincorporated Clark County'); line.textContent = 'Figures for ' + o.text + ' are coming soon. Ask me for current sales and dues.'; pts.innerHTML = ''; return; }
    var low = +o.getAttribute('data-low'), med = +o.getAttribute('data-med'), high = +o.getAttribute('data-high'), hoa = +o.getAttribute('data-hoa');
    line.innerHTML = (low ? 'Recent sales ran ' + short(low) + ' to ' + short(high) + ', median <b>' + fmt(med) + '</b>' : 'Median <b>' + fmt(med) + '</b>') + ' (' + o.getAttribute('data-period') + '). HOA: ' + o.getAttribute('data-hoanote') + '.';
    var b = '', chips = o.getAttribute('data-chips');
    if (chips) {
      JSON.parse(chips).forEach(function (c) { b += '<button type="button" class="chip" data-p="' + c[1] + '" data-h="' + (c[2] || '') + '">' + c[0] + '</button>'; });
      pts.innerHTML = b; window.__setRate(+o.getAttribute('data-rate') || 3.2782, o.getAttribute('data-district') || 'City of Las Vegas');
      line.innerHTML = 'Prices vary by neighborhood (' + o.getAttribute('data-period') + '). HOA: ' + o.getAttribute('data-hoanote') + '. Pick a neighborhood:'; var first = JSON.parse(chips)[2] || JSON.parse(chips)[0]; if (first[2]) setv('m-hoa', first[2]); usePrice(first[1]); return;
    }
    if (low) b += '<button type="button" class="chip" data-p="' + low + '">Low end ' + short(low) + '</button>';
    b += '<button type="button" class="chip" data-p="' + med + '">Median ' + short(med) + '</button>';
    if (high) b += '<button type="button" class="chip" data-p="' + high + '">High end ' + short(high) + '</button>';
    pts.innerHTML = b;
    if (hoa) setv('m-hoa', hoa);
    window.__setRate(+o.getAttribute('data-rate') || 3.2782, o.getAttribute('data-district') || 'City of Las Vegas');
    usePrice(med);
  }
  pick.addEventListener('change', show);
  info.addEventListener('click', function (e) { var b = e.target.closest('[data-p]'); if (!b) return; if (b.getAttribute('data-h')) setv('m-hoa', +b.getAttribute('data-h')); usePrice(+b.getAttribute('data-p')); });
  var h = (location.hash || '').slice(1);
  if (h && pick.querySelector('option[value="' + h + '"]')) { pick.value = h; show(); }
})();

/* Click-to-load community maps */
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-map-load]');
  if (!b) return;
  var box = b.closest('[data-map]');
  box.innerHTML = '<iframe title="Map" src="' + box.getAttribute('data-map') + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
});

/* Property tax and insurance follow the price (Clark County 2026-27 rates) */
(function () {
  var price = document.getElementById('m-price'), tax = document.getElementById('m-tax'), ins = document.getElementById('m-ins');
  if (!price || !tax || !ins) return;
  var rate = 3.2782, ownTax = false, ownIns = false;
  function upd() {
    var p = parseFloat(String(price.value).replace(/[^0-9.]/g, '')) || 0;
    if (!ownTax) { tax.value = Math.round(p * 0.8 * 0.35 * rate / 100); tax.dispatchEvent(new Event('input', { bubbles: true })); }
    if (!ownIns) { ins.value = Math.round(p * 0.6 * 0.00435); ins.dispatchEvent(new Event('input', { bubbles: true })); }
  }
  window.__setRate = function (r, district) {
    rate = r; var el = document.getElementById('m-taxrate');
    if (el) el.textContent = '$' + r.toFixed(4) + ' per $100, ' + district;
    upd();
  };
  price.addEventListener('input', upd);
  tax.addEventListener('input', function (e) { if (e.isTrusted) ownTax = true; });
  ins.addEventListener('input', function (e) { if (e.isTrusted) ownIns = true; });
  var pk = document.getElementById('c-pick'), o = pk && pk.value ? pk.options[pk.selectedIndex] : null;
  if (o && o.getAttribute('data-rate')) window.__setRate(+o.getAttribute('data-rate'), o.getAttribute('data-district')); else upd();
})();
