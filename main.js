// Initialize AOS animations
AOS.init({
    duration: 700,
    once: true
  });
  
  // Example: highlight nav link on scroll
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    sections.forEach(sec => {
      const top = sec.offsetTop - 80;
      const bottom = top + sec.offsetHeight;
      const link = document.querySelector(`#navbar a[href*="${sec.id}"]`);
      if (scrollY >= top && scrollY < bottom) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  });
  