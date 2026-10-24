// ===================================================================
// Cracker Definitions & Extensible Registry
// DIW-016: Stable IDs (0..5 original, 6..9 R1 new effects, 10..13 R2 slots),
// structured metadata, and extensible registry queries.
// ===================================================================

export const CATALOG_GROUPS = {
  ORIGINAL: 'original',
  EXPANSION_R1: 'expansion_r1',
  EXPANSION_R2: 'expansion_r2',
}

export const PALETTE_DEFINITIONS = {
  GOLD: {
    key: 'GOLD',
    name: 'Marigold Gold',
    label: 'Marigold Gold',
    swatches: ['#F59E0B', '#FCD34D', '#D97706'],
    description: 'Warm glowing marigold and amber gold',
  },
  ROSE: {
    key: 'ROSE',
    name: 'Rose & Gold',
    label: 'Rose & Gold',
    swatches: ['#F43F5E', '#FBBF24', '#BE185D'],
    description: 'Vibrant Jaipur rose with gold accents',
  },
  EMERALD: {
    key: 'EMERALD',
    name: 'Peacock Emerald',
    label: 'Peacock Emerald',
    swatches: ['#10B981', '#064E3B', '#FBBF24'],
    description: 'Royal peacock turquoise, emerald and gold',
  },
  RAINBOW: {
    key: 'RAINBOW',
    name: 'Festival Rainbow',
    label: 'Festival Rainbow',
    swatches: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'],
    description: 'Joyful spectrum of celebration colors',
  },
}

export const ORIGINAL_SIX_IDS = [0, 1, 2, 3, 4, 5]
export const R1_CRACKER_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
export const R2_CRACKER_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

