#!/usr/bin/env node
// tails · the composition gate
//
// The slop detector reads text. The ambition gate watches what moves. This one
// reads the SHAPE of the page at desktop width: how the sections are built,
// what sits above their headlines, whether the hero is one moment or a list,
// whether the navigation fits, whether a button wraps. Every rule here came
// out of pages that passed every other check and still read as generated,
// because the generator repeats the same composition with different words.
//
// The rules are taken from Leonxlnx/taste-skill §4.7, §5 and §14 (MIT, read on
// 2026-09-20) and reduced to what a browser can count. What it cannot count
// (whether two buttons mean the same thing, whether a layout is "banal") stays
// in the judgement half of 10-slop-test.md.
//
//   node checks/structure.mjs <url>
//
// Exit: 0 composed · 1 findings · 2 could not look
//
// Importable: `checks/gate.mjs` folds this into the single verdict, on the
// same loaded page, without a second copy of the logic.

import { chromium } from 'playwright';

// Every threshold in one place, with its source, so a change is a decision.
export const LIMITES = {
  eyebrowsPorSeccion: 3,   // at most one eyebrow per three sections, hero counts (§4.7)
  navAltura: 80,           // px at desktop (§4.7)
  heroTextos: 5,           // text elements in the hero, CTAs count as one. §4.7 says 4; the fifth is a price or proof line,
                           // which claveon.de puts in the hero on purpose (the price goes before the work, measured 2026-09-20)
  heroSubtextoPalabras: 20,// words in the hero paragraph (§4.7)
  zigzagSeguidos: 2,       // consecutive image+text splits allowed (§4.7)
  marquees: 1,             // per page (§5)
  familiasMinimas: (n) => (n >= 8 ? 4 : Math.ceil(n / 2)), // distinct layout families (§4.7)
  familiaRepetida: (n) => Math.max(2, Math.ceil(n / 4)),    // times one family may recur (§4.7, "at most once" softened: the fingerprint is coarse)
};

