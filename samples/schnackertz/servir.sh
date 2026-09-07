#!/usr/bin/env bash
# Serve this sample locally. It needs a server, not file:// — the module and the
# font are both blocked by CORS otherwise.
cd "$(dirname "$0")"
PORT="${1:-4600}"
echo "→ http://localhost:$PORT/"
python3 -m http.server "$PORT"
