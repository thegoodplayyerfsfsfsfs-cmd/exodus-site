# exodus — enhanced mobile-ready static site

I updated the static site to be mobile-first with iPhone installability and a nicer loading experience.

What's changed
- Added a lightweight splash/loading screen (splash shows while assets are prepared)
- Updated styles to be mobile-first, improved touch targets and typography for iPhone
- Added a manifest.json so the site can be installed as a PWA (Add to Home Screen on iOS/Android)
- Added a basic service worker (sw.js) that caches core assets for offline viewing
- Updated the header text and layout for cleaner mobile UX

Notes on icons
- I intentionally did not generate new icon sizes — the site references `/branding/logo.png` for the app icon and the Apple touch icon. Replace that file with a square PNG (>= 192px) for best results.

Deploying
- Download the repo ZIP (https://github.com/thegoodplayyerfsfsfsfs-cmd/exodus-site/archive/refs/heads/main.zip) and upload the repository files to your host.
- For iPhone: open the site in Safari, tap Share → Add to Home Screen. The app will launch in standalone mode (status bar translucent).

If you want I can:
- Produce a single ZIP with the repo updated and attach it here for direct download.
- Generate proper icons from your uploaded logo (different sizes + iOS splash assets) and add them.
- Tweak colors, fonts, or animations to match a specific style.
