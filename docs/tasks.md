# Chhotu Champ's Diwali Glow — Task Breakdown

> 14 tasks in a hybrid build sequence (foundation → first full cracker loop → expand → polish).
> Each task results in a working, demoable increment. Each builds on the previous and ends with wiring things together.

---

## Progress Tracker

| Task | Title | Status |
|---|---|---|
| T1 | Project scaffold & portrait neon shell | ✅ Done |
| T2 | Save system & game store | ✅ Done |
| T3 | SoundEngine core & DSP safety chain | ✅ Done |
| T4 | Background festive music & Calm Corner pad | ✅ Done |
| T5 | Canvas renderer & street background | ✅ Done |
| T6 | Character rigs — Chhotu Champ & Pip | ✅ Done |
| T7 | Particle engine, jelly-squash & comic bubbles | ✅ Done |
| T8 | FSM core + flow screens | ✅ Done |
| T9 | First cracker end-to-end — Phuljhari | ✅ Done |
| T10 | Crackers 2–6 — Anar, Chakri, Rocket, Ladi, Sutli Bomb | ✅ Done |
| T11 | Reward celebration, Sticker Book & Parent unlock-all | ✅ Done |
| T12 | Calm Corner global interrupt | ✅ Done |
| T13 | Full HUD + cracker carousel wiring | ✅ Done |
| T14 | Polish, accessibility & acceptance verification | ✅ Done |

**Tests passing:** 137 (save: 18, audio: 24, renderer: 8, characters: 14, particles: 17, fsm: 24, crackers: 32)
**Build:** `npm run build` → `dist/` ✅

---

## Task 1: Project scaffold & portrait neon shell ✅

- **Objective:** Create a Vite + React 18 app with a portrait 9:16 stage (centered on desktop, `100dvh` full-bleed on mobile), neon Diwali CSS theme, `viewport-fit=cover` + safe-area insets, and a global 64px-min tap-target rule. Set up Vitest.
- **Guidance:** `index.html` with viewport meta; `styles.css` with CSS variables for the indigo-violet/neon palette and component classes; `App.jsx` renders the centered stage. Vitest config in `vite.config.js`.
- **Tests:** none (visual).
- **Demo:** `npm run dev` shows a themed, centered portrait shell that responds to resize.
- **Files created:** `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/styles.css`

---

## Task 2: Save system & game store ✅

- **Objective:** Persist `unlocked[]`, `stickers[]`, `stars`, `masterVolume`, `intensity` in `localStorage` key `chhotu_diwali_save_v1`; React context store with load/save; default SOFT, only Phuljhari unlocked.
- **Guidance:** `save.js` with schema + version + safe JSON parse + field whitelist (version-upgrade safety); `gameStore.jsx` context exposing state + actions; write-through on change.
- **Tests (Vitest):** save round-trip; default schema; malformed-data fallback; version upgrade safety (unknown fields dropped); clamping; dedup/sort.
- **Demo:** change intensity, refresh, the choice persists.
- **Files created:** `src/store/save.js`, `src/store/gameStore.jsx`, `test/save.test.js` (18 tests)

---

## Task 3: SoundEngine core & DSP safety chain ✅

- **Objective:** Web Audio `AudioContext` with master chain Source → IntensityGain+LowPass → MasterVolume → Compressor (thr -12dB, ratio 8:1, attack 0.002s) → destination. Implement SOFT/NORMAL/LOUD (0.22/900Hz, 0.55/2800Hz, 1.0/8000Hz), master volume 0–100%, context resume on first gesture. Noise buffer generation (white + pink). Analyser for flame flicker. Node tracking for calm corner fade.
- **Guidance:** `SoundEngine.js` class; `setIntensity`, `setMasterVolume`, `playTestTone`; live updates via `setTargetAtTime`. Singleton via `getSoundEngine()`.
- **Tests (Vitest):** per-mode gain & cutoff values; compressor params; state before init; clamping.
- **Demo:** a button plays a tone; toggling mode/volume changes it live, mid-tone.
- **Files created:** `src/audio/SoundEngine.js`, `test/audio.test.js` (24 tests)

---

## Task 4: Background festive music & Calm Corner pad ✅

- **Objective:** Gentle pentatonic street loop (C D E G A, Raag Bhopali/Desh-inspired) on plucked marimba/sitar voice at low volume; Calm Corner warm pad (Fmaj7 / Cmaj7) with slow attack.
- **Guidance:** Lookahead scheduler (25ms interval, 100ms lookahead); pluck voice = triangle osc + amp envelope + bandpass filter + vibrato wobble; pad = detuned sines/triangles with 2s attack/release; chord cycling every 8s.
- **Tests (Vitest):** pentatonic note frequencies; melody only uses valid notes; melody length/duration uniformity; calm chord definitions (Fmaj7, Cmaj7).
- **Demo:** street music plays on start; calm pad plays on demand.
- **Files created:** Added to `src/audio/SoundEngine.js`, `test/audio.test.js`

