#!/usr/bin/env node
// tails · the ambition gate
//
// The slop detector catches what should not be there. This one catches what is
// MISSING — and that is the harder failure, because an empty page passes every
// quality check ever written. Correct, accessible, fast, and nobody would pay
// for it.
//
// It drives a real browser, scrolls the page like a person, and refuses to pass
// a build whose brief called for craft when nothing on the page moves, layers,
// or holds attention.
//
//   node checks/ambition.mjs <url> --tier=craft|standard|utility
//
// Exit: 0 met · 1 below tier · 2 could not look
//
// The tier comes from the density axis and the brief, and it is declared BEFORE
// building. Declaring `utility` to make the gate quiet is visible in the diff.
//
// Since 2026-09-07 the measurement is also importable, so `checks/gate.mjs` can
// fold this verdict into the single one without a second browser and without a
// second copy of the logic. The CLI below is unchanged.

import { chromium } from 'playwright';

export const TIERS = {
  // what a page has to demonstrate at each level of ambition
  utility: { moment: false, layers: 0, motion: 0, note: 'forms, documentation, admin' },
  standard:{ moment: false, layers: 1, motion: 2, note: 'most business sites' },
  craft:   { moment: true,  layers: 2, motion: 4, note: 'the client is paying to be proud of it' },
};

// Walk the page the way a person does, sampling what actually changes.
// Takes an already-loaded Playwright page and leaves it scrolled back to the top.
export async function medirAmbicion(page) {
  return page.evaluate(async () => {
    const snap = () => [...document.querySelectorAll('body *')].slice(0, 900).map((el) => {
      const cs = getComputedStyle(el);
      return el.dataset.__i + '|' + cs.transform + '|' + cs.opacity + '|' +
             Math.round(el.getBoundingClientRect().width) + 'x' + Math.round(el.getBoundingClientRect().height);
    });
    [...document.querySelectorAll('body *')].slice(0, 900).forEach((el, i) => { el.dataset.__i = i; });

    const before = snap();
    const moved = new Set();
    const sizes = new Map();
    // A pin is not a CSS property, it is a behaviour: an element whose position
    // on screen HOLDS while the document scrolls under it. Reading `position:
    // fixed` alone missed native sticky stages and would have counted a tall
    // sticky sidebar that never actually holds. So watch what happens instead.
    const held = new Map();       // element index -> consecutive steps held still
    const lastTop = new Map();
    let pinnedSeen = false;

    const H = document.documentElement.scrollHeight;
    for (let y = 0; y < H; y += Math.max(200, innerHeight / 3)) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 130));
      const now = snap();
      now.forEach((s, i) => { if (s !== before[i]) moved.add(i); });
      // anything holding still against the scroll is a pin
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el);
        if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
        const r = el.getBoundingClientRect();
        if (r.height < innerHeight * 0.5) continue;      // chrome and headers are not moments
        const k = el.dataset.__i;
        const prev = lastTop.get(k);
        if (prev !== undefined && Math.abs(r.top - prev) < 8) {
          const n = (held.get(k) || 0) + 1;
          held.set(k, n);
          if (n >= 2) pinnedSeen = true;                 // held across three samples
        } else held.set(k, 0);
        lastTop.set(k, r.top);
      }
      // size changes on scroll = a transforming stage
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width < 200 || r.height < 150) continue;
        const k = el.dataset.__i;
        const prev = sizes.get(k);
        const cur = Math.round(r.width) + 'x' + Math.round(r.height);
        if (prev && prev !== cur) moved.add('size:' + k);
        sizes.set(k, cur);
      }
    }
    window.scrollTo(0, 0);

    // Depth: substantial things moving at different rates during the same
    // scroll step.
    //
    // This used to sample `img, [data-parallax] img, section`, which quietly
    // assumed a page has photographs. A build that carries itself with type
    // and space — a legitimate form, and the honest one when nobody owns the
    // rights to any picture — scored zero layers however much depth it had.
    // The question is whether things move at different rates, and that has
    // nothing to do with the tag.
    // And probe it at several places down the page, not only across the first
    // 600 px. A build whose moment sits below the task — which is what a dense
    // page looks like — had every layer it owned measured as flat, because the
    // probe was over before the pin engaged.
    let profundidad = 1;
    const alto = document.documentElement.scrollHeight;
    for (const inicio of [0, alto * 0.25, alto * 0.5, alto * 0.7]) {
      window.scrollTo(0, inicio);
      await new Promise((r) => setTimeout(r, 220));
      const bloques = [...document.querySelectorAll('body *')].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.height >= 80 && r.width >= innerWidth * 0.25 && r.bottom > -200 && r.top < innerHeight + 200;
      }).slice(0, 80);
      if (!bloques.length) continue;
      const a0 = bloques.map((el) => el.getBoundingClientRect().top);
      window.scrollTo(0, inicio + 450);
      await new Promise((r) => setTimeout(r, 260));
      const a1 = bloques.map((el) => el.getBoundingClientRect().top);
      const aqui = new Set();
      a0.forEach((t, i) => { if (a1[i] !== undefined) aqui.add(Math.round((t - a1[i]) / 25)); });
      if (aqui.size > profundidad) profundidad = aqui.size;
    }
    const rates = { size: profundidad };
    window.scrollTo(0, 0);

    return {
      changed: [...moved].length,
      pinned: pinnedSeen,
      depth: rates.size,                       // >1 distinct rate = layers, not a slab
      animatedCss: [...document.styleSheets].reduce((n, ss) => {
        try { return n + [...ss.cssRules].filter((r) => r.type === 7 || /animation|transition/.test(r.cssText || '')).length; }
        catch { return n; }
      }, 0),
      reducedHandled: [...document.styleSheets].some((ss) => {
        try { return [...ss.cssRules].some((r) => /prefers-reduced-motion/.test(r.conditionText || '')); }
        catch { return false; }
      }),
    };
  });
}

