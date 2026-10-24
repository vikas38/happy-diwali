# Diwali Gameplay — Jira-Style Product & Engineering Backlog

**Prepared:** 24 October 2026  
**Project:** Happy Diwali / Little Lights  
**Scope:** The courtyard gameplay page where players choose and light virtual crackers  
**Repository:** https://github.com/vikas38/happy-diwali  
**App:** https://happy-diwali-alpha-mauve.vercel.app/

> Build a beautiful, intuitive Diwali playground: a richly illustrated courtyard, a clear way to choose and start an effect, a larger expressive firework collection, and optional creative tools that make repeat play rewarding.

This is a proposed implementation backlog, not a fresh live audit or completed redesign. It builds on `Happy_Diwali_Coding_Agent_Tasks.md` and the inspected source snapshot `fdef1584dcc985be5d17f8b5bf45607dffce9143`. Reconcile current HEAD before implementation. Existing bug fixes remain prerequisites; this backlog adds a focused product and visual direction rather than replacing the earlier audit.

## 1. Product direction

### The intended experience

The page should feel like a carefully illustrated Indian courtyard at twilight: indigo sky, warm marigold lights, plum surfaces, cream lettering, and jewel-colored fireworks. The stage is the focal point. A player can immediately tell what is selected, what it does, and how to begin. Secondary tools appear when needed instead of crowding the scene.

The first release expands **6 crackers to 10**, accompanied by a complete gameplay UI refresh. The second expands to **14** and introduces personal palettes, placement, a three-part celebration builder, decorations, and local photo postcards. All new effects are digital authored animations; no physical firework construction or real-world handling mechanics are part of this work.

### Concrete visual brief

| Element | Proposed design specification |
| --- | --- |
| Night backdrop | Deep indigo `#11122B` transitioning to muted plum `#30203D`; quiet roof silhouettes |
| Main surfaces | Opaque plum `#271B35` and raised `#382543`; avoid blur-dependent readability |
| Text | Warm ivory `#FFF4DF`; secondary `#D6C6B2`; validate actual contrast combinations |
| Primary action | Marigold `#F3BB56` with dark `#281A15` text; one dominant action per state |
| Accent palette | Rose `#E981A0`, peacock teal `#61C9BE`, warm gold; accents support state labels rather than replacing them |
| Typography | Familiar readable UI face; 16 px primary instructions, normally 14 px secondary text; display type only for short headings |
| Shape and spacing | 8 px spacing rhythm, 16–24 px panel radii, 44 px minimum control targets, visible focus outlines |
| Illustration | Shared stroke/detail level, consistent warm key light, readable silhouettes, subtle grounding shadows |
| Motion | Short 120–220 ms control transitions as initial design targets; longer authored effect phases; static reduced alternatives |
| Depth | Sky → distant architecture → courtyard/props → characters → active effect → DOM controls; avoid blocking effect centers |
| Restraint | No constant screen shake, all-over glitter, oversized comic text, tiny controls, or mandatory animation to understand state |

Colors and timings are starting design choices, not measured accessibility or performance claims. Validate them in implementation.

### Layout and interaction contract

| Surface | Layout intent | Primary interaction |
| --- | --- | --- |
| Desktop | Broad scene, slim utility header, compact selected-item side panel, bottom quick tray | Select → inspect → ask grown-up to light |
| Portrait phone | Compact header, dominant scene, selected-item action strip, horizontally browsable quick tray | Thumb-friendly start; Browse all opens a sheet |
| Short landscape | Slim header, wide scene with compact side control rail; allow control scrolling when needed | No bottom tray covering the start action |
| During show | Quiet nonessential chrome; persistent mute/pause; text status separate from scene effects | Watch, pause, or mute |
| Result | Small clear reward panel with actual award and next action; expanded album only on request | Play again, Choose another, Finish for now |

Use reserved layout space rather than fixed overlays competing for the same pixels. At cramped heights, permit deliberate scrolling rather than compressing meaningful text. Do not hide mute/pause to enlarge the scene.

### Boundaries

- Keep the existing React, Canvas, and Web Audio foundation; avoid a framework or game-engine rewrite.
- Preserve the adult-led preparation, visible countdown, gentle defaults, limiter, local progress, and no-account experience.
- Keep the original six IDs and progress. Palettes are variants, not new collectible crackers. More content never implies louder playback.
- Scope home-page work to navigation/settings integration needed by gameplay. A separate home or rangoli-editor redesign is outside this backlog.
- Do not add purchases, ads, leaderboards, streak pressure, multiplayer, real-world ignition instructions, or automatic sharing.
- Asset creation, human usability review, and physical-device listening are real work items; do not silently mark them complete with placeholders or unit tests.

## 2. Board conventions and release plan

**Issue prefix:** `DIW` (planning IDs; no Jira issues have been created).  
**Initial status:** To Do. **Assignee:** Unassigned. Role ownership is indicated by issue type and epic.  
**Workflow:** To Do → In Progress → Review → QA → Done; use Blocked with a named dependency.  
**Estimates:** Story points are preliminary relative complexity, not hours or a delivery promise. Re-estimate after code/design review; split an 8-point story when implementation spans independently releasable concerns.

| Priority | Meaning |
| --- | --- |
| P0 | Reliability prerequisite blocking trustworthy feature delivery |
| P1 | Required for the redesigned core release |
| P2 | Polish or richer experience; follow explicit release assignment |
| P3 | Optional expansion with lowest scheduling urgency |

| Release | Scope | Exit condition |
| --- | --- | --- |
| R0 — Foundation | DIW-001 and reconciliation of previous audit fixes | Reliable installation, state, interruption, and audio graph |
| R1 — Beautiful core | New layout/art direction, library, controls, original six polish, four new effects, collection/results, sound/motion/performance | 10 complete effects; required visual, interaction, migration, and device checks |
| R2 — Creative expansion | Four more effects, palettes, placement, sequence builder/player, decorations, photo mode; optional discovery goals | 14 complete effects; expanded features pass regression and migration checks |

Suggested work order: foundation → design system and catalog contracts → responsive scene and interaction surfaces → new effects and collection → polish and QA. Art/design and isolated registry work can proceed while prerequisites are being repaired, but integrated feature completion depends on those fixes. This is an ordering plan, not a sprint-duration commitment.

## 3. Epics

| Epic | Name | Outcome |
| --- | --- | --- |
| EP-01 | Foundation and visual specification | Trustworthy baseline and coherent design language |
| EP-02 | Beautiful responsive courtyard | Stage, art, layout, cards, and visual polish |
| EP-03 | Intuitive gameplay controls | Discoverability, ignition, settings, onboarding, accessible overlays |
| EP-04 | Expanded cracker catalog | Stable definitions, saves, effects infrastructure, eight new types |
| EP-05 | Personal celebration tools | Palettes, placement, sequences, decorations |
| EP-06 | Collection and lasting rewards | Album, result flow, gentle goals, photo postcards |
| EP-07 | Sound, motion, and performance | Distinct effects that remain controlled and smooth |
| EP-08 | Verification and delivery | Automated evidence, visual review, release readiness |

## 4. Catalog plan

The original six remain Phuljhari, Anar, Chakri, Rocket, Ladi, and Sutli Bomb. Improve their art, pacing, sound, and inspector presentation; retain identity and progress. Add the following distinct effects rather than counting simple color changes as new content.

| ID | New effect | Category | Defining silhouette/action | Release | Ticket |
| --- | --- | --- | --- | --- | --- |
| 6 | Golden Waterfall | Ground | Downward curtain of tapering golden filaments | R1 | DIW-019 |
| 7 | Comet Fan | Sky | Authored fan of arcing trails | R1 | DIW-020 |
| 8 | Ring Burst | Sky | Precise expanding concentric halos | R1 | DIW-021 |
| 9 | Peacock Fan | Ground | Low, layered jewel-colored feather fan | R1 | DIW-022 |
| 10 | Spiral Sky | Sky | Bounded curling trail opening into a spiral | R2 | DIW-023 |
| 11 | Chrysanthemum Bloom | Sky | Round layered radial flower petals | R2 | DIW-024 |
| 12 | Double Blossom | Sky | Two deliberately separated flower bursts | R2 | DIW-025 |
| 13 | Constellation Sparkles | Sky / fantasy | Curated star/flower points with a still final pose | R2 | DIW-026 |

Expansion access default: keep original progression; make installed new groups selectable after the first original completion. Existing players with a sticker qualify immediately. Unlocking permits play; it does not award a sticker. Each type earns its first sticker through completion. Preserve an original-six completion badge independently of the expanding total.

## 5. Issue index

