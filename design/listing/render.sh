#!/bin/sh
# Renders the listing pages into ../../assets with headless Chrome:
# the cover (assets/image.png, 1200x630) and the gallery
# (assets/screenshots/*.png, 1600x900 at 2x). The icon is drawn separately by
# scripts/make-icon.js.
#
# Set CHROME to your Chrome or Chromium binary if it isn't found. On Windows,
# run this from Git Bash.
set -e
cd "$(dirname "$0")"
python3 build.py || python build.py
if [ -z "$CHROME" ]; then
  for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
           "/c/Program Files/Google/Chrome/Application/chrome.exe" \
           "$(command -v google-chrome || true)" "$(command -v chromium || true)"; do
    if [ -n "$c" ] && [ -x "$c" ]; then CHROME="$c"; break; fi
  done
fi
ASSETS="$(cd ../../assets && pwd)"
mkdir -p "$ASSETS/screenshots"

render() { # html width height scale output
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor="$4" \
    --window-size="$2,$3" --screenshot="$5" "file://$PWD/$1" 2>/dev/null
}

render image.html 1200 630 1 "$ASSETS/image.png"
for page in 1-key-numbers-by-email 2-every-report-kept 3-carts-and-subscriptions 4-set-it-once; do
  render "$page.html" 1600 900 2 "$ASSETS/screenshots/$page.png"
done
ls -1 "$ASSETS" "$ASSETS/screenshots"
