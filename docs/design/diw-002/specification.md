# DIW-002 — Gameplay art direction and state storyboard

Status: **Done — design specification**, 24 October 2026. Implementation begins with DIW-003. This is a design handoff, not an implemented UI or release approval.

[Open the visual storyboard](index.html). Rebuild its editable SVG boards with `node docs/design/diw-002/generate.mjs`.

## Direction

An illustrated Indian courtyard at twilight: broad indigo sky, plum stonework, small pools of marigold light, quiet roof silhouettes and jewel-colored effects. Let the sky occupy the visual center. Use warm ivory for instructions; keep the logo small. Put rangoli at the doorstep, diyas along the edges and the launch marker on open ground. Do not put garlands, title lettering, cards or character heads across the central effect silhouette.

Current baseline: `345cd95` plus DIW-001 working-tree fixes. Existing gameplay has a bottom reward overlay with a crowded skip control, blue-black surfaces and a large centered heading. The proposed layout gives reward and inspector their own space. Existing React/Canvas/Web Audio architecture, six original IDs, saves, gentle defaults, adult preparation and countdown remain requirements. Concurrent store/save edits were observed and left untouched.

## Tokens and illustration rules for DIW-003/005/008

| Role | Specification |
| --- | --- |
| Sky | `#11122B` to `#30203D`, vertically; no text directly on moving effects |
| Surface / raised | Opaque `#271B35` / `#382543`; blur never required for reading |
| Primary / secondary text | `#FFF4DF` / `#D6C6B2` |
| Primary action | `#F3BB56` fill, `#281A15` text; exactly one filled marigold action per state |
| State accents | `#61C9BE` selected/status, `#E981A0` decorative highlights; accompany state with words and/or checkmark |
| Focus | 3 px marigold outline, 3 px offset on plum; dark inner separation on marigold buttons |
| UI typography | System stack: Segoe UI, system-ui, sans-serif; 16/24 px instructions, 14/21 px metadata, 600 weight controls; 24–32 px short headings |
| Display type | Georgia/serif only for short optional scene headings; never controls or long copy |
| Spacing / shape | 8 px rhythm; 12 px compact gaps where needed; panels 20–24 px radius; controls 12 px; 44 px minimum targets |
| Icon language | One 2 px rounded-stroke set, 20–24 px; speaker, pause/resume, arrow, settings, heart, lock; visible words for mute/pause and primary actions |
| Art | Rounded silhouettes, shared 2–3 px contour at 100 px item size; warm upper-left key light; short soft grounding shadows |
| Lighting | Dim architecture, warm doorstep and watching mat; effect-local glow only, bounded by existing flash limits; no full-screen glow wash |

Contrast ratios for these opaque pairs are recorded in `validation.json`. These checks cover the proposed colors, not full application accessibility. Preserve at least 4.5:1 for ordinary text and 3:1 for meaningful boundaries/focus. Selected cards also have a visible “Selected” label and border; locked cards include a lock and reason. Do not reduce disabled text to unreadable opacity.

## Compositions and space reservation

All dimensions are CSS pixels. Safe-area insets extend header/footer reserves; never draw underneath controls. The SVG boards are exact-size static compositions; scale them only for presentation, not implementation.

| Viewport | Reserved layout and interaction |
| --- | --- |
| 1440 × 900 | 56 px header; scene at (12,68), 1072 × 660; 320 px inspector separated by 16 px; bottom tray in its own band. Six visible quick choices, Browse all opens full library. Inspector content stays out of the scene. |
| 390 × 844 | 64 px header; 366 × 372 scene; 240 px selected action strip; quick tray below. Horizontal tray scrolling with visible next-card edge/scroll affordance in implementation. Sheet replaces the action region when expanded. |
| 844 × 390 | 56 px header; 508 × 318 scene; 288 px control rail. No bottom tray. Browse all in the rail; rail may scroll while header stays visible. No scale-down of meaningful text. |
| 320 × 568 | 64 px header; 296 × 240 minimum scene; action strip and tray create 712 px content height. Deliberate page scroll under a sticky utility header. Primary control remains reachable, never squeezed under the tray. |
| 200% zoom / large text | Use available CSS width to choose composition; height-constrained views permit scrolling. Header may wrap into two rows with reserved height. Preserve 44 px targets and readable font sizes. |

