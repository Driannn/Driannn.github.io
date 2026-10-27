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
