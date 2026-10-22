# Chhotu Champ's Diwali Glow — Requirements Specification

> A therapeutic, playful, touch-first HTML5 game for children ages 5–8 to overcome fear of firecrackers (phonophobia) through predictable routines, gradual sensory exposure, visual sound-taming, and user-controlled audio dynamics.

---

## 1. Platform & Architectural Constraints

| Constraint | Detail |
|---|---|
| **Delivery Format** | Vite + React 18 (JSX). Dev: `npm run dev`. Production build: `npm run build` → `dist/` is a fully self-contained, offline bundle. |
| **Zero External Assets** | No external images, sprite sheets, MP3/WAV files, or font CDNs. All characters, environments, UI icons, and effects rendered via HTML5 2D Canvas API, inline SVGs, and CSS3. All audio via Web Audio synthesis. |
| **Viewport & Input** | Portrait-first mobile layout (9:16 container centered on desktop, full-bleed `100dvh` on mobile), `touch-action: manipulation`, safe-area inset support, minimum tap target `64×64px`. |
| **Persistence** | `localStorage` key `chhotu_diwali_save_v1` persisting unlocked crackers, collected stickers, star count, master volume, and selected intensity mode (`SOFT` / `NORMAL` / `LOUD`). |
| **Strict Completeness** | No `// TODO` comments, stubbed functions, or simplified placeholders. Every cracker, particle emitter, and audio synthesizer patch must be fully implemented. |
| **Testing** | Vitest for pure-logic unit tests (FSM transitions, save serialization, audio parameter math, particle physics). Manual browser verification for canvas/audio/visual behavior. |

---

## 2. Finite State Machine (FSM) & Game Flow

```
SAFETY_SPLASH
  → IDLE (carousel visible)
  → CRACKER_INTRO_CARD (first time a cracker is selected)
  → READY_ON_STREET (cracker on rangoli launchpad, pulsing neon ring prompts tap)
  → STEPPING_BACK_SAFE_ROUTINE (1.2s walk to Safe Zone, then cover ears)
  → COUNTDOWN_3_2_1 (3 → 2 → 1 → GLOW!, 800ms per beat, pitched chime ticks)
  → CRACKER_SHOW_ACTIVE (particle + audio sequence, comic word bubbles, sidekick reaction)
  → REWARD_CELEBRATION (3 stars, sticker unlock, confetti, fanfare, "You did it, Champ!")
  → (loop back to READY_ON_STREET via "Light Again" or to next cracker via "Next Cracker")

CALM_CORNER_OVERLAY — global interrupt from ANY state
  (pauses timers/particles, fades audio 150ms, breathing guide, ambient drone, resume to prior state)
```

### State Details

1. **SAFETY_SPLASH** — One-time friendly modal: *"Real crackers are only lit by grown-ups. Stand far away and cover your ears!"* Large bouncy **"I Promise! Let's Play!"** button (min-height 72px) that initializes/resumes the AudioContext.

2. **CRACKER_INTRO_CARD** — Playful bounce-in card: *"Meet [Cracker Name]!"*, animated SVG/Canvas preview, 1-sentence description, **"Put on Street"** button.

3. **READY_ON_STREET** — Cracker on glowing Rangoli launchpad. Chhotu Champ and Pip stand near cracker with safe magic sparkler wand. Pulsing neon ring prompts tap.

4. **STEPPING_BACK_SAFE_ROUTINE** — Fuse sparks gently. Chhotu and Pip walk backward to Safe Zone (1.2s). Chhotu puts on neon ear-muffs / covers ears; Pip hides behind sneakers peeking out happily.

5. **COUNTDOWN_3_2_1** — Large bouncy neon numbers `3 → 2 → 1 → GLOW!` (800ms per beat) synced with gentle pitched marimba/chime ticks so child is never surprised.

6. **CRACKER_SHOW_ACTIVE** — Executes particle emitter sequence + Web Audio synthesis. Comic-book onomatopoeia word bubbles with spring-physics scaling and confetti bursts. Sidekick reacts with happy jumps and heart particles.

