import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Scale, ArrowRight, Building, Mail, User } from 'lucide-react';

export function BookDemoModal({ isOpen, onClose, initialPlan = 'Enterprise Legal' }) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    firmName: '',
    attorneyCount: '1-10 Attorneys',
    practiceArea: 'Commercial / Corporate Law',
    interest: 'General Contract Review & Redlining'
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-surface rounded-2xl border border-border shadow-elevated overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="bg-canvas px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-accent-fg">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-heading">
                {submitted ? 'Demo Request Received' : 'Schedule Legal Briefing'}
              </h3>
              <span className="text-xs text-muted">
                {submitted ? 'Confirmation #AMC-8829' : '1-on-1 walkthrough tailored to your practice'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-heading hover:bg-subtle transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-accent-soft text-accent flex items-center justify-center mx-auto border border-accent-border">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h4 className="text-xl font-bold text-heading">
                Briefing Requested Successfully
              </h4>
              <p className="text-sm text-body leading-relaxed max-w-sm mx-auto">
                A dedicated Legal Technology Specialist will reach out to <strong className="text-heading">{formData.email || 'your email'}</strong> within 4 business hours to coordinate your custom walkthrough.
              </p>
              
              <div className="p-4 rounded-lg bg-subtle border border-border text-xs text-left space-y-2 mt-4">
                <div className="flex justify-between">
                  <span className="text-muted">Organization:</span>
                  <span className="font-semibold text-heading">{formData.firmName || 'Legal Practice'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Practice Size:</span>
                  <span className="font-semibold text-heading">{formData.attorneyCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Data Isolation:</span>
                  <span className="font-semibold text-accent">Zero Data Retention Enforced</span>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-3 rounded-lg bg-accent text-accent-fg hover:bg-accent-hover font-bold text-sm transition-all"
              >
                Close & Return to Site
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-heading uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Sarah Jenkins, J.D."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-canvas border border-border focus:border-accent focus:ring-1 focus:ring-accent text-sm text-heading outline-none transition-all placeholder:text-muted"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-heading uppercase tracking-wider mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="s.jenkins@lawfirm.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-canvas border border-border focus:border-accent focus:ring-1 focus:ring-accent text-sm text-heading outline-none transition-all placeholder:text-muted"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-heading uppercase tracking-wider mb-1">
                  Firm / Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Jenkins, Cole & Vance LLP"
                  value={formData.firmName}
                  onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-canvas border border-border focus:border-accent focus:ring-1 focus:ring-accent text-sm text-heading outline-none transition-all placeholder:text-muted"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-heading uppercase tracking-wider mb-1">
                    Legal Team Size
                  </label>
                  <select
                    value={formData.attorneyCount}
                    onChange={(e) => setFormData({ ...formData, attorneyCount: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-border focus:border-accent text-sm text-heading outline-none"
                  >
                    <option>Solo Practitioner</option>
                    <option>2 - 10 Attorneys</option>
                    <option>11 - 50 Attorneys</option>
                    <option>50+ Attorneys / Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-heading uppercase tracking-wider mb-1">
                    Primary Area of Focus
                  </label>
                  <select
                    value={formData.practiceArea}
                    onChange={(e) => setFormData({ ...formData, practiceArea: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-border focus:border-accent text-sm text-heading outline-none"
                  >
                    <option>Commercial / Corporate Law</option>
                    <option>In-House Legal Operations</option>
                    <option>M&A / Due Diligence</option>
                    <option>IP / Technology Licensing</option>
                    <option>Real Estate & Leases</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-lg bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-active font-bold text-sm shadow-subtle transition-all flex items-center justify-center gap-2"
                >
                  <span>Confirm Briefing Request</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-muted pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                <span>Strict Client Confidentiality & Non-Disclosure Enforced</span>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
