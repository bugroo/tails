// Haus Schnackertz · the motion layer
//
// Every movement here has to answer one of three things — does it PACE, does it
// REVEAL, does it give WEIGHT. Anything that only decorates is deleted.
//
// One clock: Lenis is driven from gsap.ticker, never its own RAF loop.
// One shared state: the hero scrub writes a single value that both the image
// and the type read, so they can never disagree with each other.

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse  = matchMedia('(hover: none)').matches;

/* ── one clock ─────────────────────────────────────────────────────────── */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ autoRaf: false, duration: 1.05 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ── the moment: the plate becomes the page ────────────────────────────────
   The photograph fills the screen. As you scroll, the section pins, the plate
   shrinks and settles into its place beside the name, and the type arrives.
   It PACES — it holds you at the dish long enough to want it — and it gives
   the plate WEIGHT by making the whole page defer to it before anything else
   is allowed to happen. */
function heroMoment() {
  if (reduced) return;
  const stage = document.querySelector('.stage');
  const frame = document.querySelector('.stage-frame');
  const type  = document.querySelector('.hero-type');
  if (!stage || !frame) return;

  const split = new SplitText('.hero-type h1', { type: 'lines,words', linesClass: 'ln' });
  gsap.set(split.words, { yPercent: 115, opacity: 0 });
  gsap.set(['.hero-sub', '.hero-price'], { opacity: 0, y: 14 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: stage,
      start: 'top top',
      end: '+=120%',
      scrub: 0.6,
      pin: true,
      anticipatePin: 1,
    },
  });

  // The frame shrinks from the full viewport to the shape it will keep.
  // scale + transform only — never width/height, which would relayout every frame.
  tl.fromTo(frame,
      { '--k': 1 },
      { '--k': 0, ease: 'none', duration: 1 }, 0)
    .to(split.words, { yPercent: 0, opacity: 1, stagger: 0.035, ease: 'power3.out', duration: 0.45 }, 0.42)
    .to(['.hero-sub', '.hero-price'], { opacity: 1, y: 0, stagger: 0.08, duration: 0.3 }, 0.62);

  // the type block only exists once the plate has made room for it
  gsap.set(type, { autoAlpha: 1 });
}

/* ── depth: layers that do not move at the same speed ──────────────────────
   From the Codrops writeup: move the media from -50% to 50% across the
   section's own scroll range. The lag between the frame and its contents is
   what reads as depth. It REVEALS — the picture uncovers itself as you pass. */
function parallax() {
  if (reduced) return;
  document.querySelectorAll('[data-parallax]').forEach((wrap) => {
    const media = wrap.querySelector('img');
    if (!media) return;
    gsap.fromTo(media,
      { yPercent: -12 },
      { yPercent: 12, ease: 'none',
        scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

/* ── the menu, read sideways ───────────────────────────────────────────────
   Scroll drives a horizontal run through the dishes. It PACES a list that
   would otherwise be a grid you skim past, and it makes the scroll do work
   instead of just moving. Vertical on touch, where sideways scroll fights the
   browser's own gestures. */
function menuRun() {
  const rail = document.querySelector('.rail');
  const track = document.querySelector('.rail-track');
  if (!rail || !track || reduced || coarse) return;
  const distance = () => track.scrollWidth - rail.clientWidth;
  gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: rail,
      start: 'top top',
      end: () => '+=' + distance(),
      scrub: 0.5,
      pin: true,
      invalidateOnRefresh: true,
      onToggle: (self) => track.classList.toggle('is-running', self.isActive),
    },
  });
}

/* ── arrivals ──────────────────────────────────────────────────────────────
   Short, once, and never on anything the reader needs immediately. */
function arrivals() {
  if (reduced) return;
  gsap.utils.toArray('[data-rise]').forEach((el) => {
    gsap.from(el, {
      y: 22, autoAlpha: 0, duration: 0.6, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onStart() { el.style.willChange = 'transform, opacity'; },
      onComplete() { el.style.willChange = 'auto'; },   // the cleanup nobody does
    });
  });
}

/* ── reduced motion: everything is simply present ─────────────────────────── */
function staticFallback() {
  gsap.set(['.hero-type', '.hero-sub', '.hero-price'], { autoAlpha: 1, y: 0, opacity: 1 });
  document.querySelectorAll('[data-rise]').forEach((el) => { el.style.opacity = 1; });
  document.documentElement.classList.add('is-static');
}

if (reduced) {
  staticFallback();
} else {
  heroMoment();
  parallax();
  menuRun();
  arrivals();
}

// The address bar on iOS fires resize as it collapses, and refreshing mid-flick
// interrupts momentum. Only refresh when the WIDTH actually changed.
let lastW = innerWidth;
addEventListener('resize', () => {
  if (innerWidth !== lastW) { lastW = innerWidth; ScrollTrigger.refresh(); }
}, { passive: true });
