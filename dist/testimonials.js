// Add supplied client videos and verified review details here.
// A rating is displayed only when the client provided that rating.
const clientStories = [];

const storiesContainer = document.querySelector('#client-stories');
document.querySelector('#testimonials-empty').hidden = clientStories.length > 0;
for (const story of clientStories) {
  const article = document.createElement('article');
  article.className = 'client-story';
  if (story.video) {
    const video = document.createElement('video');
    video.src = story.video;
    video.controls = true;
    video.preload = 'metadata';
    video.playsInline = true;
    video.setAttribute('aria-label', `${story.name} client testimonial`);
    if (story.poster) video.poster = story.poster;
    video.addEventListener('play', () => {
      document.querySelectorAll('.client-story video').forEach(other => { if (other !== video) other.pause(); });
    });
    article.append(video);
  }
  const name = document.createElement('h2');
  name.textContent = story.name;
  article.append(name);
  if (story.company || story.country) {
    const company = document.createElement('p');
    company.className = 'client-company';
    company.textContent = [story.company, story.country].filter(Boolean).join(' · ');
    article.append(company);
  }
  if (Number.isInteger(story.rating) && story.rating >= 1 && story.rating <= 5) {
    const rating = document.createElement('p');
    rating.className = 'rating';
    rating.setAttribute('aria-label', `${story.rating} out of 5 stars`);
    rating.textContent = '★'.repeat(story.rating) + '☆'.repeat(5 - story.rating);
    article.append(rating);
  }
  if (story.quote) {
    const quote = document.createElement('blockquote');
    quote.textContent = story.quote;
    article.append(quote);
  }
  storiesContainer.append(article);
}
