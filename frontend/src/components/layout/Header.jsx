import React from 'react';
import { Scale, History, PlusCircle, LogOut, User as UserIcon, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Header = ({ currentView, setCurrentView, onOpenAuthModal }) => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="border-b border-border bg-surface/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('landing')}>
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-accent-fg shadow-subtle">
            <Scale className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base font-serif text-heading tracking-tight">Amicus</h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-accent-soft text-accent border border-accent-border font-bold">
                Analyzer
              </span>
            </div>
            <p className="text-[11px] text-muted -mt-0.5">Contract Intelligence Workspace</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted hover:text-heading hover:bg-subtle transition-all"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Landing Page</span>
          </button>

          <button
            onClick={() => setCurrentView('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'upload'
                ? 'bg-accent-soft text-accent border border-accent-border'
                : 'text-muted hover:text-heading hover:bg-subtle'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Analysis</span>
          </button>

          <button
            onClick={() => {
              if (isAuthenticated) {
                setCurrentView('history');
              } else {
                onOpenAuthModal();
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'history'
                ? 'bg-accent-soft text-accent border border-accent-border'
                : 'text-muted hover:text-heading hover:bg-subtle'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History</span>
          </button>


          <div className="h-4 w-px bg-border mx-1" />

          {/* User Profile / Auth */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-subtle border border-border text-xs">
                <UserIcon className="w-3 h-3 text-accent" />
                <span className="font-medium text-heading truncate max-w-[120px]">
                  {user?.full_name || user?.email}
                </span>
              </div>
              <button
                onClick={() => {
                  logout();
                  setCurrentView('landing');
                }}
                title="Sign Out"
                className="p-1.5 text-muted hover:text-risk-severe hover:bg-subtle rounded transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-3.5 py-1.5 text-xs font-bold rounded bg-accent hover:bg-accent-hover text-accent-fg transition-colors shadow-subtle"
            >
              Sign In
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
