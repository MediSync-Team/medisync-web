'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';

// Thin wrapper kept for backwards compatibility — delegates to the shared
// shadcn-styled toggles so every legacy header picks up the new design.
export default function ThemeLangToggle({ compact = false }: { compact?: boolean }) {
  void compact;
  return (
    <div className="flex items-center gap-1">
      <LanguageToggle />
      <ThemeToggle />
    </div>
  );
}
