(function () {
  var root = document.documentElement;

  // Language toggle
  var langButtons = document.querySelectorAll('[data-set-lang]');
  function setLang(lang) {
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang);
    langButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.setLang === lang)); });
    try { localStorage.setItem('lang', lang); } catch (e) {}
  }
  langButtons.forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.setLang); }); });
  setLang(root.getAttribute('data-lang'));

  // Mobile menu
  var nav = document.getElementById('nav');
  var menuBtn = document.querySelector('.menu-btn');
  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  });

  // Click-to-load YouTube (keeps the page light until a video is played)
  document.querySelectorAll('[data-yt]').forEach(function (el) {
    var id = el.dataset.yt;
    // A video with its own poster image keeps it instead of YouTube's thumbnail
    if (!el.querySelector('img')) el.style.backgroundImage = 'url(https://i.ytimg.com/vi/' + id + '/hqdefault.jpg)';
    el.addEventListener('click', function () {
      if (el.classList.contains('loaded')) return;
      // Opened as a local file there is no origin, so YouTube rejects the embed; open it on YouTube instead
      if (location.protocol === 'file:') {
        window.open('https://www.youtube.com/watch?v=' + id, '_blank', 'noopener');
        return;
      }
      // Only one video plays at a time: pause any that were started before
      document.querySelectorAll('.video.loaded iframe').forEach(function (other) {
        other.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      });
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0&enablejsapi=1';
      // YouTube refuses to play (error 153) when the embed sends no referrer
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.title = el.getAttribute('aria-label') || 'YouTube video';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      el.replaceChildren(iframe);
      el.classList.add('loaded');
    });
  });

  // Hero waveform
  var wave = document.getElementById('wave');
  var bars = wave ? (window.innerWidth < 720 ? 40 : 90) : 0;
  for (var i = 0; i < bars; i++) {
    var b = document.createElement('i');
    b.style.height = (20 + Math.abs(Math.sin(i * 0.35)) * 60 + Math.random() * 20) + '%';
    b.style.animationDelay = (-Math.random() * 1.8).toFixed(2) + 's';
    b.style.animationDuration = (1.2 + Math.random() * 1.2).toFixed(2) + 's';
    wave.appendChild(b);
  }

  // Reveal on scroll
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // Copy email
  var status = document.getElementById('copy-status');
  var copyBtn = document.getElementById('copy-email');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    var es = root.getAttribute('data-lang') === 'es';
    navigator.clipboard.writeText('contact@driann.com').then(function () {
      status.textContent = es ? 'Email copiado ✓' : 'Email copied ✓';
    }, function () {
      status.textContent = 'contact@driann.com';
    });
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
