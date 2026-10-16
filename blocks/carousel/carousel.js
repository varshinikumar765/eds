const AUTOPLAY_MS = 6000;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function showSlide(block, index) {
  const slides = [...block.querySelectorAll('.carousel-slide')];
  const dots = [...block.querySelectorAll('.carousel-dot')];
  const next = (index + slides.length) % slides.length;
  block.dataset.active = next;
  slides.forEach((slide, i) => {
    const active = i === next;
    slide.classList.toggle('active', active);
    slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    slide.querySelectorAll('a, button').forEach((el) => {
      if (active) el.removeAttribute('tabindex');
      else el.setAttribute('tabindex', '-1');
    });
  });
  dots.forEach((dot, i) => {
    dot.setAttribute('aria-selected', i === next ? 'true' : 'false');
  });
}

export default function decorate(block) {
  const rows = [...block.children];
  const track = document.createElement('div');
  track.className = 'carousel-slides';

  rows.forEach((row, i) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `Slide ${i + 1} of ${rows.length}`);

    const cells = [...row.children];
    const imageCell = cells.find((c) => c.querySelector('picture'));
    const contentCell = cells.find((c) => c !== imageCell);

    if (imageCell) {
      const bg = document.createElement('div');
      bg.className = 'carousel-slide-image';
      bg.append(...imageCell.childNodes);
      // first slide is the LCP: load eagerly, others lazily
      bg.querySelectorAll('img').forEach((img) => {
        img.loading = i === 0 ? 'eager' : 'lazy';
        if (!img.alt) img.alt = '';
      });
      slide.append(bg);
    }

    if (contentCell) {
      const content = document.createElement('div');
      content.className = 'carousel-slide-content';
      content.append(...contentCell.childNodes);

      // paragraphs that only hold icon links become the social row
      content.querySelectorAll('p').forEach((p) => {
        const links = p.querySelectorAll(':scope > a');
        const onlyIcons = links.length > 0 && [...links].every((a) => a.querySelector('.icon'));
        if (onlyIcons) {
          p.classList.add('carousel-social');
          links.forEach((a) => {
            const name = a.querySelector('.icon')?.className.match(/icon-(\S+)/)?.[1];
            if (name && !a.getAttribute('aria-label')) a.setAttribute('aria-label', name);
          });
        }
      });
      slide.append(content);
    }
    track.append(slide);
  });

  block.textContent = '';
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', 'Featured services');
  block.append(track);

  if (rows.length > 1) {
    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'carousel-nav carousel-prev';
    prev.setAttribute('aria-label', 'Previous slide');
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'carousel-nav carousel-next';
    next.setAttribute('aria-label', 'Next slide');

    const dots = document.createElement('div');
    dots.className = 'carousel-dots';
    dots.setAttribute('role', 'tablist');
    rows.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => { showSlide(block, i); restart(); }); // eslint-disable-line no-use-before-define
      dots.append(dot);
    });
    block.append(prev, next, dots);

    let timer;
    const stop = () => { clearInterval(timer); };
    const start = () => {
      stop();
      if (reduceMotion.matches) return;
      timer = setInterval(() => showSlide(block, Number(block.dataset.active) + 1), AUTOPLAY_MS);
    };
    function restart() { start(); }

    prev.addEventListener('click', () => { showSlide(block, Number(block.dataset.active) - 1); restart(); });
    next.addEventListener('click', () => { showSlide(block, Number(block.dataset.active) + 1); restart(); });
    block.addEventListener('mouseenter', stop);
    block.addEventListener('mouseleave', start);
    block.addEventListener('focusin', stop);
    block.addEventListener('focusout', start);
    block.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') prev.click();
      if (e.key === 'ArrowRight') next.click();
    });

    // swipe support
    let startX = 0;
    block.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    block.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) (dx < 0 ? next : prev).click();
    }, { passive: true });

    start();
  }

  showSlide(block, 0);
}