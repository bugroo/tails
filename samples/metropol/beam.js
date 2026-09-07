// Metropol · the projector, in one quad
//
// WHY RAW WEBGL AND NOT THREE.JS
// The whole scene is a single full-screen fragment shader. three.js would add
// roughly 170 KB gzipped to draw two triangles, and this skill's own rule is
// that the stack follows the brief and never the habit. It also serves the
// constraint that matters on the devices that will actually open this page:
// one quad and no textures is close to zero GPU memory, and GPU memory is what
// ages badly on a phone that is three or four years old, which is the average
// phone in Europe in 2026. See references/08-collisions.md § 11.1.
//
// WHAT IT DRAWS
// The projector coming up in the room behind the type: a warm halo growing out
// of the screen in the photograph, the slow gate weave a real projector has,
// and dust visible only inside the beam. It is blended with `screen`, so black
// adds nothing and the photograph keeps itself.
//
// The first version of this drew the same light over white paper. It was
// technically real and visually invisible: on an ordinary screen it looked
// like a beige background. Light needs something to fall on.
//
// ONE SHARED VALUE
// Scroll, pointer and idle all write into the same `k`. That is why the
// transitions between them feel continuous instead of stepped, and it is the
// two-layer hero pattern from references/06-motion.md.

const lienzo = document.getElementById('beam');
const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

const VERT = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision mediump float;
uniform vec2  u_res;
uniform float u_t;      // seconds
uniform float u_k;      // 0 house lights up, 1 house lights down
uniform vec2  u_ptr;    // -1..1, where the eye is
out vec4 color;

float hash(vec2 v){ return fract(sin(dot(v, vec2(12.9898, 78.233))) * 43758.5453); }

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;

  // The screen sits at roughly this point in the photograph behind us. The
  // glow grows from there, which is what a projector actually does: the light
  // arrives from the screen, not from the ceiling.
  vec2 pantalla = vec2(0.505, 0.60) + u_ptr * 0.012;
  vec2 c = uv - pantalla;
  c.x *= u_res.x / u_res.y;

  // gate weave: a real projector never holds the frame perfectly still
  float tejido = sin(u_t * 2.1) * 0.004 + sin(u_t * 5.7) * 0.0018;

  float d = length(c * vec2(1.0, 1.35));

  // A beam in a dark room has an edge. The first version washed the whole
  // frame at 0.22 and the photograph came out looking like fog: the blacks
  // lifted, the seats lost their shape, and the screen stopped being the
  // brightest thing in the picture, which is the one job it has.
  float halo = smoothstep(mix(0.34, 0.52, u_k), 0.03, d) * (1.0 + tejido);
  float sala = smoothstep(1.1, 0.15, d) * 0.055;

  float fuerza = mix(0.08, 1.0, u_k);
  vec3 tungsteno = vec3(1.000, 0.882, 0.706);
  vec3 luz = tungsteno * (halo * 0.62 + sala) * fuerza;

  // dust in the beam, only where there is beam to be seen in
  float grano = (hash(gl_FragCoord.xy + fract(u_t) * 137.0) - 0.5);
  luz += grano * (halo * 0.085 + 0.010) * fuerza;

  // screen blend: black adds nothing, so the photograph keeps itself
  color = vec4(max(luz, 0.0), 1.0);
}`;


let gl = null, prog = null, raf = 0, uni = {};
let k = 0, kObjetivo = 0, ptr = [0, 0], vivo = false;

function compilar(tipo, src) {
  const s = gl.createShader(tipo);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

function construir() {
  gl = lienzo.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return false;                       // no WebGL2: the CSS fallback is already there

  prog = gl.createProgram();
  gl.attachShader(prog, compilar(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  for (const n of ['u_res', 'u_t', 'u_k', 'u_ptr']) uni[n] = gl.getUniformLocation(prog, n);
  document.documentElement.classList.add('has-beam');
  medir();
  return true;
}

function medir() {
  if (!gl) return;
  // Half resolution on purpose. Nobody can see the difference in a grain field
  // and it is the cheapest thing you can do for an old GPU and a tired battery.
  const d = Math.min(devicePixelRatio || 1, 1.5) * 0.5;
  lienzo.width  = Math.max(2, Math.floor(lienzo.clientWidth  * d));
  lienzo.height = Math.max(2, Math.floor(lienzo.clientHeight * d));
  gl.viewport(0, 0, lienzo.width, lienzo.height);
}

function pintar(ms) {
  if (!gl || !vivo) return;
  k += (kObjetivo - k) * 0.075;               // one shared value, eased once
  gl.uniform2f(uni.u_res, lienzo.width, lienzo.height);
  gl.uniform1f(uni.u_t, ms / 1000);
  gl.uniform1f(uni.u_k, k);
  gl.uniform2f(uni.u_ptr, ptr[0], ptr[1]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  raf = requestAnimationFrame(pintar);
}

function arrancar() { if (!vivo) { vivo = true; raf = requestAnimationFrame(pintar); } }
function parar()    { vivo = false; cancelAnimationFrame(raf); }

// ── context loss ──────────────────────────────────────────────────────────
// The failure that actually happens in the field, on every tier of phone:
// mobile Chrome reclaims GPU memory the moment the tab goes to the background.
// Without preventDefault the context is gone for good and the visitor comes
// back from a phone call to a black rectangle. Almost no WebGL page does this.
lienzo.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  parar();
  document.documentElement.classList.remove('has-beam');
}, false);

lienzo.addEventListener('webglcontextrestored', () => {
  try { if (construir()) arrancar(); } catch (e) { console.warn('beam: could not restore', e); }
}, false);

// ── the shared value ──────────────────────────────────────────────────────
const escena = document.querySelector('.saal');

function desdeScroll() {
  if (!escena) return;
  const r = escena.getBoundingClientRect();
  const total = r.height - innerHeight;
  kObjetivo = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
  document.documentElement.style.setProperty('--k', kObjetivo.toFixed(3));
}

addEventListener('scroll', desdeScroll, { passive: true });

// Only refresh on a WIDTH change. On iOS the address bar fires resize as it
// collapses, and reacting to that interrupts momentum scrolling.
let anchoPrevio = innerWidth;
addEventListener('resize', () => {
  if (innerWidth !== anchoPrevio) { anchoPrevio = innerWidth; medir(); }
}, { passive: true });

if (matchMedia('(hover: hover)').matches) {
  addEventListener('pointermove', (e) => {
    ptr = [(e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1];
  }, { passive: true });
}

// Do not render a scene nobody is looking at.
const ojo = new IntersectionObserver(([e]) => { e.isIntersecting ? arrancar() : parar(); }, { threshold: 0 });
document.addEventListener('visibilitychange', () => { document.hidden ? parar() : (escena && ojo.observe(escena)); });

if (!reducido) {
  try {
    if (construir()) { desdeScroll(); if (escena) ojo.observe(escena); else arrancar(); }
  } catch (e) {
    console.warn('beam: falling back to CSS', e);   // the page was never depending on it
  }
}
