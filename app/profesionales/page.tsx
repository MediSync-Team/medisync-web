'use client';

import { Navbar } from '@/components/navbar';
import { SearchSection } from '@/components/landing/search-section';
import { Footer } from '@/components/footer';

export default function ProfesionalesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <SearchSection />
      </main>
      <Footer />
    </div>
  );
}
