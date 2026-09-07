#!/usr/bin/env node
// tails · the single quality gate  →  APPROVED / NOT APPROVED
//
// Everything this skill can measure, folded into one verdict. Not a report:
// a decision. If it says NOT APPROVED, the work is not finished, whatever it
// looks like on screen.
//
//   node checks/gate.mjs <url> --dir=<source> --tier=craft \
//        --budget=500 --js-budget=100 [--prev=A6-B4-C3-D2-E2] [--copy-checked]
//
//   node checks/gate.mjs --selftest        both controls, positive and negative
//
// Exit: 0 APPROVED · 1 NOT APPROVED · 2 COULD NOT LOOK
//
// ── why exit 2 exists, and why it is not a softer 1 ────────────────────────
// A clean result and an instrument that stopped looking produce the same
// output. Nine measurement failures in one session all produced plausible
// numbers; every one was caught by the number being IMPOSSIBLE, never by
// reading the code. So this gate refuses to grade what it could not see, and
// it exercises its own instruments against known answers on every run:
//
//   · the contrast checker measures black-on-white and white-on-white probes
//     injected into the page under test, through the entire pipeline —
//     screenshot, PNG decode, coordinate mapping, sampling. 21:1 and 1:1 or
//     the run is void.
//   · a magenta marker is planted at a known pixel. If the sampler cannot
//     find it, it is not reading the page it thinks it is reading.
//   · reduced motion is measured in BOTH directions. A check that only fires
//     on the bad case may be firing on everything.
//
// ── what it will never decide ─────────────────────────────────────────────
// Whether the copy is true. That is judgement, so it is an attestation you
// make explicitly with --copy-checked, and without it the verdict is NOT
// APPROVED. A gate that quietly skips the thing it cannot measure is how an
// invented review ships.

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { analizar, ficheros } from './slop.mjs';
import { medirAmbicion, filasAmbicion, TIERS } from './ambition.mjs';
import { decodePNG, ratio } from './lib/png.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));

// Raised when an instrument could not look. Never downgraded to a finding.
class Ciego extends Error {}

const UMBRAL_NORMAL = 4.5;   // WCAG 2.2 AA, body text
const UMBRAL_GRANDE = 3.0;   // >= 24px, or >= 18.66px bold

// Open a URL and refuse anything that is not the page that was asked for.
// A 404 body renders, scrolls, and measures like any other document: on
// 2026-09-07 one was measured as a studio's homepage and returned a complete,
// well-formed, entirely wrong result. A measurement of the wrong URL looks
// exactly like a measurement.
let ESPERADO = '';           // a string that only the intended page contains

async function abrir(page, url, quien) {
  let res;
  try { res = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }); }
  catch (e) { throw new Ciego(`${quien}: could not load ${url} — ${String(e).slice(0, 70)}`); }
  if (!res) throw new Ciego(`${quien}: no response from ${url}`);
  if (res.status() >= 400) throw new Ciego(`${quien}: ${url} answered ${res.status()}. That is not the page, and a page that is not there is not a pass.`);

  // Status 200 only proves that SOMETHING is there. On 2026-09-07 this gate
  // graded a whole different sample for a full run because a local server was
  // started in the wrong directory and answered 200 to everything. Every
  // number was real, and about the wrong page.
  if (ESPERADO) {
    const hay = await page.evaluate((m) => document.documentElement.outerHTML.includes(m), ESPERADO);
    if (!hay) {
      throw new Ciego(`${quien}: "${ESPERADO}" does not appear on ${url}. Something answered, but it is not ` +
        'the page you meant to measure, and a measurement of the wrong page looks exactly like a measurement.');
    }
  }
  return res;
}

// ── 1 · static slop ────────────────────────────────────────────────────────
function puertaSlop(dir) {
  const fs = ficheros(dir);
  if (fs === null) throw new Ciego(`slop: ${dir} does not exist`);
  if (!fs.length) throw new Ciego(`slop: zero files examined under ${dir}. That is not a pass.`);
  const det = [];
  let n = 0;
  for (const f of fs) {
    for (const h of analizar(readFileSync(f, 'utf8'), extname(f) === '.html' ? 'html' : 'css')) {
      n += h.n;
      det.push(`${f.replace(dir, '.')} — ${h.id} x${h.n}: ${h.why}`);
    }
  }
  return { estado: n ? 'fail' : 'pass', detalle: det.slice(0, 8), resumen: `${fs.length} file(s), ${n} finding(s)` };
}