7. **REWARD_CELEBRATION** — Awards 3 glowing stars, unlocks sticker in Sticker Book, confetti cannons, synth fanfare, banner: **"You did it, Champ!"**. Buttons: **"Light Again 🔁"** and **"Next Cracker ➡️"**.

8. **CALM_CORNER_OVERLAY** — Accessible at ANY time via persistent **"Calm Corner 🫧"** button (min 64×64px). Pauses all cracker timers/particles, fades cracker audio 150ms, dims to twilight indigo, 4-second inhale/exhale breathing guide with Pip, warm pentatonic ambient drone.

---

## 3. Procedural Visuals, Characters & Particle Engine

### Rendering Pipeline
- 60fps `requestAnimationFrame` delta-time loop on `<canvas>` with crisp `devicePixelRatio` scaling.
- React owns UI/state flow; imperative vanilla JS canvas/audio engines do the 60fps/realtime work.

### A. Indian Diwali Street Environment (Background Layer)
- Deep indigo-violet night sky gradient (`#0B0726` → `#1E1147`) with twinkling procedural stars.
- Festive neighborhood silhouettes with glowing windows, rooftop terraces, hanging marigold torans, swaying fairy string lights (`sin(time)` catenary curves).
- Foreground street with central geometric **Rangoli** launchpad and neon green **SAFE ZONE** footprint mat.

### B. Characters
- **Chhotu Champ**: Procedural vector/canvas character with bouncy idle breathing, oversized expressive eyes with blinking, vibrant cyan/magenta neon kurta with gold trim, chunky sneakers, articulated arms across: `IDLE_WAVE`, `LIGHTING_REACH`, `COVER_EARS_SMILE`, `VICTORY_JUMP`.
- **Pip the Diya**: Terracotta oil lamp with stubby legs, kawaii eyes, flickering golden flame hair-tuft that dances in rhythm with audio level.

### C. Custom Particle & FX Engine
- Object-pooled particle system (capacity 800) at 60fps.
- Particle properties: `x, y, vx, vy, gravity, drag, size, alpha, decay, hue, trailHistory[], shape ('circle'|'star'|'spark'|'confetti')`.
- `ctx.globalCompositeOperation = 'lighter'` for additive neon glow on sparks.
- Screen-shake replaced by **"Bouncy Jelly Squash"** (`scaleX/scaleY` spring oscillation on canvas container).

---

## 4. The 6-Cracker Progression Matrix

| # | Cracker | Visual Particle Behavior | Comic Word Bubble | Audio Synthesis Profile |
|---|---|---|---|---|
| 1 | **Phuljhari** (Sparkler) | Held wand emitting golden-pink star sparks, zero smoke, gentle gravity | `"TWINKLE ✨"` | Silent / Ultra-Soft: delicate sine/triangle wind-chime shimmer (2000–4000Hz, very low gain) |
| 2 | **Anar** (Flowerpot) | Conical pot erupting tall fountain of cyan, gold, magenta sparks that bounce on street | `"FIZZZZZ 🌸"` | Soft: pink-noise through resonant bandpass sweeping 400→1200Hz (gentle waterfall hiss) |
| 3 | **Chakri** (Ground Spinner) | Rapidly rotating ground wheel casting logarithmic spiral trails in rainbow hues | `"WHEEEEE 🌀"` | Soft-Medium: LFO-modulated triangle (6→14Hz spin rate) + filtered sparkle noise |
| 4 | **Rocket** | Golden ember trail straight up (1.0s), then heart/smiley burst of neon stars | `"WHOOSH... POP! 🚀"` | Medium: rising pitch/filter sweep (200→1600Hz) + soft 90Hz thump + chime sparkle |
| 5 | **Ladi** (Garland) | Red string of 8 mini-crackers hopping/popping rhythmically (180ms apart) with multicolor confetti | `"POP! POP! POP! 🎉"` | Medium-Loud: rhythmic 40ms bandpass noise bursts + woodblock/pop pitches |
| 6 | **Sutli Bomb** | Green twine cube swells like balloon, then massive rainbow confetti & star explosion with giant banner | `"BOOOOM! 💥🌈"` | Loudest (Tamed): sub-drop sine (120→35Hz over 250ms) + LP-shaped noise + slide-whistle cheer |