Header: Back, restrained brand where room permits, Mute/Unmute, Pause/Resume. Settings/collection use secondary utility access in the full implementation; they never replace mute/pause. In pause and library surfaces, the header remains operable inside the active interaction region. Avoid making header controls inert behind a modal while also claiming they are available.

Scene layers, back to front:

1. Quiet sky gradient and sparse still stars.
2. Distant low-contrast roofline; tallest roofs confined to outer 18% on each side.
3. Courtyard plane, doorway, doorstep rangoli, edge diyas and watching mat.
4. Grounded characters; child/Pip at left watching spot before fuse ignition, labeled adult near launch point.
5. Active effect, centered around 60% scene width. Sky reserve spans x=26–75%, y=17–65%; ground effects use x=42–78%, y=50–85%. Clip all effect drawing to the scene.
6. DOM status and controls in reserved layout bands. The teal dashed region in boards is an annotation, never shipped chrome.

Reframe the scene for portrait instead of shrinking a landscape bitmap. Use normalized anchors, clamp character sizes, and adapt effect bounds to the scene's drawable area. Status lives in the inspector/action strip; even the numeric countdown must not conceal the adult preparation.

## State storyboard and navigation contract

Primary means the single visually dominant action. Timed states advance automatically; Pause is their main available intervention, not a second start button. The header Pause is neutral and the action-region Pause is the filled action when duplicated for easy reach.

| State / visual frame | Copy and primary action | Return / cancellation | Reduced-motion equivalent |
| --- | --- | --- | --- |
| Selection | “Choose your light.” Recommended Phuljhari card; **Choose Phuljhari** opens details. Browse all is secondary. No automatic effect preview. | Back returns to festival without awarding. | Static recommendation and cards; no floating or pulsing decoration. |
| Details / ready | Effect name, category, sound character, duration from catalog and short description; **Ask grown-up to light**. An explicit silent Preview is secondary, cancellable, reward-free. | Choose another returns to selection; preserves saved progress. | Static representative effect silhouette for preview; same duration metadata and labels. |
| Adult preparation | “Off to our watching spot.” Child/Pip move away; adult is visibly labeled. **Pause**. No lit fuse until preparation completes. | Cancel show returns to selected ready state, stops timers/audio, no reward. | Snap/crossfade to watching pose, then show the adult pose; keep the preparation status readable before countdown. |
| Countdown | “Ready in 3”, then 2, 1, Glow; **Pause**. Numbers are real text; no loudness increase. | Cancel show returns to ready. | Same readable countdown timing; no scaling, shake, flashes or bounce. |
| Active show | “Golden sparks, just for you.” **Pause**; quiet secondary chrome. Mute remains reachable. | Stop show cancels the owned run and returns to ready; no award for partial playback. | Reduced particle density, static or slowly changing authored silhouette; no flash overlay/squash/camera motion. Keep completion timing. |
| Reward | First completion: “Your first Phuljhari! 1 new sticker · +3 stars.” Replay: “Another lovely sparkle. +1 star.” **Play again**. | Choose another returns to selection. Finish for now returns to festival. Skip only skips presentation, never re-awards. | All awarded stars/sticker visible immediately; no confetti/jumps. |
| Pause | “A little breathing room.” **Resume**; still scene. | Finish for now returns to festival with already-earned progress; no hidden new reward. | Entirely static; breathing motion optional and off by default under reduced motion. |
| Expanded library | 10 entries, category/favourites filters; selected tile labeled. Persistent footer shows selected name and **Use Anar** (or chosen effect). | Back to selection restores prior choice. When opened from a timed phase, close restores interrupted phase under the restart contract. | Still artwork and selected outline; no hover tilt or automatic previews. |

