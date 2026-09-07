#!/usr/bin/env node
// tails · measure the site that already exists
//
// Phase 1 needs a number to beat, and the number has to come from the real
// site rather than from an impression of it. This is also what makes a
// proposal to a business survive first contact: "your page weighs 2,4 MB and
// paints in 1,8 s, mine weighs 300 KB and paints in 90 ms, on the same
// connection" is an argument. "It looks dated" is taste, and taste loses.
//
//   node checks/baseline.mjs <url> [<url> ...]
//
// Exit: 0 measured · 2 could not look
//
// Measured at 1280 first, then at 375, because the phone is where their
// customers are and where the old site usually breaks.

import { chromium } from 'playwright';

const urls = process.argv.slice(2).filter((a) => a.startsWith('http'));
if (!urls.length) {
  console.error('usage: node checks/baseline.mjs <url> [<url> ...]');
  process.exit(2);
}

const browser = await chromium.launch();
let leidos = 0;

for (const u of urls) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  let res = null, err = null;
  try { res = await page.goto(u, { waitUntil: 'load', timeout: 60000 }); }
  catch (e) { err = String(e).slice(0, 70); }

  if (err || !res) { console.log(`${u}\n  could not load — ${err || 'no response'}\n`); await ctx.close(); continue; }
  if (res.status() >= 400) { console.log(`${u}\n  answered ${res.status()} — that is not the site\n`); await ctx.close(); continue; }

  await page.waitForTimeout(3500);          // let entrance animation and lazy loads settle

  const m = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const r = performance.getEntriesByType('resource');
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    let total = nav ? nav.transferSize : 0, js = 0, img = 0, css = 0, opacos = 0;
    for (const x of r) {
      const t = x.transferSize || 0;
      if (t === 0 && x.decodedBodySize === 0 && !/^data:/.test(x.name)) opacos++;
      total += t;
      if (/\.m?js(\?|$)/.test(x.name) || x.initiatorType === 'script') js += t;
      else if (x.initiatorType === 'img' || /\.(jpe?g|png|gif|webp|avif|svg)(\?|$)/i.test(x.name)) img += t;
      else if (/\.css(\?|$)/.test(x.name)) css += t;
    }
    const caras = [...new Set([...document.querySelectorAll('body *')].slice(0, 600)
      .map((e) => getComputedStyle(e).fontFamily.split(',')[0].replace(/['"]/g, '').trim()))].filter(Boolean);
    return {
      total, js, img, css, opacos, n: r.length,
      fcp: fcp ? Math.round(fcp.startTime) : null,
      dom: document.querySelectorAll('*').length,
      tel: document.querySelectorAll('a[href^="tel:"]').length,
      correo: document.querySelectorAll('a[href^="mailto:"]').length,
      vp: !!document.querySelector('meta[name=viewport]'),
      h1: document.querySelectorAll('h1').length,
      alt: [...document.images].filter((i) => !i.alt).length,
      imgs: document.images.length,
      caras: caras.slice(0, 6),
      titulo: (document.title || '').slice(0, 64),
    };
  });

  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(900);
  const movil = await page.evaluate(() => {
    const de = document.documentElement;
    const chico = [...document.querySelectorAll('a, button')].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.height < 24 || r.width < 24);
    }).length;
    return { sw: de.scrollWidth, cw: de.clientWidth, chico };
  });

  console.log(`${u}`);
  console.log(`  ${res.status()} · "${m.titulo}"`);
  console.log(`  weight   ${(m.total / 1024).toFixed(0)} KB across ${m.n} request(s)` +
              `  (js ${(m.js / 1024).toFixed(0)} · img ${(m.img / 1024).toFixed(0)} · css ${(m.css / 1024).toFixed(0)})`);
  console.log(`  paint    first contentful ${m.fcp === null ? 'not reported' : m.fcp + ' ms'}`);
  console.log(`  markup   ${m.dom} nodes · ${m.h1} h1 · ${m.imgs} image(s), ${m.alt} without alt`);
  console.log(`  contact  ${m.tel} tel: link(s), ${m.correo} mailto: link(s)`);
  console.log(`  type     ${m.caras.join(' / ') || 'not resolved'}`);
  console.log(`  at 375   content ${movil.sw}px in ${movil.cw}px ${movil.sw > movil.cw + 1 ? '← OVERFLOWS' : '(fits)'}` +
              ` · viewport meta ${m.vp ? 'yes' : 'NO'} · ${movil.chico} target(s) under 24px`);
  if (m.opacos) console.log(`  note     ${m.opacos} response(s) report no size (cross-origin); the real weight is higher`);
  console.log();
  leidos++;
  await ctx.close();
}

await browser.close();
if (!leidos) { console.error('baseline: nothing was measured. That is not a result.'); process.exit(2); }
process.exit(0);
