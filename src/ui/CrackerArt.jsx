import React, { useId } from 'react'

/**
 * Maps numeric index or string ID to canonical cracker art key.
 */
export function getCrackerArtKey(key) {
  if (typeof key === 'number') {
    const keys = [
      'phuljhari',
      'anar',
      'chakri',
      'rocket',
      'ladi',
      'sutli',
      'waterfall',
      'comet_fan',
      'ring_burst',
      'peacock_fan',
      'spiral_sky',
      'chrysanthemum',
      'double_blossom',
      'constellation',
    ]
    return keys[key] || 'phuljhari'
  }
  const clean = String(key || '')
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_')
  const aliases = {
    sparkler: 'phuljhari',
    fountain: 'anar',
    flowerpot: 'anar',
    spinner: 'chakri',
    ground_spinner: 'chakri',
    sky_rocket: 'rocket',
    garland: 'ladi',
    sparkle_garland: 'ladi',
    bomb: 'sutli',
    sutli_bomb: 'sutli',
    golden_waterfall: 'waterfall',
    cascade: 'waterfall',
    comet: 'comet_fan',
    fan: 'comet_fan',
    ring: 'ring_burst',
    peacock: 'peacock_fan',
    spiral: 'spiral_sky',
  }
  return aliases[clean] || clean || 'phuljhari'
}

/**
 * CrackerArt — Accessible, responsive SVG illustrations for all 10 R1 Diwali crackers
 * and 4 R2 creative expansion slots.
 *
 * Supports variants: 'default' | 'locked' | 'selected' | 'sticker'
 */