// ── 2 · the form stamp, and that it differs from the last one ──────────────
function puertaForma(dir, prev) {
  const fs = ficheros(dir);
  if (fs === null) throw new Ciego(`form: ${dir} does not exist`);
  const hojas = fs.filter((f) => ['.css', '.scss'].includes(extname(f)));
  if (!hojas.length) throw new Ciego('form: no stylesheet to read a stamp from');

  const RE = /tails\s*·\s*form:\s*(A\d)-(B\d)-(C\d)-(D\d)-(E\d)\s*·\s*density:\s*([a-z]+)\s*·\s*([\d-]+)/i;
  const hallados = [];
  for (const f of hojas) {
    const m = RE.exec(readFileSync(f, 'utf8'));
    if (m) hallados.push({ f, ejes: [m[1], m[2], m[3], m[4], m[5]], densidad: m[6], fecha: m[7] });
  }
  if (!hallados.length) {
    return { estado: 'fail', detalle: ['no `tails · form:` stamp in any stylesheet — without it the next build cannot know which shape to avoid'] };
  }
  hallados.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  const actual = hallados[0];
  const anterior = prev ? prev.trim().split('-') : (hallados[1] ? hallados[1].ejes : null);

  if (!anterior) {
    return { estado: 'note', resumen: `${actual.ejes.join('-')} · density ${actual.densidad}`,
      detalle: ['no previous form on record — nothing to differ from. Pass --prev=<stamp> once this project has a history.'] };
  }
  const distintos = actual.ejes.filter((e, i) => e !== anterior[i]).length;
  if (distintos >= 3) {
    return { estado: 'pass', resumen: `${actual.ejes.join('-')} differs from ${anterior.join('-')} on ${distintos} of 5 axes` };
  }
  return { estado: 'fail', resumen: `${actual.ejes.join('-')} vs ${anterior.join('-')}`,
    detalle: [`differs on ${distintos} axis/axes. Three is the floor: one-axis drift is the same page with a different picture.`] };
}

// ── 3 · transfer weight against the budget that was declared out loud ──────
async function puertaPeso(page, budgetKB, jsBudgetKB) {
  const p = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const res = performance.getEntriesByType('resource');
    let total = nav ? nav.transferSize : 0, js = 0;
    const opacos = [];
    for (const r of res) {
      const t = r.transferSize || 0;
      if (t === 0 && r.decodedBodySize === 0 && !/^data:/.test(r.name)) opacos.push(r.name.slice(0, 70));
      total += t;
      if (r.initiatorType === 'script' || /\.m?js(\?|$)/.test(r.name)) js += t;
    }
    return { total, js, opacos, n: res.length };
  });

  if (p.opacos.length) {
    // A cross-origin response with no Timing-Allow-Origin reports zero bytes.
    // Counting it as zero is exactly the failure this gate exists to prevent.
    throw new Ciego(`weight: ${p.opacos.length} response(s) report no size (cross-origin, no Timing-Allow-Origin). ` +
      `The real weight cannot be known from here. First: ${p.opacos[0]}`);
  }
  if (!Number.isFinite(budgetKB)) {
    return { estado: 'fail', resumen: `${Math.round(p.total / 1024)} KB total, ${Math.round(p.js / 1024)} KB JS`,
      detalle: ['no budget declared. references/06-motion.md: declare the number before building, not after measuring.'] };
  }
  const kb = p.total / 1024, jskb = p.js / 1024;
  const mal = [];
  if (kb > budgetKB) mal.push(`${kb.toFixed(0)} KB over a ${budgetKB} KB budget`);
  if (Number.isFinite(jsBudgetKB) && jskb > jsBudgetKB) mal.push(`${jskb.toFixed(0)} KB of JS over a ${jsBudgetKB} KB budget`);
  return { estado: mal.length ? 'fail' : 'pass',
    resumen: `${kb.toFixed(0)} KB total / ${jskb.toFixed(0)} KB JS across ${p.n} request(s)`, detalle: mal };
}

