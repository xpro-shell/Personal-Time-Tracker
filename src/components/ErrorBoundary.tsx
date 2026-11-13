import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Personal Time Tracker:', error, errorInfo);
  }

  public handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#141416] border border-red-900/60 rounded-xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-red-950/60 border border-red-800/80 rounded-full flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Application Interruption
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                The desk tracker encountered an unexpected issue while loading data.
              </p>
            </div>
            {this.state.error && (
              <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-lg text-left overflow-x-auto">
                <span className="text-[11px] font-mono text-red-300 block break-words">
                  {this.state.error.message || 'Unknown error occurred'}
                </span>
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-950 bg-zinc-100 rounded-lg hover:bg-white transition-colors cursor-pointer w-full"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Desk Tracker</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