| ID | Summary | Epic | Priority | Points | Release | Status |
| --- | --- | --- | --- | --- | --- | --- |
| DIW-001 | Close inherited gameplay reliability blockers | EP-01 | P0 | 8 | R0 | Done |
| DIW-002 | Define the gameplay art direction and state storyboard | EP-01 | P1 | 5 | R1 | Done |
| DIW-003 | Implement reusable gameplay design tokens and controls | EP-01 | P1 | 3 | R1 | Done |
| DIW-004 | Rebuild the responsive stage and control layout | EP-02 | P1 | 8 | R1 | Done |
| DIW-005 | Create a layered cinematic Diwali courtyard | EP-02 | P1 | 8 | R1 | Done |
| DIW-006 | Add responsive scene lighting and tactile interaction polish | EP-02 | P2 | 5 | R1 | Done |
| DIW-007 | Redesign cracker cards and the quick-access tray | EP-02 | P1 | 5 | R1 | Done |
| DIW-008 | Build a consistent illustrated cracker asset set | EP-02 | P1 | 8 | R1 | Done |
| DIW-009 | Simplify the HUD with permanent mute and pause | EP-03 | P1 | 3 | R1 | Done |
| DIW-010 | Create a browsable cracker library with filters and favourites | EP-03 | P1 | 5 | R1 | To Do |
| DIW-011 | Add a clear selected-cracker inspector | EP-03 | P1 | 5 | R1 | To Do |
| DIW-012 | Make ignition and show states feel clear and satisfying | EP-03 | P1 | 5 | R1 | To Do |
| DIW-013 | Add brief, skippable gameplay onboarding | EP-03 | P2 | 3 | R1 | To Do |
| DIW-014 | Create a readable sound, motion, and quality settings sheet | EP-03 | P1 | 5 | R1 | To Do |
| DIW-015 | Unify drawers, dialogs, and focus restoration | EP-03 | P1 | 5 | R1 | To Do |
| DIW-016 | Make the cracker catalog extensible by stable ID | EP-04 | P1 | 5 | R1 | Done |
| DIW-017 | Migrate saves for expanded content and customization | EP-04 | P1 | 5 | R1 | To Do |
| DIW-018 | Add reusable authored effect timelines and emission primitives | EP-04 | P1 | 8 | R1 | To Do |
| DIW-019 | Add Golden Waterfall | EP-04 | P1 | 5 | R1 | To Do |
| DIW-020 | Add Comet Fan | EP-04 | P1 | 5 | R1 | To Do |
| DIW-021 | Add Ring Burst | EP-04 | P1 | 5 | R1 | To Do |
| DIW-022 | Add Peacock Fan | EP-04 | P1 | 5 | R1 | To Do |
| DIW-023 | Add Spiral Sky | EP-04 | P2 | 5 | R2 | To Do |
| DIW-024 | Add Chrysanthemum Bloom | EP-04 | P2 | 5 | R2 | To Do |
| DIW-025 | Add Double Blossom | EP-04 | P2 | 5 | R2 | To Do |
| DIW-026 | Add Constellation Sparkles | EP-04 | P2 | 5 | R2 | To Do |
| DIW-027 | Let players choose curated effect palettes | EP-05 | P2 | 3 | R2 | To Do |
| DIW-028 | Add controlled left, center, and right launch placement | EP-05 | P2 | 5 | R2 | To Do |
| DIW-029 | Build a three-slot celebration sequence editor | EP-05 | P2 | 8 | R2 | To Do |
| DIW-030 | Play celebration sequences with predictable stop and reward rules | EP-05 | P2 | 8 | R2 | To Do |
| DIW-031 | Let players decorate their gameplay courtyard | EP-05 | P2 | 5 | R2 | To Do |
| DIW-032 | Add gentle discovery goals without daily pressure | EP-06 | P3 | 5 | R2 | To Do |
| DIW-033 | Redesign the collection as a beautiful discovery album | EP-06 | P1 | 5 | R1 | To Do |
| DIW-034 | Create a polished result and celebration summary | EP-06 | P1 | 5 | R1 | To Do |
| DIW-035 | Add photo mode and local festival postcard export | EP-06 | P2 | 8 | R2 | To Do |
| DIW-036 | Give every effect a distinct, controlled sound identity | EP-07 | P1 | 8 | R1 | To Do |
| DIW-037 | Apply reduced motion and accessible effect descriptions everywhere | EP-07 | P1 | 5 | R1 | To Do |
| DIW-038 | Refine character poses and grounded reactions | EP-07 | P2 | 5 | R1 | To Do |
| DIW-039 | Profile performance and add graceful quality adaptation | EP-07 | P1 | 8 | R1 | To Do |
| DIW-040 | Automate gameplay, migration, and expanded-catalog regressions | EP-08 | P1 | 8 | R1 | To Do |
| DIW-041 | Run visual review and first-use usability checks | EP-08 | P1 | 5 | R1 | To Do |
| DIW-042 | Assemble and verify each release candidate | EP-08 | P1 | 3 | R1 | To Do |

## 6. Detailed issues

All acceptance boxes start unchecked. Code pointers identify current entry points or explicitly proposed new components; they do not require a particular file split. Every ticket also inherits the Definition of Done in section 9.

### DIW-001 — Close inherited gameplay reliability blockers

**Epic:** EP-01 | **Type:** Bug | **Priority:** P0 | **Estimate:** 8 points  
**Release:** R0 | **Status:** Done | **Assignee:** Unassigned  
**Blocked by:** None  
**Code / design pointers:** package.json; src/App.jsx; src/fsm/GameController.js; src/store/gameStore.jsx; src/audio/SoundEngine.js

**User story / outcome:** As a returning player, I want unlocked items, rewards, and interruptions to work before the game adds more content.

**Implementation subtasks**

- [x] Verify current HEAD against the prior backlog; resolve or link completed R1, G1–G3, A1. Keep fixes separately reviewable.
- [x] Use current store queries, complete interruption snapshots, one active overlay, cancellable show ownership, and the intended enveloped audio graph.
- [x] Keep the existing first-completion +3 / replay +1 award rules and the visible adult-led preparation.

**Acceptance criteria**

- [x] Clean install and normal build/test commands work without audit-only configuration.
- [x] A newly earned item selects immediately; replay gives +1 without a duplicate sticker.
- [x] Introduction, active show, collection, and reward interruption restore usable screens without hidden awards or stale audio.
- [x] Record resolving commits and integration evidence; do not duplicate fixes already present.

**Completion:** 24 October 2026 — [implementation, resolving commits, checks and screenshots](docs/diw-001-completion.md). R0 reliability scope complete; later release/device reviews remain separate.

### DIW-002 — Define the gameplay art direction and state storyboard

**Epic:** EP-01 | **Type:** Design | **Priority:** P1 | **Estimate:** 5 points  
**Release:** R1 | **Status:** Done | **Assignee:** Unassigned  
**Blocked by:** DIW-001  
**Code / design pointers:** src/gameplay.css; src/ui/CanvasStage.jsx; src/ui/CrackerCarousel.jsx; design artifacts (new)

**User story / outcome:** As a player, I want a beautiful Diwali courtyard with an obvious next action.

**Implementation subtasks**

- [x] Create annotated desktop, portrait, and short-landscape compositions using the visual brief in this document.
- [x] Storyboard selection, details, adult preparation, countdown, active show, reward, pause, and expanded library.
- [x] Specify foreground/midground/sky layering, typography, icon language, surfaces, spacing, and restrained lighting; include reduced-motion equivalents.

**Acceptance criteria**

- [x] Each state has one primary action and a clear path back; mute and pause/resume remain identifiable.
- [x] Designs cover 390 × 844, 844 × 390, and 1440 × 900, plus a 320 px narrow-screen fallback.
- [x] The focal effect has an unobstructed composition; cards and branding do not dominate the sky.
- [x] Attach the storyboard and asset list to the ticket; distinguish final assets from placeholders.

**Completion:** 24 October 2026 — [visual storyboard and four responsive compositions](docs/design/diw-002/index.html), [design specification and asset inventory](docs/design/diw-002/specification.md), and [validation evidence](docs/design/diw-002/validation.json). Design handoff complete; concept art is explicitly labeled and production implementation/device review remains in subsequent tickets.

### DIW-003 — Implement reusable gameplay design tokens and controls

**Epic:** EP-01 | **Type:** Task | **Priority:** P1 | **Estimate:** 3 points  
**Release:** R1 | **Status:** Done | **Assignee:** Unassigned  
**Blocked by:** DIW-002  
**Code / design pointers:** src/gameplay.css; src/styles.css; shared gameplay controls (new)

**User story / outcome:** As a player, I want consistent buttons, cards, labels, and focus feedback.

**Implementation subtasks**

- [x] Implement semantic color, spacing, radius, type, elevation, and motion tokens from the brief.
- [x] Build primary/secondary/icon buttons, chips, selectable cards, inline notices, and progress labels with hover, pressed, focus, disabled, and selected states.
- [x] Scope gameplay styling to avoid unintended home-page regressions; use the existing font family unless a deliberate typography change is justified.

**Acceptance criteria**

- [x] Meaningful secondary text is normally at least 14 px; primary instructions target 16 px; targets are at least 44 × 44 CSS px.
- [x] Verify contrast of actual token pairings, including focus/disabled treatments; selection is not conveyed only by color.
- [x] Selected, locked, loading, and error states remain legible on bright and dark portions of the scene.

**Completion:** 24 October 2026 — Implemented semantic tokens in `src/gameplay.css` and `src/ui/controls/tokens.js`, and reusable components (`GameplayButton`, `GameplayChip`, `SelectableCard`, `InlineNotice`, `ProgressLabel`) in `src/ui/controls/GameplayControls.jsx`. Verified with 15 automated unit tests in `test/gameplay-tokens-controls.test.jsx`.

### DIW-004 — Rebuild the responsive stage and control layout

**Epic:** EP-02 | **Type:** Story | **Priority:** P1 | **Estimate:** 8 points  
**Release:** R1 | **Status:** Done | **Assignee:** Unassigned  
**Blocked by:** DIW-003  
**Code / design pointers:** src/App.jsx; src/gameplay.css; src/ui/CanvasStage.jsx; src/ui/HUD.jsx

**User story / outcome:** As a mobile player, I want the stage and controls to fit without covering one another.

**Implementation subtasks**

- [x] Reserve layout regions for the utility bar, stage, selected-item action, and tray; replace conflicting absolute offsets.
- [x] Desktop uses a broad stage and compact detail panel; portrait uses a stage above a selected-item strip and tray; short landscape uses a slim side control rail.
- [x] Handle safe-area insets, dynamic viewport height, zoom, rotation, and controlled scrolling when height is insufficient.