// ── 4 · contrast, measured on the composited pixels ────────────────────────
// getComputedStyle gives you the CONTAINER's background. Text on a photograph
// has no CSS background behind it, so a normal check reads the section colour
// and returns a clean pass for the most visible element on the page. That
// happened; the real figure under the headline was 1,09:1.
async function puertaContraste(browser, url) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await abrir(page, url, 'contrast');
  await page.waitForTimeout(1200);

  // Instrument controls, planted in the page under test and read through the
  // same screenshot / decode / map / mask / sample path as everything else.
  // Black on white must come back 21:1, and a light grey that a person cannot
  // read must come back at 1,65:1 and be reported as a failure. A checker that
  // has only ever been seen passing is not a checker.
  await page.evaluate(() => {
    const mk = (id, css, txt) => {
      const d = document.createElement('div');
      d.id = id; d.setAttribute('style', css); d.textContent = txt;
      document.body.appendChild(d);
    };
    mk('__tails_mark', 'position:fixed;left:0;top:0;width:14px;height:14px;background:rgb(255,0,255);z-index:2147483647', '');
    mk('__tails_probe_ok', 'position:fixed;left:0;bottom:0;width:150px;height:30px;background:#ffffff;color:#000000;font:16px/30px monospace;z-index:2147483647', 'control');
    mk('__tails_probe_bad', 'position:fixed;left:160px;bottom:0;width:150px;height:30px;background:#ffffff;color:#c9c9c9;font:16px/30px monospace;z-index:2147483647', 'control');

    // the sheet that strips the glyphs, off until it is wanted
    const st = document.createElement('style');
    st.id = '__tails_hide';
    st.textContent = '*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;' +
                     'text-shadow:none!important;text-decoration-color:transparent!important;caret-color:transparent!important}';
    document.head.appendChild(st);
    st.sheet.disabled = true;

    // Hold TIME-BASED animation still, or the two screenshots of a band are of
    // two different pages and every pixel differs.
    //
    // But never pause a scroll-driven one. Pausing those freezes them at their
    // current progress and they stop tracking the scroll, so anything revealed
    // by `animation-timeline: view()` stays at opacity 0 for the whole run and
    // is silently reported as unmeasurable. That happened, on two headings, on
    // a page whose reveals this skill itself recommends.
    for (const a of document.getAnimations()) {
      try {
        const t = a.timeline;
        const esTiempo = !t || (typeof DocumentTimeline !== 'undefined' && t instanceof DocumentTimeline);
        if (esTiempo) a.pause();
      } catch (e) { void e; }
    }
  });

  // Tag the text elements once and read their CURRENT viewport rect at every
  // scroll position. Precomputing document coordinates was wrong: a sticky
  // element changes its document offset the moment it sticks, so the sampler
  // would read whatever happened to be at its unstuck position and return a
  // perfectly plausible number about the wrong pixels.
  const items = await page.evaluate(() => {
    // resolve any colour the browser accepts — oklch, lab, color-mix, named.
    // A regular expression that assumes rgb() parses oklch(22% .018 55) as the
    // numbers 22, 0.018 and 55 and reports 1,05:1 for every element.
    const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const toRGB = (css) => {
      cv.fillStyle = '#000'; cv.fillStyle = css; cv.fillRect(0, 0, 1, 1);
      const d = cv.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]];
    };
    const out = [];
    let k = 0;
    for (const el of document.querySelectorAll('body *')) {
      const propio = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
      if (!propio) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.15) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 6 || r.height < 6) continue;
      el.dataset.__c = String(k);
      out.push({
        k, id: el.id || '', tag: el.tagName.toLowerCase(),
        texto: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 38),
        color: toRGB(cs.color),
        size: parseFloat(cs.fontSize) || 16,
        weight: parseInt(cs.fontWeight, 10) || 400,
      });
      k++;
      if (out.length > 320) break;
    }
    return out;
  });

  const ocultar = (v) => page.evaluate((x) => { document.getElementById('__tails_hide').sheet.disabled = !x; }, v);
  const disparar = async () => {
    try { return decodePNG(await page.screenshot()); }
    catch (e) { throw new Ciego(`contrast: could not read the screenshot — ${e.message}`); }
  };

  const vh = 800;
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  const medidos = [];

  for (let top = 0; top < Math.max(alto, 1); top += vh) {
    await page.evaluate((y) => window.scrollTo(0, y), top);
    await page.waitForTimeout(240);

    // where is each one RIGHT NOW, on this screen
    const rects = await page.evaluate(() => {
      const o = {};
      for (const el of document.querySelectorAll('[data-__c]')) {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight || r.width < 6 || r.height < 6) continue;
        o[el.dataset.__c] = { x: r.left, y: r.top, w: r.width, h: r.height };
      }
      return o;
    });

    await ocultar(false);
    const A = await disparar();                 // the page as a person sees it

    const marca = A.at(4, 4);
    if (!marca || marca[0] < 250 || marca[1] > 5 || marca[2] < 250) {
      throw new Ciego(`contrast: the marker pixel read ${marca ? marca.join(',') : 'nothing'} instead of 255,0,255. ` +
        'The sampler is not reading the pixels it thinks it is; every number from this run is void.');
    }

    await ocultar(true);
    await page.waitForTimeout(140);
    const B = await disparar();                 // the same page with no glyphs

    if (A.width !== B.width || A.height !== B.height) {
      throw new Ciego('contrast: the two passes are not the same size; they cannot be compared pixel for pixel');
    }

    for (const it of items) {
      const r = rects[it.k];
      if (!r) continue;
      const p = bajoLosGlifos(A, B, r, it.color);
      if (!p) continue;
      const ya = medidos.find((m) => m.it.k === it.k);
      if (!ya) medidos.push({ it, ...p });
      else if (p.peor < ya.peor) { ya.peor = p.peor; ya.px = p.px; ya.n = p.n; }
    }
  }
  await ctx.close();

  // ── the instrument answers two known questions before it is believed ─────
  const ok = medidos.find((m) => m.it.id === '__tails_probe_ok');
  const bad = medidos.find((m) => m.it.id === '__tails_probe_bad');
  if (!ok || !bad) throw new Ciego('contrast: the checker could not measure its own controls');
  if (Math.abs(ok.peor - 21) > 0.5) {
    throw new Ciego(`contrast: the black-on-white control read ${ok.peor.toFixed(2)}:1 and must read 21:1. Every number from this run is worthless.`);
  }
  if (Math.abs(bad.peor - 1.65) > 0.12) {
    throw new Ciego(`contrast: the unreadable-grey control read ${bad.peor.toFixed(2)}:1 and must read 1,65:1. The checker is not sampling what it believes it is.`);
  }
  if (bad.peor >= UMBRAL_NORMAL) {
    throw new Ciego('contrast: the checker did not treat its own unreadable control as a failure');
  }

  const fallos = [];
  let peorGlobal = Infinity, peorQuien = '';
  for (const m of medidos) {
    if (m.it.id.startsWith('__tails_')) continue;
    const grande = m.it.size >= 24 || (m.it.size >= 18.66 && m.it.weight >= 700);
    const umbral = grande ? UMBRAL_GRANDE : UMBRAL_NORMAL;
    if (m.peor < peorGlobal) { peorGlobal = m.peor; peorQuien = `${m.it.tag} "${m.it.texto}"`; }
    if (m.peor < umbral) {
      fallos.push(`${m.it.tag} "${m.it.texto}" — ${m.peor.toFixed(2)}:1 against ${umbral}:1 ` +
        `(${Math.round(m.it.size)}px, worst pixel under the glyphs rgb(${m.px.join(',')}))`);
    }
  }
  const n = medidos.filter((m) => !m.it.id.startsWith('__tails_')).length;
  if (!n) throw new Ciego('contrast: no text was measured. A page with no readable text is not a pass.');

  // Anything the mask could not see is named, never dropped quietly. An
  // unmeasured element that nobody mentions is indistinguishable from a
  // measured one that passed.
  const sinMedir = items.filter((it) => !it.id.startsWith('__tails_') && !medidos.some((m) => m.it.k === it.k));
  const grandesSinMedir = sinMedir.filter((it) => it.size >= 24);
  if (grandesSinMedir.length) {
    fallos.push(`${grandesSinMedir.length} display element(s) could not be measured at all — ` +
      grandesSinMedir.slice(0, 2).map((g) => `${g.tag} "${g.texto}" (${Math.round(g.size)}px)`).join('; ') +
      '. Clipped, covered, or drawn by something the screenshot does not show. Unmeasured is not passed.');
  }

  return { estado: fallos.length ? 'fail' : 'pass',
    resumen: `${n} measured, ${sinMedir.length} not visible to the mask, worst ` +
      `${Number.isFinite(peorGlobal) ? peorGlobal.toFixed(2) : '?'}:1 (${peorQuien}) · controls 21,00 and 1,65`,
    detalle: fallos.slice(0, 6) };
}