---

## Task 5: Canvas renderer & street background ✅

- **Objective:** DPR-scaled canvas, `requestAnimationFrame` dt-clamped loop, layered night street: indigo-violet gradient sky, twinkling stars, neighborhood silhouettes with glowing windows, marigold torans, fairy string lights (sin catenary), central Rangoli launchpad, neon-green SAFE ZONE mat.
- **Guidance:** `Renderer.js` with ResizeObserver + DPR scaling + dt clamp (1/30 max); `Background.js` draws all layers to spec; star twinkle via `sin(time)`; layout constants shared via `LAYOUT` object.
- **Tests (Vitest):** dt clamp bounds; DPR scaling; layout positions (launch center, safe zone left); background generation (stars, buildings, fairy lights, torans).
- **Demo:** animated festive street running at 60fps.
- **Files created:** `src/render/Renderer.js`, `src/render/layers/Background.js`, `src/ui/CanvasStage.jsx`, `test/renderer.test.js` (8 tests)

---

## Task 6: Character rigs — Chhotu Champ & Pip the Diya ✅

- **Objective:** Procedural canvas characters with full animation states. Chhotu: idle breathing, blink, neon kurta, sneakers, arms across IDLE_WAVE/LIGHTING_REACH/COVER_EARS_SMILE/VICTORY_JUMP with smooth pose lerping + walk cycle + jump. Pip: terracotta diya, stubby legs, kawaii eyes, flame flicker synced to audio level, moods (IDLE/HIDE/HAPPY), hearts.
- **Guidance:** `ChhotuChamp.js` vector drawing with lerped pose transitions, breathing scale, blink, walk cycle, jump arc; `Pip.js` with flame flicker from `getAudioLevel()`, mood-based bouncing, heart particles.
- **Tests (Vitest):** arm-state transition lerp; same-state no-reset; eye crinkle for cover-ears; walk interpolation + onDone callback; flame flicker tracks audio level; mood-based heart spawning.
- **Demo:** cycle Chhotu through all four poses; Pip's flame dances with music.
- **Files created:** `src/render/characters/ChhotuChamp.js`, `src/render/characters/Pip.js`, `test/characters.test.js` (14 tests)

---

## Task 7: Particle engine, jelly-squash & comic bubbles ✅

- **Objective:** Object-pooled particle system (capacity 800) with properties `x,y,vx,vy,gravity,drag,size,alpha,decay,hue,trailHistory[],shape`; shapes circle/star/spark/confetti; additive `'lighter'` glow; jelly-squash spring on canvas container; spring-physics comic word bubbles.
- **Guidance:** `Particles.js` pool with round-robin free-slot search, zero allocation after warmup; `JellySquash.js` spring (k=220, c=9, underdamped) applied to DOM element; `ComicBubble.js` spring scale-in with overshoot, float, fade.
- **Tests (Vitest):** pool capacity, no growth beyond capacity, reuse after warmup, clear; physics step (velocity, gravity, decay, deactivation); spring convergence to rest; reduced-motion disabled; comic bubble scale-in, float, lifetime.
- **Demo:** tapping spawns a neon particle burst + jelly squash + a bouncing comic word.
- **Files created:** `src/render/Particles.js`, `src/render/fx/JellySquash.js`, `src/render/fx/ComicBubble.js`, `test/particles.test.js` (17 tests)

---

## Task 8: FSM core + flow screens ✅

- **Objective:** `GameController` FSM implementing all 9 states + global calm interrupt, wired to UI screens: SafetySplash, IntroCard, ReadyOnStreet, SteppingBackSafeRoutine (1.2s walk + ear-cover), Countdown (3→2→1→GLOW, 800ms each, pitched chime ticks). Observer pattern for React integration. Cracker definitions metadata for intro cards.
- **Guidance:** `GameController.js` state enum, transition guards, engine/UI callbacks, timer management for calm corner pause/resume; React subscribes via `subscribe()`; `crackerDefs.js` with 6 crackers' metadata.
- **Tests (Vitest):** legal transitions only; illegal transitions rejected; calm corner stores/resumes prior state; timer clearing; reward awards stars + sticker + unlocks next; lightAgain/nextCracker flow.
- **Demo:** tap through splash → intro → ready → walk-back → countdown → placeholder "GLOW!" with no cracker effect yet.
- **Files created:** `src/fsm/GameController.js`, `src/crackers/crackerDefs.js`, `test/fsm.test.js` (24 tests)

---

## Task 9: First cracker end-to-end — Phuljhari (Sparkler) 🔲

- **Objective:** Complete loop for cracker 1 — ReadyOnStreet → walk → countdown → Phuljhari show (golden-pink star sparks, zero smoke, gentle gravity) + `"TWINKLE ✨"` comic bubble + happy sidekick reaction → RewardCelebration (3 stars, sticker unlock, confetti, synth fanfare, "You did it, Champ!" with "Light Again" / "Next Cracker" buttons).
- **Guidance:** `crackerControllers.js`; Phuljhari emitter (star-shape sparks, gentle gravity, no smoke) + ultra-soft chime shimmer (2–4kHz, very low gain); `RewardOverlay.jsx`; SoundEngine fanfare patch; write sticker + stars to save.
- **Tests (Vitest):** Phuljhari def integrity; reward updates save correctly.
- **Demo:** a full, rewarding Phuljhari loop from tap to sticker unlock.