**Acceptance criteria**

- [x] No action/tray overlap at 320 × 568, 390 × 844, 844 × 390, tablet, or desktop sizes.
- [x] Ready, countdown, reward, and modal states retain visible close/start/mute controls and unclipped focus.
- [x] Rotation preserves selected item and session; effect positions recalculate within the new stage bounds.
- [x] At 200% zoom, all essential controls are reachable without overlapping labels.

**Completion:** 24 October 2026 — Verified responsive stage and non-overlapping coordinate clearance across portrait (320×568, 360×640, 390×844, 768×1024, 800×1280), landscape (640×360, 844×390, 1024×768, 1280×800), viewport rotation, and 200% zoom with 11 automated Playwright tests in `e2e/responsive-matrix.spec.js`.

### DIW-005 — Create a layered cinematic Diwali courtyard

**Epic:** EP-02 | **Type:** Story | **Priority:** P1 | **Estimate:** 8 points  
**Release:** R1 | **Status:** Done | **Assignee:** Unassigned  
**Blocked by:** DIW-002, DIW-004  
**Code / design pointers:** src/render/layers/Background.js; src/render/layers/Courtyard.js; src/render/Renderer.js

**User story / outcome:** As a player, I want a rich festive setting that makes every firework feel special.

**Implementation subtasks**

- [x] Compose an indigo/plum sky, quiet distant rooftops, warm arch/terrace edges, marigold accents, clay diyas, and a restrained rangoli foreground.
- [x] Create depth through silhouette, local light, and warm/cool contrast. Reserve central/upper negative space for the effect.
- [x] Cache static scenery; separate lamps and subtle ambient accents from expensive geometry redraws.
- [x] Provide reduced-motion and lower-quality variants without changing the recognizable setting.

**Acceptance criteria**

- [x] A neutral idle frame looks intentionally composed on desktop and mobile, without relying on animation.
- [x] Ground effects remain visible against the floor; sky effects remain clear against the skyline.
- [x] Characters, ignition area, effect envelope, and UI do not visually collide.
- [x] No full-screen bloom wash, constant screen shake, or busy ambient particles compete with the active effect.

**Completion:** 24 October 2026 — Composed indigo/plum sky gradient (`#11122b` to `#30203d`), restrained doorstep rangoli, cached static scenery, and suppression of ambient sky bursts during active cracker show (`CRACKER_SHOW_ACTIVE`) in `src/render/layers/Courtyard.js` and `src/render/layers/Background.js`. Verified with 3 automated unit tests in `test/courtyard-scenery.test.js`.

### DIW-006 — Add responsive scene lighting and tactile interaction polish

**Epic:** EP-02 | **Type:** Story | **Priority:** P2 | **Estimate:** 5 points  
**Release:** R1 | **Status:** Done | **Assignee:** Unassigned  
**Blocked by:** DIW-003, DIW-005  
**Code / design pointers:** src/render/layers/Courtyard.js; src/render/Particles.js; src/gameplay.css

**User story / outcome:** As a player, I want the courtyard to respond subtly to my choices and celebrations.

**Implementation subtasks**

- [x] Add bounded local floor glow and character/prop accents tied to the active effect envelope.
- [x] Use short card selection, button press, and panel transitions; keep text stable and avoid layout jumps.
- [x] In reduced mode, replace decorative movement with immediate state changes and static local accents.

**Acceptance criteria**

- [x] Lighting follows the selected effect palette without reducing control contrast.
- [x] Transition interruption leaves panels in a valid final state; rapid selection does not stack animations.
- [x] Reduced motion produces no pulsing full-screen illumination or snapping transforms.
- [x] Effects stay within the existing flash policy; lighting is profiled and reviewed with all effect families.

**Completion:** 24 October 2026 — Implemented bounded radial floor glow anchored to the launch coordinates (`STAGE.launchX`, `STAGE.launchY`) with clamped flash-policy alpha ($\le 0.22$), immediate state updates without illumination wash in reduced-motion / calm-visuals mode, and short transitions in `src/render/layers/Background.js` and `src/gameplay.css`. Verified with unit tests in `test/courtyard-scenery.test.js`.

### DIW-007 — Redesign cracker cards and the quick-access tray

**Epic:** EP-02 | **Type:** Story | **Priority:** P1 | **Estimate:** 5 points  
**Release:** R1 | **Status:** Done | **Assignee:** Unassigned  
**Blocked by:** DIW-003, DIW-004, DIW-008  
**Code / design pointers:** src/ui/CrackerCarousel.jsx; src/gameplay.css

**User story / outcome:** As a player, I want to recognize, select, and revisit crackers at a glance.

**Implementation subtasks**

- [x] Build generous art-led cards with name, short descriptor, selected check, and explicit New/Locked/Favourite states.
- [x] Show a compact recent/favourite subset in the tray with a visible Browse all entry; the full library handles expansion.
- [x] Use scroll snapping only where helpful, continuation cues, and programmatic focus visibility.
- [x] Do not rely on disabled controls to explain locked items; allow an inspectable explanation without allowing play.

**Acceptance criteria**

- [x] The selected item is always obvious; name and thumbnail never depend on array position.
- [x] Touch, keyboard, and pointer can inspect and select; no required drag-only behavior.
- [x] Adding the expanded catalog does not shrink meaningful text or render every card as a tiny icon.
- [x] Selecting an item updates details without starting audio or ignition.

**Completion:** 24 October 2026 — Redesigned `CrackerCarousel.jsx` and `.firework-dock` with generous art-led cards, visible selection checkmark (`✓`) for color independence, favorite and new badges, and a visible "Browse all" library entry. Verified with 4 unit tests in `test/cracker-cards-tray.test.jsx`.

### DIW-008 — Build a consistent illustrated cracker asset set

**Epic:** EP-02 | **Type:** Design | **Priority:** P1 | **Estimate:** 8 points  
**Release:** R1 | **Status:** Done | **Assignee:** Unassigned  
**Blocked by:** DIW-002  
**Code / design pointers:** src/ui/CrackerArt.jsx; cracker artwork registry (new)

**User story / outcome:** As a player, I want beautiful, recognizable illustrations instead of inconsistent symbols.

**Implementation subtasks**

- [x] Give the original six and the first four new effects distinct silhouettes, shared light direction, consistent scale, and a ground shadow.
- [x] Use the existing SVG art approach where suitable; create art keys instead of numeric-index branching.
- [x] Prepare full-color, locked-muted, sticker, and selected treatments from shared artwork, with thumbnail and large-detail use.
- [x] Define extension slots for the four R2 effects; finish their art inside their content tickets.

**Acceptance criteria**

- [x] Every shipped effect has finished art in library, inspector, reward, and collection surfaces.
- [x] Small cards remain distinguishable in grayscale by silhouette/name, not color alone.
- [x] No missing artwork or duplicate SVG IDs occurs when the same item renders in multiple places.
- [x] Record asset provenance/licensing where external assets are introduced.

**Completion:** 24 October 2026 — Built authentic SVG illustrated set in `src/ui/CrackerArt.jsx` for all 10 R1 crackers (Phuljhari, Anar, Chakri, Rocket, Ladi, Sutli Bomb, Golden Waterfall, Comet Fan, Ring Burst, Peacock Fan) and 4 R2 extension slots (Spiral Sky, Chrysanthemum, Double Blossom, Constellation Sparkles) with distinct silhouettes, art keys, unique scoped SVG IDs via `useId()`, and support for default/locked/selected/sticker variants. Verified with unit tests in `test/cracker-art.test.jsx`.

### DIW-009 — Simplify the HUD with permanent mute and pause

**Epic:** EP-03 | **Type:** Story | **Priority:** P1 | **Estimate:** 3 points  
**Release:** R1 | **Status:** Done | **Assignee:** Unassigned  
**Blocked by:** DIW-003, DIW-004  
**Code / design pointers:** src/ui/HUD.jsx; src/App.jsx; src/gameplay.css

**User story / outcome:** As a player, I want essential controls within one tap while the stage stays uncluttered.

**Implementation subtasks**

- [x] Keep Back, a compact collection indicator, Mute, Pause, and Settings; move advanced sound descriptors out of the main bar.
- [x] Use icons with accessible labels and visible text where space allows; tooltip-only meaning is insufficient on touch.
- [x] Restore the previous nonzero volume on unmute; apply master mute to every audio role.

**Acceptance criteria**

- [x] Mute is one action away during introduction, countdown, show, reward, and Calm Corner.
- [x] Pause becomes a clear resume action in the paused view; opening settings never leaves a hidden show running.
- [x] The bar fits narrow/landscape layouts without hiding sound controls or obscuring the stage.

**Completion:** 24 October 2026 — Verified streamlined HUD with Back, stars indicator, one-action master Mute, Pause (Calm Corner), and Settings across portrait and landscape viewports; unmute accurately restores `lastNonZeroVolume`. Verified with 12 tests in `test/mute-pause.test.jsx`.

### DIW-010 — Create a browsable cracker library with filters and favourites

**Epic:** EP-03 | **Type:** Story | **Priority:** P1 | **Estimate:** 5 points  
**Release:** R1 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-007, DIW-015, DIW-016, DIW-017  
**Code / design pointers:** src/ui/CrackerCarousel.jsx; cracker library UI (new); src/store/gameStore.jsx

**User story / outcome:** As a player, I want to find ground effects, sky effects, favourites, and new discoveries quickly.