// The pixels a glyph actually covers, and what is behind them.
//
// Sampling the whole element box was wrong in both directions: it read the
// marker planted by this very checker as if it were page content, and it
// failed a centred line of text because the empty half of its box sat over
// something dark. A glyph is exactly the set of pixels that CHANGE when the
// text is made transparent, so the difference between the two passes is the
// mask, and the second pass is the background under it.
function bajoLosGlifos(A, B, box, color) {
  const x0 = Math.max(0, Math.floor(box.x)), y0 = Math.max(0, Math.floor(box.y));
  const x1 = Math.min(A.width - 1, Math.ceil(box.x + box.w) - 1);
  const y1 = Math.min(A.height - 1, Math.ceil(box.y + box.h) - 1);
  if (x1 <= x0 || y1 <= y0) return null;

  let peor = Infinity, px = null, n = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const a = A.at(x, y), b = B.at(x, y);
      if (!a || !b) continue;
      const d = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
      if (d < 24) continue;                    // not a glyph pixel
      n++;
      const r = ratio(color, b);
      if (r < peor) { peor = r; px = b; }
    }
  }
  // Fewer than a handful of changed pixels is not a measurement of anything:
  // the text may be clipped, covered, or off-screen. Say nothing rather than
  // say something plausible.
  if (n < 12 || !Number.isFinite(peor)) return null;
  return { peor, px, n };
}

