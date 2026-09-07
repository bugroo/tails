// tails lab — the bench.
//
// This file is written to be BROKEN. Flags at the top switch each known
// collision on and off so the same page can be measured in both states.
// Anything that only shows up in one state is a real finding; anything that
// shows up in both was never about that collision.
//
// Run:  ?twoClocks=1   two RAF loops instead of one ticker
//       ?noLenis=1     no smooth scroll at all (control)
//       ?leakWillChange=1  never clean up will-change
//       ?reduced=1     force the reduced-motion path

import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

const q = new URLSearchParams(location.search);
const FLAG = {
  twoClocks:      q.has('twoClocks'),
  noLenis:        q.has('noLenis'),
  leakWillChange: q.has('leakWillChange'),
  reduced:        q.has('reduced'),
};

const prefersReduced =
  FLAG.reduced || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── the HUD ────────────────────────────────────────────────────────────────
// Frame timing, not a frame counter. A counter that says "60" while three
// frames are 90ms long is the kind of green that hides the problem.
const hud = document.getElementById('hud');
const frames = [];
let worst = 0;
function tickHud() {
  // performance.now() SIEMPRE, nunca el tiempo que pasa el ticker.
  // gsap.ticker entrega SEGUNDOS y requestAnimationFrame entrega MILISEGUNDOS:
  // medir con el argumento del callback compara unidades distintas segun la
  // rama, y produjo una comparativa falsa de 123ms contra 0,2ms el 07-09-2026.
  const t = performance.now();
  frames.push(t);
  while (frames.length > 2 && t - frames[0] > 1000) frames.shift();
  if (frames.length > 1) {
    let longest = 0;
    for (let i = 1; i < frames.length; i++) longest = Math.max(longest, frames[i] - frames[i - 1]);
    worst = Math.max(worst, longest);
    hud.textContent =
      `fps ${frames.length - 1}  worst frame ${longest.toFixed(1)}ms  worst ever ${worst.toFixed(1)}ms\n` +
      `flags ${Object.entries(FLAG).filter(([, v]) => v).map(([k]) => k).join(' ') || 'none'}` +
      `  reduced-motion ${prefersReduced}`;
  }
}

// ── one state, shared ──────────────────────────────────────────────────────
// The pattern from the teardown: scroll, pointer and idle all write to the
// same numbers, so transitions between them are continuous instead of stepped.
const state = { scroll: 0, pointerX: 0, pointerY: 0, spread: 0 };

// ── smooth scroll ──────────────────────────────────────────────────────────
let lenis = null;
if (!FLAG.noLenis) {
  lenis = new Lenis({ autoRaf: FLAG.twoClocks });   // autoRaf = its own clock
  if (!FLAG.twoClocks) {
    // ONE clock: the animation library's ticker drives the scroll library.
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
}

// ── the WebGL layer ────────────────────────────────────────────────────────
const canvas = document.querySelector('.hero-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));   // never render 3x on a phone
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
camera.position.z = 6;

const group = new THREE.Group();
scene.add(group);
const PANELS = 7;
for (let i = 0; i < PANELS; i++) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 0.42),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(0.62, 0.5 - i * 0.05, 0.62 - i * 0.03),
      transparent: true, opacity: 0.9,
    })
  );
  m.position.y = (i - (PANELS - 1) / 2) * 0.5;
  m.userData.base = m.position.y;
  group.add(m);
}

function size() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== w || canvas.height !== h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}

addEventListener('pointermove', (e) => {
  state.pointerX = (e.clientX / innerWidth) * 2 - 1;
  state.pointerY = (e.clientY / innerHeight) * 2 - 1;
}, { passive: true });

// ── the render loop ────────────────────────────────────────────────────────
function render() {
  size();
  // spread is written by hover AND by scroll. One value, two authors.
  const target = Math.abs(state.pointerX) * 0.5 + state.scroll * 1.4;
  state.spread += (target - state.spread) * 0.08;

  group.rotation.y = state.pointerX * 0.25;
  group.rotation.x = state.pointerY * 0.12;
  group.children.forEach((m, i) => {
    const d = i - (PANELS - 1) / 2;
    m.position.y = m.userData.base + d * state.spread * 0.55;
  });
  renderer.render(scene, camera);
  tickHud();
}

if (FLAG.twoClocks) {
  // SECOND clock, on purpose: three.js on its own RAF while Lenis runs another.
  const loop = () => { render(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
} else {
  gsap.ticker.add(render);
}

// ── the DOM layer ──────────────────────────────────────────────────────────
const h1 = document.querySelector('.hero-h1');
const split = new SplitText(h1, { type: 'chars', charsClass: 'ch' });

if (prefersReduced) {
  gsap.set(split.chars, { opacity: 1, y: 0, filter: 'none' });
  gsap.set(split.chars, { willChange: 'auto' });
} else {
  gsap.fromTo(split.chars,
    { opacity: 0, yPercent: 40, filter: 'blur(10px)' },
    {
      opacity: 1, yPercent: 0, filter: 'blur(0px)',
      duration: 0.75, ease: 'power3.out', stagger: 0.03,
      onComplete() {
        // The cleanup that everyone forgets. Skipping it is a measurable cost,
        // which is what ?leakWillChange=1 is here to show.
        if (!FLAG.leakWillChange) gsap.set(split.chars, { willChange: 'auto' });
      },
    });
}

// scroll writes into the same shared value the pointer writes into
ScrollTrigger.create({
  trigger: '.hero',
  start: 'top top',
  end: 'bottom top',
  onUpdate: (self) => { state.scroll = self.progress; },
});

// PROBE 3 · scrubbed
gsap.to('.scrub-target', {
  xPercent: 22, opacity: 0.35,
  scrollTrigger: { trigger: '.scrub-target', start: 'top 80%', end: 'bottom 30%', scrub: true },
});

// ── what the harness reads ────────────────────────────────────────────────
window.__lab = {
  flags: FLAG,
  worstFrame: () => worst,
  state,
  chars: () => split.chars.length,
  willChangeLeft: () =>
    Array.from(document.querySelectorAll('.ch'))
      .filter((el) => getComputedStyle(el).willChange !== 'auto').length,
};
