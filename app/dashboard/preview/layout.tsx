import { Newsreader } from 'next/font/google';

/**
 * Display accent for the dashboard previews — an optical serif used ONLY for
 * the greeting headline and large metric numbers. Body/headings stay on Geist
 * (the landing's font-heading). Exposed as the --font-display CSS variable.
 */
const display = Newsreader({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <div className={display.variable}>{children}</div>;
}
