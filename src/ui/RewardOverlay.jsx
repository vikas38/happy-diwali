import React, { useEffect, useState } from 'react'
import { t } from '../i18n/index.js'

// ===================================================================
// RewardOverlay — REWARD_CELEBRATION screen
// ===================================================================
// Awards 3 glowing stars, shows sticker unlock, confetti burst,
// "You did it, Champ!" banner with "Light Again" / "Next Cracker" buttons.

function StarRating({ count = 3 }) {
  const [visible, setVisible] = useState([false, false, false])

  useEffect(() => {
    setVisible([false, false, false])
    const delays = [100, 350, 600]
    const ids = delays.map((d, i) =>
      setTimeout(
        () =>
          setVisible((v) => {
            const n = [...v]
            n[i] = true
            return n
          }),
        d
      )
    )
    return () => ids.forEach(clearTimeout)
  }, [count])

  return (
    <div className="star-rating" aria-label={t('stars_earned', { count })}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={`star${visible[i] ? ' star--visible' : ''}`} aria-hidden="true">
          ⭐
        </span>
      ))}
    </div>
  )
}

export default function RewardOverlay({
  cracker,
  isNewSticker,
  onLightAgain,
  onNextCracker,
  isLastCracker,
}) {
  if (!cracker) return null

  return (
    <div
      className="overlay overlay--reward"
      role="dialog"
      aria-modal="true"
      aria-label={t('reward_dialog_aria')}
    >
      <div className="reward-card">
        <h2 className="reward-card__title">
          {t('reward_title_prefix')} <span className="neon">{t('reward_title_accent')}</span>
        </h2>
        <StarRating count={isNewSticker ? 3 : 1} />
        {isNewSticker && (
          <div
            className="reward-card__sticker"
            aria-label={t('new_sticker_unlocked', { name: cracker.name })}
          >
            <span className="reward-card__sticker-emoji" aria-hidden="true">
              {cracker.emoji}
            </span>
            <p className="reward-card__sticker-label">
              {t('new_sticker_prefix')}
              <br />
              <strong>{cracker.name}</strong>!
            </p>
          </div>
        )}
        <div className="reward-card__actions">
          <button
            className="btn btn--secondary"
            onClick={onLightAgain}
            aria-label={t('reward_light_again_aria')}
          >
            {t('reward_light_again')}
          </button>
          <button
            className="btn btn--primary"
            onClick={onNextCracker}
            autoFocus
            aria-label={t('reward_next_aria')}
          >
            {isLastCracker ? t('reward_box') : t('reward_next')}
          </button>
        </div>
      </div>
    </div>
  )
}
