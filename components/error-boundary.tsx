"use client"

import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })
    
    // Log error for debugging
    console.error('MurfKiddo Error Boundary caught an error:', error, errorInfo)
    
    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: reportError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 max-w-md text-center shadow-2xl border border-white/20">
            <div className="mb-6">
              <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600">
                Don't worry, this happens sometimes! Let's try to fix it.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={this.handleReset}
                className="w-full bg-gradient-to-r from-purple-400 to-pink-400 text-white px-6 py-3 rounded-2xl font-bold hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-purple-300 focus:ring-offset-2 flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Try Again</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full bg-white text-purple-600 px-6 py-3 rounded-2xl font-bold border-2 border-purple-200 hover:bg-purple-50 transition-all focus:outline-none focus:ring-4 focus:ring-purple-300 focus:ring-offset-2 flex items-center justify-center space-x-2"
              >
                <Home className="w-5 h-5" />
                <span>Go Home</span>
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Developer Details
                </summary>
                <div className="mt-2 p-4 bg-red-50 rounded-lg text-xs font-mono text-red-800 overflow-auto max-h-40">
                  <div className="font-bold mb-2">Error:</div>
                  <div className="mb-4">{this.state.error.toString()}</div>
                  
                  {this.state.errorInfo && (
                    <>
                      <div className="font-bold mb-2">Component Stack:</div>
                      <pre className="whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="mt-6 text-xs text-gray-500">
              <p>If this keeps happening, try refreshing the page or clearing your browser data.</p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
} 