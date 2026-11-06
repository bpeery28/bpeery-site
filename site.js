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
