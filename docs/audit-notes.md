# Audit Notes — Baseline Reconnaissance (T00)

Date: 23 October 2026  
Branch: `task/T00-recon`  
Environment: Node 22 (v22.12.0), Windows, Vite 7.3.7, Vitest 4.1.12, React 18.3.1  

---

## Baseline Verification (Step 1 & Step 2)

### Test Results
- Suite: Vitest (9 test files)
- Status: **162 tests passed, 0 failed** (100% green)
- Test files:
  - `test/audio.test.js`
  - `test/characters.test.js`
  - `test/crackers.test.js`
  - `test/fsm.test.js`
  - `test/particles.test.js`
  - `test/renderer.test.js`
  - `test/save.test.js`
  - `test/safety-hardening.test.js`
  - `test/safety-flash.test.js`

### Build & Asset Gzip Sizes (`npm run build`)
- `dist/index.html`: 1.88 kB (gzip: 0.72 kB)
- `dist/assets/index-tai79UDN.css`: 65.11 kB (gzip: 13.72 kB)
- `dist/assets/index-BJl7tDVe.js`: 257.24 kB (gzip: 82.16 kB)
- Total JS bundle gzip is ~82.16 kB, well below the 150 kB budget.

---

## Audit Verification Questions (Q1 – Q14)

### Q1. What does Home show on first load? Is there one dominant primary action?
- **Answer**: No single dominant primary action.
- **File**: `src/ui/FestivalHome.jsx` (lines 24–42), `src/festival.css` (lines 14–110).
- **Evidence**: Renders a multi-card festival hub with sidebar nav (`.festival-sidebar`), topbar sound button (`.festival-topbar`), hero with `.sun-button` ("Let's light it up"), 3 activity cards (Little Lights, Rangoli Magic, Diya Trail), and 2 bottom cards (Meet the Stars, For Grown-ups).

### Q2. Where do volume, level, Take a breath and any Home/back control live (component and CSS file)?
- **Answer**: Yes, divided between Courtyard HUD and Home topbar.
- **File**:
  - `src/ui/HUD.jsx` (lines 19–72), styled in `src/gameplay.css` (lines 20–150).
    - Home/back: `button.back-home` (HUD line 26).
    - Volume: `.game-volume input[type="range"]` (HUD lines 36–41).
    - Level (Sound modes): `.game-sound-modes button` (HUD lines 43–61: Gentle, Natural, Full).
    - Take a breath: `button.game-pause` (HUD lines 68–71, calls `onCalmCorner()`).
  - `src/ui/FestivalHome.jsx` (line 33), styled in `src/festival.css` (lines 36–50) with `.action-badge` audio toggle.

### Q3. How are the five steps shown in the UI? Which component renders "Light the fuse", the dock and the countdown?
- **Answer**: Implicit state-driven views; no explicit 5-dot progress indicator.
- **File**:
  - Step 1 (Select / Dock): `src/ui/CrackerCarousel.jsx` (`.cracker-carousel`).
  - Step 2 (Place / Safety Intro): `src/ui/IntroCard.jsx` (`.intro-card`).
  - Step 3 (Light the fuse): `src/App.jsx` (lines 259–272, `.ready-street-banner` with button `.ready-street-btn` reading `"Adult lights fuse"`).
  - Step 4 (Step back & Countdown): `src/fsm/GameController.js` (walk routine) & `src/ui/Countdown.jsx` (lines 9–35, `.countdown-overlay` rendering 3-2-1-GLOW).
  - Step 5 (Celebrate): `src/ui/RewardOverlay.jsx` (`.reward-overlay`).

### Q4. List every interactive control smaller than 44 x 44 CSS px, with its size.
- **Answer**: Yes, multiple sub-44px controls identified.
- **File**: `src/festival.css`, `src/gameplay.css`.
- **Evidence**:
  - `src/festival.css`:
    - `.modal-close`: 28 × 28 px.
    - `.swatches button`: 28 × 28 px.
    - `.topbar-actions button`: ~32 × 32 px desktop default.
  - `src/gameplay.css`:
    - `.game-sound-modes button`: padding 6px 11px, height ~22–26 px.
    - `.game-collection`: padding 6px 12px, height ~26 px.
    - `.game-pause`: padding 6px 12px, height ~26 px.
    - `.back-home`: padding 5px 12px, height ~25 px.
    - `.game-volume input`: height 3 px track (thumb ~14–16 px).

### Q5. What does the resize handler do (file, conditions, what it pauses)?
- **Answer**: Debounced resize guard pauses active firework sequences into Calm Corner.
- **File**: `src/App.jsx` (lines 104–121), thresholds in `src/safety/limits.js` (lines 6–8).
- **Evidence**: Debounced by 200 ms (`RESIZE_DEBOUNCE_MS`). Pauses via `gc.enterCalmCorner()` when `Math.abs(before.width - after.width) > 50` or `Math.abs(before.height - after.height) > 150` while state is `STEPPING_BACK_SAFE_ROUTINE`, `COUNTDOWN_3_2_1`, or `CRACKER_SHOW_ACTIVE`. (Tab visibility also pauses via lines 123–131).

