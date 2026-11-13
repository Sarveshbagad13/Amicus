import React from 'react';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { TrustMetricsBar } from './TrustMetricsBar';
import { FeatureGrid } from './FeatureGrid';
import { HowItWorks } from './HowItWorks';
import { InteractiveClauseInspector } from './InteractiveClauseInspector';
import { TestimonialSection } from './TestimonialSection';
import { SecurityFaq } from './SecurityFaq';
import { CtaBanner } from './CtaBanner';
import { Footer } from './Footer';

export function LandingPage({ onLaunchApp }) {
  const handleScrollToSandbox = () => {
    const el = document.getElementById('clause-inspector');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-body flex flex-col font-sans selection:bg-accent-soft selection:text-accent">
      
      {/* Top Navigation */}
      <Navbar 
        onLaunchApp={onLaunchApp}
      />

      {/* Main Landing Sections */}
      <main className="flex-1">
        
        {/* 1. Hero Section */}
        <HeroSection 
          onStartTrial={onLaunchApp}
          onExploreSandbox={handleScrollToSandbox}
        />

        {/* 2. Stat & Trust Bar */}
        <TrustMetricsBar />

        {/* 3. Feature Grid (4 Deep Cards) */}
        <FeatureGrid />

        {/* 4. How It Works (3-Step Engine) */}
        <HowItWorks />

        {/* 5. Interactive Live Clause Inspector */}
        <InteractiveClauseInspector />

        {/* 6. Social Proof & Testimonials */}
        <TestimonialSection />

        {/* 7. Security & Ethical AI FAQ Accordion */}
        <SecurityFaq onLaunchApp={onLaunchApp} />

        {/* 8. Final CTA Conversion Banner */}
        <CtaBanner 
          onStartTrial={onLaunchApp}
          onExploreSandbox={handleScrollToSandbox}
        />

      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}
