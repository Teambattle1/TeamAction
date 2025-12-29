import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackUI?: ReactNode;
  componentName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 * 
 * Usage:
 * <ErrorBoundary componentName="TaskEditor">
 *   <TaskModal />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error(`[ErrorBoundary] ${this.props.componentName || 'Unknown Component'}:`, error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Store error info in state
    this.setState({
      error,
      errorInfo
    });

    // Optional: Send to error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback UI if provided
      if (this.props.fallbackUI) {
        return this.props.fallbackUI;
      }

      // Default error UI
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <AlertTriangle className="error-icon" size={48} />
            <h2 className="error-title">Something went wrong</h2>
            <p className="error-message">
              {this.props.componentName 
                ? `The ${this.props.componentName} component encountered an error.`
                : 'An unexpected error occurred.'}
            </p>
            
            {this.state.error && (
              <details className="error-details">
                <summary>Error details</summary>
                <pre className="error-stack">
                  <strong>Error:</strong> {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      {'\n\n'}
                      <strong>Component Stack:</strong>
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}

            <div className="error-actions">
              <button onClick={this.handleReset} className="error-btn error-btn-primary">
                <RefreshCw size={16} />
                Try Again
              </button>
              <button onClick={this.handleReload} className="error-btn error-btn-secondary">
                <Home size={16} />
                Reload Page
              </button>
            </div>
          </div>

          <style>{`
            .error-boundary-container {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 400px;
              padding: 2rem;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }

            .error-boundary-content {
              background: white;
              border-radius: 12px;
              padding: 2rem;
              max-width: 500px;
              width: 100%;
              box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
              text-align: center;
            }

            .error-icon {
              color: #f59e0b;
              margin: 0 auto 1rem;
            }

            .error-title {
              font-size: 1.5rem;
              font-weight: 700;
              color: #1f2937;
              margin-bottom: 0.5rem;
            }

            .error-message {
              color: #6b7280;
              margin-bottom: 1.5rem;
              line-height: 1.6;
            }

            .error-details {
              text-align: left;
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 1rem;
              margin-bottom: 1.5rem;
            }

            .error-details summary {
              cursor: pointer;
              font-weight: 600;
              color: #4b5563;
              user-select: none;
            }

            .error-details summary:hover {
              color: #1f2937;
            }

            .error-stack {
              margin-top: 0.75rem;
              padding: 0.75rem;
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 4px;
              overflow-x: auto;
              font-size: 0.75rem;
              line-height: 1.5;
              color: #374151;
              white-space: pre-wrap;
              word-break: break-word;
            }

            .error-actions {
              display: flex;
              gap: 0.75rem;
              justify-content: center;
            }

            .error-btn {
              display: inline-flex;
              align-items: center;
              gap: 0.5rem;
              padding: 0.625rem 1.25rem;
              border: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 0.875rem;
              cursor: pointer;
              transition: all 0.2s;
            }

            .error-btn-primary {
              background: #667eea;
              color: white;
            }

            .error-btn-primary:hover {
              background: #5a67d8;
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }

            .error-btn-secondary {
              background: #e5e7eb;
              color: #374151;
            }

            .error-btn-secondary:hover {
              background: #d1d5db;
              transform: translateY(-1px);
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
