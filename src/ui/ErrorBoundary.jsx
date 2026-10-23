import React from 'react'
export default class ErrorBoundary extends React.Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed)
      return (
        <main className="recovery-card" role="alert">
          <h1>Let’s take a little pause.</h1>
          <p>The courtyard could not open. Your saved progress stays in this browser.</p>
          <button className="sun-button" onClick={() => window.location.reload()}>
            Try again
          </button>
        </main>
      )
    return this.props.children
  }
}