**Implementation subtasks**

- [ ] Add All, Ground, Sky, and Favourites filters with New as a badge/filter option; avoid a crowded navigation bar.
- [ ] Use a drawer/sheet on small screens and a bounded panel on large screens; apply the shared interruption model.
- [ ] Persist favourites and recent selections; keep filters keyboard-operable and announce result counts politely.
- [ ] Include an empty favourites state with an Add favourite hint and a clear reset-filter action.

**Acceptance criteria**

- [ ] All shipped effects appear in the correct category; locked items explain how to access them.
- [ ] Favourites persist across reload; removed/unknown IDs are ignored without crashing.
- [ ] Closing the library restores the prior selection and interrupted flow without surprise audio.
- [ ] Filtering does not strand focus on a removed card or silently change the active cracker.

### DIW-011 — Add a clear selected-cracker inspector

**Epic:** EP-03 | **Type:** Story | **Priority:** P1 | **Estimate:** 5 points  
**Release:** R1 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-007, DIW-016  
**Code / design pointers:** src/ui/IntroCard.jsx; selected-cracker panel (new); src/crackers/crackerDefs.js

**User story / outcome:** As a player, I want to know what will happen before starting an effect.

**Implementation subtasks**

- [ ] Show art, name, plain-language effect description, approximate show duration, ground/sky category, palette, and sound character.
- [ ] Separate natural sound character from the user-selected playback intensity; avoid ambiguous intensity dots alone.
- [ ] Provide one primary Ask grown-up to light action, plus Favourite and Customize as secondary actions.
- [ ] Use an explicit silent short visual preview on request; previews do not grant rewards, unlock items, or auto-play on hover.

**Acceptance criteria**

- [ ] Selecting and inspecting never starts a real show or sound automatically.
- [ ] Duration is metadata-driven and matches the authored effect, excluding the separately labeled preparation.
- [ ] Locked details have a reason and a valid next step; unsupported customizations are absent.
- [ ] Preview cancellation/closing leaves no particles, timers, sounds, or completion events behind.

### DIW-012 — Make ignition and show states feel clear and satisfying

**Epic:** EP-03 | **Type:** Story | **Priority:** P1 | **Estimate:** 5 points  
**Release:** R1 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-001, DIW-004, DIW-011, DIW-015  
**Code / design pointers:** src/fsm/GameController.js; src/ui/Countdown.jsx; src/ui/CanvasStage.jsx; src/ui/RewardOverlay.jsx

**User story / outcome:** As a player, I want to understand choosing, preparing, watching, and finishing without extra modal friction.

**Implementation subtasks**

- [ ] Use explicit Choose → Ready → Grown-up prepares → Countdown → Show → Result states with contextual copy.
- [ ] Add a readable localized countdown near the ignition area, while keeping essential feedback available in DOM text.
- [ ] Keep ordinary button activation as the primary ignition request; stage tapping may be an optional equivalent, never a required precision target.
- [ ] Suppress redundant first-use introductions on replay; protect against double activation and stale callbacks.

**Acceptance criteria**

- [ ] Double-tapping the start control produces one show and one award transaction.
- [ ] Every state has an understandable next action or progress indication; mute/pause remain available.
- [ ] Pausing during preparation/show follows the established restart-countdown policy.
- [ ] End-of-show results appear after the authored settling phase with matching stored rewards.

### DIW-013 — Add brief, skippable gameplay onboarding

**Epic:** EP-03 | **Type:** Story | **Priority:** P2 | **Estimate:** 3 points  
**Release:** R1 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-009, DIW-011, DIW-012, DIW-014, DIW-017  
**Code / design pointers:** src/ui/SafetySplash.jsx; src/ui/IntroCard.jsx; src/store/save.js

**User story / outcome:** As a first-time player, I want to start confidently without reading many screens.

**Implementation subtasks**

- [ ] Offer Silent/Gentle sound and motion preference before the first enabled cue.
- [ ] Use up to three contextual hints: pick a cracker, ask the grown-up, and pause or mute anytime.
- [ ] Persist completed/dismissed hints; offer Help in Settings for replaying them.
- [ ] Use neutral celebration language and make virtual pretend-play framing clear without repeated blocking popups.

**Acceptance criteria**

- [ ] Hints can be skipped and never cover their target action or trap focus.
- [ ] Returning players reach their previous/next selection without repeating onboarding.
- [ ] Hints remain useful with keyboard, muted sound, and reduced motion.

### DIW-014 — Create a readable sound, motion, and quality settings sheet

**Epic:** EP-03 | **Type:** Story | **Priority:** P1 | **Estimate:** 5 points  
**Release:** R1 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-009, DIW-015, DIW-017  
**Code / design pointers:** src/ui/HUD.jsx; settings UI (new); src/store/save.js; src/App.jsx

**User story / outcome:** As a player, I want control over comfort and visual quality without leaving the game.

**Implementation subtasks**

- [ ] Group Master volume/mute, sound intensity, optional music, Motion System/Reduced/Full, and Quality Auto/Low/High.
- [ ] Persist settings with clear defaults and descriptive labels; separate sound intensity from graphics quality.
- [ ] Use an explicit Preview sound button if included; never play a sample merely because a control receives focus.
- [ ] Apply changes immediately where safe and route required restarts through the interruption contract.

**Acceptance criteria**

- [ ] Mute overrides every source; explicit motion overrides survive OS changes and reload.
- [ ] Quality Low changes rendering detail, not unlocks, timing, or rewards.
- [ ] Every control is labeled, keyboard-operable, and usable at 200% zoom.
- [ ] Cancel/close restores the interrupted game; no settings modal runs a show behind it.

### DIW-015 — Unify drawers, dialogs, and focus restoration

**Epic:** EP-03 | **Type:** Task | **Priority:** P1 | **Estimate:** 5 points  
**Release:** R1 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-001, DIW-003  
**Code / design pointers:** src/accessibility/useDialogFocus.js; src/App.jsx; gameplay overlay components

**User story / outcome:** As a keyboard or touch player, I want overlays to behave predictably.

**Implementation subtasks**

- [ ] Create one overlay owner with accessible naming, initial focus, intended focus scope, background inertness, Escape, and return focus.
- [ ] Treat mobile sheets and desktop dialogs as alternate presentations of the same interaction contract.
- [ ] Keep essential mute/pause/resume controls within the active modal scope.
- [ ] Use accessible normal-button confirmation for grown-up unlock; cancel any retained hold handlers on blur/unmount.

**Acceptance criteria**

- [ ] Library, settings, collection, photo mode, and help cannot create competing active modals.
- [ ] Closing a sheet returns focus to a meaningful visible control, including when its original trigger disappeared.
- [ ] Escape never restores an empty introduction or re-awards a reward.
- [ ] Touch and keyboard can complete the grown-up unlock flow with identical outcomes.

### DIW-016 — Make the cracker catalog extensible by stable ID

**Epic:** EP-04 | **Type:** Task | **Priority:** P1 | **Estimate:** 5 points  
**Release:** R1 | **Status:** Done | **Assignee:** Unassigned  
**Blocked by:** DIW-001  
**Code / design pointers:** src/crackers/crackerDefs.js; src/crackers/crackerControllers.js; src/ui/CrackerArt.jsx; src/ui/CrackerCarousel.jsx

**User story / outcome:** As a developer, I want to add new crackers without editing unrelated six-item assumptions.

**Implementation subtasks**

- [x] Preserve existing numeric IDs 0–5; assign new stable IDs 6–13 and separate display ordering from identity.
- [x] Replace CRACKERS[id] lookup, index-keyed art, parallel label arrays, and fixed total assumptions with explicit registries.
- [x] Define name, descriptor, category, artKey, effectKey, duration, palettes, sound character, motion variant, budget, and catalog group metadata.
- [x] Validate duplicate/unknown IDs and missing render/audio/art handlers; use a safe unavailable-item state for corrupt selections.

**Acceptance criteria**

- [x] Reordering display entries cannot change saved stickers, art, or effect behavior.
- [x] A test-only additional definition appears through the shared UI without another hard-coded count.
- [x] Every shipped definition resolves all required assets/handlers and supports cancellation.
- [x] No new catalog item silently falls back to Phuljhari while claiming a different name.

**Completion:** 24 October 2026 — Built extensible registry in `src/crackers/crackerDefs.js` with stable IDs 0..5 (original), 6..9 (R1 new effects), 10..13 (R2 slots), metadata schemas (category, palettes, sound character, budgets), safe unavailable fallback instead of silent substitution, and extensible registration. Verified with 7 unit tests in `test/catalog-extensibility.test.js`.

### DIW-017 — Migrate saves for expanded content and customization

**Epic:** EP-04 | **Type:** Task | **Priority:** P1 | **Estimate:** 5 points  
**Release:** R1 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-016  
**Code / design pointers:** src/store/save.js; src/store/gameStore.jsx; existing persistence tests

**User story / outcome:** As a returning player, I want my old collection preserved when the new catalog arrives.

**Implementation subtasks**

- [ ] Version and validate favourites, palettes, motion override, last nonzero volume, quality, discovered IDs, decorations, and later show drafts.
- [ ] Replace TOTAL_CRACKERS=6 validation with explicit valid-ID membership; preserve original IDs, stars, unlocks, and introduction history.
- [ ] After the first original completion, make the installed expansion items selectable; old saves with any earned sticker qualify immediately. Keep original progression intact.
- [ ] Give expansion content separate catalog groups so an earned original-six completion badge is never revoked.
- [ ] Keep save failure nonfatal and expose a truthful session-only notice when persistence fails.

**Acceptance criteria**