The library board shows the returning-player unlocked state. Fresh players retain original progression; new R1 entries unlock after the first original completion. Locked entries expose name and reason but cannot become selected. No-results filtering offers “Clear filters.” If artwork fails, use name and category with a neutral outlined fallback, not an empty card. Unknown IDs fall back to no selection. A load/storage error cannot prevent in-memory play.

### Interruption and focus

- One interrupting surface at a time. Switching settings/library/collection/pause preserves the original return snapshot. Every modal entry stops/cancels active preview, show ownership, fuse and scheduled effect audio.
- Intro returns with its original payload; ready returns ready; preparation restarts visibly; countdown resumes its documented beat; interrupted active show restarts with a full countdown; reward restores the exact existing award without granting again.
- Escape closes the active dismissible sheet. In preparation/countdown/show it opens pause rather than exiting the game. Close restores focus to the invoker, or the selected item/primary action if the invoker no longer exists.
- Card controls support keyboard navigation and activation; no drag-only selection. Dialog focus stays in the active surface including its persistent mute/pause utility region. Separate scene descriptions and a polite text-status region from decorative canvas graphics; do not announce every particle.
- Motion preference and graphics quality are independent. UI transitions: 120–220 ms for opacity/color; reduced mode removes translation/scale and uses instant or short opacity changes. No essential meaning depends on a transition.

## Asset inventory and production status

| Asset / source | Current status | Required next work |
| --- | --- | --- |
| `public/assets/characters/chhotu_idle.png`, `chhotu_safe_ears.png`, `chhotu_celebrate.png` | Existing production assets; not recreated for this design | DIW-038 checks scale, warm lighting, poses and grounding against new scene |
| Pip and adult in `src/render/characters/` | Existing procedural production art | DIW-005/038 align contour/lighting; adult retains text label |
| Six originals in `src/ui/CrackerArt.jsx` | Existing production vector art | DIW-008 adapts to shared silhouette, stroke and lighting rules |
| Courtyard/background in `src/render/layers/` | Existing production procedural scene | DIW-005 rebuilds depth/composition from these anchors |
| Golden Waterfall, Comet Fan, Ring Burst, Peacock Fan | Names/identities specified; **no final art delivered** | DIW-008 + DIW-019–022 supply distinct thumbnails, effects and stickers |
| Four R2 additions | Future scope, hidden in R1 | DIW-023–026; not counted in these 10-item boards |
| UI icon set and control states | Style specification only | DIW-003/008 create consistent production vectors and accessible labels |
| Courtyard, person blocks, launch prop and radial burst in these SVGs | **Concept placeholders**, editable vectors for composition | Not shippable art, not validated effect timing or final character design |
| Text, palette, spacing and state contracts in this handoff | Final design specification for implementation | Validate actual rendered combinations and behavior during implementation |

No external fonts/images or generated bitmap assets are required to review this handoff. No new assets have been silently marked production-ready.

## Completion evidence and remaining work

Deliverables: four annotated compositions; eight state frames; an inspectable HTML board; editable generator; this specification and asset inventory. Exact vector dimensions and palette contrast are checked in `validation.json`; rendered review captures are in `review/`. Baseline screenshots remain in `../../evidence/diw-001/` for comparison.

Design-only scope: no application code, stores, saves, audio or dependencies changed. App regression tests are not required for this documentation-only ticket. Physical-device listening, implemented keyboard/focus behavior, user usability studies and final asset review belong to their implementation/release tickets; they are not claimed complete here.

Next: **DIW-003**, reusable gameplay design tokens and controls. DIW-004 consumes the layout rules; DIW-005/008 consume the scene and asset requirements; DIW-011/012/015 consume the state and interruption contracts.
