import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);

    // Hook for an error-reporting service (Sentry, Rollbar, …):
    //   window.Sentry?.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
          <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-8 animate-bounce">
            <AlertTriangle size={48} strokeWidth={1.5} />
          </div>

          <h1 className="text-4xl lg:text-6xl font-black text-black uppercase tracking-tighter mb-4 italic">
            Critical Failure
          </h1>

          <p className="text-gray-500 max-w-md font-medium text-lg mb-10 leading-relaxed">
            The application encountered an unexpected error. Don't worry, your data is
            safe, but we need to restart the session.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-black text-white px-8 py-5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} strokeWidth={2.5} />
              Retry Session
            </button>
            <button
              onClick={this.handleReset}
              className="flex-1 bg-white border-2 border-gray-100 text-black px-8 py-5 rounded-full text-xs font-black uppercase tracking-widest hover:border-black transition-all flex items-center justify-center gap-2"
            >
              <Home size={16} strokeWidth={2.5} />
              Safe Return
            </button>
          </div>

          {/*
            Development only: a production stack trace tells an attacker about
            your internals and tells the user nothing they can act on.
          */}
          {import.meta.env.DEV && (
            <div className="mt-12 p-4 bg-gray-50 rounded-2xl max-w-lg w-full">
              <p className="text-[10px] font-mono text-gray-400 break-all text-left overflow-auto max-h-32">
                {this.state.error?.toString()}
              </p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