// ── 5 · widths 320 to 1280, nothing overflowing ────────────────────────────
async function puertaAnchos(browser, url, anchos) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await abrir(page, url, 'widths');

  const filas = [];
  for (const w of anchos) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(420);
    const r = await page.evaluate(() => {
      const de = document.documentElement;
      const over = [];
      if (de.scrollWidth > de.clientWidth + 1) {
        for (const el of document.querySelectorAll('body *')) {
          const b = el.getBoundingClientRect();
          if (b.width === 0 || b.height === 0) continue;
          if (getComputedStyle(el).position === 'fixed') continue;
          if (b.right > de.clientWidth + 1) {
            const c = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : '';
            over.push(`${el.tagName.toLowerCase()}${c} reaches ${Math.round(b.right)}px`);
          }
        }
      }
      return { sw: de.scrollWidth, cw: de.clientWidth, over: over.slice(0, 3) };
    });
    filas.push({ w, ok: r.sw <= r.cw + 1, ...r });
  }
  await ctx.close();
  const malos = filas.filter((f) => !f.ok);
  return { estado: malos.length ? 'fail' : 'pass',
    resumen: filas.map((f) => `${f.w}${f.ok ? '' : '✗'}`).join(' · '),
    detalle: malos.map((f) => `${f.w}px: content is ${f.sw}px wide. ${f.over.join('; ') || 'no single element identified'}`) };
}

// ── 6 · the keyboard path ──────────────────────────────────────────────────
async function puertaTeclado(browser, url) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await abrir(page, url, 'keyboard');
  await page.waitForTimeout(600);

  const base = await page.evaluate(() => {
    const sel = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[tabindex]:not([tabindex="-1"])';
    const els = [...document.querySelectorAll(sel)].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden';
    });
    els.forEach((e, i) => { e.dataset.__k = String(i); });
    return els.map((e) => {
      const cs = getComputedStyle(e);
      return { i: +e.dataset.__k, estilo: cs.outlineStyle, ancho: cs.outlineWidth, sombra: cs.boxShadow,
        borde: cs.borderColor, fondo: cs.backgroundColor, tag: e.tagName.toLowerCase(),
        etq: (e.textContent || e.getAttribute('aria-label') || e.getAttribute('name') || '').trim().slice(0, 28) };
    });
  });
  if (!base.length) { await ctx.close(); return { estado: 'note', resumen: 'no focusable element on the page', detalle: [] }; }

  const malos = [];
  const vistos = new Set();
  for (let n = 0; n < Math.min(base.length + 2, 32); n++) {
    await page.keyboard.press('Tab');
    const r = await page.evaluate(() => {
      const e = document.activeElement;
      if (!e || e === document.body || e === document.documentElement) return null;
      const cs = getComputedStyle(e), b = e.getBoundingClientRect();
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      const encima = (cx >= 0 && cy >= 0 && cx <= innerWidth && cy <= innerHeight) ? document.elementFromPoint(cx, cy) : null;
      return { i: e.dataset && e.dataset.__k !== undefined ? +e.dataset.__k : -1,
        estilo: cs.outlineStyle, ancho: cs.outlineWidth, sombra: cs.boxShadow,
        borde: cs.borderColor, fondo: cs.backgroundColor,
        tapado: encima ? !(encima === e || e.contains(encima) || encima.contains(e)) : false };
    });
    if (!r || r.i < 0) continue;
    if (vistos.has(r.i)) break;                     // focus wrapped round
    vistos.add(r.i);
    const b = base.find((x) => x.i === r.i);
    if (!b) continue;
    const anillo = r.estilo !== 'none' && parseFloat(r.ancho) >= 1;
    const cambio = r.estilo !== b.estilo || r.ancho !== b.ancho || r.sombra !== b.sombra ||
                   r.borde !== b.borde || r.fondo !== b.fondo;
    if (!anillo && !cambio) malos.push(`${b.tag} "${b.etq}" — nothing visible happens when it takes focus`);
    else if (r.tapado) malos.push(`${b.tag} "${b.etq}" — focused, then covered by another layer (WCAG 2.4.11)`);
  }
  await ctx.close();
  return { estado: malos.length ? 'fail' : 'pass',
    resumen: `${vistos.size} of ${base.length} focusable element(s) walked`, detalle: malos.slice(0, 5) };
}

// ── 7 · reduced motion, in both directions ─────────────────────────────────
// A check that only fires on the bad case may be firing on everything.
async function puertaReducido(browser, url, normal) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await abrir(page, url, 'reduced-motion');
  await page.waitForTimeout(1400);

  const a = await medirAmbicion(page);
  const corriendo = await page.evaluate(() =>
    document.getAnimations()
      .filter((x) => x.playState === 'running')
      .map((x) => {
        let d = 0;
        try { d = x.effect && x.effect.getTiming ? x.effect.getTiming().duration : 0; } catch { d = 0; }
        return { d, n: x.animationName || (x.transitionProperty || 'animation') };
      })
      .filter((x) => x.d !== 0));
  await ctx.close();

  const det = [];
  if (corriendo.length) {
    det.push(`${corriendo.length} animation(s) still running under prefers-reduced-motion: ` +
      corriendo.slice(0, 3).map((c) => c.n).join(', '));
  }
  if (normal.changed === 0 && normal.running === 0) {
    return { estado: det.length ? 'fail' : 'note',
      resumen: 'nothing moves in either direction — there is nothing to reduce',
      detalle: det };
  }
  if (a.changed >= normal.changed && normal.changed > 0) {
    det.push(`${a.changed} element(s) still change on scroll under reduce, against ${normal.changed} normally. ` +
      'The preference is not reaching the page.');
  }
  return { estado: det.length ? 'fail' : 'pass',
    resumen: `${normal.changed} moving normally, ${a.changed} under reduce, ${corriendo.length} animation(s) left running`,
    detalle: det };
}

