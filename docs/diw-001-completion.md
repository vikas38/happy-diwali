# DIW-001 — Close inherited gameplay reliability blockers

Status: **Done** (24 October 2026). Scope: R0 software reliability prerequisite.

Base commit: `345cd95`. Result: local working-tree changes; no commit or deployment created.

## Reconciliation

| Prior finding | Existing resolution | Verification |
| --- | --- | --- |
| R1 toolchain | `65c6727` pins compatible Vite 8 / React plugin 6 tooling | Clean installation, ordinary development startup, unit tests and production build pass without overrides |
| G1 current progress | `816ddcf` | Real React provider regressions plus browser first award, replay, immediate Anar selection and persisted save |
| G2 complete interruption snapshot | `80de1eb` | Introduction/reward payload restoration, preparation/countdown/active-show restart and abandoned completion regressions |
| G3 coordinated overlays | `053c6f7` | Collection/settings/calm interruption tests; one dialog and no hidden awards |
| A1 enveloped audio | `345cd95` | Unconnected source factory / routed envelope tests and browser OfflineAudioContext digital output tests |

The existing fixes were retained. Three remaining interruption edges were repaired in `src/fsm/GameController.js`:

- An abandoned show's completion callback can no longer erase the current show's cancellation handle. Interrupting that current show still cancels its effects.
- A close action belonging to an old overlay cannot dismiss the currently active overlay.
- Switching from Calm Corner to settings or collection stops the calm pad.

`test/fsm.test.js` adds three behavioral regressions. `e2e/smoke.spec.js` now verifies first completion (+3), replay (+1, one sticker), immediate newly unlocked selection, and persisted totals through the production React UI. Existing adult-led preparation and countdown remain intact. The save schema, original IDs, artwork and synthesis graph are unchanged.

## Validation

Windows, Node 24.19.0, npm 11.17.0, Chromium; 24 October 2026 local date.

| Check | Result |
| --- | --- |
| `npm ci` | Pass; 511 packages installed, zero reported vulnerabilities |
| `npm run lint` | Pass |
| `npm test` | Pass; 329 tests across 30 files |
| `npm run build` | Pass, including PWA generation |
| `npm run check:budget` | Pass; 87.6 KiB gzip against 150 KiB limit |
| `npx playwright install chromium` | Pass |
| `npm run test:e2e` | Pass; extended first-completion/replay/unlock/reload journey |
| `npx playwright test e2e/festival.spec.js --grep "every synthesized sound"` | Pass; seven sounds × three intensity modes through the actual offline audio graph |
| Ordinary development startup | Pass; Playwright starts the standard Vite dev command and serves the journey |
| `git diff --check` | Pass |

The initial in-place installation encountered a Windows file lock from this project's running Vite process. After stopping that process, unmodified `npm ci` succeeded. No dependency overrides were used.

## Visual evidence and scope limits

- [Desktop first reward](evidence/diw-001/first-reward-desktop.png), 1280 × 720.
- [Immediately unlocked Anar introduction](evidence/diw-001/unlocked-intro-mobile-reduced.png), 390 × 844 with reduced-motion media enabled.

These are inspected current-state captures, not a before/after redesign comparison: this ticket changes controller ownership only. The desktop reward skip control still crowds its heading; visual redesign/review belongs to DIW-034/041. No claim of release-wide visual signoff is made.

Physical-device listening, assistive technology and broader usability/performance reviews remain pending under the later release tickets. No synthesis, loudness, layout or assets changed in this ticket; the applicable R0 checks here are software graph, cancellation, state and persistence regressions. Browser digital limits do not establish acoustic loudness safety. This completion does not mark R1/R2 release readiness or those external reviews complete.

Next dependency-ready issue: **DIW-002 — Define the gameplay art direction and state storyboard**.
