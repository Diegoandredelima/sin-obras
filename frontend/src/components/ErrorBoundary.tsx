import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center px-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 border border-rose-100 mb-6">
            <span className="text-4xl font-black text-rose-400">!</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Algo deu errado</h1>
          <p className="text-slate-400 mb-6 max-w-sm text-sm">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-md hover:bg-emerald-500 transition-all"
          >
            Recarregar
          </button>
          {this.state.error && (
            <pre className="mt-6 text-xs text-slate-400 max-w-lg overflow-auto bg-slate-100 p-3 rounded-xl">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