export const ALL_CRACKER_DEFINITIONS = [
  // ── Original Six (R0 / Base) ───────────────────────────────────────
  {
    id: 0,
    stableKey: 'phuljhari',
    name: 'Phuljhari',
    descriptor: 'Sparkler',
    fullName: 'Phuljhari · Sparkler',
    category: 'ground',
    catalogGroup: CATALOG_GROUPS.ORIGINAL,
    release: 'R0',
    artKey: 'phuljhari',
    effectKey: 'phuljhari',
    duration: 3.0,
    durationMs: 3000,
    intensityDots: 1,
    colors: [45, 330, 50],
    palettes: ['GOLD', 'RAINBOW', 'ROSE', 'EMERALD'],
    soundCharacter: 'Fine crackle',
    audioProfile: 'Fine crackle',
    motionVariant: 'gentle_spark',
    budget: { maxParticles: 120, maxDrawCalls: 60 },
    emoji: '✨',
    iconType: 'sparkler',
    description: 'A silver wand comes alive with fine golden sparks and a soft, textured crackle.',
    comicWord: 'TWINKLE ✨',
  },
  {
    id: 1,
    stableKey: 'anar',
    name: 'Anar',
    descriptor: 'Fountain',
    fullName: 'Anar · Fountain',
    category: 'ground',
    catalogGroup: CATALOG_GROUPS.ORIGINAL,
    release: 'R0',
    artKey: 'anar',
    effectKey: 'anar',
    duration: 3.5,
    durationMs: 3500,
    intensityDots: 2,
    colors: [180, 45, 320],
    palettes: ['GOLD', 'RAINBOW', 'ROSE', 'EMERALD'],
    soundCharacter: 'Soft rushing fountain',
    audioProfile: 'Soft',
    motionVariant: 'upward_spray',
    budget: { maxParticles: 200, maxDrawCalls: 90 },
    emoji: '🌸',
    iconType: 'flowerpot',
    description:
      'A growing fountain of molten gold. Watch the sparks rise, arc, and settle on the stone.',
    comicWord: 'FIZZZZZ 🌸',
  },
  {
    id: 2,
    stableKey: 'chakri',
    name: 'Chakri',
    descriptor: 'Ground spinner',
    fullName: 'Chakri · Ground spinner',
    category: 'ground',
    catalogGroup: CATALOG_GROUPS.ORIGINAL,
    release: 'R0',
    artKey: 'chakri',
    effectKey: 'chakri',
    duration: 3.5,
    durationMs: 3500,
    intensityDots: 2,
    colors: [0, 60, 120, 180, 240, 300],
    palettes: ['GOLD', 'RAINBOW', 'ROSE', 'EMERALD'],
    soundCharacter: 'Whirring sweep',
    audioProfile: 'Soft-Medium',
    motionVariant: 'radial_spin',
    budget: { maxParticles: 180, maxDrawCalls: 80 },
    emoji: '🌀',
    iconType: 'spinner',
    description:
      'A little wheel gathers speed, tracing sweeping circles of warm sparks across the courtyard.',
    comicWord: 'WHEEEEE 🌀',
  },
  {
    id: 3,
    stableKey: 'rocket',
    name: 'Rocket',
    descriptor: 'Sky rocket',
    fullName: 'Rocket · Sky rocket',
    category: 'sky',
    catalogGroup: CATALOG_GROUPS.ORIGINAL,
    release: 'R0',
    artKey: 'rocket',
    effectKey: 'rocket',
    duration: 4.0,
    durationMs: 4000,
    intensityDots: 3,
    colors: [45, 30, 180, 320],
    palettes: ['GOLD', 'RAINBOW', 'ROSE', 'EMERALD'],
    soundCharacter: 'Ascending whoosh and gentle burst',
    audioProfile: 'Medium',
    motionVariant: 'rocket_rise_and_burst',
    budget: { maxParticles: 220, maxDrawCalls: 100 },
    emoji: '🚀',
    iconType: 'rocket',
    description:
      'Follow a glowing trail into the night. A golden burst opens overhead and falls like willow branches.',
    comicWord: 'WHOOSH... POP! 🚀',
  },
  {
    id: 4,
    stableKey: 'ladi',
    name: 'Ladi',
    descriptor: 'Sparkle garland',
    fullName: 'Ladi · Sparkle garland',
    category: 'ground',
    catalogGroup: CATALOG_GROUPS.ORIGINAL,
    release: 'R0',
    artKey: 'ladi',
    effectKey: 'ladi',
    duration: 4.5,
    durationMs: 4500,
    intensityDots: 3,
    colors: [0, 45, 120, 280, 320],
    palettes: ['GOLD', 'RAINBOW', 'ROSE', 'EMERALD'],
    soundCharacter: 'Rhythmic eight-beat pops',
    audioProfile: 'Festive rhythm',
    motionVariant: 'sequential_chain',
    budget: { maxParticles: 160, maxDrawCalls: 75 },
    emoji: '🎉',
    iconType: 'garland',
    description:
      'Eight little flashes travel along a red garland, leaving curling wisps of smoke behind.',
    comicWord: 'POP! POP! POP! 🎉',
  },
  {
    id: 5,
    stableKey: 'sutli',
    name: 'Sutli Bomb',
    descriptor: 'Twine sounder',
    fullName: 'Sutli Bomb · Twine sounder',
    category: 'ground',
    catalogGroup: CATALOG_GROUPS.ORIGINAL,
    release: 'R0',
    artKey: 'sutli',
    effectKey: 'sutli',
    duration: 5.0,
    durationMs: 5000,
    intensityDots: 4,
    colors: [0, 60, 120, 180, 240, 300, 45, 320],
    palettes: ['GOLD', 'RAINBOW', 'ROSE', 'EMERALD'],
    soundCharacter: 'Deep rounded low-end boom',
    audioProfile: 'Rich boom (Tamed)',
    motionVariant: 'ground_burst',
    budget: { maxParticles: 250, maxDrawCalls: 110 },
    emoji: '💥',
    iconType: 'bomb',
    description:
      'A slow-burning fuse, a deep rounded pop, and a bright shower of embers. Try it with gentle sound.',
    comicWord: 'BOOOOM! 💥🌈',
  },

  // ── Four R1 New Effects (EP-04: DIW-019 to DIW-022) ─────────────────
  {
    id: 6,
    stableKey: 'waterfall',
    name: 'Golden Waterfall',
    descriptor: 'Ground cascade',
    fullName: 'Golden Waterfall · Ground cascade',
    category: 'ground',
    catalogGroup: CATALOG_GROUPS.EXPANSION_R1,
    release: 'R1',
    artKey: 'waterfall',
    effectKey: 'waterfall',
    duration: 4.5,
    durationMs: 4500,
    intensityDots: 2,
    colors: [45, 48, 52], // shimmering gold
    palettes: ['GOLD', 'ROSE', 'EMERALD'],
    soundCharacter: 'Soft rushing cascade',
    audioProfile: 'Cascade shimmer',
    motionVariant: 'downward_curtain',
    budget: { maxParticles: 210, maxDrawCalls: 85 },
    emoji: '✨',
    iconType: 'waterfall',
    description: 'A high cascade of molten gold threads pouring down toward the courtyard floor.',
    comicWord: 'SHIMMER ✦',
  },
  {
    id: 7,
    stableKey: 'comet_fan',
    name: 'Comet Fan',
    descriptor: 'Sky fan',
    fullName: 'Comet Fan · Sky fan',
    category: 'sky',
    catalogGroup: CATALOG_GROUPS.EXPANSION_R1,
    release: 'R1',
    artKey: 'comet_fan',
    effectKey: 'comet_fan',
    duration: 4.5,
    durationMs: 4500,
    intensityDots: 3,
    colors: [45, 200, 330],
    palettes: ['GOLD', 'RAINBOW', 'ROSE'],
    soundCharacter: 'Five-tone arcing sweep',
    audioProfile: 'Comet sweep',
    motionVariant: 'arcing_fan',
    budget: { maxParticles: 220, maxDrawCalls: 95 },
    emoji: '🌠',
    iconType: 'fan',
    description: 'Five celestial comets rise together and trace sweeping luminous fans across the sky.',
    comicWord: 'SWOOOOOSH 🌠',
  },
  {
    id: 8,
    stableKey: 'ring_burst',
    name: 'Ring Burst',
    descriptor: 'Concentric halos',
    fullName: 'Ring Burst · Concentric halos',
    category: 'sky',
    catalogGroup: CATALOG_GROUPS.EXPANSION_R1,
    release: 'R1',
    artKey: 'ring_burst',
    effectKey: 'ring_burst',
    duration: 4.0,
    durationMs: 4000,
    intensityDots: 3,
    colors: [330, 175, 45], // rose, peacock teal, gold
    palettes: ['GOLD', 'RAINBOW', 'ROSE', 'EMERALD'],
    soundCharacter: 'Resonant harmonic chime',
    audioProfile: 'Harmonic ring',
    motionVariant: 'expanding_rings',
    budget: { maxParticles: 240, maxDrawCalls: 100 },
    emoji: '🪐',
    iconType: 'ring',
    description: 'A brilliant burst that expands into two perfect concentric rings of rose and peacock teal.',
    comicWord: 'RING-GLOW 🪐',
  },
  {
    id: 9,
    stableKey: 'peacock_fan',
    name: 'Peacock Fan',
    descriptor: 'Feather fan',
    fullName: 'Peacock Fan · Feather fan',
    category: 'ground',
    catalogGroup: CATALOG_GROUPS.EXPANSION_R1,
    release: 'R1',
    artKey: 'peacock_fan',
    effectKey: 'peacock_fan',
    duration: 4.5,
    durationMs: 4500,
    intensityDots: 2,
    colors: [175, 145, 45], // turquoise, emerald, gold
    palettes: ['EMERALD', 'GOLD', 'RAINBOW'],
    soundCharacter: 'Lush fluttering chords',
    audioProfile: 'Feather fan',
    motionVariant: 'feather_plumes',
    budget: { maxParticles: 210, maxDrawCalls: 90 },
    emoji: '🦚',
    iconType: 'peacock',
    description: 'Radiant turquoise and emerald feather plumes rise in a graceful royal peacock fan.',
    comicWord: 'FEATHER-SPARK 🦚',
  },

  // ── Four R2 Expansion Slots (EP-04: DIW-023 to DIW-026) ─────────────
  {
    id: 10,
    stableKey: 'spiral_sky',
    name: 'Spiral Sky',
    descriptor: 'Curling trail',
    fullName: 'Spiral Sky · Curling trail',
    category: 'sky',
    catalogGroup: CATALOG_GROUPS.EXPANSION_R2,
    release: 'R2',
    artKey: 'spiral_sky',
    effectKey: 'spiral_sky',
    duration: 4.0,
    durationMs: 4000,
    intensityDots: 3,
    colors: [175, 45],
    palettes: ['GOLD', 'EMERALD'],
    soundCharacter: 'Curling whistle and sparkle',
    audioProfile: 'Spiral trail',
    motionVariant: 'spiral_curls',
    budget: { maxParticles: 200, maxDrawCalls: 85 },
    emoji: '🌀',
    iconType: 'spiral',
    description: 'A curling luminous trail that opens into an expansive aerial spiral.',
    comicWord: 'SPIRAL 🌀',
  },
  {
    id: 11,
    stableKey: 'chrysanthemum',
    name: 'Chrysanthemum Bloom',
    descriptor: 'Flower burst',
    fullName: 'Chrysanthemum Bloom · Flower burst',
    category: 'sky',
    catalogGroup: CATALOG_GROUPS.EXPANSION_R2,
    release: 'R2',
    artKey: 'chrysanthemum',
    effectKey: 'chrysanthemum',
    duration: 4.0,
    durationMs: 4000,
    intensityDots: 3,
    colors: [45, 330],
    palettes: ['GOLD', 'ROSE'],
    soundCharacter: 'Petal blossom whisper',
    audioProfile: 'Chrysanthemum bloom',
    motionVariant: 'radial_petals',
    budget: { maxParticles: 230, maxDrawCalls: 95 },
    emoji: '🌼',
    iconType: 'chrysanthemum',
    description: 'Layered flower petals opening radially across the dark sky.',
    comicWord: 'BLOOM 🌼',
  },
  {
    id: 12,
    stableKey: 'double_blossom',
    name: 'Double Blossom',
    descriptor: 'Twin flowers',
    fullName: 'Double Blossom · Twin flowers',
    category: 'sky',
    catalogGroup: CATALOG_GROUPS.EXPANSION_R2,
    release: 'R2',
    artKey: 'double_blossom',
    effectKey: 'double_blossom',
    duration: 4.5,
    durationMs: 4500,
    intensityDots: 3,
    colors: [330, 45, 175],
    palettes: ['GOLD', 'RAINBOW'],
    soundCharacter: 'Double soft burst',
    audioProfile: 'Twin bloom',
    motionVariant: 'double_radial',
    budget: { maxParticles: 260, maxDrawCalls: 110 },
    emoji: '🌸',
    iconType: 'double_blossom',
    description: 'Two flower bursts opening in harmonious sequence overhead.',
    comicWord: 'TWIN-BLOOM 🌸🌸',
  },
  {
    id: 13,
    stableKey: 'constellation',
    name: 'Constellation Sparkles',
    descriptor: 'Starlit pose',
    fullName: 'Constellation Sparkles · Starlit pose',
    category: 'sky',
    catalogGroup: CATALOG_GROUPS.EXPANSION_R2,
    release: 'R2',
    artKey: 'constellation',
    effectKey: 'constellation',
    duration: 5.0,
    durationMs: 5000,
    intensityDots: 2,
    colors: [45, 175, 330],
    palettes: ['GOLD', 'RAINBOW'],
    soundCharacter: 'Glassy starlight chimes',
    audioProfile: 'Constellation chime',
    motionVariant: 'geometric_stars',
    budget: { maxParticles: 190, maxDrawCalls: 80 },
    emoji: '⭐',
    iconType: 'constellation',
    description: 'Curated points of light holding a still starlit final constellation.',
    comicWord: 'STARS ⭐',
  },
]