- [ ] Fresh, partial original, completed original, malformed, and storage-blocked fixtures behave correctly.
- [ ] Migration is idempotent; reload does not grant free stickers or repeat first-time awards.
- [ ] R1 has 10 installed items and R2 has 14 without invalid counters or false locked state.
- [ ] Unknown fields/IDs follow a documented compatibility policy; existing progress is not reset by a missing new field.

### DIW-018 — Add reusable authored effect timelines and emission primitives

**Epic:** EP-04 | **Type:** Task | **Priority:** P1 | **Estimate:** 8 points  
**Release:** R1 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-001, DIW-016  
**Code / design pointers:** src/crackers/crackerControllers.js; src/render/Particles.js; src/render/Renderer.js; src/audio/FireworkSound.js

**User story / outcome:** As a developer, I want distinct new shows with consistent timing, cancellation, and quality limits.

**Implementation subtasks**

- [ ] Expose fan, ring, arc, trail, radial petal, and staggered-burst primitives with deterministic seed support.
- [ ] Author anticipation, focal action, and settling on one show timeline coordinated with audio time.
- [ ] Provide cancellation handles, completion identity, normalized stage anchors, live motion policy, and per-effect particle budgets.
- [ ] Reuse the existing Canvas/particle architecture; no game-engine rewrite.

**Acceptance criteria**

- [ ] Timing remains coherent under variable frame intervals; completion follows the visual ending.
- [ ] Cancel/restart/dispose cannot leak timers or emit a second completion.
- [ ] Each primitive has deterministic geometry checks and a reduced-motion presentation.
- [ ] Peak simultaneous particles stay within the configured shared budget, including settling tails.

### DIW-019 — Add Golden Waterfall

**Epic:** EP-04 | **Type:** Story | **Priority:** P1 | **Estimate:** 5 points  
**Release:** R1 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-008, DIW-016, DIW-017, DIW-018  
**Code / design pointers:** src/crackers/crackerDefs.js; src/crackers/crackerControllers.js; src/audio/FireworkSound.js; cracker artwork registry

**User story / outcome:** As a player, I want a curtain of gold that hangs and settles into the courtyard.

**Implementation subtasks**

- [ ] Register stable ID 6, category Ground, catalog group Festival additions, art, sticker, inspector copy, and sound metadata.
- [ ] Use a bounded horizontal emitter with staggered downward filaments, a soft rise, and tapering embers; keep the center readable.
- [ ] Author an initial 4–6 second show excluding preparation; refine timing through visual review. Soft descending shimmer with a clean fade.
- [ ] Implement palette/anchor parameters with a curated default palette and centered placement in R1; expose player controls only with DIW-027/028 in R2. Include silent/reduced/low-quality variants, cancellation, and reward integration.

**Acceptance criteria**

- [ ] A continuous curtain silhouette remains distinct from Anar’s upward fountain.
- [ ] Library thumbnail, preview, show, and sticker match the same identity; do not ship a recolor of an existing effect as this new type.
- [ ] Run the shared cracker acceptance matrix in section 8, including first award, replay, interruption, and device checks.
- [ ] No effect changes the global sound setting, exceeds the shared output/particle limits, or plays while paused.

### DIW-020 — Add Comet Fan

**Epic:** EP-04 | **Type:** Story | **Priority:** P1 | **Estimate:** 5 points  
**Release:** R1 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-008, DIW-016, DIW-017, DIW-018  
**Code / design pointers:** src/crackers/crackerDefs.js; src/crackers/crackerControllers.js; src/audio/FireworkSound.js; cracker artwork registry

**User story / outcome:** As a player, I want a fan of colored trails crossing the night sky.

**Implementation subtasks**

- [ ] Register stable ID 7, category Sky, catalog group Festival additions, art, sticker, inspector copy, and sound metadata.
- [ ] Launch a small authored fan of arcs with distinct start offsets, bright heads, and fading tails; do not implement random all-direction spray.
- [ ] Author an initial 4–6 second show excluding preparation; refine timing through visual review. Short restrained whooshes aligned to each arc.
- [ ] Implement palette/anchor parameters with a curated default palette and centered placement in R1; expose player controls only with DIW-027/028 in R2. Include silent/reduced/low-quality variants, cancellation, and reward integration.

**Acceptance criteria**

- [ ] The fan pattern stays inside the sky region and is recognizable with sound off.
- [ ] Library thumbnail, preview, show, and sticker match the same identity; do not ship a recolor of an existing effect as this new type.
- [ ] Run the shared cracker acceptance matrix in section 8, including first award, replay, interruption, and device checks.
- [ ] No effect changes the global sound setting, exceeds the shared output/particle limits, or plays while paused.

### DIW-021 — Add Ring Burst

**Epic:** EP-04 | **Type:** Story | **Priority:** P1 | **Estimate:** 5 points  
**Release:** R1 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-008, DIW-016, DIW-017, DIW-018  
**Code / design pointers:** src/crackers/crackerDefs.js; src/crackers/crackerControllers.js; src/audio/FireworkSound.js; cracker artwork registry

**User story / outcome:** As a player, I want a precise expanding halo of light.

**Implementation subtasks**

- [ ] Register stable ID 8, category Sky, catalog group Festival additions, art, sticker, inspector copy, and sound metadata.
- [ ] Build an ascent followed by one or two concentric rings, even angular distribution, and slow settling points.
- [ ] Author an initial 4–6 second show excluding preparation; refine timing through visual review. A rounded burst and subtle tail, without increased peak gain.
- [ ] Implement palette/anchor parameters with a curated default palette and centered placement in R1; expose player controls only with DIW-027/028 in R2. Include silent/reduced/low-quality variants, cancellation, and reward integration.

**Acceptance criteria**

- [ ] The ring remains circular in world geometry and is fitted to the current viewport without clipping.
- [ ] Library thumbnail, preview, show, and sticker match the same identity; do not ship a recolor of an existing effect as this new type.
- [ ] Run the shared cracker acceptance matrix in section 8, including first award, replay, interruption, and device checks.
- [ ] No effect changes the global sound setting, exceeds the shared output/particle limits, or plays while paused.

### DIW-022 — Add Peacock Fan

**Epic:** EP-04 | **Type:** Story | **Priority:** P1 | **Estimate:** 5 points  
**Release:** R1 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-008, DIW-016, DIW-017, DIW-018  
**Code / design pointers:** src/crackers/crackerDefs.js; src/crackers/crackerControllers.js; src/audio/FireworkSound.js; cracker artwork registry

**User story / outcome:** As a player, I want a jewel-colored fan inspired by a peacock tail.

**Implementation subtasks**

- [ ] Register stable ID 9, category Ground, catalog group Festival additions, art, sticker, inspector copy, and sound metadata.
- [ ] Create layered teal, blue, and gold arcs with eye-like accent points and a clear opening/settling phase.
- [ ] Author an initial 4–6 second show excluding preparation; refine timing through visual review. A gentle rising texture synchronized with the opening.
- [ ] Implement palette/anchor parameters with a curated default palette and centered placement in R1; expose player controls only with DIW-027/028 in R2. Include silent/reduced/low-quality variants, cancellation, and reward integration.

**Acceptance criteria**

- [ ] Its broad, symmetric low fan is visually distinct from both the vertical Anar and sky Comet Fan.
- [ ] Library thumbnail, preview, show, and sticker match the same identity; do not ship a recolor of an existing effect as this new type.
- [ ] Run the shared cracker acceptance matrix in section 8, including first award, replay, interruption, and device checks.
- [ ] No effect changes the global sound setting, exceeds the shared output/particle limits, or plays while paused.

### DIW-023 — Add Spiral Sky

**Epic:** EP-04 | **Type:** Story | **Priority:** P2 | **Estimate:** 5 points  
**Release:** R2 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-008, DIW-016, DIW-017, DIW-018  
**Code / design pointers:** src/crackers/crackerDefs.js; src/crackers/crackerControllers.js; src/audio/FireworkSound.js; cracker artwork registry

**User story / outcome:** As a player, I want a curling trail that opens into a suspended spiral.

**Implementation subtasks**

- [ ] Register stable ID 10, category Sky, catalog group Sky collection, art, sticker, inspector copy, and sound metadata.
- [ ] Author a bounded spiral path with decreasing velocity and a settling tail; use static separated points for reduced motion.
- [ ] Author an initial 4–6 second show excluding preparation; refine timing through visual review. A light rising sweep ending in a restrained sparkle.
- [ ] Implement palette/anchor parameters with a curated default palette and centered placement in R1; expose player controls only with DIW-027/028 in R2. Include silent/reduced/low-quality variants, cancellation, and reward integration.

**Acceptance criteria**

- [ ] The spiral silhouette is distinct from the ground Chakri and never becomes a spinning camera effect.
- [ ] Library thumbnail, preview, show, and sticker match the same identity; do not ship a recolor of an existing effect as this new type.
- [ ] Run the shared cracker acceptance matrix in section 8, including first award, replay, interruption, and device checks.
- [ ] No effect changes the global sound setting, exceeds the shared output/particle limits, or plays while paused.

### DIW-024 — Add Chrysanthemum Bloom

**Epic:** EP-04 | **Type:** Story | **Priority:** P2 | **Estimate:** 5 points  
**Release:** R2 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-008, DIW-016, DIW-017, DIW-018  
**Code / design pointers:** src/crackers/crackerDefs.js; src/crackers/crackerControllers.js; src/audio/FireworkSound.js; cracker artwork registry

**User story / outcome:** As a player, I want a round flower of many fine petals.

**Implementation subtasks**

