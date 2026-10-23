import React from 'react'
import { t } from '../i18n/index.js'

export default class ErrorBoundary extends React.Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed)
      return (
        <main className="recovery-card" role="alert">
          <h1>{t('error_pause_title')}</h1>
          <p>{t('error_pause_desc')}</p>
          <button className="sun-button" onClick={() => window.location.reload()}>
            {t('try_again')}
          </button>
        </main>
      )
    return this.props.children
  }
}