// ── Registry Storage ────────────────────────────────────────────────
const registryById = new Map()
const registryByKey = new Map()

export function registerCracker(def) {
  if (!def || typeof def !== 'object') {
    throw new TypeError('Invalid cracker definition')
  }
  if (typeof def.id !== 'number' || def.id < 0) {
    throw new TypeError(`Invalid cracker id: ${def.id}`)
  }
  if (!def.name || !def.stableKey) {
    throw new TypeError(`Cracker missing name or stableKey: ${JSON.stringify(def)}`)
  }
  registryById.set(def.id, def)
  registryByKey.set(def.stableKey, def)
}

// Initialize default registry
for (const def of ALL_CRACKER_DEFINITIONS) {
  registerCracker(def)
}

export const ORIGINAL_CRACKERS = ALL_CRACKER_DEFINITIONS.filter(
  (c) => c.catalogGroup === CATALOG_GROUPS.ORIGINAL
)

export const R1_CRACKERS = ALL_CRACKER_DEFINITIONS.filter(
  (c) => c.release === 'R0' || c.release === 'R1'
)

export const R2_CRACKERS = ALL_CRACKER_DEFINITIONS

// Active base collection in R1: 10 crackers (IDs 0..9)
export const CRACKERS = R1_CRACKERS

/**
 * Total cracker count for the current active release.
 */