// ── the run ────────────────────────────────────────────────────────────────
export async function correr(o) {
  ESPERADO = o.expect || '';
  const browser = await chromium.launch();
  const filas = [];
  let ciego = null;

  const add = (id, titulo, r) => filas.push({ id, titulo, ...r });
  const intentar = async (id, titulo, fn) => {
    try { add(id, titulo, await fn()); }
    catch (e) {
      if (e instanceof Ciego) { ciego = ciego || e.message; add(id, titulo, { estado: 'blind', detalle: [e.message] }); }
      else throw e;
    }
  };

  try {
    // static first: it needs no browser and it is the cheapest to fail on
    await intentar('slop', 'no slop in the source', async () => puertaSlop(o.dir));
    await intentar('form', 'form stamped, and different from the last one', async () => puertaForma(o.dir, o.prev));

    // one shared page for weight and ambition; both read the page as loaded
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    let fatal = null;
    page.on('pageerror', (e) => { fatal = String(e).slice(0, 120); });
    await abrir(page, o.url, 'page');
    await page.waitForTimeout(1500);

    await intentar('weight', 'weight within the declared budget', async () => puertaPeso(page, o.budget, o.jsBudget));

    const amb = await medirAmbicion(page);
    const corriendoNormal = await page.evaluate(() => document.getAnimations().filter((x) => x.playState === 'running').length);
    await ctx.close();

    const filasAmb = filasAmbicion(amb, o.tier);
    const malAmb = filasAmb.filter(([, ok, , skip]) => !ok && !skip);
    add('ambition', `ambition at tier ${o.tier}`, {
      estado: malAmb.length ? 'fail' : 'pass',
      resumen: filasAmb.map(([w, ok, , skip]) => `${skip ? '·' : ok ? '✓' : '✗'} ${w.split(' —')[0].split(' (')[0]}`).join(' · '),
      detalle: malAmb.map(([w, , req]) => `${w} — needs ${req}`),
    });

    if (fatal) add('js', 'no JavaScript error on the page', { estado: 'fail', detalle: [fatal] });
    else add('js', 'no JavaScript error on the page', { estado: 'pass' });

    await intentar('contrast', 'contrast on the composited pixels', async () => puertaContraste(browser, o.url));
    await intentar('widths', 'no overflow, 320 to 1280', async () => puertaAnchos(browser, o.url, o.anchos));
    await intentar('keyboard', 'keyboard path and visible focus', async () => puertaTeclado(browser, o.url));
    await intentar('reduced', 'reduced motion, both directions', async () =>
      puertaReducido(browser, o.url, { changed: amb.changed, running: corriendoNormal }));

    // the one it must never decide for you
    add('copy', 'nothing invented in the copy', o.copyChecked
      ? { estado: 'pass', resumen: 'attested with --copy-checked' }
      : { estado: 'fail', detalle: [
          'not attested. This gate cannot read a claim and know whether it is true, so it will not pretend to.',
          'Check every number, review, award, opening time and local detail against a source you can point at,',
          'then re-run with --copy-checked. Missing information is named as missing, never filled in.'] });
  } catch (e) {
    // the page itself could not be opened: everything downstream is unknowable
    if (e instanceof Ciego) {
      ciego = ciego || e.message;
      filas.push({ id: 'page', titulo: 'the page is there and answers', estado: 'blind', detalle: [e.message] });
    } else throw e;
  } finally {
    await browser.close();
  }

  return { filas, ciego };
}

// ── the receipt ────────────────────────────────────────────────────────────
// A verdict that lives only in a chat message can be claimed by anyone. This
// writes one to disk, fingerprinted against the exact bytes that were judged,
// so the Stop hook can tell the difference between "this was approved" and
// "somebody said it was approved". Change one character of the source and the
// fingerprint stops matching, which is the point.

function huella(dir) {
  const partes = [];
  const andar = (d) => {
    for (const e of readdirSync(d)) {
      if (['node_modules', '.git', 'dist', 'build'].includes(e)) continue;
      const f = join(d, e);
      const st = statSync(f);
      if (st.isDirectory()) andar(f);
      else if (/\.(html|css|scss|m?js)$/.test(e)) {
        partes.push(f.replace(dir, '.') + ':' + createHash('sha256').update(readFileSync(f)).digest('hex'));
      }
    }
  };
  try { andar(dir); } catch { return null; }
  if (!partes.length) return null;
  return createHash('sha256').update(partes.sort().join('\n')).digest('hex');
}

