import { Newsreader } from 'next/font/google';

/**
 * Display accent for the patient dashboard preview — optical serif used ONLY
 * for the greeting and large numbers. Exposed as --font-display.
 */
const display = Newsreader({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export default function PacientePreviewLayout({ children }: { children: React.ReactNode }) {
  return <div className={display.variable}>{children}</div>;
}