// Takes an already-loaded Playwright page at desktop width and leaves it as it
// found it. Returns raw counts; the verdict is made outside, in filasEstructura,
// so a reader can see the number and the limit side by side.
export async function medirEstructura(page) {
  return page.evaluate(() => {
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
    };
    const texto = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim();
    const esBoton = (el) => {
      if (!visible(el)) return false;
      if (el.tagName === 'BUTTON') return true;
      if (el.tagName !== 'A') return false;
      const cs = getComputedStyle(el);
      const fondo = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';
      const borde = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none';
      return (fondo || borde) && parseFloat(cs.paddingLeft) >= 8 && cs.display !== 'inline';
    };

    // ── sections: top-level only, a section inside a section is a part ──────
    let secciones = [...document.querySelectorAll('section, article, [data-section]')]
      .filter((s) => !s.parentElement.closest('section, article, [data-section]'))
      .filter(visible);
    const n = secciones.length;

    // ── eyebrows: small, uppercase, tracked, sitting right above a heading ──
    const eyebrows = [];
    for (const el of document.querySelectorAll('body *')) {
      if (/^H[1-6]$/.test(el.tagName) || !visible(el)) continue;
      const t = texto(el);
      if (!t || t.length > 48 || el.children.length > 1) continue;
      const cs = getComputedStyle(el);
      if (cs.textTransform !== 'uppercase' || parseFloat(cs.fontSize) > 14) continue;
      if (cs.letterSpacing === 'normal' || parseFloat(cs.letterSpacing) <= 0) continue;
      const sig = el.nextElementSibling;
      const encima = sig && /^H[1-3]$/.test(sig.tagName);
      const padreEncima = !sig && el.parentElement && el.parentElement.nextElementSibling && /^H[1-3]$/.test(el.parentElement.nextElementSibling.tagName);
      if (encima || padreEncima) eyebrows.push(t.slice(0, 30));
    }

    // ── navigation: one line, and not a wall ────────────────────────────────
    let nav = null;
    // A <header> that holds the whole hero is not a navigation; only a <nav> is judged.
    const navEl = document.querySelector('header nav, nav');
    if (navEl && visible(navEl)) {
      const enlaces = [...navEl.querySelectorAll('a, button')].filter(visible);
      // A row starts where an item's top clears the bottom of everything before it.
      // Bucketing tops alone called claveon.de's one-row nav "two rows" (2026-09-20):
      // vertically centred items of different heights have different tops.
      const cajas = enlaces.map((a) => a.getBoundingClientRect()).sort((a, b) => a.top - b.top);
      let filas = 0, fondo = -Infinity;
      for (const c of cajas) { if (c.top >= fondo - 4) filas++; fondo = Math.max(fondo, c.bottom); }
      nav = { altura: Math.round(navEl.getBoundingClientRect().height), filas, enlaces: enlaces.length };
    }

    // ── buttons that wrap onto a second line ────────────────────────────────
    const botones = [...document.querySelectorAll('a, button')].filter(esBoton);
    // Wrapped = the label's text occupies more than one line box. Measuring the
    // button's height instead flagged a 52px flex button with a 28px line
    // (claveon.de footer, 2026-09-20): min-height and icons add height, not lines.
    // Text nodes only: an inline icon next to the label has its own rect at its
    // own top and would count as a second line (claveon.de nav, 2026-09-20).
    const lineas = (el) => {
      const tops = new Set();
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let t = w.nextNode(); t; t = w.nextNode()) {
        if (!t.textContent.trim()) continue;
        const r = document.createRange(); r.selectNodeContents(t);
        for (const c of r.getClientRects()) if (c.width > 1 && c.height > 1) tops.add(Math.round(c.top / 4));
      }
      return tops.size;
    };
    const envueltos = botones.filter((b) => texto(b).length <= 40 && lineas(b) > 1).map((b) => texto(b).slice(0, 30));

    // ── the hero: one moment, not a feature list ────────────────────────────
    // The hero is the stack the <h1> lives in: its siblings, not everything in
    // the first section. A cinema's programme board sits in the first section
    // by necessity (density axis) and is not a hero, so it is not counted.
    let hero = null;
    const h1 = [...document.querySelectorAll('h1')].find(visible);
    if (h1) {
      const pila = [...h1.parentElement.children].filter(visible)
        .filter((b) => /^(H[1-6]|P|UL|OL|SMALL|DL|SPAN|DIV)$/.test(b.tagName) && texto(b).length > 0);
      const esCtaSolo = (b) => b.querySelector('a, button') && texto(b).length < 60;
      const textos = pila.filter((b) => !esCtaSolo(b) && !(b.tagName === 'DIV' && b.children.length > 3)).length;
      const ctas = pila.some(esCtaSolo) || botones.some((b) => h1.parentElement.contains(b)) ? 1 : 0;
      const parrafo = pila.find((b) => b.tagName === 'P' && !esCtaSolo(b) && b.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_PRECEDING);
      const ctaEnPantalla = botones.some((b) => b.getBoundingClientRect().top < innerHeight);
      hero = { textos: textos + ctas, subtextoPalabras: parrafo ? texto(parrafo).split(' ').length : 0,
               ctaEnPantalla, hayCta: botones.length > 0 };
    }

    // ── layout families and the zigzag ──────────────────────────────────────
    const huella = (s) => {
      const hijos = [...s.children].filter(visible);
      const cont = hijos.length === 1 ? hijos[0] : s;
      const nietos = [...cont.children].filter(visible);
      const cs = getComputedStyle(cont);
      const cols = cs.display.includes('grid') ? cs.gridTemplateColumns.split(' ').filter(Boolean).length
                 : cs.display.includes('flex') && cs.flexDirection.startsWith('row') ? Math.min(nietos.length, 6) : 1;
      const img = s.querySelector('img, picture, video, svg') ? 'i' : 't';
      const iguales = nietos.length >= 3 && new Set(nietos.map((x) => Math.round(x.getBoundingClientRect().width / 10))).size === 1 ? 'eq' : 'var';
      return `${cols}c-${Math.min(nietos.length, 6)}n-${img}-${iguales}`;
    };
    const familias = secciones.map(huella);
    const distintas = new Set(familias).size;
    const repetida = Math.max(0, ...[...new Set(familias)].map((f) => familias.filter((x) => x === f).length));

    const esSplit = (s) => {
      const hijos = [...s.children].filter(visible);
      const cont = hijos.length === 1 ? hijos[0] : s;
      const nietos = [...cont.children].filter(visible);
      if (nietos.length !== 2) return false;
      const [a, b] = nietos.map((x) => x.getBoundingClientRect());
      // side by side = they overlap vertically and sit apart horizontally;
      // `align-items: center` makes their tops differ, so tops are not compared
      const ladoALado = a.bottom > b.top && b.bottom > a.top && Math.abs(a.left - b.left) > 100;
      const unaImagen = nietos.filter((x) => x.querySelector('img, picture, video') || x.matches('img, picture, video')).length === 1;
      return ladoALado && unaImagen;
    };
    let zigzagMax = 0, racha = 0;
    for (const s of secciones) { racha = esSplit(s) ? racha + 1 : 0; zigzagMax = Math.max(zigzagMax, racha); }

    // ── marquees: infinite horizontal transforms, grouped by parent ─────────
    const marquees = new Set();
    for (const a of document.getAnimations()) {
      const ef = a.effect;
      if (!ef || !ef.target) continue;
      const t = ef.getTiming();
      if (t.iterations !== Infinity) continue;
      const kf = ef.getKeyframes ? ef.getKeyframes() : [];
      if (!kf.some((k) => /translateX|translate3d\(-?\d|translate\(-?\d/.test(String(k.transform || k.translate || '')))) continue;
      marquees.add(ef.target.parentElement || ef.target);
    }

    return { secciones: n, eyebrows, nav, envueltos, hero, familias, distintas, repetida, zigzagMax, marquees: marquees.size };
  });
}

