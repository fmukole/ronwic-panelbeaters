/* Ronwic Motors CC — site behaviour. Settings come from window.RONWIC (written by build.js). */
(function () {
  var cfg = window.RONWIC || {};
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  function loadAnalytics() {
    if (!cfg.gaId || window.gtag) return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.gaId);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', cfg.gaId, { anonymize_ip: true });
  }

  function onScroll() {
    var h = $('.site-header'), t = $('.to-top');
    if (h) h.classList.toggle('scrolled', window.scrollY > 8);
    if (t) t.classList.toggle('show', window.scrollY > window.innerHeight);
  }

  function countUp(el) {
    var end = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || '0', 10);
    var suffix = el.dataset.suffix || '', start = parseFloat(el.dataset.from || '0'), t0 = null;
    function frame(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / 1400, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = (start + (end - start) * e).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    el.textContent = start.toFixed(dec) + suffix;
    requestAnimationFrame(frame);
  }

  function init() {
    // Mobile menu
    var burger = $('.burger'), menu = $('.mobile-menu');
    if (burger && menu) {
      burger.onclick = function () {
        var open = menu.classList.toggle('open');
        burger.setAttribute('aria-expanded', open);
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.style.overflow = open ? 'hidden' : '';
      };
      document.body.style.overflow = '';
    }

    // Services dropdown (hover works in CSS; this adds click and keyboard)
    $$('.has-drop').forEach(function (li) {
      var btn = $('.drop-btn', li);
      function set(open) { li.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); }
      btn.onclick = function () { set(!li.classList.contains('open')); };
      li.onkeydown = function (e) { if (e.key === 'Escape') { set(false); btn.focus(); } };
      li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) set(false); });
    });

    // Scroll reveal + count-up
    var reveals = $$('.reveal'), counts = $$('[data-count]');
    if (reduce || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          io.unobserve(en.target);
          if (en.target.hasAttribute('data-count')) countUp(en.target);
          else en.target.classList.add('in');
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
      reveals.concat(counts).forEach(function (el) { io.observe(el); });
    }

    // FAQ: one open at a time
    $$('.faq').forEach(function (faq) {
      var qs = $$('.faq-q', faq);
      qs.forEach(function (q) {
        var a = document.getElementById(q.getAttribute('aria-controls'));
        a.hidden = q.getAttribute('aria-expanded') !== 'true';
        q.onclick = function () {
          var open = q.getAttribute('aria-expanded') === 'true';
          qs.forEach(function (o) {
            o.setAttribute('aria-expanded', 'false');
            document.getElementById(o.getAttribute('aria-controls')).hidden = true;
          });
          if (!open) { q.setAttribute('aria-expanded', 'true'); a.hidden = false; }
        };
      });
    });

    // Gallery lightbox
    var box = $('.lightbox');
    if (box && box.showModal) {
      $$('.gallery button').forEach(function (b) {
        b.onclick = function () {
          var img = $('img', b), big = $('img', box);
          big.src = b.dataset.full || img.src; big.alt = img.alt;
          $('p', box).textContent = $('span', b).textContent;
          box.showModal();
        };
      });
      $('.close', box).onclick = function () { box.close(); };
      box.onclick = function (e) { if (e.target === box) box.close(); };
    }

    // Before / after sliders
    $$('.ba').forEach(function (ba) {
      var input = $('input', ba);
      input.oninput = function () { ba.style.setProperty('--pos', input.value + '%'); };
    });

    // Video: only loads when clicked
    $$('.video').forEach(function (v) {
      var btn = $('button', v);
      btn.onclick = function () {
        if (cfg.videoUrl) {
          var f = document.createElement('iframe');
          f.src = 'https://www.facebook.com/plugins/video.php?autoplay=1&href=' + encodeURIComponent(cfg.videoUrl);
          f.allow = 'autoplay; encrypted-media; picture-in-picture';
          f.allowFullscreen = true; f.title = 'Ronwic Motors video';
          v.innerHTML = ''; v.appendChild(f);
        } else if (!$('.msg', v)) {
          var p = document.createElement('p');
          p.className = 'msg'; p.setAttribute('role', 'status');
          p.textContent = 'Demo: the video from Ronwic’s Facebook page will play here once the link is added.';
          v.appendChild(p);
        }
      };
    });

    // Quote form -> WhatsApp ready message
    var form = $('#quote-form');
    if (form) {
      var pre = cfg.job || new URLSearchParams(location.search).get('job');
      if (pre) {
        $$('option', form.job).forEach(function (o) { if (o.value === pre) form.job.value = pre; });
      }
      form.onsubmit = function (e) {
        e.preventDefault();
        if (!form.reportValidity()) return;
        var n = form.photo.files ? form.photo.files.length : 0;
        var lines = [
          'Hi, I’d like a quote for… ' + form.job.value,
          'Name: ' + form.name.value.trim(),
          'Phone: ' + form.phone.value.trim(),
          'Suburb: ' + form.suburb.value.trim()
        ];
        if (form.details.value.trim()) lines.push('Details: ' + form.details.value.trim());
        lines.push(n ? 'Photos: I’m attaching ' + n + ' photo' + (n > 1 ? 's' : '') + ' in this chat.' : 'Photos: none yet.');
        window.open('https://wa.me/' + cfg.wa + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
        var done = $('#form-done');
        done.hidden = false; done.focus();
      };
    }

    // Booking button falls back to WhatsApp until a Calendly link is set
    $$('[data-booking]').forEach(function (a) { if (cfg.calendly) a.href = cfg.calendly; });

    // Cookie notice
    var cookie = $('.cookie'), choice = store('ronwic-cookies');
    if (cookie) {
      cookie.classList.toggle('show', !choice);
      $$('button', cookie).forEach(function (b) {
        b.onclick = function () {
          store('ronwic-cookies', b.dataset.choice);
          cookie.classList.remove('show');
          if (b.dataset.choice === 'yes') loadAnalytics();
        };
      });
    }
    if (choice === 'yes') loadAnalytics();

    var top = $('.to-top');
    if (top) top.onclick = function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); };
    onScroll();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.RonwicInit = init;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
