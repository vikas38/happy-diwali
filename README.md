# Little Lights — Your Diwali Adventure

A gentle virtual Diwali celebration with diyas, rangoli and six pretend fireworks. This is a game, not a medical tool or real-world firework instruction.

[Play Little Lights](https://happy-diwali-vikas38.vercel.app/)

## Play at your own pace

Choose a firework, then ask a grown-up to start. Chhotu and Pip move to their watching spot before a labelled adult handles the pretend fuse. A visible countdown precedes every show. Take a breathing break whenever you like; interrupted shows resume with a countdown.

Gentle sound is the default. The master volume and three sound modes remain available. Gentle visuals suppress flash overlays and squash effects and reduce particle density; the operating system's reduced-motion preference is honoured. The setting also controls decorative home animations.

Real fireworks must only be handled by responsible adults with children at a safe distance. For persistent distress, consider speaking with a paediatric professional.

## Privacy and offline behaviour

Progress and sound preferences are stored locally under the legacy key `chhotu_diwali_save_v1` so existing progress is preserved. No accounts, analytics or progress uploads are implemented. Loading the website makes normal requests to its hosting provider. If storage is blocked, play continues in memory.

The site bundles character PNG images and generates canvas/SVG scenery and Web Audio sound. It works without further network requests once its required assets have loaded. It does **not** promise offline reloads: there is no service worker. The manifest provides home-screen metadata, not an offline guarantee.

## Develop

Use Node 22+ (see `.nvmrc`). Node 22 and newer are supported.

```sh
git clone https://github.com/vikas38/happy-diwali.git
cd happy-diwali
npm ci
npm run dev
```

## Checks

```sh
npm audit --audit-level=moderate
npm run lint
npm test
npm run build
npm run check:budget
npx playwright install chromium
npm run test:e2e
```

GitHub Actions runs these checks on pushes and pull requests. The browser suite covers keyboard play, pause/resume, automatic accessibility scans, mobile layout, blocked storage, reduced motion and offline audio rendering. Automated checks do not establish full WCAG conformance or device loudness safety.

The JavaScript budget is 150 KiB gzipped. Canvas DPR is capped at 2; particles use a bounded pool. The rendering loop stops while the page is hidden or the calm corner is open. Real-device performance measurements remain pending.

## Sound and flashes

All production audio passes through a final bounded WaveShaper after the mixer and compressor. Its transfer function stays within ±0.25 normalized digital amplitude (approximately −12 dBFS). The master limiter ceiling is exposed as `MASTER_CEILING_DB = -6.0` dBFS (with Gentle defaults operating well below this ceiling at approximately −13.15 dBFS, clamped by the wave-shaper peak of ±0.25 / −12 dBFS). This is **not** an acoustic dB SPL guarantee: speaker, headphone and device volume determine listening loudness. Browser tests render every synthesized effect in each intensity mode to check the digital cap.

Localized flash overlays are limited to a 100 CSS-pixel radius and at least 400 ms apart. Gentle visuals disables them completely. This controls the explicit overlays; full photosensitivity assessment of complete rendered videos remains pending.

## Architecture

React UI, a finite-state game controller, Canvas 2D rendering and synthesized Web Audio. Runtime dependencies are React and ReactDOM. Source lives in src/, unit tests in test/, browser checks in e2e/, and the audit response in docs/audit-response.md.

## License status

No open-source license has been selected by the repository owner. No new license grant is implied by this README. A license decision is still required before advertising this project as open source.
