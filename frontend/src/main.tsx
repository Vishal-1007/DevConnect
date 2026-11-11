import { StrictMode, Component, type ReactNode, type ErrorInfo } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', background: '#0b0c14', color: '#ff6b6b', minHeight: '100vh' }}>
          <h2 style={{ color: '#ff6b6b', marginBottom: 12 }}>⚠ Application Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#e8e9f0' }}>
            {err.message}
            {'\n\n'}
            {err.stack}
          </pre>
          <button
            style={{ marginTop: 20, padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
)
