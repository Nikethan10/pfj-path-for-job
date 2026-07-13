import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches unexpected render/runtime errors anywhere in the tree and shows a friendly
 * recovery screen instead of a blank white page. Without this, a single thrown error in
 * any component takes the whole app down for the user with no way back.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log for now; this is where a monitoring service (e.g. Sentry) would hook in.
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full text-center bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.01M10.29 3.86l-7.4 12.82A1.5 1.5 0 004.18 19h15.64a1.5 1.5 0 001.29-2.32l-7.4-12.82a1.5 1.5 0 00-2.58 0z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-slate-800 mb-1">Something went wrong</h1>
          <p className="text-sm text-slate-500 mb-6">
            An unexpected error occurred. Reloading the page usually fixes it — your saved data is safe.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-green-700 hover:bg-green-800 transition-colors"
            >
              Reload page
            </button>
            <button
              onClick={() => window.location.assign('/dashboard')}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Go to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}
