import React, { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore.jsx'
import Diya from './Diya.jsx'
import CrackerArt from './CrackerArt.jsx'
import FestivalSparkles from './FestivalSparkles.jsx'
import { CRACKERS } from '../crackers/crackerDefs.js'
import { t } from '../i18n/index.js'

function Icon({ name, size = 22 }) {
  const paths = {
    home: 'M3 10 12 3l9 7v10H3Z M9 20v-7h6v7',
    spark: 'm12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8Z',
    book: 'M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2v16',
    moon: 'M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z',
    heart: 'M12 21 3.5 12.5C-2 5 7-1 12 6c5-7 14-1 8.5 6.5Z',
    sound: 'M3 9h4l5-4v14l-5-4H3Z M16 8q5 4 0 8 M19 4q9 8 0 16',
    arrow: 'M4 12h16m-6-6 6 6-6 6',
    shield: 'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6Z m-5 10 3 3 6-6',
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.spark} />
    </svg>
  )
}

function Rangoli({ color = '#dd796d' }) {
  const grainId = React.useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 240 240" aria-hidden="true">
      <defs>
        <filter id={grainId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".65"
            numOctaves="2"
            seed="8"
            result="grain"
          />
          <feComposite in="grain" in2="SourceGraphic" operator="in" result="clipped" />
          <feBlend in="SourceGraphic" in2="clipped" mode="soft-light" />
        </filter>
      </defs>
      <g filter={`url(#${grainId})`} transform="translate(120 120)">
        {Array.from({ length: 12 }, (_, i) => (
          <g key={i} transform={`rotate(${i * 30})`}>
            <path
              d="M0-13Q-46-64 0-103Q46-64 0-13"
              fill={i % 2 ? '#e9b84e' : color}
              stroke="#fff3d6"
              strokeWidth="3"
            />
            <path d="M0-38Q-17-66 0-86Q17-66 0-38" fill="none" stroke="#fff3d6" strokeWidth="2" />
            <circle cy="-112" r="3" fill={color} />
          </g>
        ))}
        <circle r="30" fill="#698f79" stroke="#fff3d6" strokeWidth="4" />
        <circle r="18" fill="#e9b84e" />
        <circle r="7" fill={color} />
      </g>
    </svg>
  )
}

