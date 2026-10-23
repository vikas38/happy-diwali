// ===================================================================
// Cracker Definitions — metadata for all 6 crackers
// ===================================================================
// Display info (name, emoji, description, intensity dots, colors)
// used by the intro card, carousel, and sticker book.
// Particle/audio show logic lives in crackerControllers.js.
// ===================================================================

export const CRACKERS = [
  {
    id: 0,
    name: 'Phuljhari',
    emoji: '✨',
    iconType: 'sparkler',
    description: 'A silver wand comes alive with fine golden sparks and a soft, textured crackle.',
    intensityDots: 1,
    colors: [45, 330, 50], // gold, pink, gold
    comicWord: 'TWINKLE ✨',
    audioProfile: 'Fine crackle',
  },
  {
    id: 1,
    name: 'Anar',
    emoji: '🌸',
    iconType: 'flowerpot',
    description:
      'A growing fountain of molten gold. Watch the sparks rise, arc, and settle on the stone.',
    intensityDots: 2,
    colors: [180, 45, 320], // cyan, gold, magenta
    comicWord: 'FIZZZZZ 🌸',
    audioProfile: 'Soft',
  },
  {
    id: 2,
    name: 'Chakri',
    emoji: '🌀',
    iconType: 'spinner',
    description:
      'A little wheel gathers speed, tracing sweeping circles of warm sparks across the courtyard.',
    intensityDots: 2,
    colors: [0, 60, 120, 180, 240, 300],
    comicWord: 'WHEEEEE 🌀',
    audioProfile: 'Soft-Medium',
  },
  {
    id: 3,
    name: 'Rocket',
    emoji: '🚀',
    iconType: 'rocket',
    description:
      'Follow a glowing trail into the night. A golden burst opens overhead and falls like willow branches.',
    intensityDots: 3,
    colors: [45, 30, 180, 320],
    comicWord: 'WHOOSH... POP! 🚀',
    audioProfile: 'Medium',
  },
  {
    id: 4,
    name: 'Ladi',
    emoji: '🎉',
    iconType: 'garland',
    description:
      'Eight little flashes travel along a red garland, leaving curling wisps of smoke behind.',
    intensityDots: 3,
    colors: [0, 45, 120, 280, 320],
    comicWord: 'POP! POP! POP! 🎉',
    audioProfile: 'Medium-Loud',
  },
  {
    id: 5,
    name: 'Sutli Bomb',
    emoji: '💥',
    iconType: 'bomb',
    description:
      'A slow-burning fuse, a deep rounded pop, and a bright shower of embers. Try it with gentle sound.',
    intensityDots: 4,
    colors: [0, 60, 120, 180, 240, 300, 45, 320],
    comicWord: 'BOOOOM! 💥🌈',
    audioProfile: 'Loudest (Tamed)',
  },
]

export function getCracker(id) {
  return CRACKERS[id] || CRACKERS[0]
}