export const TOTAL_CRACKERS = CRACKERS.length

/**
 * Returns a cracker definition by stable ID or stableKey.
 * If unknown/corrupt, returns null (or unavailable descriptor if requested).
 */
export function getCrackerById(idOrKey) {
  if (typeof idOrKey === 'number') {
    return registryById.get(idOrKey) || null
  }
  if (typeof idOrKey === 'string') {
    return registryByKey.get(idOrKey) || null
  }
  return null
}

/**
 * Backward-compatible cracker getter.
 * If ID is unknown/corrupt, returns a truthful safe unavailable-item descriptor,
 * never silently substituting Phuljhari under a misleading name.
 */
export function getCracker(idOrKey) {
  const found = getCrackerById(idOrKey)
  if (found) return found

  // Safe unavailable item descriptor
  return {
    id: -1,
    stableKey: 'unavailable',
    name: 'Unavailable Sparkle',
    descriptor: 'Not found',
    fullName: 'Unavailable Sparkle',
    category: 'ground',
    catalogGroup: 'unknown',
    release: 'R0',
    artKey: 'phuljhari',
    effectKey: 'unavailable',
    duration: 3.0,
    durationMs: 3000,
    intensityDots: 1,
    colors: [45],
    palettes: ['GOLD'],
    soundCharacter: 'Silent',
    audioProfile: 'Silent',
    motionVariant: 'static',
    budget: { maxParticles: 0, maxDrawCalls: 0 },
    emoji: '❓',
    iconType: 'sparkler',
    description: 'This sparkle is currently unavailable.',
    comicWord: '✦',
    isUnavailable: true,
  }
}

export function isValidCrackerId(id) {
  return typeof id === 'number' && registryById.has(id)
}

export function getAllCrackers() {
  return Array.from(registryById.values())
}

export function getCrackersByGroup(group) {
  return getAllCrackers().filter((c) => c.catalogGroup === group)
}

export function getCrackersByCategory(category) {
  return getAllCrackers().filter((c) => c.category === category)
}