function FestivalArt() {
  return (
    <svg className="festival-art" viewBox="0 0 620 430" aria-hidden="true">
      <defs>
        <radialGradient id="glow">
          <stop stopColor="#f5ba60" stopOpacity=".3" />
          <stop offset="1" stopColor="#f5ba60" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pot" x2="0" y2="1">
          <stop stopColor="#f1b77e" />
          <stop offset=".4" stopColor="#be7047" />
          <stop offset="1" stopColor="#622c28" />
        </linearGradient>
        <radialGradient id="hero-oil">
          <stop stopColor="#c88a3f" />
          <stop offset=".4" stopColor="#6c432c" />
          <stop offset="1" stopColor="#2e2020" />
        </radialGradient>
        <linearGradient id="lantern-fold">
          <stop stopColor="#884635" />
          <stop offset=".4" stopColor="#ffd598" />
          <stop offset=".65" stopColor="#e4a15e" />
          <stop offset="1" stopColor="#8c4a3c" />
        </linearGradient>
        <linearGradient id="hero-flame" x2="0" y2="1">
          <stop stopColor="#ef9c37" stopOpacity=".6" />
          <stop offset=".6" stopColor="#ffe8a0" />
          <stop offset="1" stopColor="#ffb743" />
        </linearGradient>
      </defs>
      <circle cx="328" cy="236" r="200" fill="url(#glow)" />
      <path d="M-10 21Q300 125 630 20" stroke="#a38162" fill="none" />
      {[40, 115, 190, 265, 340, 415, 490, 565].map((x, i) => (
        <g key={x} transform={`translate(${x} ${41 + Math.sin((i / 7) * Math.PI) * 38})`}>
          <path d="M0 0v20" stroke="#d7a756" />
          <path d="M-12 20h24l7 30-19 15-19-15Z" fill="url(#lantern-fold)" />
          <path d="M-11 31h22M0 21v40M-8 67v13M0 65v20M8 67v13" stroke="#ffd48c" opacity=".8" />
        </g>
      ))}
      {[
        [110, 161],
        [510, 172],
        [465, 268],
        [192, 100],
        [330, 138],
        [80, 275],
        [560, 310],
      ].map(([x, y]) => (
        <g key={x} transform={`translate(${x} ${y})`} stroke="#e4bb7a" opacity=".8">
          <path d="M-5 0H5M0-5V5" />
          <circle cx="15" cy="15" r="1" />
        </g>
      ))}
      <g fill="#65507c" opacity=".45">
        <path d="M0 350V277h36v-24h35v24h28v73M78 350V295h26v-44q38-55 76 0v44h25v55M470 350V274h21v-32q25-41 50 0v32h25v76M563 350V296h57v54" />
      </g>
      <ellipse cx="328" cy="371" rx="220" ry="33" fill="#231d39" opacity=".45" />
      <g transform="translate(150 18)">
        <path d="M176 258C108 213 179 156 178 101c39 56 72 108-2 157" fill="url(#hero-flame)" />
        <path d="M177 251C142 223 177 195 180 171c24 38 27 63-3 80" fill="#fff1b1" />
        <path d="M38 278Q176 431 314 278Z" fill="url(#pot)" />
        <ellipse cx="176" cy="278" rx="138" ry="32" fill="#f4b87a" />
        <ellipse cx="176" cy="276" rx="118" ry="23" fill="url(#hero-oil)" />
        <path d="M176 277l5-24" stroke="#fff1b1" strokeWidth="7" />
        <path d="M53 297q123 80 246 0" stroke="#ffcd88" strokeWidth="6" fill="none" />
        {[98, 137, 176, 215, 254].map((x, i) => (
          <path
            key={x}
            d={`M${x - 9} ${326 + Math.sin((i / 4) * Math.PI) * 18}l9 9 9-9`}
            fill="none"
            stroke="#ffcf8c"
            strokeWidth="4"
          />
        ))}
      </g>
      <g transform="translate(447 276) scale(.55)">
        <path d="M60 55C20 26 65 6 62-24c30 38 32 58-2 79" fill="#ffc769" />
        <path d="M0 65Q60 135 120 65Z" fill="#d48161" />
        <ellipse cx="60" cy="65" rx="60" ry="13" fill="#ffc785" />
      </g>
      <g fill="#e5a355">
        <ellipse cx="147" cy="377" rx="12" ry="5" transform="rotate(-25 147 377)" />
        <ellipse cx="478" cy="397" rx="13" ry="5" transform="rotate(25 478 397)" />
        <ellipse cx="510" cy="380" rx="9" ry="4" />
      </g>
    </svg>
  )
}

function Modal({ title, onClose, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    ref.current?.showModal()
    return () => previous?.focus()
  }, [])
  return (
    <dialog
      ref={ref}
      className="festival-modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <button className="modal-close" aria-label={t('close_dialog')} onClick={onClose}>
        ×
      </button>
      <h2>{title}</h2>
      {children}
    </dialog>
  )
}

/**
 * For Grown-ups button with press-and-hold (800ms) protection and keyboard path.
 * A single tap will not open it; holding for 800ms fills the ring and opens.
 * Keyboard users can press Enter or Space to open immediately.
 */
function GrownUpsNavButton({ onOpen }) {
  const [holding, setHolding] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef(null)
  const startRef = useRef(0)

  const startHold = () => {
    startRef.current = Date.now()
    setHolding(true)
    setProgress(0)

    const tick = () => {
      const elapsed = Date.now() - startRef.current
      const pct = Math.min(1, elapsed / 800)
      setProgress(pct)
      if (pct >= 1) {
        setHolding(false)
        setProgress(0)
        onOpen()
      } else {
        timerRef.current = requestAnimationFrame(tick)
      }
    }
    timerRef.current = requestAnimationFrame(tick)
  }

  const cancelHold = () => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current)
      timerRef.current = null
    }
    setHolding(false)
    setProgress(0)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen()
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current)
    }
  }, [])

  // Circumference of r=10 circle: 2 * Math.PI * 10 ≈ 62.83
  const circumference = 62.83
  const dashoffset = circumference * (1 - progress)

  return (
    <button
      type="button"
      className={`nav-item grown-ups-btn ${holding ? 'is-holding' : ''}`}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerCancel={cancelHold}
      onPointerLeave={cancelHold}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.preventDefault()}
      aria-label={t('grownups_nav_label')}
    >
      <div className="grown-ups-icon-wrap">
        <Icon name="heart" />
        {holding && (
          <svg className="hold-progress-ring" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" className="hold-ring-bg" />
            <circle
              cx="12"
              cy="12"
              r="10"
              className="hold-ring-fill"
              style={{ strokeDasharray: circumference, strokeDashoffset: dashoffset }}
            />
          </svg>
        )}
      </div>
      <span>{t('grownups_nav_text')}</span>
      <span className="grown-ups-hold-hint" aria-hidden="true">
        {holding ? t('grownups_hold_active') : t('grownups_hold_idle')}
      </span>
      <span className="nav-arrow" aria-hidden="true">
        ↗
      </span>
    </button>
  )
}