---

## Task 10: Crackers 2–6 — Anar, Chakri, Rocket, Ladi, Sutli Bomb 🔲

- **Objective:** Implement the remaining five crackers per the spec table with their particle sequences, audio patches, comic bubbles, intensity dots (1–4), and sequential unlock.
- **Guidance:**
  - **Anar:** conical fountain (cyan/gold/magenta bouncing sparks), pink-noise through resonant bandpass sweeping 400→1200Hz, `"FIZZZZZ 🌸"`.
  - **Chakri:** rotating ground wheel with logarithmic spiral rainbow trails, LFO-modulated triangle 6→14Hz + sparkle noise, `"WHEEEEE 🌀"`.
  - **Rocket:** golden ember trail up (1.0s) then heart/smiley neon-star burst, rising sweep 200→1600Hz + soft 90Hz thump + chime, `"WHOOSH... POP! 🚀"`.
  - **Ladi:** 8 mini-crackers popping 180ms apart with multicolor confetti, 40ms bandpass noise bursts + woodblock pop pitches, `"POP! POP! POP! 🎉"`.
  - **Sutli Bomb:** green twine cube swells then bursts into massive rainbow confetti/star explosion, sub-drop 120→35Hz over 250ms + LP-shaped noise + slide-whistle cheer, `"BOOOOM! 💥🌈"`.
- **Tests (Vitest):** each controller emits expected emitter + audio config; Ladi 8-pop timing sequence.
- **Demo:** all six crackers playable with correct visuals/audio/bubbles; sequential unlock enforced.

---

## Task 11: Reward celebration, Sticker Book & Parent unlock-all 🔲

- **Objective:** Sticker Book showing unlocked stickers (locked = silhouette), confetti cannons on reward, a parent "Unlock All" gate (e.g., 2-second hold) to jump to any cracker, and free replay of any already-unlocked gentler cracker.
- **Guidance:** `StickerBook.jsx`; stickers rendered as canvas/SVG thumbnails from cracker defs; parent gate via long-press; carousel reflects unlocked set.
- **Tests (Vitest):** sticker lock/unlock state transitions; parent toggle persists across reload.
- **Demo:** sticker book fills as crackers complete; a parent can unlock all and jump to Sutli Bomb immediately.

---

## Task 12: Calm Corner global interrupt 🔲

- **Objective:** Persistent Calm Corner button that, from any state, pauses all cracker timers/particles, fades cracker audio over 150ms, dims to twilight indigo, runs a 4-second inhale/exhale breathing guide with Pip, and plays a warm pentatonic ambient drone; resuming returns to the prior state.
- **Guidance:** `CalmCorner.jsx` overlay; `GameController.enterCalmCorner()`/`exitCalmCorner()`; `SoundEngine.fadeCracker(150ms)` + `startCalmPad()`; breathing circle scales over 4s; resume restarts appropriate sequence (walk/countdown/show).
- **Tests (Vitest):** calm interrupt from any state pauses timers; resume restores prior FSM state and resumes audio.
- **Demo:** tap Calm Corner mid-Sutli-Bomb → everything pauses, breathing starts, then resume continues the show.

---

## Task 13: Full HUD + cracker carousel wiring 🔲

- **Objective:** Top HUD with master volume slider (0–100%), SOFT/NORMAL/LOUD pill selector, star counter, Sticker Book button, and the persistent Calm Corner button. Bottom carousel with the 6 crackers, big illustrated icons, lock/unlock badges, and 1–4 intensity dots. All audio updates apply live, even mid-cracker.
- **Guidance:** `HUD.jsx` + `CrackerCarousel.jsx` bound to the store; 64px-min targets; high-contrast neon styling; volume/intensity call straight into SoundEngine via GameController.
- **Tests (Vitest):** HUD controls mutate store and produce correct SoundEngine param calls.
- **Demo:** adjust volume or switch intensity while a cracker is active and hear it change in real time.

---

## Task 14: Polish, accessibility & acceptance verification 🔲

- **Objective:** Final integration pass, accessibility audit (contrast, visible focus, 64px targets, `prefers-reduced-motion` to disable jelly-squash and reduce particles), full Vitest suite green, `npm run build` produces an offline `dist/`, and a manual checklist verifying all 8 EARS criteria.
- **Guidance:** audit tap targets and color contrast; respect reduced-motion; run tests; build; walk the EARS checklist.
- **Tests:** entire Vitest suite green.
- **Demo:** complete, end-to-end playable game meeting all 8 EARS criteria; the offline `dist/` build runs by opening its files.
