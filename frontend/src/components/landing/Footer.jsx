import React from 'react';
import { Scale, ShieldCheck, Lock, ExternalLink } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { label: 'Contract Intelligence', href: '#features' },
      { label: 'CUAD Clause Detection', href: '#features' },
      { label: 'BART Summarization', href: '#features' },
      { label: 'spaCy Entity Tagging', href: '#features' },
      { label: 'Live Clause Inspector', href: '#clause-inspector' }
    ],
    solutions: [
      { label: 'Commercial Contract Review', href: '#features' },
      { label: 'Legislative Bill Summaries', href: '#features' },
      { label: 'Procurement & Vendor MSAs', href: '#features' },
      { label: 'M&A Due Diligence Audits', href: '#features' },
      { label: 'Turnkey PDF Reports', href: '#how-it-works' }
    ],
    security: [
      { label: 'User Data Isolation Policy', href: '#security' },
      { label: 'Cascading Deletion Controls', href: '#security' },
      { label: 'Informational Legal Disclaimer', href: '#security' },
      { label: 'FastAPI & MongoDB Stack', href: '#security' }
    ],
    legal: [
      { label: 'Terms of Service', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Ethical AI Guidelines', href: '#' },
      { label: 'Informational Safe Harbor', href: '#' }
    ]
  };

  return (
    <footer className="bg-canvas border-t border-border pt-16 pb-12 text-sm text-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 pb-12 border-b border-border">
          
          {/* Brand Info (2 Columns) */}
          <div className="lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-accent-fg shadow-sm">
                  <Scale className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold font-serif tracking-tight text-heading">
                  Amicus
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed mb-6 max-w-sm">
                AI-powered legal text analysis engine engineered for legal professionals, paralegals, and businesses. Precise clause extraction, entity detection, and instant executive summaries.
              </p>
            </div>

            {/* System Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-subtle border border-border text-[11px] text-heading font-mono">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>All Systems Operational · FastAPI Engine</span>
            </div>
          </div>


          {/* Links Column 1: Platform */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-heading mb-4 font-mono">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs text-muted">
              {footerLinks.platform.map((item, idx) => (
                <li key={idx}>
                  <a href={item.href} className="hover:text-heading transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 2: Solutions */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-heading mb-4 font-mono">
              Solutions
            </h4>
            <ul className="space-y-2.5 text-xs text-muted">
              {footerLinks.solutions.map((item, idx) => (
                <li key={idx}>
                  <a href={item.href} className="hover:text-heading transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 3: Security & Trust */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-heading mb-4 font-mono">
              Security & Trust
            </h4>
            <ul className="space-y-2.5 text-xs text-muted">
              {footerLinks.security.map((item, idx) => (
                <li key={idx}>
                  <a href={item.href} className="hover:text-heading transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 4: Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-heading mb-4 font-mono">
              Compliance
            </h4>
            <ul className="space-y-2.5 text-xs text-muted">
              {footerLinks.legal.map((item, idx) => (
                <li key={idx}>
                  <a href={item.href} className="hover:text-heading transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Legal Notice */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <p>
            © {currentYear} Amicus Legal Technologies, Inc. All rights reserved.
          </p>
          <p className="text-[11px] text-muted/80 max-w-xl text-center sm:text-right">
            Amicus is an AI-assisted analysis tool and does not provide formal legal advice. Contract decisions should be reviewed by qualified legal counsel.
          </p>
        </div>

      </div>
    </footer>
  );
}
