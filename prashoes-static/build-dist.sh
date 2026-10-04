#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"
rm -rf dist
mkdir -p dist
cp index.html styles.css app.js data.js dist/
cp -R images dist/

echo "dist ready: $(pwd)/dist"