### Q6. What is the default audio level? Where is the AudioContext created and resumed? Does any sound play before a user gesture?
- **Answer**: Default is Gentle (`INTENSITY.SOFT`); no sound plays before user gesture.
- **File**: `src/store/save.js` (lines 17–25), `src/audio/SoundEngine.js` (lines 44, 69–77), `src/ui/SafetySplash.jsx` (line 20).
- **Evidence**: `save.js` sets `intensity: INTENSITY.SOFT` (-6 dB attenuation) and `masterVolume: 0.7`. `AudioContext` is created in `SoundEngine.init()` (`this.ctx = new AudioContextClass()`) and resumed in `SoundEngine.resume()` only upon explicit user gesture (e.g. "Start Celebration" button).

### Q7. Is `prefers-reduced-motion` honoured in CSS or the canvas loop? Is there any full-screen flash or brightness pulse on bursts, and how often can it fire?
- **Answer**: Yes, honoured in both CSS and canvas; bursts and flashes are strictly rate-limited.
- **File**: `src/festival.css` (line 6), `src/render/Renderer.js`, `src/render/Particles.js`, `src/safety/limits.js` (lines 9–14).
- **Evidence**: `festival.css` reduces all CSS durations to 0.01 ms. `Renderer.js` syncs `reducedMotion` to `Particles.js` (skipping ambient bursts/flashes) and `JellySquash.js`. `Particles.flash()` is throttled by `FLASH_INTERVAL_MS = 400` ms, max 20 active flashes, max radius 100 px, and max alpha 0.35.

### Q8. Is every localStorage read and write inside try/catch? What happens on corrupt JSON? Is there a migration function?
- **Answer**: Yes, try/catch protected; fallback on corrupt JSON; schema validator cleans unknown fields.
- **File**: `src/store/save.js` (lines 62–75, 81–89).
- **Evidence**: `loadSave()` and `writeSave()` wrap all storage access in `try ... catch`. Corrupt JSON catches parse error and returns `createDefaultSave()`. `validateSave()` enforces schema types and restores defaults for missing fields (no multi-version migration pipeline exists yet beyond `chhotu_diwali_save_v1`).

### Q9. What is in `public/assets/characters`, and is anything in it referenced by code?
- **Answer**: Yes, three PNG sprites referenced by the character renderer.
- **File**: `public/assets/characters/`, `src/render/characters/ChhotuChamp.js` (lines 34–38).
- **Evidence**: Directory contains `chhotu_idle.png`, `chhotu_safe_ears.png`, `chhotu_celebrate.png`. Referenced in `ChhotuChamp.js` via `SPRITE_DEFS` for `IDLE_WAVE`, `LIGHTING_REACH`, `COVER_EARS_SMILE`, and `VICTORY_JUMP`.

### Q10. Does any code make network requests (fetch, XHR, remote imports, remote CSS or fonts)?
- **Answer**: No.
- **File**: Repository-wide search across `src/`, `index.html`.
- **Evidence**: Zero occurrences of `fetch`, `XMLHttpRequest`, `navigator.sendBeacon`, or external CDNs/fonts/scripts. All visual effects and audio are generated locally and procedurally.

### Q11. Is there a service worker, manifest or any PWA code?
- **Answer**: Manifest exists; no service worker registered.
- **File**: `public/manifest.webmanifest`, `index.html` (line 11).
- **Evidence**: `index.html` links `<link rel="manifest" href="/manifest.webmanifest" />`. No service worker file or `navigator.serviceWorker.register` call exists in `src/`.

### Q12. Output of `npm ls vite`.
- **Answer**:
```
happy-diwali@1.0.0 D:\apps\happy-diwali
+-- @vitejs/plugin-react@5.1.4
| `-- vite@7.3.7 deduped
+-- vite@7.3.7
`-- vitest@4.1.12
  +-- @vitest/mocker@4.1.12
  | `-- vite@7.3.7 deduped
  `-- vite@7.3.7 deduped
```

### Q13. Are user-visible strings hard-coded in components or centralised?
- **Answer**: Hard-coded across components.
- **File**: `src/ui/FestivalHome.jsx`, `src/ui/HUD.jsx`, `src/App.jsx`, `src/ui/SafetySplash.jsx`, `src/ui/IntroCard.jsx`, `src/ui/RewardOverlay.jsx`, `src/ui/Countdown.jsx`, `src/crackers/crackerDefs.js`.
- **Evidence**: UI labels ("Adult lights fuse", "Take a breath", "Let's light it up", etc.) are directly embedded as string literals in JSX.

