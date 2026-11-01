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
  onSkip,
  isLastCracker,
  isMuted = false,
  onToggleMute,
  allStickersCollected = false,
  onReplayFavourites,
  onMakeRangoli,
  onFinishForNow,
  gentleGoals,
  isSequence = false,
  sequenceIndex = 0,
  sequenceTotal = 0,
}) {
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false)

  const handleSkip = React.useCallback(() => {
    if (onSkip) onSkip()
    else onNextCracker?.()
  }, [onSkip, onNextCracker])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') handleSkip()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleSkip])

  if (!cracker) return null

  let suggestionText = null
  if (!gentleGoals?.groundAndSky) {
    suggestionText = cracker.category === 'ground' ? t('suggestion_sky') : t('suggestion_ground')
  } else if (!gentleGoals?.twoPalettes) {
    suggestionText = t('suggestion_palettes')
  } else if (!gentleGoals?.decoratedCourtyard) {
    suggestionText = t('suggestion_decorations')
  }

  return (
    <div
      className="overlay overlay--reward"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reward-card-title"
    >
      <div className={`reward-card ${allStickersCollected ? 'reward-card--complete' : ''}`}>
        <div className="reward-card__top">
          {onToggleMute ? (
            <button
              type="button"
              className="reward-mute-btn"
              onClick={onToggleMute}
              aria-pressed={isMuted}
              aria-label={isMuted ? t('unmute_audio') : t('mute_audio')}
              title={isMuted ? t('unmute_audio') : t('mute_audio')}
            >
              <span aria-hidden="true">{isMuted ? '🔇' : '🔊'}</span>
            </button>
          ) : (
            <span className="reward-card__spacer" aria-hidden="true" />
          )}
          <button
            type="button"
            className="reward-skip-btn"
            onClick={handleSkip}
            aria-label={t('reward_skip_aria')}
          >
            {t('reward_skip_btn')}
          </button>
        </div>
        <h2 id="reward-card-title" className="reward-card__title">
          <span className="sr-only">{t('reward_dialog_aria')} </span>
          {allStickersCollected ? (
            t('collection_complete_title')
          ) : (
            <>
              {t('reward_title_prefix')} <span className="neon">{t('reward_title_accent')}</span>
            </>
          )}
        </h2>
        <StarRating count={allStickersCollected ? 3 : isNewSticker ? 3 : 1} />
        {allStickersCollected && (
          <div className="reward-celebration-badge" aria-hidden="true">
            <span className="celebration-badge-diya">🪔</span>
            <span className="celebration-badge-sparkle">✨</span>
            <span className="celebration-badge-confetti">🎉</span>
          </div>
        )}
        {isNewSticker && !allStickersCollected && (
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
        {isSequence && (
          <div className="reward-sequence-pill" role="status">
            {t('sequence_progress', { current: sequenceIndex + 1, total: sequenceTotal })}
          </div>
        )}
        {suggestionText && !dismissedSuggestion && !allStickersCollected && (
          <div className="reward-suggestion-card" role="status">
            <div className="reward-suggestion-header">
              <span className="reward-suggestion-title">✨ {t('suggestion_title')}</span>
              <button
                type="button"
                className="reward-suggestion-dismiss"
                onClick={() => setDismissedSuggestion(true)}
                aria-label={t('suggestion_dismiss')}
              >
                ✕
              </button>
            </div>
            <p className="reward-suggestion-text">{suggestionText}</p>
          </div>
        )}
        {allStickersCollected && (
          <p className="reward-card__complete-subtext">{t('collection_complete_sub')}</p>
        )}
        <div
          className={`reward-card__actions ${allStickersCollected ? 'reward-card__actions--complete' : ''}`}
        >
          {allStickersCollected ? (
            <>
              <button
                type="button"
                className="btn btn--secondary reward-action-btn reward-action-btn--replay"
                onClick={onReplayFavourites || onLightAgain}
                aria-label={t('action_replay_favourites_aria')}
              >
                <span className="reward-btn-icon" aria-hidden="true">
                  ✨
                </span>
                <span className="reward-btn-text">{t('action_replay_favourites')}</span>
              </button>
              <button
                type="button"
                className="btn btn--primary reward-action-btn reward-action-btn--next"
                onClick={onMakeRangoli || onNextCracker}
                autoFocus
                aria-label={t('action_make_rangoli_aria')}
              >
                <span className="reward-btn-icon" aria-hidden="true">
                  ✦
                </span>
                <span className="reward-btn-text">{t('action_make_rangoli')}</span>
              </button>
              <button
                type="button"
                className="btn btn--secondary reward-action-btn reward-action-btn--finish"
                onClick={onFinishForNow || handleSkip}
                aria-label={t('action_finish_for_now_aria')}
              >
                <span className="reward-btn-icon" aria-hidden="true">
                  🪔
                </span>
                <span className="reward-btn-text">{t('action_finish_for_now')}</span>
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
