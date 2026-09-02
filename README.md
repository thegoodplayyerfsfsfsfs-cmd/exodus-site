# exodus — enhanced mobile-ready static site (PWA)

This repository contains a mobile-first static site named "exodus". It is optimized for iPhone Add-to-Home-Screen and includes client-side seed encryption and a polished splash animation.

What’s included (highlights)
- Mobile-first UI with large touch targets and safe-area support
- PWA manifest and basic service worker for offline caching
- Splash screen / loader for app-like launch experience
- Client-side seed encryption: optionally protect your mnemonic with a passphrase (uses Web Crypto PBKDF2 + AES-GCM)
- Tokens & balances are simulated locally for personal/demo use
- No server; everything runs in the browser and stores data in localStorage (optionally encrypted)

Important security notes
- If you choose to protect your seed with a passphrase, the encryption is performed locally in your browser. Keep your passphrase safe — losing it means you cannot decrypt your seed.
- This project is a demo. Do NOT use real funds unless you know what you’re doing and are willing to accept the risks of an un-audited client.

Download & deploy
- Download the repo ZIP: https://github.com/thegoodplayyerfsfsfsfs-cmd/exodus-site/archive/refs/heads/main.zip
- Upload the repository files to your static host (Netlify, Vercel, cPanel, FTP).

iPhone install
- Open the deployed site in Safari. Tap Share → Add to Home Screen.

If you want me to:
- Generate all app icon sizes + iOS splash images from your uploaded logo and add them to the project, I can do that next.
- Wrap the site in Capacitor for a native iOS build (requires an Apple developer account).
- Enable Ethereum testnet signing (needs ethers.js and careful warnings).

Tell me if you want the icon generation and I’ll proceed to add crisp icons and a single downloadable ZIP optimized for phone upload.