- [ ] Register stable ID 11, category Sky, catalog group Sky collection, art, sticker, inspector copy, and sound metadata.
- [ ] Build a spherical-looking radial petal bloom with layered lengths and warm inner/cool outer color, using budgeted trails.
- [ ] Author an initial 4–6 second show excluding preparation; refine timing through visual review. One soft rounded bloom followed by fine crackle.
- [ ] Implement palette/anchor parameters with a curated default palette and centered placement in R1; expose player controls only with DIW-027/028 in R2. Include silent/reduced/low-quality variants, cancellation, and reward integration.

**Acceptance criteria**

- [ ] Petal density conveys a flower, while the lower-quality variant retains the same shape and timing.
- [ ] Library thumbnail, preview, show, and sticker match the same identity; do not ship a recolor of an existing effect as this new type.
- [ ] Run the shared cracker acceptance matrix in section 8, including first award, replay, interruption, and device checks.
- [ ] No effect changes the global sound setting, exceeds the shared output/particle limits, or plays while paused.

### DIW-025 — Add Double Blossom

**Epic:** EP-04 | **Type:** Story | **Priority:** P2 | **Estimate:** 5 points  
**Release:** R2 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-008, DIW-016, DIW-017, DIW-018  
**Code / design pointers:** src/crackers/crackerDefs.js; src/crackers/crackerControllers.js; src/audio/FireworkSound.js; cracker artwork registry

**User story / outcome:** As a player, I want a small bloom that opens into a second contrasting flower.

**Implementation subtasks**

- [ ] Register stable ID 12, category Sky, catalog group Sky collection, art, sticker, inspector copy, and sound metadata.
- [ ] Author two distinct sequential blooms from one show timeline; add no uncontrolled recursive particle spawning.
- [ ] Author an initial 4–6 second show excluding preparation; refine timing through visual review. Two controlled accents separated by the visual beat.
- [ ] Implement palette/anchor parameters with a curated default palette and centered placement in R1; expose player controls only with DIW-027/028 in R2. Include silent/reduced/low-quality variants, cancellation, and reward integration.

**Acceptance criteria**

- [ ] The second bloom is visible and deliberate; only the final settling triggers completion and one reward.
- [ ] Library thumbnail, preview, show, and sticker match the same identity; do not ship a recolor of an existing effect as this new type.
- [ ] Run the shared cracker acceptance matrix in section 8, including first award, replay, interruption, and device checks.
- [ ] No effect changes the global sound setting, exceeds the shared output/particle limits, or plays while paused.

### DIW-026 — Add Constellation Sparkles

**Epic:** EP-04 | **Type:** Story | **Priority:** P2 | **Estimate:** 5 points  
**Release:** R2 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-008, DIW-016, DIW-017, DIW-018  
**Code / design pointers:** src/crackers/crackerDefs.js; src/crackers/crackerControllers.js; src/audio/FireworkSound.js; cracker artwork registry

**User story / outcome:** As a player, I want a fantasy light effect drawing a star or flower in the sky.

**Implementation subtasks**

- [ ] Register stable ID 13, category Sky, catalog group Sky collection, art, sticker, inspector copy, and sound metadata.
- [ ] Reveal one of two curated point patterns in sequence with faint connecting traces and a still final pose; label it as a fantasy light effect.
- [ ] Author an initial 4–6 second show excluding preparation; refine timing through visual review. Optional sparse chimes with a fully silent equivalent.
- [ ] Implement palette/anchor parameters with a curated default palette and centered placement in R1; expose player controls only with DIW-027/028 in R2. Include silent/reduced/low-quality variants, cancellation, and reward integration.

**Acceptance criteria**

- [ ] It reads as a designed constellation rather than random glitter; reduced mode uses a static reveal without flashing points.
- [ ] Library thumbnail, preview, show, and sticker match the same identity; do not ship a recolor of an existing effect as this new type.
- [ ] Run the shared cracker acceptance matrix in section 8, including first award, replay, interruption, and device checks.
- [ ] No effect changes the global sound setting, exceeds the shared output/particle limits, or plays while paused.

### DIW-027 — Let players choose curated effect palettes

**Epic:** EP-05 | **Type:** Story | **Priority:** P2 | **Estimate:** 3 points  
**Release:** R2 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-011, DIW-016, DIW-017, DIW-018  
**Code / design pointers:** selected-cracker panel; src/crackers/crackerDefs.js; particle color configuration

**User story / outcome:** As a player, I want the same cracker to feel personal through color choices.

**Implementation subtasks**

- [ ] Offer three or four named palettes per compatible effect, such as Marigold Gold, Rose & Gold, and Peacock Jewels.
- [ ] Show name plus swatches; persist the selected palette by stable cracker ID.
- [ ] Apply choices to preview, live effect, and saved show segments; disable editing during an active effect.

**Acceptance criteria**

- [ ] Palette changes do not alter duration, particle budget, loudness, or reward value.
- [ ] Every palette retains visible contrast against the courtyard; color names work without swatch perception.
- [ ] A palette is a variant of an existing cracker, not an extra collectible or first-time reward.

### DIW-028 — Add controlled left, center, and right launch placement

**Epic:** EP-05 | **Type:** Story | **Priority:** P2 | **Estimate:** 5 points  
**Release:** R2 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-004, DIW-012, DIW-018  
**Code / design pointers:** src/ui/CanvasStage.jsx; selected-cracker panel; controller launch parameters

**User story / outcome:** As a player, I want to compose where an effect appears without precise dragging.

**Implementation subtasks**

- [ ] Offer Left/Center/Right anchors with a stage highlight and equivalent labeled buttons.
- [ ] Map anchors to safe normalized effect zones; preserve ground-versus-sky behavior and adult positioning.
- [ ] Optional direct tapping selects the nearest valid anchor; never require freeform dragging or place an effect under controls.

**Acceptance criteria**

- [ ] All three placements fit every supported viewport and recalculate after rotation.
- [ ] Keyboard/touch produce equivalent placement; invalid taps do not trigger ignition.
- [ ] Preview and actual show use the same anchor and bounded effect envelope.

### DIW-029 — Build a three-slot celebration sequence editor

**Epic:** EP-05 | **Type:** Story | **Priority:** P2 | **Estimate:** 8 points  
**Release:** R2 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-010, DIW-017, DIW-027, DIW-028  
**Code / design pointers:** celebration builder UI (new); src/store/gameStore.jsx; src/store/save.js

**User story / outcome:** As a player, I want to arrange a small personal fireworks celebration.

**Implementation subtasks**

- [ ] Add a Build a show mode with one to three slots; each stores cracker ID, palette, and anchor.
- [ ] Support add, replace, remove, and move-left/right buttons; dragging is optional.
- [ ] Show estimated total time including preparation and settling; persist one draft locally.
- [ ] Reject unavailable IDs and handle deleted/invalid draft entries with a clear repair action.

**Acceptance criteria**

- [ ] A complete three-slot show can be built using keyboard only or touch only.
- [ ] Reload restores the draft without starting playback or applying rewards.
- [ ] Empty/incomplete states explain the next action; Play is enabled only for a valid draft.
- [ ] The estimate comes from the actual schedule, not a separate hard-coded label.

### DIW-030 — Play celebration sequences with predictable stop and reward rules

**Epic:** EP-05 | **Type:** Story | **Priority:** P2 | **Estimate:** 8 points  
**Release:** R2 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-001, DIW-012, DIW-018, DIW-029  
**Code / design pointers:** src/fsm/GameController.js; show-sequence controller (new); src/ui/RewardOverlay.jsx

**User story / outcome:** As a player, I want my celebration to play in order while I stay in control.

**Implementation subtasks**

- [ ] Run one effect at a time; include the visible preparation/countdown for each segment in the first version.
- [ ] Expose segment progress, Pause, Stop show, and Mute. Stop clears pending segments and returns to the editable draft.
- [ ] Pause during an active segment cancels and restarts that segment through countdown; completed segments never replay automatically.
- [ ] Apply standard first/replay awards once per completed segment using stable run/segment identities. No sequence bonus in the first version.

**Acceptance criteria**

- [ ] Stopping midway preserves already earned rewards and grants none for unfinished segments.
- [ ] Repeated cracker IDs earn a first reward once and normal replay rewards afterward.
- [ ] No callback from an abandoned sequence can start the next segment or award stars.
- [ ] On reload, restore only the draft; never resume a running sequence automatically.

### DIW-031 — Let players decorate their gameplay courtyard

**Epic:** EP-05 | **Type:** Story | **Priority:** P2 | **Estimate:** 5 points  
**Release:** R2 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-005, DIW-015, DIW-017  
**Code / design pointers:** src/render/layers/Courtyard.js; decoration panel (new); save schema

**User story / outcome:** As a player, I want the place where I celebrate to feel like my own.

**Implementation subtasks**

- [ ] Offer three curated rangoli motifs, two toran styles, and a small diya arrangement choice within the gameplay page.
- [ ] Use fixed decoration slots; persist selections and provide Reset decorations without resetting game progress.
- [ ] Render chosen props through the same scene model used by photo mode; keep launch zones clear.

**Acceptance criteria**

- [ ] Decorations survive reload and switching game modes.
- [ ] All combinations retain character/effect readability and do not overlap required controls.
- [ ] Selecting a decoration never lights a cracker, changes sound, or consumes stars.

### DIW-032 — Add gentle discovery goals without daily pressure

**Epic:** EP-06 | **Type:** Story | **Priority:** P3 | **Estimate:** 5 points  
**Release:** R2 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-017, DIW-027, DIW-031, DIW-033  
**Code / design pointers:** collection/progress UI; src/store/gameStore.jsx; save schema

