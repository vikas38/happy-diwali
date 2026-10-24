import React from 'react'
import CrackerInspector from './CrackerInspector.jsx'
import { t } from '../i18n/index.js'

/**
 * IntroCard — Legacy wrapper connecting CRACKER_INTRO_CARD FSM state
 * to the rich CrackerInspector implementation.
 */
export default function IntroCard({ cracker, onPutOnStreet, onCancel, ...props }) {
  const introTitle = cracker ? (
    <>
      {t('intro_meet_prefix')} <span className="neon">{cracker.name}</span>
    </>
  ) : (
    ''
  )
  return (
    <CrackerInspector
      cracker={cracker}
      title={introTitle}
      isOpen={true}
      onCancel={onCancel}
      onClose={onCancel}
      onPutOnStreet={onPutOnStreet}
      titleId="intro-card-title"
      {...props}
    />
  )
}
