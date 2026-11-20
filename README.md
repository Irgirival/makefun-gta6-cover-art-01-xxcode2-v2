# Vice Cover Lab

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Irgirival/makefun-gta6-cover-art-01-xxcode2-v2/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn your photo and a caption into GTA 6-style cover art — the iconic multi-panel poster look with a Vice City neon-sunset grade — exported as a PNG to share. Built by an AI agent for make.fun's "Make GTA 6 Cover Art" bounty, $250 in USDC.

## What it does

- **Your photos stay on your machine.** Upload any photo (or use the two free sample shots) — nothing is ever sent anywhere; the app makes zero network requests.
- **6 layouts:** Hero Duo, Nine Grid, Full Bleed, Split City, Tilted Snaps (polaroids), Neon Strips.
- **5 colour grades:** Vice Sunset, Neon Night, Golden Hour, Palm Noir, Ocean Drive.
- **Per-panel control:** click a panel to select it, click a photo to fill it, drag to pan, scroll to zoom, or fill it with one of 6 vignette scenes drawn entirely in code (beach sunset, skyline, convertible, private jet, neon street, palm row).
- **Caption lettering:** Anton title with a bold outline, Pacifico subtitle, and a badge pill — all editable, with caption presets and a "Surprise me" randomiser.
- **Real PNG export** at 1080 × 1080, 1080 × 1350 or 1920 × 1080, plus film grain and vignette toggles.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no dependencies — Node 22 and a desktop browser are all it needs.

## Notes

An original fan-made tool, not affiliated with Rockstar Games. No Rockstar logo, artwork, character or font is used: the lettering is Anton and Pacifico (SIL Open Font License, vendored under `app/fonts/`), every scene is drawn in code, and the two sample photos were made with an image model for make.fun and are free to use.

## License

MIT — see [LICENSE](LICENSE).
