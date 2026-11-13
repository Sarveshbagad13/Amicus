import React, { useState } from 'react';
import { Check, ArrowRight, Sparkles, Shield, Building2 } from 'lucide-react';

export function PricingTeaser({ onSelectPlan, onBookDemo }) {
  const [annualBilling, setAnnualBilling] = useState(true);

  const plans = [
    {
      id: 'boutique',
      name: 'Boutique Counsel',
      badge: 'Solo & Small Practice',
      description: 'Ideal for solo practitioners and boutique chambers seeking rapid contract triage and risk detection.',
      monthlyPrice: 109,
      annualPrice: 89,
      features: [
        'Up to 150 document analyses / mo',
        'Standard commercial clause taxonomy (80+ types)',
        'Plain-English executive summaries',
        'Word (.docx) & PDF export',
        'Standard email & knowledge base support',
        'Zero Data Retention guarantee'
      ],
      popular: false,
      ctaText: 'Start 14-Day Free Trial'
    },
    {
      id: 'enterprise',
      name: 'Enterprise Legal',
      badge: 'Most Popular for In-House Teams',
      description: 'Built for corporate legal departments and multi-partner firms requiring custom playbooks and deep DMS sync.',
      monthlyPrice: 299,
      annualPrice: 249,
      features: [
        'Unlimited document & multi-party analyses',
        'Custom Firm Playbook ingestion & fallback rules',
        'Full 120+ clause taxonomy & multi-jurisdiction citations',
        'Native Microsoft Word Track Changes add-in',
        'DocuSign & Google Workspace integrations',
        'Priority 24/7 dedicated legal engineer support',
        'SOC 2 Type II compliance audit reports'
      ],
      popular: true,
      ctaText: 'Start Enterprise Trial'
    },
    {
      id: 'custom',
      name: 'AmLaw & Global Firm',
      badge: 'Dedicated Air-Gapped Cloud',
      description: 'Engineered for top law firms and global enterprises requiring isolated private cloud VPC or on-prem deployments.',
      monthlyPrice: 'Custom',
      annualPrice: 'Custom',
      features: [
        'Dedicated isolated private VPC / on-premises',
        'Bespoke institutional LLM fine-tuning on firm archive',
        'Custom API access & DMS connectors (iManage, NetDocs)',
        'Enterprise SSO (Okta, Azure AD, SAML)',
        'Custom BAA & Master Services Agreement',
        'Dedicated Solutions Architect & SLA guarantee'
      ],
      popular: false,
      ctaText: 'Contact Enterprise Sales'
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-canvas relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft border border-accent-border text-accent text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transparent Investment</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-heading tracking-tight mb-4">
            Predictable pricing for{' '}
            <span className="editorial-italic font-normal">uncompromising counsel.</span>
          </h2>
          <p className="text-base sm:text-lg text-muted leading-relaxed mb-8">
            All plans include our ironclad Zero Data Retention guarantee and deterministic citation grounding.
          </p>

          {/* Billing Frequency Toggle */}
          <div className="inline-flex items-center p-1 rounded-lg bg-surface border border-border shadow-subtle">
            <button
              onClick={() => setAnnualBilling(false)}
              className={`px-4 py-2 rounded text-xs font-bold transition-all ${
                !annualBilling
                  ? 'bg-accent text-accent-fg shadow-subtle'
                  : 'text-muted hover:text-heading'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setAnnualBilling(true)}
              className={`px-4 py-2 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                annualBilling
                  ? 'bg-accent text-accent-fg shadow-subtle'
                  : 'text-muted hover:text-heading'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-accent-soft text-accent uppercase font-mono font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const price = annualBilling ? plan.annualPrice : plan.monthlyPrice;
            return (
              <div
                key={plan.id}
                className={`rounded-xl p-8 flex flex-col justify-between transition-all duration-200 ${
                  plan.popular
                    ? 'bg-surface border-2 border-accent shadow-card relative ring-1 ring-accent/20'
                    : 'bg-surface border border-border shadow-subtle hover:border-border-hover'
                }`}
              >
                {/* Popular Pill */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-accent-fg text-[11px] font-bold uppercase tracking-wider shadow-subtle">
                    Recommended for Teams
                  </div>
                )}

                <div>
                  {/* Plan Name & Tag */}
                  <div className="mb-4">
                    <span className="text-xs font-mono font-bold text-muted uppercase tracking-wider block mb-1">
                      {plan.badge}
                    </span>
                    <h3 className="text-2xl font-bold text-heading">
                      {plan.name}
                    </h3>
                  </div>

                  <p className="text-xs text-body leading-relaxed mb-6">
                    {plan.description}
                  </p>

                  {/* Price Display */}
                  <div className="mb-6 pb-6 border-b border-border">
                    <div className="flex items-baseline gap-1">
                      {typeof price === 'number' ? (
                        <>
                          <span className="text-4xl font-extrabold font-serif text-heading">
                            ${price}
                          </span>
                          <span className="text-xs text-muted font-medium">
                            / seat / month
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl font-extrabold font-serif text-heading">
                          Custom
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted block mt-1 font-mono">
                      {typeof price === 'number' && annualBilling
                        ? 'Billed annually · 14-day risk-free trial'
                        : typeof price === 'number'
                        ? 'Billed monthly · Cancel anytime'
                        : 'Dedicated account executive & SLA'}
                    </span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted block font-mono">
                      Included Capabilities:
                    </span>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-body">
                        <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <span className="leading-tight">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <div>
                  <button
                    onClick={() => {
                      if (plan.id === 'custom') {
                        if (onBookDemo) onBookDemo();
                      } else {
                        if (onSelectPlan) onSelectPlan(plan.id);
                      }
                    }}
                    className={`w-full py-3 rounded text-sm font-bold transition-all duration-150 flex items-center justify-center gap-2 shadow-subtle ${
                      plan.popular
                        ? 'bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-active'
                        : 'bg-subtle hover:bg-border text-heading border border-border'
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