### Q14. Which commit and branch does Vercel deploy to production? Does `index.html` on `main` match the deployed head (Open Graph and Twitter tags, `share-card.png`, `theme-color`, meta description)? If not, which is the source of truth? Which domain is production (`happy-diwali-alpha-mauve.vercel.app` or `happy-diwali-vikas38.vercel.app`), and does the `og:image` URL return 200 on it?
- **Answer**: Deploys from `main` branch. `index.html` matches deployed head. `happy-diwali-alpha-mauve.vercel.app` is the working public production deployment (HTTP 200).
- **File**: `index.html`, git log (`main` branch commit `60d7e85`).
- **Evidence**:
  - `index.html` on `main` already includes OG/Twitter tags, `theme-color="#221b35"`, and references to `share-card.png`.
  - HTTP checks:
    - `https://happy-diwali-alpha-mauve.vercel.app/` returns `200 OK`.
    - `https://happy-diwali-alpha-mauve.vercel.app/share-card.png` returns `200 OK` (17,156 bytes).
    - `https://happy-diwali-vikas38.vercel.app/` returns `302 Found` redirecting to Vercel SSO login (`vercel.com/sso-api`).
  - Note for T05/T08/D7: `index.html` canonical and OG URLs point to `happy-diwali-vikas38.vercel.app`, but the active public production deployment is `happy-diwali-alpha-mauve.vercel.app`.

---

## Task log

- **T00 — done** — Reconnaissance and baseline verification completed. Answered Q1–Q14 with exact file paths, line numbers, and evidence. Recorded Vitest suite (162 tests passed) and asset gzip build sizes. No source files modified. — `docs/audit-notes.md` created — Follow-up: Proceed to T01 on `task/T01-home-entry`.
- **T01 — done** — Dominant Play entry (at least 56px tall, high contrast, full width on mobile), audio unlock on gesture, persistent Home control, settings sheet isolating volume/level while keeping Take a breath visible, For Grown-ups 800ms press-and-hold with visible progress ring & keyboard support, and first-run courtyard hint persisted via `seenHint`. Installed exact devDependencies `@testing-library/react@16.3.3` and `@testing-library/dom@10.4.0`. Full suite green (171 tests passed, 0 failed). — Files touched: `package.json`, `package-lock.json`, `vite.config.js`, `src/store/save.js`, `src/store/gameStore.jsx`, `src/ui/FestivalHome.jsx`, `src/festival.css`, `src/ui/HUD.jsx`, `src/gameplay.css`, `src/App.jsx`, `src/fsm/GameController.js`, `test/save.test.js`, `test/home-entry.test.jsx`, `docs/audit-notes.md` — Follow-up: Proceed to T02.
- **T02 — done** — Contextual action button (visually dominant $\ge 56\text{ px}$ tall in lower screen), 5-dot step flow indicator with polite live region, tap target enlargement to $\ge 48\text{ px}$ across courtyard controls, horizontal scroll-snap firework carousel with 1.15x magnification for active choice, Chhotu walk-back skip button (`skipWalk()`) taking Chhotu/Pip directly to safe zone with ears covered, countdown pause/resume preserving exact beat number during Take a breath, and `hasCompletedFirst` save schema tracking. Full suite green (181 tests passed, 0 failed, 0 linter warnings, clean bundle build). — Files touched: `src/store/save.js`, `src/store/gameStore.jsx`, `src/fsm/GameController.js`, `src/ui/Countdown.jsx`, `src/ui/CrackerCarousel.jsx`, `src/ui/ContextualAction.jsx`, `src/App.jsx`, `src/gameplay.css`, `src/festival.css`, `test/save.test.js`, `test/action-flow.test.jsx`, `docs/audit-notes.md` — Follow-up: Proceed to T03.
- **T03 — done** — Calm visuals toggle, reduced motion integration, rolling flash limiter (WCAG 2.3.1 compliance), and accessibility polish. Added `calmVisuals` to store and save (defaulting to `prefers-reduced-motion` match on first run), `CALM_VISUALS_CONFIG` (particle count x0.5, lifetime x0.6, squash x0.5, screen flash suppression), `FlashLimiter` enforcing at most 3 large-area flashes per rolling 1000ms window, canvas loop slowing/flicker calming (Courtyard, Pip flame, Background bursts), full `:focus-visible` styling across all controls, Escape key listeners on overlays, arrow key navigation on the firework dock, and polite live regions. Full suite green (200 tests passed across 12 files, 0 failed, 0 linter warnings, clean bundle build). — Files touched: `src/safety/calmVisuals.js`, `src/store/save.js`, `src/store/gameStore.jsx`, `src/render/Particles.js`, `src/render/fx/JellySquash.js`, `src/render/layers/Courtyard.js`, `src/render/layers/Background.js`, `src/render/characters/Pip.js`, `src/crackers/crackerControllers.js`, `src/ui/CanvasStage.jsx`, `src/ui/HUD.jsx`, `src/ui/StickerBook.jsx`, `src/ui/CalmCorner.jsx`, `src/ui/CrackerCarousel.jsx`, `src/ui/ContextualAction.jsx`, `src/App.jsx`, `src/gameplay.css`, `test/save.test.js`, `test/calm-visuals.test.js`, `docs/audit-notes.md` — Follow-up: Proceed to T04; owner follow-up: run recorded gameplay of all six fireworks through a flash analyser (e.g. PEAT).
