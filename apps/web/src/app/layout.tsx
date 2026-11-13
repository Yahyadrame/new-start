import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';
import { ServerGate } from '../features/server-status';
import { themeInitScript } from '../features/theme';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: '700',
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'new start',
  description: 'Apprends à parler anglais en discutant avec des contacts IA.',
};

export const viewport: Viewport = { colorScheme: 'light dark' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ServerGate apiUrl={process.env['NEXT_PUBLIC_API_URL']}>{children}</ServerGate>
      </body>
    </html>
  );
}
