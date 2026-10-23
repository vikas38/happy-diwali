# Chhotu Champ's Diwali Glow — Documentation

> A gentle, sensory-friendly HTML5 celebration helping children (ages 5–8) explore Diwali firecrackers through predictable routines, gradual sensory exposure, visual sound-taming, and user-controlled audio dynamics.

## Documents

| Document | Description |
|---|---|
| [requirements.md](./requirements.md) | Full game specification: platform constraints, FSM, cracker matrix, audio DSP, UI/UX guardrails, EARS acceptance criteria |
| [implementation-plan.md](./implementation-plan.md) | Architecture, tech stack, module structure, FSM diagram, audio signal chain, build sequence |
| [tasks.md](./tasks.md) | 14-task breakdown with progress tracker, objectives, guidance, tests, and demos per task |

## Quick Start

```bash
npm install      # install dependencies
npm run dev      # start dev server
npm run build    # production build → dist/
npm test         # run Vitest test suite
```

## Tech Stack

- Vite + React 18 (JSX)
- Web Audio API (procedural synthesis, no audio files)
- HTML5 Canvas 2D (procedural visuals, no image assets)
- Vitest (logic unit tests)
- localStorage (persistence: `chhotu_diwali_save_v1`)

## Current Progress

Tasks 1–8 complete (105 tests passing). Remaining: cracker show implementations (T9–T10), reward/sticker book (T11), calm corner overlay (T12), HUD/carousel wiring (T13), final polish (T14).
