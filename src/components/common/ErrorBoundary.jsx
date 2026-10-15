import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[TheHorizon ErrorBoundary Caught Error]', error, errorInfo);
    this.setState({ errorInfo });
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <div style={{
          padding: '2.5rem',
          maxWidth: '640px',
          margin: '3rem auto',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #fee2e2',
          boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.08)',
          textAlign: 'center',
          fontFamily: 'var(--font-sans, system-ui, sans-serif)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#fef2f2',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <AlertCircle size={24} />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            {this.props.title || 'An unexpected rendering error occurred'}
          </h3>

          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {this.props.message || 'The component encountered an unexpected issue. Your existing content has been kept safe in memory.'}
          </p>

          {this.state.error && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              textAlign: 'left',
              fontSize: '0.8rem',
              color: '#dc2626',
              fontFamily: 'monospace',
              marginBottom: '1.5rem',
              overflowX: 'auto',
              maxHeight: '120px'
            }}>
              {this.state.error.toString()}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.6rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={15} />
              <span>Retry / Recover View</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
