// Interaction layer for motion.css: scroll progress, header state, card
// spotlight, staggered reveals and a pointer-reactive hero wave.
// Purely decorative: the page works the same without it.
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Scroll progress bar + header shadow once the page scrolls
  var bar = document.createElement('div');
  bar.className = 'progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var header = document.querySelector('.site-header');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty('--progress', max > 0 ? Math.min(window.scrollY / max, 1) : 0);
      if (header) header.classList.toggle('scrolled', window.scrollY > 8);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Stagger reveals that sit side by side in the same container
  document.querySelectorAll('.grid, .paths, .disciplines, .tool-row, .certs, .skillset, .timeline').forEach(function (group) {
    var i = 0;
    Array.prototype.forEach.call(group.children, function (child) {
      if (child.classList.contains('reveal')) child.style.setProperty('--i', i++);
    });
  });

  if (reduceMotion || !finePointer) return;

  // Spotlight that follows the pointer across cards
  document.querySelectorAll('.card, .path, .featured').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // Hero wave: bars near the pointer light up
  var hero = document.querySelector('.hero');
  var wave = document.getElementById('wave');
  if (hero && wave) {
    var hot = [];
    hero.addEventListener('pointermove', function (e) {
      var bars = wave.children;
      if (!bars.length) return;
      var r = wave.getBoundingClientRect();
      var idx = Math.floor(((e.clientX - r.left) / r.width) * bars.length);
      hot.forEach(function (b) { b.classList.remove('hot'); });
      hot = [];
      for (var k = idx - 3; k <= idx + 3; k++) {
        if (bars[k]) { bars[k].classList.add('hot'); hot.push(bars[k]); }
      }
    });
    hero.addEventListener('pointerleave', function () {
      hot.forEach(function (b) { b.classList.remove('hot'); });
      hot = [];
    });
  }
})();

// Liquid nav: a single pill slides (and stretches) between page tabs, also
// across page loads; a soft ghost follows the hovered tab. The ES/EN switch
// gets the same sliding pill, and the page text settles in after a switch.
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var pages = document.querySelector('.nav-pages');

  // The browser may skip a cross-page view transition (background tab, fast clicks);
  // it then rejects these promises. Nothing breaks, so just keep the console clean.
  function quiet(e) {
    var vt = e.viewTransition;
    if (!vt) return;
    ['ready', 'finished', 'updateCallbackDone'].forEach(function (p) { if (vt[p]) vt[p].catch(function () {}); });
  }
  window.addEventListener('pageswap', quiet);
  window.addEventListener('pagereveal', quiet);
  var KEY = 'navPill';

  if (pages) {
    var pill = document.createElement('span');
    pill.className = 'nav-pill';
    pill.setAttribute('aria-hidden', 'true');
    var ghost = document.createElement('span');
    ghost.className = 'nav-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    pages.prepend(ghost, pill);
    root.classList.add('has-nav-pill');

    var current = pages.querySelector('a[aria-current="page"]');
    var stretchTimer;

    function rectOf(a) { return { x: a.offsetLeft, w: a.offsetWidth }; }
    function place(el, r) {
      el.style.setProperty('--x', r.x + 'px');
      el.style.setProperty('--w', r.w + 'px');
    }
    function jump(el, r) {
      el.classList.add('no-anim');
      place(el, r);
      void el.offsetWidth;
      el.classList.remove('no-anim');
    }
    // Stretch over both tabs first, then settle on the target: reads as liquid.
    function flow(from, to) {
      clearTimeout(stretchTimer);
      if (reduceMotion || !from) { jump(pill, to); return; }
      var left = Math.min(from.x, to.x);
      var right = Math.max(from.x + from.w, to.x + to.w);
      pill.classList.add('stretching');
      place(pill, { x: left, w: right - left });
      stretchTimer = setTimeout(function () {
        pill.classList.remove('stretching');
        place(pill, to);
      }, 170);
    }

    // Initial position: continue from the tab we came from, if any.
    var saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(KEY) || 'null'); sessionStorage.removeItem(KEY); } catch (e) {}
    var fresh = saved && Date.now() - saved.t < 4000;
    if (current) {
      var target = rectOf(current);
      if (fresh && saved.x != null) {
        jump(pill, saved);
        pill.classList.add('on');
        requestAnimationFrame(function () { requestAnimationFrame(function () { flow(saved, target); }); });
      } else {
        jump(pill, target);
        pill.classList.add('on');
      }
    } else if (fresh && saved.x != null) {
      // Arriving on home: the pill melts away from where it was.
      jump(pill, saved);
      pill.classList.add('on');
      requestAnimationFrame(function () { requestAnimationFrame(function () { pill.classList.remove('on'); }); });
    }

    // Remember where the pill was when leaving through a tab or the logo.
    function remember() {
      if (!current) return;
      var r = rectOf(current);
      try { sessionStorage.setItem(KEY, JSON.stringify({ x: r.x, w: r.w, t: Date.now() })); } catch (e) {}
    }
    pages.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (a === current || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        remember();
      });
    });
    var brand = document.querySelector('.brand');
    if (brand) brand.addEventListener('click', remember);

    // Hover ghost glides between tabs.
    pages.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('pointerenter', function () {
        if (a === current) { ghost.classList.remove('on'); return; }
        if (!ghost.classList.contains('on')) jump(ghost, rectOf(a)); else place(ghost, rectOf(a));
        ghost.classList.add('on');
      });
    });
    pages.addEventListener('pointerleave', function () { ghost.classList.remove('on'); });

    // Tab widths change with the language: let the pill flow to the new size.
    window.addEventListener('resize', function () { if (current) jump(pill, rectOf(current)); });
    // Web fonts change the tab widths once they load; settle the pill on the final size.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (current && !pill.classList.contains('stretching')) place(pill, rectOf(current));
      });
    }
    root.addEventListener('langchange', function () {
      if (!current) return;
      var before = { x: parseFloat(pill.style.getPropertyValue('--x')) || 0, w: parseFloat(pill.style.getPropertyValue('--w')) || 0 };
      requestAnimationFrame(function () { flow(before, rectOf(current)); });
    });
  }

  // Language switch: announce the change and let the text settle in.
  document.querySelectorAll('[data-set-lang]').forEach(function (b) {
    b.addEventListener('click', function () {
      root.dispatchEvent(new Event('langchange'));
      if (reduceMotion) return;
      root.classList.remove('lang-swap');
      void root.offsetWidth;
      root.classList.add('lang-swap');
      setTimeout(function () { root.classList.remove('lang-swap'); }, 450);
    });
  });
})();