export default function CrackerArt({
  index = 0,
  id: explicitId,
  variant = 'default', // 'default' | 'locked' | 'selected' | 'sticker'
  className = '',
}) {
  const uid = useId().replace(/:/g, '')
  const paint = (name) => `url(#${uid}-${name})`
  const artKey = getCrackerArtKey(explicitId !== undefined ? explicitId : index)

  const coil = Array.from({ length: 180 }, (_, i) => {
    const a = i * 0.16
    const r = 1 + i * 0.155
    return `${i ? 'L' : 'M'}${50 + Math.cos(a) * r},${61 + Math.sin(a) * r * 0.57}`
  }).join(' ')

  const fuse = (d) => (
    <>
      <path d={d} stroke="#493b29" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d={d} stroke="#d4bc82" strokeWidth="1.6" strokeDasharray="2 1" fill="none" />
    </>
  )

  const isLocked = variant === 'locked'
  const isSelected = variant === 'selected'
  const isSticker = variant === 'sticker'

  const rootClass = [
    'cracker-art',
    `cracker-art--${artKey}`,
    isLocked ? 'is-locked' : '',
    isSelected ? 'is-selected' : '',
    isSticker ? 'is-sticker' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <svg
      viewBox="0 0 100 100"
      className={rootClass}
      aria-hidden="true"
      data-testid={`cracker-art-${artKey}`}
    >
      <defs>
        {/* Paper & Foil Gradients */}
        <linearGradient id={`${uid}-paper`}>
          <stop stopColor="#682335" />
          <stop offset=".25" stopColor="#c94953" />
          <stop offset=".42" stopColor="#ed8e79" />
          <stop offset=".6" stopColor="#c54348" />
          <stop offset="1" stopColor="#702332" />
        </linearGradient>

        <linearGradient id={`${uid}-gold`}>
          <stop stopColor="#805020" />
          <stop offset=".3" stopColor="#edbc68" />
          <stop offset=".47" stopColor="#ffe7a4" />
          <stop offset=".7" stopColor="#c28a3c" />
          <stop offset="1" stopColor="#745026" />
        </linearGradient>

        <radialGradient id={`${uid}-jute`} cx="35%" cy="25%">
          <stop stopColor="#cbbb88" />
          <stop offset=".6" stopColor="#8f8050" />
          <stop offset="1" stopColor="#443f2b" />
        </radialGradient>

        <linearGradient id={`${uid}-metal`}>
          <stop stopColor="#4f555b" />
          <stop offset=".45" stopColor="#e2dfcf" />
          <stop offset=".65" stopColor="#858d90" />
          <stop offset="1" stopColor="#353b40" />
        </linearGradient>

        <radialGradient id={`${uid}-glow`}>
          <stop stopColor="#fff8d7" stopOpacity=".75" />
          <stop offset=".25" stopColor="#ffcf69" stopOpacity=".35" />
          <stop offset="1" stopColor="#ffad38" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={`${uid}-peacock`}>
          <stop stopColor="#0f4c5c" />
          <stop offset=".35" stopColor="#1b9aaa" />
          <stop offset=".7" stopColor="#61c9be" />
          <stop offset="1" stopColor="#064e3b" />
        </linearGradient>

        <linearGradient id={`${uid}-wood`}>
          <stop stopColor="#3d271d" />
          <stop offset=".5" stopColor="#6b4423" />
          <stop offset="1" stopColor="#331e14" />
        </linearGradient>

        {/* Selected Halo Filter */}
        {isSelected && (
          <filter id={`${uid}-selected-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#61c9be" floodOpacity="0.8" />
          </filter>
        )}
      </defs>

      {/* Grounding Drop Shadow */}
      <ellipse cx="51" cy="90" rx="30" ry="4" fill="#000" opacity=".25" />
      <ellipse cx="51" cy="89" rx="19" ry="2.2" fill="#000" opacity=".22" />

      {/* 0. Phuljhari — Handheld wand sparkler */}
      {artKey === 'phuljhari' && (
        <g>
          <path d="M35 88 60 24" stroke={paint('metal')} strokeWidth="2.4" />
          <path d="M46 59 60 24" stroke="#333a3e" strokeWidth="5" strokeLinecap="round" />
          <path d="M45 57 58 25" stroke="#9b9b8b" strokeWidth="2" strokeLinecap="round" />
          {Array.from({ length: 17 }, (_, i) => (
            <path
              key={i}
              d={`M${47 + i * 0.7} ${56 - i * 1.8}l2 1`}
              stroke={i % 2 ? '#555c58' : '#c2bba0'}
              strokeWidth=".65"
            />
          ))}
          <circle cx="60" cy="24" r="23" fill={paint('glow')} />
          <g className="cracker-glitter">
            {Array.from({ length: 21 }, (_, i) => {
              const a = i * 2.399
              const r = 10 + (i % 5) * 3
              const x = 60 + Math.cos(a) * r
              const y = 24 + Math.sin(a) * r
              return (
                <path
                  key={i}
                  className="cracker-twinkle"
                  style={{ animationDelay: `${-i * 0.23}s` }}
                  d={`M${60 + Math.cos(a) * 5} ${24 + Math.sin(a) * 5}Q${x} ${y - 2} ${x + Math.cos(a) * 4} ${y + 3}`}
                  fill="none"
                  stroke={i % 3 ? '#ffc164' : '#fff8dd'}
                  strokeWidth={i % 3 ? 0.6 : 1.1}
                />
              )
            })}
          </g>
          <circle cx="60" cy="24" r="2" fill="#fffce7" />
        </g>
      )}

      {/* 1. Anar — Conical fountain flowerpot */}
      {artKey === 'anar' && (
        <g>
          {fuse('M50 29Q43 19 53 13')}
          <path d="M45 30Q50 27 55 30L78 82Q51 96 23 82Z" fill={paint('gold')} />
          <path d="M36 52Q50 56 64 52L73 73Q50 84 27 73Z" fill={paint('paper')} />
          <path
            d="M36 52Q50 57 64 52M27 73Q50 84 73 73"
            stroke="#f5d28a"
            strokeWidth="1.2"
            fill="none"
          />
          <ellipse cx="50" cy="30" rx="5" ry="2" fill="#493321" />
          <ellipse cx="50" cy="65" rx="7" ry="8" fill={paint('gold')} />
          <path d="m50 59 2 4 4 1-3 3 .5 4-3.5-2-3.5 2 .5-4-3-3 4-1Z" fill="#8d4033" />
          <path d="M44 34 27 81M57 35 74 80" stroke="#fff0b5" opacity=".22" fill="none" />
          <path d="M24 83Q50 96 77 83" stroke="#614127" strokeWidth="2" fill="none" />
        </g>
      )}

      {/* 2. Chakri — Golden ground spinner disc */}
      {artKey === 'chakri' && (
        <g>
          <ellipse cx="50" cy="66" rx="31" ry="19" fill="#69442e" />
          <ellipse cx="50" cy="61" rx="31" ry="18" fill={paint('gold')} />
          <path d={coil} fill="none" stroke="#61472c" strokeWidth="3.4" />
          <path d={coil} fill="none" stroke="#d1ac70" strokeWidth="1.9" />
          <path
            d={coil}
            fill="none"
            stroke="#f7dba2"
            strokeWidth=".5"
            transform="translate(0 -.7)"
          />
          <circle cx="50" cy="61" r="2.3" fill="#473b2c" />
          {fuse('M77 56Q91 53 86 42')}
        </g>
      )}

      {/* 3. Rocket — Sky ascent rocket on guide stick */}
      {artKey === 'rocket' && (
        <g transform="rotate(16 50 50)">
          <path d="M52 50V93" stroke="#5c3c25" strokeWidth="3" />
          <path d="M51 50V93" stroke="#d7b783" strokeWidth="1.2" />
          <path d="M39 27H61V65Q50 70 39 65Z" fill={paint('paper')} />
          <ellipse cx="50" cy="65" rx="11" ry="3" fill="#6c3730" />
          <path d="M34 28 50 5 66 28Q50 34 34 28" fill={paint('gold')} />
          <path d="M50 7 41 27" stroke="#fff2cb" strokeWidth="1" opacity=".6" />
          <path
            d="M39 38Q50 42 61 38M39 55Q50 59 61 55"
            stroke={paint('gold')}
            strokeWidth="4"
            fill="none"
          />
          <path d="M43 32V62" stroke="#ffcfb0" strokeWidth=".7" opacity=".45" />
          <path d="m47 45 3-4 3 4-3 5Z" fill="#ffdb8c" />
          {fuse('M47 67Q35 72 40 79')}
        </g>
      )}

      {/* 4. Ladi — 8-firecracker string garland */}
      {artKey === 'ladi' && (
        <g>
          {fuse('M27 18Q77 19 77 49Q77 77 25 77')}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <g
              key={i}
              transform={`translate(${28 + (i % 4) * 14} ${i < 4 ? 35 : 66}) rotate(${i % 2 ? 10 : -10})`}
            >
              <rect x="-5" y="-13" width="10" height="26" rx="2" fill={paint('paper')} />
              <ellipse cy="-12" rx="5" ry="1.7" fill="#dba276" />
              <ellipse cy="12" rx="4.8" ry="1.6" fill="#652d2d" />
              <path d="M-5-7H5M-5 7H5" stroke={paint('gold')} strokeWidth="2.3" />
              <path d="M-2-10V10" stroke="#ffc4a3" strokeWidth=".6" opacity=".5" />
            </g>
          ))}
        </g>
      )}

      {/* 5. Sutli Bomb — Twine wrapped sounder */}
      {artKey === 'sutli' && (
        <g>
          {fuse('M51 35Q40 20 55 12')}
          <path d="M30 40Q50 29 69 41L78 66Q73 85 51 88Q28 86 22 68Z" fill={paint('jute')} />
          {Array.from({ length: 13 }, (_, i) => (
            <path
              key={i}
              d={`M${30 - i * 0.45} ${41 + i * 3}Q50 ${53 + i * 2.6} ${69 + i * 0.55} ${42 + i * 3}`}
              fill="none"
              stroke={i % 2 ? '#524a31' : '#ddc48b'}
              strokeWidth={i % 2 ? 1.7 : 1.1}
              opacity=".85"
            />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <path
              key={i}
              d={`M${32 + i * 4.5} 39Q${15 + i * 7} 65 ${34 + i * 4.7} 83`}
              fill="none"
              stroke="#bba16c"
              strokeWidth="1.4"
            />
          ))}
          <path d="M36 43Q50 34 63 42" stroke="#e1c992" strokeWidth="1.4" fill="none" />
        </g>
      )}

      {/* 6. Golden Waterfall (DIW-019) — Ground cascade tripod stand with hanging golden curtain */}
      {artKey === 'waterfall' && (
        <g>
          {/* Tripod Stand */}
          <path
            d="M50 22 L26 86 M50 22 L74 86 M50 22 L50 87"
            stroke={paint('wood')}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path d="M36 60 L64 60" stroke={paint('wood')} strokeWidth="2.2" />
          <ellipse cx="50" cy="22" rx="7" ry="4" fill={paint('gold')} />
          {/* Cascade Cylinder Tube */}
          <rect x="44" y="24" width="12" height="28" rx="3" fill={paint('gold')} />
          <rect x="46" y="28" width="8" height="20" rx="1.5" fill={paint('paper')} />
          {fuse('M50 52Q46 62 54 68')}
          {/* Cascading Golden Filaments */}
          <g opacity=".85">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => {
              const xOff = (i - 3) * 3.5
              return (
                <path
                  key={i}
                  d={`M${50 + xOff} 52 Q${50 + xOff * 1.5} 68 ${50 + xOff * 2} 85`}
                  stroke="#ffe082"
                  strokeWidth="1.2"
                  strokeDasharray="3 2"
                  fill="none"
                />
              )
            })}
          </g>
          <circle cx="50" cy="52" r="3" fill="#fff9c4" />
        </g>
      )}

      {/* 7. Comet Fan (DIW-020) — 5-tube angled sky fan rack */}
      {artKey === 'comet_fan' && (
        <g>
          {/* Wooden Base Block */}
          <rect x="22" y="74" width="56" height="13" rx="3" fill={paint('wood')} />
          <path d="M25 80 H75" stroke="#ffe082" strokeWidth="1.5" opacity=".6" />
          {/* 5 Angled Launch Tubes radiating outward */}
          {[-32, -16, 0, 16, 32].map((angle, idx) => (
            <g key={idx} transform={`translate(50, 75) rotate(${angle}) translate(-50, -75)`}>
              <rect x="46" y="32" width="8" height="42" rx="2" fill={paint('paper')} />
              <rect x="45" y="30" width="10" height="6" rx="1.5" fill={paint('gold')} />
              <path d="M46 44 H54 M46 58 H54" stroke="#ffd54f" strokeWidth="1.2" />
              {/* Star Comet on Tip */}
              <circle cx="50" cy="27" r="2.5" fill="#fff9c4" />
            </g>
          ))}
          {fuse('M50 78 Q50 86 58 87')}
        </g>
      )}

      {/* 8. Ring Burst (DIW-021) — Concentric planetary halos around jewel core */}
      {artKey === 'ring_burst' && (
        <g>
          {fuse('M50 72 Q42 80 50 86')}
          {/* Central Aerial Shell */}
          <circle cx="50" cy="48" r="16" fill={paint('paper')} />
          <circle cx="50" cy="48" r="13" fill={paint('gold')} />
          <circle cx="50" cy="48" r="6" fill="#fff8e1" />
          {/* Concentric Halo Rings (Ring Burst Signature) */}
          <ellipse
            cx="50"
            cy="48"
            rx="38"
            ry="14"
            fill="none"
            stroke="#61c9be"
            strokeWidth="2.2"
            strokeDasharray="5 3"
          />
          <ellipse
            cx="50"
            cy="48"
            rx="28"
            ry="9.5"
            fill="none"
            stroke="#f3bb56"
            strokeWidth="1.8"
          />
          <ellipse
            cx="50"
            cy="48"
            rx="20"
            ry="6.5"
            fill="none"
            stroke="#e981a0"
            strokeWidth="1.4"
          />
          {/* Celestial Points on Outer Ring */}
          <circle cx="14" cy="48" r="2" fill="#61c9be" />
          <circle cx="86" cy="48" r="2" fill="#61c9be" />
          <circle cx="50" cy="34" r="1.8" fill="#f3bb56" />
          <circle cx="50" cy="62" r="1.8" fill="#f3bb56" />
        </g>
      )}

      {/* 9. Peacock Fan (DIW-022) — Royal peacock vase with layered jewel feather fan */}
      {artKey === 'peacock_fan' && (
        <g>
          {fuse('M50 70 Q42 78 50 85')}
          {/* Royal Brass Pot Base */}
          <path d="M40 68 Q50 63 60 68 L66 84 Q50 88 34 84 Z" fill={paint('gold')} />
          <ellipse cx="50" cy="68" rx="10" ry="3" fill="#2d1d0c" />
          {/* Layered Peacock Feather Quills (Fan) */}
          {[-36, -18, 0, 18, 36].map((deg, i) => (
            <g key={i} transform={`translate(50, 66) rotate(${deg}) translate(-50, -66)`}>
              <path d="M50 66 L50 20" stroke="#064e3b" strokeWidth="1.6" />
              {/* Feather Eye */}
              <ellipse cx="50" cy="22" rx="7" ry="11" fill={paint('peacock')} />
              <ellipse cx="50" cy="23" rx="4.5" ry="7.5" fill="#f59e0b" />
              <circle cx="50" cy="25" r="3.2" fill="#1e3a8a" />
              <circle cx="50" cy="24" r="1.2" fill="#61c9be" />
            </g>
          ))}
          <ellipse cx="50" cy="74" rx="6" ry="2" fill="#92400e" />
        </g>
      )}

      {/* R2 Extension Slots (DIW-023 to 026) */}
      {artKey === 'spiral_sky' && (
        <g>
          {fuse('M50 75 Q40 82 50 86')}
          <circle cx="50" cy="46" r="15" fill={paint('gold')} />
          <path
            d="M50 46 m 0 -4 a 4 4 0 0 1 4 4 a 8 8 0 0 1 -8 8 a 12 12 0 0 1 -12 -12 a 16 16 0 0 1 16 -16"
            fill="none"
            stroke="#61c9be"
            strokeWidth="2.2"
          />
        </g>
      )}

      {artKey === 'chrysanthemum' && (
        <g>
          {fuse('M50 75 Q40 82 50 86')}
          <circle cx="50" cy="46" r="14" fill={paint('paper')} />
          {[0, 45, 90, 135].map((rot) => (
            <g key={rot} transform={`rotate(${rot} 50 46)`}>
              <ellipse
                cx="50"
                cy="46"
                rx="22"
                ry="7"
                fill="none"
                stroke="#f3bb56"
                strokeWidth="1.5"
              />
            </g>
          ))}
        </g>
      )}

      {artKey === 'double_blossom' && (
        <g>
          {fuse('M50 75 Q40 82 50 86')}
          <circle cx="42" cy="38" r="12" fill={paint('gold')} />
          <circle cx="58" cy="52" r="10" fill={paint('paper')} />
        </g>
      )}

      {artKey === 'constellation' && (
        <g>
          {fuse('M50 75 Q40 82 50 86')}
          <polygon
            points="50,22 56,38 72,40 60,52 64,68 50,58 36,68 40,52 28,40 44,38"
            fill={paint('gold')}
          />
        </g>
      )}
    </svg>
  )
}
