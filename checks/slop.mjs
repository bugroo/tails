#!/usr/bin/env node
// tails · deterministic slop detector
//
// No model, no API key, no network. Reads CSS and HTML text and decides.
// A model asked "is this generic?" answers from the same distribution that made
// it generic. Code does not have that problem.
//
//   node checks/slop.mjs <file|dir> [...]
//   node checks/slop.mjs --selftest      run the built-in fixtures
//
// Exit codes:  0 clean · 1 findings · 2 could not look (no input, unreadable)
//
// Exit 2 matters: "no files found" must never look like "no problems found".

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

// ── the rules ──────────────────────────────────────────────────────────────
// Each: id, what it looks for, and why it is a tell. `test` gets the source
// text and returns matches. Keep them cheap and textual — this must run in a
// pre-commit hook without a browser.

const RULES = [
  {
    id: 'default-face',
    why: 'The statistical default typeface. Its presence reads as absence of choice.',
    test: (s) => grep(s, /font-family\s*:\s*[^;}]*\b(Inter|Roboto|Open Sans|Poppins|Lato)\b/gi),
  },
  {
    id: 'indigo-gradient',
    why: 'Indigo-to-purple is the single most recognisable AI-generated tell.',
    test: (s) => grep(s, /linear-gradient\([^)]*(#(6|7|8)[0-9a-f]{2}(f|e|d)[0-9a-f]{2}|rebeccapurple|blueviolet|indigo|#6366f1|#8b5cf6|#a855f7|#7c3aed)/gi),
  },
  {
    id: 'gradient-text',
    why: 'Gradient-filled display text. No brief has ever needed this.',
    test: (s) => grep(s, /background-clip\s*:\s*text|-webkit-background-clip\s*:\s*text/gi),
  },
  {
    id: 'card-stripe',
    why: 'A thick coloured side-stripe on a card: decoration standing in for a label that was never written.',
    test: (s) => grep(s, /border-(left|right)\s*:\s*(?:[3-9]|[1-9]\d)px\s+solid/gi),
  },
  {
    id: 'cream-surface',
    why: 'A warm cream background is the first of the three clusters AI-generated design collapses into. Use it only when it was asked for — the default is white.',
    // Replaces an earlier `pure-black-white` rule that fired on #fff and #000.
    // The measurement contradicted that rule: four of five award-winning sites
    // read on 2026-09-07 use pure white AND pure black. What marks a page as
    // generated is not the value, it is the absence of a choice — and the value
    // that arrives without a choice is cream.
    test: (s) => {
      const out = [];
      // hex in the cream band: high, near-equal R and G, lower B, warm
      // Also custom properties that name a surface — the lab declared its cream
      // as `--paper: #f2efe9` and the first version of this rule walked past it.
      const re = /(background(?:-color)?|--[a-z-]*(?:paper|surface|bg|background|canvas|base)[a-z-]*)\s*:\s*#([0-9a-f]{6})\b/gi;
      let m;
      while ((m = re.exec(s))) {
        const r = parseInt(m[2].slice(0,2),16), g = parseInt(m[2].slice(2,4),16), b = parseInt(m[2].slice(4,6),16);
        if (r > 228 && g > 222 && b > 208 && r >= g && g > b && (r - b) >= 8 && (r - b) <= 34) {
          out.push(`#${m[2]} — cream. Justify it or use white`);
        }
      }
      // and the oklch shape of the same thing: very light, low chroma, warm hue
      const ok = /oklch\(\s*(8[5-9]|9[0-9])(?:\.\d+)?%\s+(0?\.0[0-4]\d*)\s+(\d{2,3})/gi;
      while ((m = ok.exec(s))) {
        const hue = +m[3];
        if (hue >= 55 && hue <= 105) out.push(`oklch(${m[1]}% ${m[2]} ${m[3]}) — cream. Justify it or use white`);
      }
      return out;
    },
  },
  {
    id: 'transition-all',
    why: 'transition: all animates properties you did not choose, including layout ones.',
    test: (s) => grep(s, /transition\s*:\s*all\b/gi),
  },
  {
    id: 'static-will-change',
    why: 'will-change outside an animating state holds a GPU layer forever.',
    test: (s) => {
      const out = [];
      const re = /([^{}]*)\{([^}]*will-change\s*:[^;}]*)/gi;
      let m;
      while ((m = re.exec(s))) {
        const sel = m[1].trim().split('\n').pop().trim();
        if (/:hover|:focus|:active|\[data-|\.is-|\.anim|@keyframes/i.test(sel)) continue;
        if (/will-change\s*:\s*auto/i.test(m[2])) continue;
        out.push(sel.slice(0, 60));
      }
      return out;
    },
  },
  {
    id: 'viewport-unit-mobile',
    why: '100vh on mobile refers to a viewport that changes size as browser chrome moves. Use svh/dvh.',
    // False positive found on a production stylesheet, 2026-09-07: declaring
    // 100vh and then overriding it inside `@supports (min-height: 100svh)` is
    // the CORRECT progressive-enhancement pattern, not a defect. If the file
    // contains that guard, the plain declaration is a fallback.
    test: (s) => (/@supports[^{]*\b(100svh|100dvh|svh|dvh)\b/i.test(s)
      ? [] : grep(s, /(height|min-height)\s*:\s*100vh\b/gi)),
  },
  {
    id: 'loose-display',
    why: 'Display type at line-height 1.3+ reads as a paragraph in a big font. Measured award-winning sites sit at 0.76–1.00.',
    test: (s) => {
      const out = [];
      const re = /font-size\s*:\s*(?:clamp\([^)]*?([\d.]+)rem\s*\)|([\d.]+)(rem|px))[^}]*?line-height\s*:\s*([\d.]+)\s*[;}]/gi;
      let m;
      while ((m = re.exec(s))) {
        const px = m[2] ? (m[3] === 'rem' ? parseFloat(m[2]) * 16 : parseFloat(m[2])) : parseFloat(m[1]) * 16;
        const lh = parseFloat(m[4]);
        if (px >= 40 && lh >= 1.3) out.push(`${Math.round(px)}px at line-height ${lh}`);
      }
      return out;
    },
  },
  {
    id: 'untracked-display',
    why: 'Large type left at default tracking looks loose. Every measured site uses negative letter-spacing on display.',
    // LIMIT OF STATIC ANALYSIS, learned the hard way on a production stylesheet
    // 2026-09-07: this rule cannot resolve the cascade. That file declared
    // `letter-spacing: -0.02em` on a grouped `h1,h2,h3,h4` selector and the
    // sizes in a later rule, so the tracking was correct and this fired anyway.
    // Three false positives out of three.
    // Mitigation: if the file sets a negative letter-spacing on ANY heading
    // selector, stay quiet — the cascade probably covers it. This trades recall
    // for precision on purpose, because a rule that cries wolf gets disabled,
    // and a disabled rule protects nothing.
    // The reliable version of this check lives in the browser, on computed
    // style. See `11-verify.md`.
    test: (s) => {
      if (/h[1-6][^{}]*\{[^}]*letter-spacing\s*:\s*-/i.test(s)) return [];
      const out = [];
      const re = /\{[^}]*font-size\s*:\s*(?:clamp\([^)]*?([\d.]+)rem\s*\)|([\d.]+)rem)[^}]*\}/gi;
      let m;
      while ((m = re.exec(s))) {
        const rem = parseFloat(m[1] || m[2]);
        if (rem * 16 >= 48 && !/letter-spacing/i.test(m[0])) out.push(`${Math.round(rem * 16)}px with no letter-spacing`);
      }
      return out;
    },
  },
  {
    id: 'italic-heading',
    why: 'Italic display type — above all one italicised word inside an upright headline — is a top tell.',
    test: (s) => grep(s, /(h[1-4]|\[class[*^]?=["']?(title|head|hero))[^{}]*\{[^}]*font-style\s*:\s*italic/gi),
  },
  {
    id: 'focus-by-border',
    why: 'A focus ring built from border shifts geometry. Use outline with an offset.',
    test: (s) => grep(s, /:focus(-visible)?[^{}]*\{[^}]*border(-width)?\s*:\s*[^;}]*(?<!0)px/gi),
  },
  {
    id: 'emoji-as-icon',
    why: 'Emoji standing in for an icon set is a tell and it renders differently on every platform.',
    test: (s) => grep(s, /<(h[1-6]|li|span|p)[^>]*>\s*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu),
  },
  {
    id: 'no-form-stamp',
    scope: 'css',
    why: 'No `tails · form:` stamp. Without it the next build cannot know what shape to avoid.',
    test: (s) => (/tails\s*·\s*form:/i.test(s) ? [] : ['stamp missing']),
  },
];

const grep = (s, re) => {
  const out = [];
  let m;
  while ((m = re.exec(s))) out.push(m[0].replace(/\s+/g, ' ').slice(0, 70));
  return out;
};

// ── running ────────────────────────────────────────────────────────────────
export function ficheros(p) {
  if (!existsSync(p)) return null;
  if (statSync(p).isFile()) return [p];
  const out = [];
  for (const e of readdirSync(p)) {
    if (['node_modules', '.git', 'dist', 'build'].includes(e)) continue;
    const f = join(p, e);
    if (statSync(f).isDirectory()) out.push(...(ficheros(f) || []));
    else if (['.css', '.html', '.scss'].includes(extname(f))) out.push(f);
  }
  return out;
}

export function analizar(texto, tipo = 'css') {
  const hits = [];
  for (const r of RULES) {
    if (r.scope && r.scope !== tipo) continue;
    const m = r.test(texto);
    if (m.length) hits.push({ id: r.id, why: r.why, n: m.length, ejemplos: m.slice(0, 3) });
  }
  return hits;
}

// ── self-test: the detector must be seen failing before it is trusted ──────
const MALO = `
:root { --x: 0 }
.hero { font-family: Inter, sans-serif; background: linear-gradient(135deg,#6366f1,#a855f7); }
.hero h1 { font-size: 4rem; line-height: 1.5; }
.title { background-clip: text; }
.card { border-left: 6px solid #6366f1; background: #f4f1ea; }
.thing { transition: all .3s; will-change: transform; }
.full { min-height: 100vh; }
.btn:focus-visible { border: 2px solid blue; }
h2 { font-style: italic; }
`;
const BUENO = `
/* tails · form: A6-B4-C3-D2-E2 · density: dense · 2026-09-07 */
:root { --ink:#111111; --paper:#ffffff; }
.hero { font-family: "Neue Montreal", system-ui; background: #ffffff; }
.hero h1 { font-size: 5rem; line-height: 0.92; letter-spacing: -0.035em; }
.card { border: 1px solid var(--rule); background: var(--paper); }
.thing { transition: transform .3s ease; }
.thing:hover { will-change: transform; }
.full { min-height: 100svh; }
.btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
`;

function selftest() {
  const malo = analizar(MALO, 'css');
  const bueno = analizar(BUENO, 'css');
  const esperados = ['default-face','indigo-gradient','gradient-text','card-stripe','cream-surface',
                     'transition-all','static-will-change','viewport-unit-mobile','loose-display',
                     'italic-heading','focus-by-border','no-form-stamp'];
  const vistos = malo.map(h => h.id);
  const faltan = esperados.filter(e => !vistos.includes(e));
  const falsos = bueno.map(h => h.id);

  console.log(`positive control · bad fixture: ${vistos.length} rules fired`);
  if (faltan.length) console.log(`  ✗ DID NOT FIRE: ${faltan.join(', ')}`);
  else console.log('  ✓ every rule that should fire, fired');
  console.log(`negative control · good fixture: ${falsos.length} rules fired`);
  if (falsos.length) console.log(`  ✗ FALSE POSITIVES: ${falsos.map(f=>f.id||f).join(', ')}`);
  else console.log('  ✓ no false positives');

  const ok = !faltan.length && !falsos.length;
  console.log(ok ? '\nself-test passed' : '\nSELF-TEST FAILED — do not trust this detector');
  return ok ? 0 : 1;
}

// ── cli ────────────────────────────────────────────────────────────────────
// Guarded since 2026-09-07 so `checks/gate.mjs` can import the rules without
// the CLI firing on import — an unguarded module body would have exited 2 the
// moment the single gate loaded it.
const esCli = process.argv[1] && process.argv[1].endsWith('slop.mjs');
if (esCli) {
  const args = process.argv.slice(2);
  if (args[0] === '--selftest') process.exit(selftest());

  if (!args.length) {
    console.error('tails/slop: no input. Usage: node checks/slop.mjs <file|dir> [--selftest]');
    process.exit(2);                       // 2 = could not look, never 0
  }

  let total = 0, mirados = 0;
  for (const a of args) {
    const fs = ficheros(a);
    if (fs === null) { console.error(`tails/slop: ${a} does not exist`); process.exit(2); }
    for (const f of fs) {
      mirados++;
      const hits = analizar(readFileSync(f, 'utf8'), extname(f) === '.html' ? 'html' : 'css');
      for (const h of hits) {
        total += h.n;
        console.log(`${f}\n  ${h.id} ×${h.n} — ${h.why}`);
        h.ejemplos.forEach(e => console.log(`    · ${e}`));
      }
    }
  }
  if (!mirados) { console.error('tails/slop: zero files examined. That is not a pass.'); process.exit(2); }
  console.log(`\n${mirados} file(s) examined · ${total} finding(s)`);
  process.exit(total ? 1 : 0);
}

export { selftest };