**User story / outcome:** As a player, I want optional ideas for what to try next.

**Implementation subtasks**

- [ ] Add three timeless goals: try one ground and one sky effect; try two palettes; decorate your courtyard.
- [ ] Use optional cosmetic badges with no streaks, expiry, random loot, purchases, or requirement to use louder sound.
- [ ] Show at most one next suggestion in the gameplay result; allow dismissal.

**Acceptance criteria**

- [ ] Goals complete from actual recorded actions once and persist across reload.
- [ ] Muted/reduced-motion play qualifies equally.
- [ ] Ignoring goals leaves the full core activity usable; rewards do not introduce duplicate star transactions.

### DIW-033 — Redesign the collection as a beautiful discovery album

**Epic:** EP-06 | **Type:** Story | **Priority:** P1 | **Estimate:** 5 points  
**Release:** R1 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-008, DIW-010, DIW-016, DIW-017  
**Code / design pointers:** src/ui/StickerBook.jsx; src/store/gameStore.jsx; collection styles

**User story / outcome:** As a player, I want a satisfying record of the effects I have discovered.

**Implementation subtasks**

- [ ] Group Original six, Festival additions, and installed future Sky collection entries; show earned/available counts per group.
- [ ] Use consistent illustrated stickers, an honest empty state, and a clear completed-group treatment.
- [ ] Let earned entries open details, favourite, or replay through the normal flow.
- [ ] Preserve earned original-six completion when new catalog groups arrive.

**Acceptance criteria**

- [ ] Counts derive from installed definitions and collected stable IDs; no stale 6/6 total for an expanded catalog.
- [ ] Locked/unearned entries are distinguishable and inspectable without pretending they are collected.
- [ ] The album can be opened/closed from a reward without losing its payload or awarding twice.
- [ ] Grown-up unlock works with keyboard and does not automatically grant stickers.

### DIW-034 — Create a polished result and celebration summary

**Epic:** EP-06 | **Type:** Story | **Priority:** P1 | **Estimate:** 5 points  
**Release:** R1 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-012, DIW-017, DIW-033  
**Code / design pointers:** src/ui/RewardOverlay.jsx; src/fsm/GameController.js; collection summary UI

**User story / outcome:** As a player, I want a clear, rewarding finish with an obvious next choice.

**Implementation subtasks**

- [ ] Show actual awarded stars, new-sticker status, and one suggested next effect; use a short restrained reveal.
- [ ] Offer Play again, Choose another, and Finish for now; secondary Favourite is available without leaving the result.
- [ ] Celebrate group completion distinctly and preserve silent/reduced alternatives.
- [ ] When R2 sequences ship, extend the summary with completed segments and earned totals using the same transaction data.

**Acceptance criteria**

- [ ] First-time, replay, interrupted, and whole-group completion each display the correct metadata.
- [ ] Finish for now leaves the game in a stopped state with no background audio.
- [ ] One primary action is visually dominant; the result does not obscure essential mute/close controls.
- [ ] Reload/reopening does not replay a reward transaction.

### DIW-035 — Add photo mode and local festival postcard export

**Epic:** EP-06 | **Type:** Story | **Priority:** P2 | **Estimate:** 8 points  
**Release:** R2 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-005, DIW-015, DIW-017, DIW-018, DIW-031  
**Code / design pointers:** src/ui/CanvasStage.jsx; scene renderer; photo/postcard UI (new)

**User story / outcome:** As a player, I want to save a beautiful picture of my celebration.

**Implementation subtasks**

- [ ] Capture a frozen scene or deterministic authored highlight on explicit request; pause gameplay through the shared interruption flow.
- [ ] Offer clean scene and a restrained Happy Diwali frame with two export ratios; composite decorations/characters consistently.
- [ ] Preview before PNG download; keep export local with no account or automatic share/upload.
- [ ] Handle cross-origin asset taint, unsupported export, size limits, and failed downloads with actionable messages.

**Acceptance criteria**

- [ ] Export matches the preview, includes the selected scene, and excludes HUD/focus rings unless deliberately requested.
- [ ] Photo mode never advances rewards or resumes sound on its own.
- [ ] PNG opens correctly on Android/iPhone; success is reported only when the browser operation succeeds as far as detectable.
- [ ] Object URLs and temporary canvases are released; cancellation returns to the documented game state.

### DIW-036 — Give every effect a distinct, controlled sound identity

**Epic:** EP-07 | **Type:** Story | **Priority:** P1 | **Estimate:** 8 points  
**Release:** R1 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-001, DIW-018  
**Code / design pointers:** src/audio/SoundEngine.js; src/audio/FireworkSound.js; cracker metadata

**User story / outcome:** As a player, I want satisfying synchronized sound with immediate control over its intensity.

**Implementation subtasks**

- [ ] Separate effects, music, calm, and interface roles under one master mute and final limiter.
- [ ] Retune the original six after the dry-path fix and author the four R1 effects; R2 tickets extend the same contract.
- [ ] Use envelope-shaped transitions, bounded overlap, and cancellable scheduled notes. Maintain distinction through rhythm/timbre rather than escalating volume.
- [ ] Keep ambient/music playback opt-in and subdued; no hover previews or automatic louder unlock rewards.

**Acceptance criteria**

- [ ] All effects are recognizable with their visuals and have an equivalent silent experience.
- [ ] Offline graph/envelope/pan/peak checks pass for every shipped sound mode.
- [ ] Repeated pause/resume returns tracked nodes to baseline; no clicks or stale cues are found in listening checks.
- [ ] Review phone speakers/headphones and record listening limitations honestly.

### DIW-037 — Apply reduced motion and accessible effect descriptions everywhere

**Epic:** EP-07 | **Type:** Story | **Priority:** P1 | **Estimate:** 5 points  
**Release:** R1 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-003, DIW-014, DIW-018  
**Code / design pointers:** src/App.jsx; all Canvas layers; src/ui/CalmCorner.jsx; countdown/status text

**User story / outcome:** As a player, I want the beautiful experience to remain usable without continuous motion or audio.

**Implementation subtasks**

- [ ] Apply one effective motion policy to ambient scene, characters, particles, flashes, cards, scrolling, confetti, and breathing guidance.
- [ ] In reduced mode, use sparse/static geometry and clear phase text instead of bounce, scale snapping, shaking, or explicit flashes.
- [ ] Provide concise selected-effect and completion descriptions; avoid announcing every particle or decorative change.
- [ ] Review countdown announcements with real assistive technology and keep meaningful feedback available with sound off.

**Acceptance criteria**

- [ ] System/Reduced/Full works across OS changes, reload, and midshow preference changes.
- [ ] No active density emitter keeps the old policy after a reduced-mode change.
- [ ] VoiceOver/TalkBack can follow selection, countdown, result, and pause without queued announcement overload.
- [ ] Document rendered flash bounds precisely; do not infer whole-scene flash compliance from a particle counter.

### DIW-038 — Refine character poses and grounded reactions

**Epic:** EP-07 | **Type:** Story | **Priority:** P2 | **Estimate:** 5 points  
**Release:** R1 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-002, DIW-005, DIW-037  
**Code / design pointers:** src/render/characters/ChhotuChamp.js; src/render/characters/Adult.js; src/render/characters/Pip.js

**User story / outcome:** As a player, I want companions that look alive and clearly communicate what is happening.

**Implementation subtasks**

- [ ] Provide neutral empty-handed idle, attentive watching, short walk, and restrained celebration poses.
- [ ] Align proportions, shading, scale, and floor contact with the courtyard art direction.
- [ ] Keep the adult responsible for ignition and avoid placing characters inside the active effect area.
- [ ] Use still equivalents in reduced mode; define concrete missing-asset requirements rather than disguising a placeholder as finished art.

**Acceptance criteria**

- [ ] States are distinguishable with sound off and animation reduced.
- [ ] Foot placement and ground shadows remain consistent at different stage sizes.
- [ ] Characters enhance the show without oversized reaction bubbles or repetitive jumps stealing focus.

### DIW-039 — Profile performance and add graceful quality adaptation

**Epic:** EP-07 | **Type:** Task | **Priority:** P1 | **Estimate:** 8 points  
**Release:** R1 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-005, DIW-018, DIW-036, DIW-037  
**Code / design pointers:** src/render/Renderer.js; src/render/Particles.js; scene caches; quality settings

**User story / outcome:** As a mobile player, I want smooth effects without overheating the interface or losing progress.

**Implementation subtasks**

- [ ] Measure idle, the densest effect, repeated shows, and overlay transitions; record device and frame-time distributions.
- [ ] Reuse static scene caches, bounded trails, and current particle/DPR limits; make all additional budgets explicit.
- [ ] Implement Auto quality with hysteresis to avoid oscillation; reduce decoration/trail density before essential shapes or controls.
- [ ] Pause rendering/audio correctly in background and check cleanup after repeated sessions.

**Acceptance criteria**

- [ ] Proposed targets: 60 fps on the nominated reference device and stable 30 fps on the nominated lower-tier device; name hardware and report actual measurements.
- [ ] Quality changes preserve effect identity, phase timing, input responsiveness, and rewards.
- [ ] No unbounded growth in particles, audio nodes, timers, or DOM elements after repeated runs.
- [ ] Production budget checks pass; investigate regressions rather than quietly raising every budget.

### DIW-040 — Automate gameplay, migration, and expanded-catalog regressions

