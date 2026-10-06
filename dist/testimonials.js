// Testimonials Interactive Sliding & Video Controls
document.addEventListener('DOMContentLoaded', () => {
  // Setup horizontal sliders with arrow navigation
  function setupSlider(trackSelector, prevBtnSelector, nextBtnSelector) {
    const track = document.querySelector(trackSelector);
    const prevBtn = document.querySelector(prevBtnSelector);
    const nextBtn = document.querySelector(nextBtnSelector);

    if (!track || !prevBtn || !nextBtn) return;

    prevBtn.addEventListener('click', () => {
      const cardWidth = track.firstElementChild ? track.firstElementChild.getBoundingClientRect().width + 24 : 300;
      track.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
      const cardWidth = track.firstElementChild ? track.firstElementChild.getBoundingClientRect().width + 24 : 300;
      track.scrollBy({ left: cardWidth, behavior: 'smooth' });
    });
  }

  setupSlider('#video-slider-track', '#video-prev-btn', '#video-next-btn');
  setupSlider('#text-slider-track', '#text-prev-btn', '#text-next-btn');

  // Video play overlays & mutual-pause
  const videoFrames = document.querySelectorAll('.sliding-video-frame');
  const allVideos = document.querySelectorAll('video');

  videoFrames.forEach(frame => {
    const video = frame.querySelector('video');
    const overlay = frame.querySelector('.video-play-overlay');
    if (!video || !overlay) return;

    function playVideo() {
      allVideos.forEach(v => {
        if (v !== video && !v.paused) v.pause();
      });
      video.play();
    }

    overlay.addEventListener('click', () => {
      if (video.paused) {
        playVideo();
      } else {
        video.pause();
      }
    });

    video.addEventListener('play', () => {
      overlay.classList.add('is-playing');
      allVideos.forEach(v => {
        if (v !== video && !v.paused) v.pause();
      });
    });

    video.addEventListener('pause', () => {
      overlay.classList.remove('is-playing');
    });

    video.addEventListener('ended', () => {
      overlay.classList.remove('is-playing');
    });
  });

  const emptyNotice = document.querySelector('#testimonials-empty');
  if (emptyNotice) {
    emptyNotice.hidden = true;
  }
});