// Each row: [what, ok, requirement, skip]. skip = the page has nothing to judge here.
export function filasEstructura(m) {
  const L = LIMITES;
  const topeEyebrows = Math.ceil(m.secciones / L.eyebrowsPorSeccion);
  const filas = [];
  filas.push([`eyebrows ${m.eyebrows.length} over ${m.secciones} section(s)`, m.eyebrows.length <= topeEyebrows, `at most ${topeEyebrows}`, m.secciones < 3]);
  filas.push([`nav ${m.nav ? m.nav.altura + 'px, ' + m.nav.filas + ' row(s)' : 'none'}`, !m.nav || (m.nav.altura <= L.navAltura && m.nav.filas <= 1), `one row, ≤ ${L.navAltura}px`, !m.nav || m.nav.enlaces < 2]);
  filas.push([`buttons wrapping ${m.envueltos.length}${m.envueltos.length ? ' (' + m.envueltos.join(', ') + ')' : ''}`, m.envueltos.length === 0, 'one line each at desktop', false]);
  filas.push([`hero text elements ${m.hero ? m.hero.textos : 0}`, !m.hero || m.hero.textos <= L.heroTextos, `at most ${L.heroTextos}`, !m.hero]);
  filas.push([`hero subtext ${m.hero ? m.hero.subtextoPalabras : 0} words`, !m.hero || m.hero.subtextoPalabras <= L.heroSubtextoPalabras, `at most ${L.heroSubtextoPalabras}`, !m.hero]);
  filas.push([`CTA in the first viewport ${m.hero && m.hero.hayCta ? (m.hero.ctaEnPantalla ? 'yes' : 'no') : 'n/a'}`, !m.hero || !m.hero.hayCta || m.hero.ctaEnPantalla, 'visible without scrolling', !m.hero || !m.hero.hayCta]);
  filas.push([`layout families ${m.distintas} across ${m.secciones} section(s)`, m.distintas >= L.familiasMinimas(m.secciones), `at least ${L.familiasMinimas(m.secciones)}`, m.secciones < 4]);
  filas.push([`most repeated family ×${m.repetida}`, m.repetida <= L.familiaRepetida(m.secciones), `at most ×${L.familiaRepetida(m.secciones)}`, m.secciones < 4]);
  filas.push([`consecutive image+text splits ${m.zigzagMax}`, m.zigzagMax <= L.zigzagSeguidos, `at most ${L.zigzagSeguidos}`, false]);
  filas.push([`marquees ${m.marquees}`, m.marquees <= L.marquees, `at most ${L.marquees}`, false]);
  return filas;
}

// ── cli ────────────────────────────────────────────────────────────────────
const esCli = process.argv[1] && process.argv[1].endsWith('structure.mjs');
if (esCli) {
  const url = process.argv.slice(2).find((a) => a.startsWith('http'));
  if (!url) { console.error('usage: node checks/structure.mjs <url>'); process.exit(2); }
  const browser = await chromium.launch();
  let code = 0;
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const r = await page.goto(url, { waitUntil: 'networkidle' }).catch(() => null);
    if (!r || r.status() >= 400) { console.error(`structure: ${url} answered ${r ? r.status() : 'nothing'}`); process.exit(2); }
    await page.waitForTimeout(1500);
    const m = await medirEstructura(page);
    const filas = filasEstructura(m);
    for (const [w, ok, req, skip] of filas) {
      console.log(`${skip ? '·' : ok ? '✓' : '✗'} ${w}${!ok && !skip ? ` — needs ${req}` : ''}`);
      if (!ok && !skip) code = 1;
    }
    if (m.eyebrows.length) console.log(`  eyebrows seen: ${m.eyebrows.join(' | ')}`);
    console.log(`  families: ${m.familias.join(' ')}`);
  } finally {
    await browser.close();
  }
  process.exit(code);
}