---

## 5. Web Audio API DSP & Fear-Reduction Engine

### Master Signal Chain
```
Source Nodes → IntensityProfileGainAndFilter → MasterVolumeGainNode → SafetyDynamicsCompressorNode → AudioContext.destination
```

### Three-Tier Intensity Toggle

| Mode | Gain Multiplier | Low-Pass Cutoff |
|---|---|---|
| SOFT | 0.22 | 900 Hz (removes sharp transients, turns bangs into soft pillows) |
| NORMAL | 0.55 | 2800 Hz |
| LOUD | 1.0 | 8000 Hz (full festive punch, still protected by safety limiter) |

### Safety Compressor
- Threshold: -12dB, Ratio: 8:1, Attack: 0.002s, Knee: 30, Release: 0.25s

### Master Volume
- Continuous range slider (0%–100%) in top HUD alongside Music Mute button.
- All live param changes use `setTargetAtTime` to avoid clicks.

### Procedural Music
- **Street Festive Loop**: Gentle slow-tempo Indian pentatonic melody (Raag Bhopali/Desh: C D E G A) on synthesized plucked sitar/marimba voice at low volume.
- **Calm Corner Pad**: Warm slow-attack sine/triangle chord pad (Fmaj7 / Cmaj7) synced with breathing guide.

---

## 6. UI/UX & Accessibility Guardrails

### Top HUD
- Master Volume slider + `Soft / Normal / Loud` pill selector.
- Star counter + **"Sticker Book 📖"** button.
- Persistent high-contrast **"Calm Corner 🫧"** button.

### Bottom Dock
- Horizontal carousel of 6 crackers with big illustrated icons, lock/unlock badges, intensity dots (1–4).
- Free replay of unlocked gentler crackers; "Parent Unlock All" toggle in Sticker Book.

### Zero Punishment
- No timers, no health bars, no fail states, no scary smoke or fire damage visuals.

---

## 7. EARS Acceptance Criteria

| # | Criterion |
|---|---|
| 1 | **WHEN** the app first loads, **THE SYSTEM SHALL** display the Safety Splash modal instructing the child that real crackers are only lit by grown-ups and require standing back and covering ears. |
| 2 | **WHEN** the user taps any cracker for the first time, **THE SYSTEM SHALL** display its "Meet [Cracker]!" intro card describing its light and sound before placing it on the street. |
| 3 | **WHEN** the user taps a cracker on the street to light it, **THE SYSTEM SHALL** animate Chhotu Champ and sidekick walking back to the Safe Zone and covering their ears before the cracker activates. |
| 4 | **WHEN** Chhotu reaches the Safe Zone, **THE SYSTEM SHALL** display a visible and audible 3-2-1 countdown prior to triggering the cracker's main effect. |
| 5 | **WHEN** a cracker produces its sound, **THE SYSTEM SHALL** simultaneously render a bouncy comic-book word bubble and happy sidekick reaction to visually tame the noise. |
| 6 | **WHEN** the user switches intensity modes or adjusts Master Volume, **THE SYSTEM SHALL** immediately update the Web Audio API gain and low-pass filter in real time, even mid-cracker. |
| 7 | **WHEN** the user taps "Calm Corner", **THE SYSTEM SHALL** immediately pause active cracker sequences, silence cracker audio, and present a soothing breathing animation with ambient music. |
| 8 | **WHEN** a cracker sequence completes, **THE SYSTEM SHALL** award stars, unlock the corresponding sticker in localStorage, and display the "You did it, Champ!" celebration overlay. |
