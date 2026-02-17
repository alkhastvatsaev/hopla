
import type { Metadata, Viewport } from 'next';
import './globals.css';
import TabBar from './components/TabBar';
import SupportChat from './components/SupportChat';

export const metadata: Metadata = {
  title: 'Hopla - Vos courses à Strasbourg',
  description: 'Faites-vous livrer par vos voisins en un clin d\'œil.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body>
        <main>{children}</main>
        <SupportChat />
      </body>
    </html>
  );
}
