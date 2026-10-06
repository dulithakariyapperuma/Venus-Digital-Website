const video = document.querySelector('#planet-video');
const motionButton = document.querySelector('.motion-toggle');
if (video && motionButton) {
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let userPaused = motionPreference.matches;
function updateMotionButton() {
  const paused = video.paused;
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.setAttribute('aria-label', paused ? 'Play background animation' : 'Pause background animation');
  motionButton.querySelector('.motion-label').textContent = paused ? 'Play motion' : 'Pause motion';
}
async function playVideo() { try { await video.play(); } catch {} updateMotionButton(); }
if (userPaused) { video.removeAttribute('autoplay'); video.pause(); } else { playVideo(); }
video.addEventListener('play', updateMotionButton);
video.addEventListener('pause', updateMotionButton);
motionButton.addEventListener('click', () => { userPaused = !userPaused; if (userPaused) video.pause(); else playVideo(); updateMotionButton(); });
motionPreference.addEventListener('change', event => { userPaused = event.matches; if (userPaused) video.pause(); else playVideo(); updateMotionButton(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); else if (!userPaused) playVideo(); });
updateMotionButton();
}
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
function closeMenu() { nav.classList.remove('is-open'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open navigation'); }
menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; nav.classList.toggle('is-open', open); menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); });
nav.querySelectorAll('a,button').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
const dialog = document.querySelector('#contact-dialog');
document.querySelectorAll('[data-contact]').forEach(button => button.addEventListener('click', () => {
  const bookingUrl = window.VENUS_BOOKING_URL;
  if (bookingUrl) {
    window.open(bookingUrl, '_blank', 'noopener,noreferrer');
    return;
  }
  dialog.showModal();
}));
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
document.querySelector('.dialog-services').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { const rect = dialog.getBoundingClientRect(); if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close(); });
document.querySelector('#year').textContent = new Date().getFullYear();