function escribirRecibo(o, veredicto, incumplidos) {
  const recibo = {
    verdict: veredicto,                       // APPROVED · NOT_APPROVED · COULD_NOT_LOOK
    at: new Date().toISOString(),
    url: o.url,
    // Never an absolute path. It leaked the machine's user name into a public
    // repository, and worse, a clone on another machine would point the Stop
    // hook at a directory that does not exist there. The receipt always sits at
    // the root of the tree it judged, so the tree is simply "next to this file".
    dir: '.',
    tier: o.tier,
    expect: o.expect || '',
    budgetKB: Number.isFinite(o.budget) ? o.budget : null,
    copyChecked: !!o.copyChecked,
    unmet: incumplidos,
    fingerprint: huella(o.dir),
    note: 'Written by checks/gate.mjs. The fingerprint covers every html, css and js '
        + 'file under dir. Editing any of them invalidates this verdict on purpose.',
  };
  try {
    writeFileSync(join(o.dir, '.tails-verdict.json'), JSON.stringify(recibo, null, 2) + '\n');
  } catch (e) {
    console.error(`  (could not write the verdict receipt: ${e.message})`);
  }
  return recibo;
}

// ── printing the verdict ───────────────────────────────────────────────────
const ICONO = { pass: '✓', fail: '✗', note: '·', blind: '?', };

export function imprimir(filas, ciego, o) {
  console.log(`\ntails · quality gate`);
  console.log(`  ${o.url}`);
  console.log(`  tier ${o.tier} — ${TIERS[o.tier].note}`);
  console.log(o.expect
    ? `  confirmed on the page: "${o.expect}"\n`
    : '  no --expect given: this gate cannot confirm it measured the page you meant\n');

  for (const f of filas) {
    console.log(`  ${ICONO[f.estado] || '?'} ${f.titulo.padEnd(46)} ${f.resumen || ''}`);
    for (const d of (f.detalle || [])) console.log(`      ${d}`);
  }

  const fallos = filas.filter((f) => f.estado === 'fail');
  const ciegos = filas.filter((f) => f.estado === 'blind');

  if (ciegos.length) {
    console.log(`\n  COULD NOT LOOK — ${ciegos.length} instrument(s) did not see the page.`);
    console.log('  This is not a pass and it is not a failure. Fix the instrument and run it again;');
    console.log('  an unread page and a clean page produce the same silence.');
    return 2;
  }
  if (fallos.length) {
    console.log(`\n  NOT APPROVED — ${fallos.length} of ${filas.length} parameter(s) unmet:`);
    for (const f of fallos) console.log(`    · ${f.id}`);
    console.log('\n  The build is not finished. Not "finished with caveats", not "good enough for a first');
    console.log('  pass". Fix what is listed and run it again.');
    return 1;
  }
  console.log(`\n  APPROVED — ${filas.length} parameters, all met.`);
  console.log('\n  What this verdict does NOT cover, and cannot:');
  console.log('    · a real phone. Emulation gives the engine and a slow CPU, not thermal');
  console.log('      throttling, not a GPU memory ceiling, not chrome that resizes as you scroll.');
  console.log('    · iOS 26 moves fixed and sticky pixels while leaving the layout correct, so');
  console.log('      getBoundingClientRect and every screenshot here agree with each other and');
  console.log('      with nothing the visitor sees. See references/08-collisions.md § 11.3.');
  console.log('    · whether the page is any good. That is still your eye, and the client\'s.');
  return 0;
}

