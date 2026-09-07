#!/usr/bin/env bash
# tails · the Stop gate
#
# A document cannot force anything. This can.
#
# The skill says a build is not delivered until `checks/gate.mjs` returns
# APPROVED. Saying so is not enough: the model that just spent an hour on a page
# is exactly the wrong judge of whether it is finished, and "I ran the checks"
# is a sentence, not evidence. So this refuses to let the turn end while a tails
# build in this directory has no earned verdict.
#
# HOW IT SCOPES ITSELF, which matters more than what it blocks
# It only acts on projects that carry a `tails · form:` stamp in a stylesheet.
# No stamp, no tails, no blocking. That keeps it silent in every repository it
# has nothing to do with, and a gate that fires where it does not belong gets
# switched off, and a switched-off gate protects nothing.
#
# Exit 0  let the turn end
# Exit 2  block, and hand the reason to the model

set -uo pipefail
ENTRADA=$(cat)

# The harness re-runs Stop hooks after a block. Never block twice on the same
# stop, or the session cannot end at all.
if printf '%s' "$ENTRADA" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  exit 0
fi

RAIZ="${CLAUDE_PROJECT_DIR:-$PWD}"
[ -d "$RAIZ" ] || exit 0

# 1 · is this a tails project at all?
# `fixtures` is skipped by name: a stamped stylesheet whose whole job is to be
# judged by a test would otherwise block every session in this repository, and
# a gate that fires where it does not belong gets switched off. A directory can
# also opt out by carrying a `.tails-ignore` file.
MAPA=$(grep -rl --include='*.css' --include='*.scss' 'tails · form:' "$RAIZ" 2>/dev/null \
       | grep -v '/node_modules/' | grep -v '/\.git/' | grep -v '/fixtures/' \
       | while IFS= read -r h; do [ -f "$(dirname "$h")/.tails-ignore" ] || printf '%s\n' "$h"; done \
       | head -20)
[ -z "$MAPA" ] && exit 0

# 2 · every directory that holds a stamped stylesheet has to carry a verdict
FALTAN=""
while IFS= read -r hoja; do
  [ -z "$hoja" ] && continue
  # The receipt covers whatever tree the gate was pointed at, which is not
  # always the folder the stylesheet happens to sit in. Walk up to the project
  # root looking for it, and then trust the receipt's own `dir` field about
  # what it covers. Assuming the stylesheet's own folder was the judged one
  # made every project with a src/styles/ layout block forever.
  DIR=$(dirname "$hoja")
  RECIBO=""
  BUSCA="$DIR"
  while :; do
    if [ -f "$BUSCA/.tails-verdict.json" ]; then RECIBO="$BUSCA/.tails-verdict.json"; break; fi
    [ "$BUSCA" = "$RAIZ" ] || [ "$BUSCA" = "/" ] && break
    BUSCA=$(dirname "$BUSCA")
  done

  if [ -z "$RECIBO" ]; then
    FALTAN="${FALTAN}\n  · ${DIR#$RAIZ/} — no verdict at all. The gate has never been run here."
    continue
  fi

  LECTURA=$(RECIBO="$RECIBO" python3 - <<'PY' 2>/dev/null
import json, os, hashlib, sys

recibo_path = os.environ['RECIBO']
try:
    r = json.load(open(recibo_path))
except Exception as e:
    print(f"the verdict file is unreadable ({e.__class__.__name__})"); sys.exit(0)

# The receipt always sits at the root of the tree it judged, so resolve from
# the file itself. Trusting an absolute path recorded on someone else's machine
# would break every clone.
raiz = os.path.dirname(os.path.abspath(recibo_path))

if r.get('verdict') != 'APPROVED':
    faltan = ', '.join(r.get('unmet') or []) or 'see the gate output'
    print(f"last verdict was {r.get('verdict')} — unmet: {faltan}"); sys.exit(0)

if not r.get('expect'):
    print("approved without --expect, so it cannot confirm it measured this page"); sys.exit(0)

if not r.get('copyChecked'):
    print("approved without --copy-checked, so nothing attests the copy is not invented"); sys.exit(0)

partes = []
for base, dirs, files in os.walk(raiz):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'dist', 'build')]
    for f in files:
        if f.rsplit('.', 1)[-1] in ('html', 'css', 'scss', 'js', 'mjs'):
            p = os.path.join(base, f)
            with open(p, 'rb') as fh:
                partes.append(p.replace(raiz, '.') + ':' + hashlib.sha256(fh.read()).hexdigest())
ahora = hashlib.sha256('\n'.join(sorted(partes)).encode()).hexdigest() if partes else None

if ahora != r.get('fingerprint'):
    print("the source changed after it was approved, so that verdict is about a page that no longer exists")
    sys.exit(0)
PY
)
  [ -n "$LECTURA" ] && FALTAN="${FALTAN}\n  · ${DIR#$RAIZ/} — ${LECTURA}"
done <<< "$MAPA"

[ -z "$FALTAN" ] && exit 0

{
  echo "tails: this build is not finished, so the turn does not end here."
  echo ""
  printf '%b\n' "${FALTAN#\\n}"
  echo ""
  echo "Run the gate and let it decide:"
  echo ""
  echo "  node checks/gate.mjs <url> --dir=<source> --tier=craft|standard|utility \\"
  echo "       --budget=<KB> --expect=<text only this page contains> --copy-checked"
  echo ""
  echo "  --expect      a marker only the intended page contains. Without it a local"
  echo "                server pointed at the wrong directory answers 200 to everything"
  echo "                and every number you get is real and about another page."
  echo "  --copy-checked   an attestation you make, not a flag that quiets the output."
  echo "                Every number, review, opening time and local detail checked"
  echo "                against a source you can point at. No code can do this for you."
  echo ""
  echo "If it returns NOT APPROVED, fix what it names and run it again. If it returns 2,"
  echo "an instrument could not see the page, which is not a pass either."
  echo ""
  echo "And when it approves: APPROVED means correct, never wanted. Look at the"
  echo "screenshots yourself, then run /tails-verdict for the one isolated review."
} >&2

exit 2
