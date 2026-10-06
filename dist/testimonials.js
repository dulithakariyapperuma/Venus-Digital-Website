// Testimonials interactive enhancements
document.addEventListener('DOMContentLoaded', () => {
  const allVideos = document.querySelectorAll('.curved-video-card video, .client-story video');
  allVideos.forEach(video => {
    video.addEventListener('play', () => {
      allVideos.forEach(other => {
        if (other !== video && !other.paused) {
          other.pause();
        }
      });
    });
  });

  const emptyNotice = document.querySelector('#testimonials-empty');
  if (emptyNotice) {
    emptyNotice.hidden = true;
  }
});