// ── self-test: the gate is not trusted until it has been seen doing both ───
async function selftest() {
  const raiz = join(AQUI, 'fixtures');
  if (!existsSync(raiz)) { console.error(`gate: fixtures missing at ${raiz}`); return 2; }

  const srv = createServer((req, res) => {
    const p = join(raiz, decodeURIComponent(req.url.split('?')[0]));
    const f = existsSync(p) && statSync(p).isDirectory() ? join(p, 'index.html') : p;
    if (!existsSync(f) || !statSync(f).isFile()) { res.writeHead(404); return res.end('no'); }
    const t = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' }[extname(f)] || 'application/octet-stream';
    res.writeHead(200, { 'content-type': t });
    res.end(readFileSync(f));
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port;
  const base = `http://127.0.0.1:${port}`;

  let salida = 0;
  try {
    // ── negative control: a page that should be approved ──────────────────
    console.log('negative control · a build that should pass');
    const bueno = await correr({ url: `${base}/good/`, dir: join(raiz, 'good'), tier: 'standard',
      budget: 60, jsBudget: 20, prev: 'A1-B1-C1-D1-E1', copyChecked: true, anchos: [320, 375, 768, 1280] });
    const malosBueno = bueno.filas.filter((f) => f.estado === 'fail' || f.estado === 'blind');
    if (malosBueno.length) {
      console.log(`  ✗ FALSE POSITIVES: ${malosBueno.map((f) => f.id).join(', ')}`);
      malosBueno.forEach((f) => (f.detalle || []).forEach((d) => console.log(`      ${d}`)));
      salida = 1;
    } else console.log('  ✓ approved, no false positive');

    // ── positive control: a page that must be refused, gate by gate ───────
    console.log('\npositive control · a build that must be refused');
    const malo = await correr({ url: `${base}/bad/`, dir: join(raiz, 'bad'), tier: 'standard',
      budget: 60, jsBudget: 20, prev: 'A1-B2-C1-D1-E1', copyChecked: false, anchos: [320, 375, 768, 1280] });
    const debenFallar = ['slop', 'form', 'weight', 'ambition', 'contrast', 'widths', 'keyboard', 'reduced', 'copy'];
    const fallaron = malo.filas.filter((f) => f.estado === 'fail').map((f) => f.id);
    const mudos = debenFallar.filter((d) => !fallaron.includes(d));
    if (mudos.length) {
      console.log(`  ✗ DID NOT FIRE: ${mudos.join(', ')}`);
      mudos.forEach((id) => {
        const f = malo.filas.find((x) => x.id === id);
        console.log(`      ${id}: ${f ? f.estado + ' — ' + (f.resumen || '') : 'missing'}`);
      });
      salida = 1;
    } else console.log(`  ✓ all nine parameters fired: ${fallaron.join(', ')}`);

    // ── and the third state: an instrument that cannot look ───────────────
    console.log('\nthird control · a page that cannot be read must exit 2, never 0');
    const ausente = await correr({ url: `${base}/nothing-here/`, dir: join(raiz, 'good'), tier: 'standard',
      budget: 60, jsBudget: 20, prev: 'A1-B1-C1-D1-E1', copyChecked: true, anchos: [320] });
    if (!ausente.ciego) { console.log('  ✗ a 404 was graded instead of refused'); salida = 1; }
    else console.log(`  ✓ refused to grade: ${String(ausente.ciego).slice(0, 60)}`);

    // ── fourth control: something answered, but it is the wrong page ──────
    console.log('\nfourth control · a page that answers 200 but is not the one meant');
    const otra = await correr({ url: `${base}/good/`, dir: join(raiz, 'good'), tier: 'standard',
      budget: 60, jsBudget: 20, prev: 'A1-B1-C1-D1-E1', copyChecked: true, anchos: [320],
      expect: 'a string that is certainly not on this page' });
    if (!otra.ciego) { console.log('  ✗ the wrong page was graded instead of refused'); salida = 1; }
    else console.log(`  ✓ refused to grade: ${String(otra.ciego).slice(0, 60)}`);
  } finally {
    srv.close();
  }

  console.log(salida ? '\nSELF-TEST FAILED — do not trust this gate' : '\nself-test passed');
  return salida;
}

// ── cli ────────────────────────────────────────────────────────────────────
const esCli = process.argv[1] && process.argv[1].endsWith('gate.mjs');
if (esCli) {
  const args = process.argv.slice(2);
  if (args.includes('--selftest')) process.exit(await selftest());

  const val = (k, d) => {
    const a = args.find((x) => x.startsWith(`--${k}=`));
    return a ? a.slice(k.length + 3) : d;
  };
  const url = args.find((a) => a.startsWith('http'));
  const tier = val('tier', 'standard');
  const dir = resolve(val('dir', '.'));

  if (!url || !TIERS[tier]) {
    console.error('usage: node checks/gate.mjs <url> --dir=<source> --tier=craft|standard|utility \\');
    console.error('              --budget=<KB> [--js-budget=<KB>] [--prev=A6-B4-C3-D2-E2] [--copy-checked] \\');
    console.error('              [--expect=<text only this page contains>]');
    console.error('       node checks/gate.mjs --selftest');
    process.exit(2);
  }

  const o = {
    url, dir, tier,
    budget: parseFloat(val('budget', 'NaN')),
    jsBudget: parseFloat(val('js-budget', 'NaN')),
    prev: val('prev', ''),
    expect: val('expect', ''),
    copyChecked: args.includes('--copy-checked'),
    anchos: val('widths', '320,375,768,1280').split(',').map(Number),
  };

  const { filas, ciego } = await correr(o);
  const code = imprimir(filas, ciego, o);
  const veredicto = code === 0 ? 'APPROVED' : code === 2 ? 'COULD_NOT_LOOK' : 'NOT_APPROVED';
  escribirRecibo(o, veredicto, filas.filter((f) => f.estado === 'fail').map((f) => f.id));
  process.exit(code);
}
