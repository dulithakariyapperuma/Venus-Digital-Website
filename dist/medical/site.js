(() => {
  window.SITE_READY = true;
  const links = window.VIDEO_LINKS || {};
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Title and tag shown under each film in the player. Keep the tags: they say these are spec concepts.
  const FILMS = {
    showreel: { title: 'Showreel', tag: 'Spec concepts · not affiliated with the brands shown' },
    oxiwear: { title: 'OxiWear · “Freedom to thrive” · 0:45', tag: 'Spec concept · not affiliated with OxiWear' },
    procedures: { title: 'Inside the Procedure · 1:00', tag: 'Self-initiated showreel · no client or brand' },
    flow: { title: 'Flow Neuroscience · “Rebalance your brain” · 1:05', tag: 'Spec concept · not affiliated with Flow Neuroscience' },
    biobutton: { title: 'BioButton · “When everything is a priority” · 0:54', tag: 'Spec concept · not affiliated with Medtronic or BioIntelliSense' },
    rewalk: { title: 'ReWalk 7 · “Stand up. Eye to eye.” · 1:04', tag: 'Spec concept · not affiliated with Lifeward' },
  };

  /** Turns a Vimeo or YouTube page link into an embeddable player URL, or null. */
  function embedUrl(raw) {
    if (!raw || !raw.trim()) return null;
    let u;
    try { u = new URL(raw.trim()); } catch { return null; }
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'vimeo.com' || host.endsWith('.vimeo.com')) {
      const parts = u.pathname.split('/').filter(Boolean);
      const i = parts.findIndex((p) => /^\d+$/.test(p));
      if (i < 0) return null;
      const next = parts[i + 1] || '';
      const hash = u.searchParams.get('h') || (/^[0-9a-f]{6,}$/i.test(next) ? next : '');
      const q = new URLSearchParams({ autoplay: '1', title: '0', byline: '0', portrait: '0', dnt: '1' });
      if (hash) q.set('h', hash);
      return `https://player.vimeo.com/video/${parts[i]}?${q}`;
    }
    if (host === 'youtu.be' || host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      let id = '';
      if (host === 'youtu.be') id = u.pathname.slice(1);
      else if (u.searchParams.get('v')) id = u.searchParams.get('v');
      else {
        const m = u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{11})/);
        if (m) id = m[1];
      }
      id = (id || '').split('/')[0];
      if (!/^[\w-]{11}$/.test(id)) return null;
      return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;
    }
    return null;
  }

  /* ---------- Hero showreel loop ---------- */
  const reel = document.getElementById('reel');
  const pauseBtn = document.querySelector('.reel-pause');
  const label = document.querySelector('.reel-label');
  const nameEl = document.getElementById('reel-name');
  const tagEl = document.getElementById('reel-tag');
  // The loop (media/reel.mp4) is six 2.6 s excerpts joined by 0.35 s dissolves, so a new one starts every 2.25 s.
  const SEGMENTS = [
    ['Inside the Procedure', 'Self-initiated showreel · no brand'],
    ['OxiWear', 'Spec concept · not affiliated with OxiWear'],
    ['ReWalk 7', 'Spec concept · not affiliated with Lifeward'],
    ['Flow Neuroscience', 'Spec concept · not affiliated with Flow Neuroscience'],
    ['BioButton', 'Spec concept · not affiliated with Medtronic or BioIntelliSense'],
    ['Inside the Procedure', 'Self-initiated showreel · no brand'],
  ];
  const STEP = 2.25;
  const HALF_DISSOLVE = 0.175;
  let userPaused = reduceMotion;
  let current = 0;

  function syncLabel() {
    const i = Math.min(SEGMENTS.length - 1, Math.max(0, Math.floor((reel.currentTime - HALF_DISSOLVE) / STEP)));
    if (i === current) return;
    current = i;
    label.classList.add('is-swapping');
    setTimeout(() => {
      [nameEl.textContent, tagEl.textContent] = SEGMENTS[i];
      label.classList.remove('is-swapping');
    }, 180);
  }

  function setPaused(paused) {
    userPaused = paused;
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.setAttribute('aria-label', paused ? 'Play the background video' : 'Pause the background video');
    if (paused) reel.pause();
    else reel.play().catch(() => {});
  }

  if (reel) {
    reel.addEventListener('timeupdate', syncLabel);
    pauseBtn.addEventListener('click', () => setPaused(!userPaused));
    setPaused(userPaused);
    // Save battery: only play while the reel is on screen.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        if (userPaused || document.querySelector('.player[open]')) return;
        if (e.isIntersecting) reel.play().catch(() => {});
        else reel.pause();
      }, { threshold: 0.15 }).observe(reel);
    }
  }

  /* ---------- Video player (Vimeo / YouTube) ---------- */
  const dialog = document.getElementById('player');
  const frame = document.getElementById('player-frame');
  const titleEl = document.getElementById('player-title');
  const playerTag = document.getElementById('player-tag');

  function openFilm(key) {
    let k = key;
    if (k === 'showreel' && !embedUrl(links.showreel)) k = 'procedures';
    const meta = FILMS[k];
    const src = embedUrl(links[k]);
    frame.replaceChildren();
    if (src) {
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.title = meta.title;
      iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.append(iframe);
    } else {
      console.warn(`[site] No video link for "${k}". Paste its Vimeo or YouTube link into links.js.`);
      frame.innerHTML =
        '<div class="player-missing"><strong>This film is coming online shortly.</strong>' +
        '<p>Email <a href="mailto:hello@venusdigital.org?subject=Medical%20animation%20showreel">hello@venusdigital.org</a> and I\'ll send you a private link.</p></div>';
    }
    titleEl.textContent = meta.title;
    playerTag.textContent = meta.tag;
    if (reel) reel.pause();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else if (src) window.open(src, '_blank', 'noopener');
  }

  document.querySelectorAll('[data-play]').forEach((el) => {
    el.addEventListener('click', () => openFilm(el.dataset.play));
  });
  dialog.querySelector('.player-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    frame.replaceChildren(); // stops playback
    if (reel && !userPaused) reel.play().catch(() => {});
    if (Object.hasOwn(FILMS, location.hash.slice(1))) history.replaceState(null, '', location.pathname + location.search);
  });

  // Direct links for outreach emails: venusdigital.org/medical/#oxiwear opens that film.
  const fromHash = () => {
    const key = location.hash.slice(1).toLowerCase();
    if (Object.hasOwn(FILMS, key)) openFilm(key);
  };
  window.addEventListener('hashchange', fromHash);
  fromHash();

  /* ---------- Hover previews on film cards (desktop only) ---------- */
  if (canHover && !reduceMotion) {
    document.querySelectorAll('.film-media').forEach((card) => {
      const v = card.querySelector('video');
      if (!v) return;
      let leaveTimer;
      card.addEventListener('mouseenter', () => {
        clearTimeout(leaveTimer);
        if (!v.getAttribute('src')) v.src = v.dataset.src;
        v.play().then(() => card.classList.add('is-previewing')).catch(() => {});
      });
      card.addEventListener('mouseleave', () => {
        card.classList.remove('is-previewing');
        leaveTimer = setTimeout(() => { v.pause(); v.currentTime = 0; }, 450);
      });
    });
  }

  /* ---------- Header background after scrolling ---------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        // Drop the stagger afterwards so hover effects stay instant.
        setTimeout(() => { e.target.style.transitionDelay = ''; }, 1200);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    revealEls.forEach((el, i) => {
      // Small stagger for items that enter together.
      el.style.transitionDelay = `${(i % 4) * 70}ms`;
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.classList.add('is-in'); // already on screen: reveal now
        setTimeout(() => { el.style.transitionDelay = ''; }, 1200);
      } else {
        io.observe(el);
      }
    });
  }

  // "Book a 30-min call": the Google Calendar booking page set in ../booking.js (shared with the main site).
  // The button stays hidden until that link is set; "Email me" works either way.
  const bookingUrl = String(window.VENUS_BOOKING_URL || '').trim();
  const bookingBtn = document.querySelector('[data-booking]');
  if (bookingBtn && /^https:\/\//.test(bookingUrl)) {
    bookingBtn.href = bookingUrl;
    bookingBtn.target = '_blank';
    bookingBtn.rel = 'noopener';
    bookingBtn.hidden = false;
  }

  document.getElementById('year').textContent = String(new Date().getFullYear());
})();