**Epic:** EP-08 | **Type:** Task | **Priority:** P1 | **Estimate:** 8 points  
**Release:** R1 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-001, DIW-004, DIW-012, DIW-016, DIW-017, DIW-018  
**Code / design pointers:** existing unit/integration/browser tests; accessibility test configuration

**User story / outcome:** As a maintainer, I want changes to art and content to preserve the complete player journey.

**Implementation subtasks**

- [ ] Use the real React store provider for unlock/replay integration; parameterize shipped catalog journeys.
- [ ] Cover old-save migration, unknown IDs, interrupted show/reward/preview, overlays, volume, motion, and keyboard unlock.
- [ ] Add deterministic visual states for stage, cards, selected/locked/new items, and representative effects.
- [ ] Extend the suite for sequence builder/photo mode when R2 lands; do not leave those behaviors covered only by mocks.

**Acceptance criteria**

- [ ] Every shipped effect passes the shared acceptance matrix; missing metadata/art handlers fail tests.
- [ ] Layout checks cover narrow portrait and short landscape, including result/overlay states.
- [ ] Tests detect duplicate completion/reward and stale store snapshots.
- [ ] Record standard command results on supported runtime/browser versions; environmental failures remain explicit.

### DIW-041 — Run visual review and first-use usability checks

**Epic:** EP-08 | **Type:** Design QA | **Priority:** P1 | **Estimate:** 5 points  
**Release:** R1 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-004, DIW-005, DIW-007, DIW-009, DIW-010, DIW-011, DIW-012, DIW-033, DIW-034, DIW-037  
**Code / design pointers:** review artifacts; gameplay copy/styles; device test notes

**User story / outcome:** As a first-time player, I want the next action to be obvious and the page to feel deliberately designed.

**Implementation subtasks**

- [ ] Review fixed screenshots and short recordings for all major states at mobile, landscape, and desktop sizes.
- [ ] Check hierarchy, alignment, scene occlusion, icon consistency, texture density, lighting, and meaningful text size.
- [ ] Ask representative players/caregivers to select, customize when available, mute, pause, switch cracker, and find their collection without coaching.
- [ ] Log observed confusion and fix concrete issues; use a small formative test, not a claim of statistically proven engagement.

**Acceptance criteria**

- [ ] No placeholder art, clipped labels, unexplained disabled actions, or competing primary CTAs remains in the released scope.
- [ ] Players can identify the selected effect and primary action; record completion/errors for each observed task.
- [ ] Physical Android/iPhone checks and assistive-technology review are completed or explicitly pending.
- [ ] Before/after comparisons demonstrate the agreed visual direction without sacrificing readability.

### DIW-042 — Assemble and verify each release candidate

**Epic:** EP-08 | **Type:** Release task | **Priority:** P1 | **Estimate:** 3 points  
**Release:** R1 | **Status:** To Do | **Assignee:** Unassigned  
**Blocked by:** DIW-001, DIW-002, DIW-003, DIW-004, DIW-005, DIW-006, DIW-007, DIW-008, DIW-009, DIW-010, DIW-011, DIW-012, DIW-013, DIW-014, DIW-015, DIW-016, DIW-017, DIW-018, DIW-019, DIW-020, DIW-021, DIW-022, DIW-033, DIW-034, DIW-036, DIW-037, DIW-038, DIW-039, DIW-040, DIW-041  
**Code / design pointers:** README.md; release notes; test reports; feature availability configuration

**User story / outcome:** As a maintainer, I want a reviewable release with a clear record of what works and what remains.

**Implementation subtasks**

- [ ] For R1, ship the redesigned page and first four new effects; keep unfinished R2 navigation and assets hidden.
- [ ] Run the integrated release matrix and standard commands; link evidence for resolved prior audit blockers.
- [ ] Document save migration, installed catalog groups, known limitations, and rollback compatibility.
- [ ] Repeat this release task for R2 after its tickets are complete; preserve the original-six and R1 completion records.

**Acceptance criteria**

- [ ] R1 has exactly 10 fully working catalog entries; R2 has 14 when the expansion is released.
- [ ] All in-scope dependencies meet Done; unrun device/listening checks are visible and release readiness is not overstated.
- [ ] Final change summary links code, screenshots/review evidence, tests, and remaining issues.
- [ ] No merge/deployment is performed solely by this planning ticket; follow the project’s release authorization.

## 7. Prior-audit dependency mapping

Do not create duplicate fixes if the previous backlog has already landed. Link the resolving commit/tests, then verify the redesigned flow still passes. The mappings below preserve traceability to the earlier report.

| Prior findings | Relevant new tickets |
| --- | --- |
| R1 build; G1 current progress; G2/G3 interruption; A1 dry audio route | DIW-001, then DIW-012/015/018/036 |
| U1 mobile mute | DIW-009/014 |
| U2 readability; U3 landscape collision | DIW-003/004/007/011 |
| U4 grown-up keyboard unlock; U5 dialogs | DIW-015/033/040 |
| A2 mixing and cleanup | DIW-018/036 |
| M1 motion preference | DIW-014/037 |
| M2 clocks/performance; M3 poses/flash bounds | DIW-018/038/039 and DIW-037 |
| D1 replay/ending | DIW-013/027–030/032–034 |
| D2 creative continuity | Gameplay-scoped DIW-031/035; standalone home activity changes remain in the earlier backlog |

## 8. Shared acceptance matrices

### Every shipped cracker, original and new

- [ ] Metadata, unique ID, category, duration, artwork, effect handler, sound identity, and sticker resolve successfully.
- [ ] Silent preview is explicitly triggered, visually representative, cancellable, and reward-free.
- [ ] First completion grants exactly one sticker and +3 stars; replay grants +1 star, with UI and save in agreement.
- [ ] Selection, unlock, and seen-introduction queries are current through the real React store provider.
- [ ] Full, gentle, and muted sound behavior works; motion and graphics quality remain independent settings.
- [ ] Reduced-motion and low-quality variants preserve the effect's recognizable shape and timeline.
- [ ] Pause from introduction, ready, preparation, countdown, active show, and reward restores the documented usable state.
- [ ] Library/settings/collection/photo interruption cannot leave timers, audio, hidden rewards, or stacked active dialogs running.
- [ ] Show fits portrait and landscape stage bounds; settling particles do not cover controls or drift indefinitely.
- [ ] Preview/run/segment IDs prevent stale completion; all sources and timers clean up on stop/unmount.
- [ ] Output graph, envelopes, channel response, final digital bounds, and real-device listening are checked. Mark unavailable listening pending.

### Release matrix

| Area | Required scenarios |
| --- | --- |
| Responsive layout | 320 × 568, 390 × 844, 844 × 390, representative tablet, 1440 × 900; rotate during play; 200% zoom |
| Interaction | Keyboard, touch, pointer; start double-tap; rapid selection; escape; focus restoration; no drag-only operation |
| State | Fresh save, partial original collection, completed original collection, expanded save, invalid ID, corrupt/blocked storage |
| Modal interruption | Every gameplay phase; repeated open/close; switching overlays; hidden/visible tab; interrupted audio context |
| Accessibility | Names, focus, contrast, text status, meaningful countdown, reduced motion; physical VoiceOver/TalkBack checks |
| Audio | All effects × all sound modes; muted transitions; envelopes/pan/cancellation; phone speakers/headphones |
| Performance | Idle, dense effects, repeated sessions, low/auto/high quality, CPU throttling; record hardware and measured frame times |
| R2 additions | Draft migration, reorder buttons, repeated items, stop mid-sequence, palette/placement persistence, photo cancellation/download |

### Standard verification commands

Use the current supported repository workflow, documenting intentional script changes. The prior audit's plugin-bypassed diagnostic build is not a substitute for these checks.

```bash
npm ci
npm run lint
npm test
npm run build
npm run check:budget
npx playwright install chromium
npm run test:e2e
```

Also smoke-test ordinary development startup. Record browser-download failures as environment blockers, not app defects or passing tests. Physical-device and formative user checks are separate from desktop emulation.

## 9. Definition of Ready and Definition of Done

### Ready for implementation

- [ ] Current HEAD and relevant earlier fixes have been inspected; unrelated user changes are preserved.
- [ ] Dependencies are complete or a bounded independent subtask is identified.
- [ ] Art/state requirements and scope are concrete; no hidden dependence on unavailable assets.
- [ ] Save, interruption, reduced-motion, and mobile implications are understood.

### Done

- [ ] Implementation and every acceptance criterion pass for the released scope.
- [ ] Relevant regression coverage tests behavior rather than merely mirroring implementation.
- [ ] Final art/copy is present; loading, empty, locked, disabled, error, and cancellation states are handled where applicable.
- [ ] Before/after screenshots or recordings demonstrate responsive visual quality; evidence includes a reduced-motion state.
- [ ] Keyboard, mute, pause, persistence, and existing progress are preserved.
- [ ] Applicable device/listening checks are complete. Otherwise status is QA/Blocked with the missing check identified, not Done.
- [ ] Changed files, test results, compatibility risks, and remaining work are documented.
- [ ] No unrelated home redesign, account system, external publishing, or silent dependency override has been added.

### Agent completion comment template

```markdown
Issue: DIW-XXX
Status: Review / QA / Done / Blocked
Base and resulting commit:
Implemented behavior:
Files changed:
Acceptance criteria evidence:
Commands and results:
Screenshots / recordings / device details:
Save and backward-compatibility result:
Remaining limitations or external checks:
Next dependency-ready issue:
```

When reconciling this backlog, preserve stable issue IDs. Add subtasks or update estimates instead of renumbering tickets. A beautiful release requires both the visual review and reliable interaction flows; neither a screenshot alone nor a passing test suite alone completes this scope.
