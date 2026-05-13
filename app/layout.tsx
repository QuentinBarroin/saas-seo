import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import './nv.css';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'saas-audit-seo',
  description: "Cockpit interne d'audit SEO/GEO",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={manrope.variable}>
      <body data-theme="nv" className="min-h-screen bg-[var(--nv-bg)] text-[var(--nv-text)] antialiased">
        {children}
      </body>
    </html>
  );
}
