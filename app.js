(() => {
  const body = document.body;
  const modal = document.querySelector('#course-modal');
  const modalPlate = modal?.querySelector('.course-plate');
  const panels = [...document.querySelectorAll('[data-panel]')];
  const plates = [...document.querySelectorAll('[data-course]')];
  const contactOverlay = document.querySelector('#contact-overlay');
  const contactTriggers = document.querySelectorAll('[data-contact]');
  let activeTrigger = null;
  let activeCourse = null;
  let routeChangeInProgress = false;

  document.querySelectorAll('[data-year]').forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  const allowedCourses = new Set(panels.map((panel) => panel.dataset.panel));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setRoute(hash, replace = false) {
    routeChangeInProgress = true;
    const method = replace ? 'replaceState' : 'pushState';
    history[method](null, '', hash);
    requestAnimationFrame(() => { routeChangeInProgress = false; });
  }

  function targetPlateSize() {
    if (window.innerWidth <= 820) {
      return { width: Math.min(window.innerWidth * 0.94, 720), height: Math.min(window.innerHeight * 0.92, 820) };
    }
    const size = Math.min(window.innerWidth * 0.88, window.innerHeight * 0.88, 900);
    return { width: size, height: size };
  }

  async function animatePlateIn(trigger) {
    if (!trigger || reducedMotion) return;
    const rect = trigger.getBoundingClientRect();
    const target = targetPlateSize();
    const targetLeft = (window.innerWidth - target.width) / 2;
    const targetTop = (window.innerHeight - target.height) / 2;
    const clone = trigger.cloneNode(true);
    clone.classList.add('plate-flight');
    clone.removeAttribute('data-course');
    clone.removeAttribute('aria-label');
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    document.body.append(clone);
    trigger.classList.add('is-source-hidden');

    await clone.animate([
      { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, opacity: 1 },
      { left: `${targetLeft}px`, top: `${targetTop}px`, width: `${target.width}px`, height: `${target.height}px`, opacity: 1 }
    ], { duration: 650, easing: 'cubic-bezier(.18,.82,.2,1)', fill: 'forwards' }).finished.catch(() => {});

    clone.remove();
    trigger.classList.remove('is-source-hidden');
  }

  async function openCourse(course, trigger = null, options = {}) {
    if (!allowedCourses.has(course) || !modal) return;
    if (activeCourse === course && modal.classList.contains('is-open')) return;

    closeContact({ updateRoute: false });
    activeTrigger = trigger || document.querySelector(`[data-course="${course}"]`);
    activeCourse = course;
    body.classList.add('course-active', 'is-locked');

    panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== course; });
    modalPlate?.setAttribute('aria-labelledby', `${course}-heading`);
    modal.setAttribute('aria-hidden', 'false');

    if (!options.skipFlight) await animatePlateIn(activeTrigger);
    modal.classList.add('is-open');
    modalPlate?.querySelector('.course-scroll')?.scrollTo(0, 0);
    setTimeout(() => modal.querySelector('[data-close-course]')?.focus({ preventScroll: true }), reducedMotion ? 0 : 350);

    if (options.updateRoute !== false && location.hash !== `#${course}`) setRoute(`#${course}`);
  }

  async function animatePlateOut(trigger) {
    if (!trigger || reducedMotion || !modalPlate) return;
    const rect = trigger.getBoundingClientRect();
    const source = targetPlateSize();
    const startLeft = (window.innerWidth - source.width) / 2;
    const startTop = (window.innerHeight - source.height) / 2;
    const clone = trigger.cloneNode(true);
    clone.classList.add('plate-flight');
    clone.removeAttribute('data-course');
    clone.style.left = `${startLeft}px`;
    clone.style.top = `${startTop}px`;
    clone.style.width = `${source.width}px`;
    clone.style.height = `${source.height}px`;
    document.body.append(clone);
    trigger.classList.add('is-source-hidden');

    await clone.animate([
      { left: `${startLeft}px`, top: `${startTop}px`, width: `${source.width}px`, height: `${source.height}px`, opacity: 1 },
      { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, opacity: 1 }
    ], { duration: 520, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).finished.catch(() => {});

    clone.remove();
    trigger.classList.remove('is-source-hidden');
  }

  async function closeCourse(options = {}) {
    if (!modal?.classList.contains('is-open')) return;
    const trigger = activeTrigger;
    modal.classList.remove('is-open');
    await new Promise((resolve) => setTimeout(resolve, reducedMotion ? 0 : 180));
    await animatePlateOut(trigger);
    modal.setAttribute('aria-hidden', 'true');
    body.classList.remove('course-active', 'is-locked');
    activeCourse = null;
    if (options.restoreFocus !== false) trigger?.focus({ preventScroll: true });
    if (options.updateRoute !== false && location.hash !== '#home') setRoute('#home');
  }

  function openContact(options = {}) {
    if (!contactOverlay) return;
    if (modal?.classList.contains('is-open')) closeCourse({ updateRoute: false, restoreFocus: false });
    body.classList.add('contact-active', 'is-locked');
    contactOverlay.classList.add('is-open');
    contactOverlay.setAttribute('aria-hidden', 'false');
    setTimeout(() => contactOverlay.querySelector('[data-close-contact]')?.focus({ preventScroll: true }), reducedMotion ? 0 : 400);
    if (options.updateRoute !== false && location.hash !== '#contact') setRoute('#contact');
  }

  function closeContact(options = {}) {
    if (!contactOverlay?.classList.contains('is-open')) return;
    contactOverlay.classList.remove('is-open');
    contactOverlay.setAttribute('aria-hidden', 'true');
    body.classList.remove('contact-active', 'is-locked');
    if (options.restoreFocus !== false) document.querySelector('[data-contact]')?.focus({ preventScroll: true });
    if (options.updateRoute !== false && location.hash !== '#home') setRoute('#home');
  }

  plates.forEach((plate) => plate.addEventListener('click', () => openCourse(plate.dataset.course, plate)));
  document.querySelectorAll('[data-close-course]').forEach((button) => button.addEventListener('click', () => closeCourse()));
  contactTriggers.forEach((trigger) => trigger.addEventListener('click', () => openContact()));
  document.querySelectorAll('[data-close-contact]').forEach((button) => button.addEventListener('click', () => closeContact()));

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (contactOverlay?.classList.contains('is-open')) closeContact();
    else if (modal?.classList.contains('is-open')) closeCourse();
  });

  window.addEventListener('popstate', () => {
    if (routeChangeInProgress) return;
    handleRoute({ skipFlight: true, updateRoute: false });
  });

  function handleRoute(options = {}) {
    const route = location.hash.replace('#', '') || 'home';
    if (route === 'contact') {
      if (modal?.classList.contains('is-open')) closeCourse({ updateRoute: false, restoreFocus: false });
      openContact({ updateRoute: false });
      return;
    }
    if (allowedCourses.has(route)) {
      closeContact({ updateRoute: false, restoreFocus: false });
      openCourse(route, document.querySelector(`[data-course="${route}"]`), { ...options, updateRoute: false });
      return;
    }
    closeContact({ updateRoute: false, restoreFocus: false });
    closeCourse({ updateRoute: false, restoreFocus: false });
  }

  const form = document.querySelector('#contact-form');
  const status = document.querySelector('.form-status');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const label = button.querySelector('span');
    const original = label.textContent;
    button.disabled = true;
    label.textContent = 'Sending…';
    status.textContent = '';
    status.className = 'form-status';
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('Submission failed');
      form.reset();
      status.textContent = 'Message sent. I’ll be in touch.';
      status.classList.add('success');
    } catch {
      status.textContent = 'The form could not send. Email harrison.tun@tufts.edu instead.';
      status.classList.add('error');
    } finally {
      button.disabled = false;
      label.textContent = original;
    }
  });

  if (!location.hash) history.replaceState(null, '', '#home');
  else handleRoute({ skipFlight: true, updateRoute: false });
})();
