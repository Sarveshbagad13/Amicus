import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Scale, 
  Menu, 
  X, 
  ArrowRight, 
  ChevronRight, 
  Lock, 
  FileText, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export function Navbar({ onLaunchApp }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Platform', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Live Inspector', href: '#clause-inspector' },
    { label: 'Security & Ethics', href: '#security' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled 
          ? 'bg-surface/95 backdrop-blur-md border-b border-border shadow-subtle py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo & Wordmark */}
          <a href="#" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-accent-fg shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Scale className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-serif tracking-tight text-heading">
                  Amicus
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-accent-soft text-accent border border-accent-border">
                  Legal AI
                </span>
              </div>
              <span className="text-[11px] text-muted -mt-0.5 tracking-tight font-medium">
                Contract Intelligence
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[14px] font-medium text-muted hover:text-heading transition-colors duration-150 relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-accent after:transition-all after:duration-200 hover:after:w-full"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {onLaunchApp && (
              <button
                onClick={onLaunchApp}
                className="px-4 py-2 rounded text-[13px] font-semibold bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-active transition-all duration-150 shadow-subtle hover:shadow flex items-center gap-1.5"
                title="Launch the live contract analyzer workspace"
              >
                <Sparkles className="w-3.5 h-3.5 text-accent-fg" />
                <span>Launch Analyzer</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {onLaunchApp && (
              <button
                onClick={onLaunchApp}
                className="px-3 py-1.5 rounded text-[12px] font-semibold bg-accent text-accent-fg shadow-subtle"
              >
                Open App
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded text-muted hover:text-heading hover:bg-subtle focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface border-b border-border px-4 pt-3 pb-6 space-y-3 shadow-card animate-fadeIn">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded text-sm font-medium text-body hover:bg-subtle hover:text-heading transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
          {onLaunchApp && (
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLaunchApp();
                }}
                className="w-full py-2.5 rounded text-sm font-semibold bg-accent text-accent-fg hover:bg-accent-hover shadow flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-accent-fg" />
                <span>Launch Live Analyzer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