export default function FestivalHome({ onPlay, motion, setMotion }) {
  const { state, setMasterVolume, unlockAllCrackers } = useGameStore()
  const [modal, setModal] = useState(null)

  const [lit, setLit] = useState([])
  const [color, setColor] = useState('#dd796d')
  const [breath, setBreath] = useState(false)
  useEffect(() => {
    if (modal !== 'calm') return
    setBreath(false)
    const id = setInterval(() => setBreath((v) => !v), 4000)
    return () => clearInterval(id)
  }, [modal])

  const explore = () =>
    document.getElementById('activities')?.scrollIntoView({ behavior: 'smooth' })

  const swatches = [
    [t('swatch_rose'), '#dd796d'],
    [t('swatch_purple'), '#9276b3'],
    [t('swatch_ocean'), '#58a7a5'],
    [t('swatch_marigold'), '#dc922e'],
  ]

  return (
    <div className={`festival-app ${motion ? '' : 'motion-paused'}`}>
      <a className="skip-link" href="#activities">
        {t('skip_to_activities')}
      </a>
      <aside className="sidebar">
        <a className="brand" href="#">
          <span className="brand-mark">✳</span>
          <span>
            {t('brand_name_lower')}
            <small>{t('brand_sidebar_sub')}</small>
          </span>
        </a>
        <div className="sidebar-label">{t('sidebar_space')}</div>
        <nav aria-label={t('main_nav_aria')}>
          <button
            className="nav-item active"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Icon name="home" /> {t('nav_my_diwali')} <span className="nav-dot" />
          </button>
          <button className="nav-item" onClick={explore}>
            <Icon name="spark" /> {t('nav_play_discover')}
          </button>
          <button className="nav-item" onClick={() => setModal('stickers')}>
            <Icon name="book" /> {t('nav_sticker_book')}{' '}
            <span className="nav-count">{state.stickers.length}</span>
          </button>
          <button className="nav-item" onClick={() => setModal('calm')}>
            <Icon name="moon" /> {t('nav_calm_corner')}
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="little-note">
            <span>✧</span>
            <h3>{t('sidebar_note_title')}</h3>
            <p>
              {t('sidebar_note_body1')}
              <br />
              {t('sidebar_note_body2')}
            </p>
          </div>
          <GrownUpsNavButton onOpen={() => setModal('parents')} />
          <p className="made-with">{t('sidebar_made_for')}</p>
        </div>
      </aside>

      <main className="festival-main">
        <header className="festival-topbar">
          <div>
            <span className="season-dot" /> {t('festival_title')}
          </div>
          <div className="topbar-actions">
            <button
              className="motion-toggle"
              aria-pressed={motion}
              onClick={() => setMotion((v) => !v)}
            >
              <Icon name="spark" size={16} />
              <span>{t('motion_toggle_label', { state: motion ? 'on' : 'off' })}</span>
            </button>
            <button
              onClick={() => setMasterVolume(state.masterVolume ? 0 : 0.35)}
              aria-label={state.masterVolume ? t('sound_mute_aria') : t('sound_enable_aria')}
            >
              <Icon name="sound" size={18} />
              <span>{t('sound_toggle_label', { state: state.masterVolume ? 'on' : 'off' })}</span>
            </button>
            <span className="star-bank">{t('stars_bank', { count: state.stars })}</span>
            <span className="avatar" aria-label={t('little_explorer')}>
              V
            </span>
          </div>
        </header>

        <div className="home-content">
          <section className="welcome">
            <div>
              <p className="eyebrow">{t('welcome_eyebrow')}</p>
              <h1>
                {t('welcome_title')}
                <span> ✦</span>
              </h1>
              <p>{t('welcome_subtitle')}</p>
            </div>
            <span className="festival-stamp">
              {t('stamp_made_of')}
              <br />
              <strong>{t('stamp_little_joys')}</strong>
              <span>✧</span>
            </span>
          </section>

          <section className="festival-hero">
            <FestivalSparkles />
            <div className="hero-copy">
              <span className="hero-tag">
                <span /> {t('hero_tag')}
              </span>
              <h2>
                {t('hero_title_line1')}
                <br />
                {t('hero_title_line2')} <em>{t('hero_title_smiles')}</em>
              </h2>
              <p>
                {t('hero_desc_line1')}
                <br className="desktop-break" /> {t('hero_desc_line2')}
                <br className="desktop-break" /> {t('hero_desc_line3')}
              </p>
              <button
                className="sun-button play-dominant-btn"
                onClick={onPlay}
                aria-label={t('play_little_lights')}
              >
                <span className="play-btn-spark" aria-hidden="true">
                  ✦
                </span>
                <span>{t('play_little_lights')}</span>
                <Icon name="arrow" size={24} />
              </button>
              <div className="hero-footnote">
                <Icon name="shield" size={15} /> {t('hero_footnote')}
              </div>
            </div>
            <FestivalArt />
            <div className="hero-keepsake">
              <span>✧</span>
              <div>
                {t('hero_keepsake_title')}
                <small>{t('hero_keepsake_sub')}</small>
              </div>
            </div>
            <span className="hero-caption">{t('hero_caption')}</span>
          </section>

          <section id="activities" className="activities">
            <div className="section-heading">
              <div>
                <h2>{t('activities_title')}</h2>
                <p>{t('activities_desc')}</p>
              </div>
              <span>
                {t('activities_explore_tag')} <span>↙</span>
              </span>
            </div>
            <div className="activity-grid">
              <button
                className="activity-card"
                onClick={() => {
                  setLit([])
                  setModal('diyas')
                }}
              >
                <div className="activity-art diya-art">
                  <span className="activity-tag">{t('activity_diya_tag')}</span>
                  <Diya />
                  <span className="art-spark">✧</span>
                </div>
                <div className="activity-copy">
                  <h3>
                    {t('activity_diya_title')} <span>↗</span>
                  </h3>
                  <p>{t('activity_diya_desc')}</p>
                  <small>
                    {t('activity_diya_meta1')} <span>·</span> {t('activity_diya_meta2')}
                  </small>
                </div>
              </button>
              <button className="activity-card" onClick={() => setModal('rangoli')}>
                <div className="activity-art rangoli-art">
                  <span className="activity-tag">{t('activity_rangoli_tag')}</span>
                  <Rangoli />
                </div>
                <div className="activity-copy">
                  <h3>
                    {t('activity_rangoli_title')} <span>↗</span>
                  </h3>
                  <p>{t('activity_rangoli_desc')}</p>
                  <small>
                    {t('activity_rangoli_meta1')} <span>·</span> {t('activity_rangoli_meta2')}
                  </small>
                </div>
              </button>
              <button className="activity-card" onClick={onPlay}>
                <div className="activity-art spark-art">
                  <span className="activity-tag">{t('activity_spark_tag')}</span>
                  <CrackerArt index={0} />
                </div>
                <div className="activity-copy">
                  <h3>
                    {t('activity_spark_title')} <span>↗</span>
                  </h3>
                  <p>{t('activity_spark_desc')}</p>
                  <small>
                    {t('activity_spark_meta1')} <span>·</span> {t('activity_spark_meta2')}
                  </small>
                </div>
              </button>
            </div>
          </section>

          <section className="bottom-grid">
            <button className="journey-card" onClick={() => setModal('stickers')}>
              <span className="journey-icon">✧</span>
              <div>
                <h3>{t('journey_card_title')}</h3>
                <p>{t('journey_card_desc')}</p>
                <div className="collection-progress">
                  <span style={{ width: `${(state.stickers.length / 6) * 100}%` }} />
                </div>
                <small>{t('journey_card_count', { count: state.stickers.length })}</small>
              </div>
              <span className="journey-arrow">→</span>
            </button>
            <button className="calm-card" onClick={() => setModal('calm')}>
              <span className="calm-moon">☾</span>
              <div>
                <h3>{t('calm_card_title')}</h3>
                <p>{t('calm_card_desc')}</p>
                <strong>
                  {t('calm_card_link')} <span>→</span>
                </strong>
              </div>
            </button>
          </section>
          <footer className="festival-footer">
            <span>✳ &nbsp; {t('footer_text')}</span>
            <span>{t('footer_tag')}</span>
          </footer>
        </div>
      </main>

      {modal && (
        <Modal
          title={
            {
              diyas: t('modal_diyas_title'),
              rangoli: t('modal_rangoli_title'),
              stickers: t('modal_stickers_title'),
              calm: t('modal_calm_title'),
              parents: t('modal_parents_title'),
            }[modal]
          }
          onClose={() => setModal(null)}
        >
          {modal === 'diyas' && (
            <>
              <p>{t('modal_diyas_intro')}</p>
              <div className="diya-row">
                {[0, 1, 2, 3, 4].map((i) => (
                  <button
                    key={i}
                    aria-label={t('modal_diyas_aria', { num: i + 1 })}
                    aria-pressed={lit.includes(i)}
                    onClick={() => setLit((s) => (s.includes(i) ? s : [...s, i]))}
                  >
                    <Diya lit={lit.includes(i)} />
                  </button>
                ))}
              </div>
              <p className="activity-result" aria-live="polite">
                {lit.length === 5
                  ? t('modal_diyas_full')
                  : t('modal_diyas_count', { count: lit.length })}
              </p>
              <button className="sun-button" onClick={() => setLit([])}>
                {t('modal_diyas_reset')}
              </button>
            </>
          )}
          {modal === 'rangoli' && (
            <>
              <p>{t('modal_rangoli_intro')}</p>
              <div className="rangoli-preview">
                <Rangoli color={color} />
              </div>
              <div className="swatches">
                {swatches.map(([name, c]) => (
                  <button
                    key={c}
                    style={{ background: c }}
                    aria-label={name}
                    aria-pressed={color === c}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
              <button
                className="sun-button"
                onClick={() => {
                  const svg = document.querySelector('.rangoli-preview svg').cloneNode(true)
                  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
                  svg.setAttribute('width', '800')
                  svg.setAttribute('height', '800')
                  const url = URL.createObjectURL(
                    new Blob([svg.outerHTML], { type: 'image/svg+xml' })
                  )
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'my-diwali-rangoli.svg'
                  a.click()
                  setTimeout(() => URL.revokeObjectURL(url), 1000)
                }}
              >
                {t('modal_rangoli_keep')}
              </button>
            </>
          )}
          {modal === 'stickers' && (
            <>
              <p>{t('modal_stickers_intro')}</p>
              <div className="home-stickers">
                {CRACKERS.map((c) => (
                  <div key={c.id} className={state.stickers.includes(c.id) ? 'collected' : ''}>
                    <span className={state.stickers.includes(c.id) ? '' : 'sticker-silhouette'}>
                      {c.emoji}
                    </span>
                    <strong>{c.name}</strong>
                    <small>
                      {state.stickers.includes(c.id)
                        ? t('modal_stickers_collected')
                        : t('modal_stickers_waiting')}
                    </small>
                  </div>
                ))}
              </div>
              <button className="sun-button" onClick={onPlay}>
                {t('modal_stickers_go')} <Icon name="arrow" />
              </button>
            </>
          )}
          {modal === 'calm' && (
            <>
              <p>{t('modal_calm_intro')}</p>
              <div className={`home-breathing ${breath ? 'exhale' : ''}`}>
                <span>☾</span>
              </div>
              <p className="activity-result" aria-live="polite">
                {breath ? t('modal_calm_out') : t('modal_calm_in')}
              </p>
              <button className="sun-button" onClick={() => setModal(null)}>
                {t('modal_calm_ready')}
              </button>
            </>
          )}
          {modal === 'parents' && (
            <>
              <p>{t('modal_parents_desc')}</p>
              <div className="parent-note">
                <Icon name="shield" />
                <p>{t('modal_parents_safety')}</p>
              </div>
              <label className="parent-volume">
                {t('modal_parents_volume')}{' '}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step=".05"
                  value={state.masterVolume}
                  onChange={(e) => setMasterVolume(Number(e.target.value))}
                />
              </label>
              <div className="parent-actions">
                <button
                  type="button"
                  className="btn btn--secondary parent-unlock-btn"
                  onClick={() => {
                    unlockAllCrackers()
                  }}
                  aria-label={t('grownups_unlock_all_aria')}
                >
                  <span aria-hidden="true">🔓</span>{' '}
                  {state.unlocked.length >= 6
                    ? t('grownups_unlocked_done')
                    : t('grownups_unlock_all_btn')}
                </button>
                <small className="parent-unlock-hint">{t('grownups_unlock_all_hint')}</small>
              </div>
              <div className="privacy-note" role="region" aria-label={t('privacy_notice_region')}>
                <p>{t('privacy_line1')}</p>
                <p>{t('privacy_line2')}</p>
                <p>{t('privacy_line3')}</p>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  )
}
