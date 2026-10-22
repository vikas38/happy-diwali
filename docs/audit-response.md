# Audit response — 23 October 2026

Scope: verified the supplied report against local source, tests and build. Existing uncommitted artwork improvements were preserved. This implements the release-focused P0 recommendations and the directly supporting P1 quality/security tooling. Larger P1/P2 product ideas are tracked below, not silently treated as release requirements.

| Audit | Finding and response |
| --- | --- |
| A1 | Confirmed child ignition pose. Child moves away before ignition; labelled adult appears during countdown. Child's sparkler-holding idle sprite is no longer used. Existing in-game adult-only disclaimer strengthened. |
| A2 | Gentle already default. Added final ±0.25 digital output transfer limit, offline-rendered audio tests, flash cooldown/radius caps, and shared gentle-visuals mode. No physical loudness or clinical safety claim. |
| A3 | Removed therapeutic/fear-treatment claims from package and README; parent panel explicitly says this is not a medical tool. |
| A4 | Resize handling debounced 200 ms; ignores width changes ≤50 px and height changes ≤150 px. Meaningful geometry changes during active sequences still pause safely; hidden tabs pause. |
| B1 | Public identity: Little Lights — Your Diwali Adventure; package/repository: happy-diwali. Character names and the compatible legacy storage key remain. |
| B2 | Open Graph/Twitter metadata, 1200×630 PNG, SVG favicon, Apple/192/512 icons and manifest added. Hosting deployment is still needed for public previews. |
| B3 | Vite 5.4.21 explicitly pinned; Node 22 in .nvmrc and Node 22–24 engines. |
| B4 | Correct clone/demo URLs, no fixed test count. Documented absent license rather than choosing a legal grant for the owner. |
| B5 | Confirmed local PNG assets; removed procedural-only/offline-reload claims. No service worker added. |
| B6 | Repository topics/releases are optional owner-facing publishing decisions; no remote metadata changed. |
| C1/C2 | Playwright keyboard journey, pause/resume, mobile/reduced-motion/storage failure and axe checks; CI installs, lints, tests, builds and checks JS budget. |
| C3 | ESLint hooks rules enabled. Formatting migration deferred to avoid unrelated diff churn. |
| C4 | React recovery boundary, canvas unavailable/context-loss fallback, blocked storage getter guard, AudioContext creation/resume guards and visible retry control. |
| D1 | Existing labelled controls/focus and native home dialogs verified. Added game-dialog focus containment, readable countdown text, larger HUD targets and contrast corrections found by axe. Full manual screen-reader audit remains. |
| D2 | Existing pooled particles/delta time confirmed. DPR capped at 2; pause/hidden renderer stop added; gzip budget enforced. Static-layer caching/adaptive quality remain profiling-led work. |
| D3 | Audio starts from a gesture. Retry control added for suspended/unavailable sound. Real iOS silent-switch testing remains. |
| E1 | Production Vercel CSP, nosniff, referrer and permissions headers added; inline styles allowed for React. Verify deployed response headers after release. |
| E2 | Export contains generated geometry and a fixed colour palette; no user-authored strings are injected. No change needed. |
| E3 | Parent privacy note describes local saves and normal hosting requests accurately; no analytics/accounts introduced. |
| E4 | npm audit/outdated run. Vitest patched 2.1.8→2.1.9, React unchanged; Dependabot configured. Remaining dev-tool advisories require a separately tested toolchain migration. |

## Remaining verification and decisions

- Physical low-end Android, iPhone Safari and tablet test; acoustic measurements with actual devices/headphones.
- Lighthouse mobile and throttled-device profiling; rendered-video photosensitivity analysis. The flash limiter alone is not proof of WCAG 2.3.1 compliance.
- Owner license choice; public deployment and verification of preview cards/headers; optional GitHub topics and release tags.
- Development dependencies still report advisories. Keep development servers local; do not expose Vitest API/UI servers. No claim of a clean development audit is made. Runtime audit is checked separately.

## Future enhancement backlog

P1: PNG/Web Share rangoli and sticker cards; Hindi/Marathi and optional device voices; parent gate/session timer; service-worker offline support only if product scope requires it. These need product design and language/device review.

P2: sweets-making and more non-firework activities; green-Diwali guidance; measured adaptive rendering; narrated story mode and local parent progress view. Preserve the no-account/no-tracking design. No louder effects, backend or game-engine migration planned.

## Additional defects caught during implementation

The keyboard start button was incorrectly affected by a canvas accidental-tap cooldown; the cooldown now applies only to canvas taps. A negative arch radius on narrow mobile viewports could crash the scene; dimensions are now clamped. Ambient flash overlays were removed and ambient bursts are hidden in gentle-visuals mode. Renderer exceptions now stop the loop and offer a return to the festival.

## Validation results

- ESLint hooks checks pass.
- 162 unit tests pass, including adult ignition, blocked storage, audio creation failure, flash bounds and resize thresholds.
- Four Chromium browser tests pass: axe and keyboard journey/pause/resume; 390px mobile/reduced-motion/blocked storage; every audio effect at all three intensities; missing-canvas recovery.
- Production build passes; JavaScript gzip is approximately 80 KiB, below the 150 KiB budget.
- Production dependency audit: zero known vulnerabilities. Full development audit: six advisories (three moderate, one high, two critical) remain in the retained toolchain.
- CI and hosting configuration are local changes; remote CI/deployed headers have not yet been exercised.
