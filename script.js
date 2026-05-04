

document.addEventListener('DOMContentLoaded', () => {

  /* ─── SCROLL REVEAL ────────────────────────────────────── */
  const reveals = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -30px 0px',
  });

  reveals.forEach(el => observer.observe(el));

});
