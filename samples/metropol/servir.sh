#!/usr/bin/env bash
# Serve this proposal locally. It needs a server, not file:// — the font and
# the WebGL module are both blocked by CORS otherwise.
cd "$(dirname "$0")"
PORT="${1:-4700}"
echo "→ http://localhost:$PORT/"
python3 -m http.server "$PORT"
