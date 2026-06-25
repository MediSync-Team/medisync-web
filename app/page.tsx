'use client';

import { useMemo } from 'react';
import { useAuth } from './lib/auth-context';
import { useLang } from './lib/i18n/context';
import OnboardingTour from './components/OnboardingTour';
import { Navbar } from '@/components/navbar';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Footer } from '@/components/footer';

export default function HomePage() {
  const { user } = useAuth();
  const h = useLang().t('home');

  const homeTourSteps = useMemo(() => [
    { selector: '[data-onboarding="hero"]', title: h.tour.welcomeTitle, description: h.tour.welcomeDesc, position: 'bottom' as const },
    { selector: '[data-onboarding="nav-register"]', title: h.tour.registerTitle, description: h.tour.registerDesc, position: 'bottom' as const },
  ], [h]);

  return (
    <div className="flex min-h-screen flex-col">
      {!user && (
        <OnboardingTour storageKey="medisync-home-tour-v1" steps={homeTourSteps} delay={1200} />
      )}
      <Navbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}
