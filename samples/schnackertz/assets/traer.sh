#!/usr/bin/env bash
# Fetch the restaurant's own photographs into this directory so the sample renders.
# They are not redistributed with this repository: see README.md next to this file.
set -euo pipefail
cd "$(dirname "$0")"
BASE="https://www.schnackertz.koeln"
echo "These images belong to the restaurant. Fetch them only to look at the sample."
echo "Base: $BASE  (adjust if their site has moved)"
echo
echo "This script intentionally does not run unattended. Open the site, take the images"
echo "you need, and name them as index.html expects:"
grep -o 'assets/[A-Za-z0-9_-]*\.jpg' ../index.html | sort -u | sed 's/^assets\//  /'