// Turn the measurement into rows. Shared with gate.mjs so both print the same
// verdict from the same numbers.
export function filasAmbicion(found, tier) {
  const want = TIERS[tier];
  const has = {
    moment: found.pinned,
    layers: Math.max(0, found.depth - 1),
    motion: found.changed,
  };
  return [
    ['a moment — something pins and transforms while you scroll', has.moment, want.moment ? 'required' : 'optional', !want.moment],
    [`layers — elements moving at different rates (${has.layers} distinct)`, has.layers >= want.layers, `>= ${want.layers}`, false],
    [`motion — elements that change during a scroll (${has.motion})`, has.motion >= want.motion, `>= ${want.motion}`, false],
    ['reduced-motion handled', found.reducedHandled, 'always', false],
  ];
}

// ── cli ────────────────────────────────────────────────────────────────────
const esCli = process.argv[1] && process.argv[1].endsWith('ambition.mjs');
if (esCli) {
  const args = process.argv.slice(2);
  const url = args.find((a) => a.startsWith('http'));
  const tier = (args.find((a) => a.startsWith('--tier=')) || '--tier=standard').split('=')[1];

  if (!url || !TIERS[tier]) {
    console.error('usage: node checks/ambition.mjs <url> --tier=craft|standard|utility');
    process.exit(2);
  }

  const want = TIERS[tier];
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

  let fatal = null;
  page.on('pageerror', (e) => { fatal = String(e).slice(0, 120); });

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  } catch (e) {
    console.error(`ambition: could not load ${url} — ${String(e).slice(0, 80)}`);
    process.exit(2);                       // never 0: not looking is not passing
  }
  await page.waitForTimeout(1800);

  const found = await medirAmbicion(page);
  await browser.close();

  console.log(`tier: ${tier} — ${want.note}\n`);
  let failed = 0;
  for (const [what, ok, req, skip] of filasAmbicion(found, tier)) {
    if (!ok && !skip) failed++;
    console.log(`  ${skip ? '·' : ok ? '✓' : '✗'} ${what.padEnd(58)} ${req}`);
  }
  if (fatal) { console.log(`\n  ✗ JavaScript error on the page: ${fatal}`); failed++; }

  if (failed) {
    console.log(`\n${failed} unmet. This page is correct and forgettable.`);
    console.log('A business owner does not pay to have their coherence fixed. Read');
    console.log('references/06-motion.md — every movement must pace, reveal, or give weight —');
    console.log('and 03-form.md for the axes that produce a shape worth animating.');
    process.exit(1);
  }
  console.log('\nambition met at this tier.');
  process.exit(0);
}
