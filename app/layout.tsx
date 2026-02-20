
import type { Metadata, Viewport } from 'next';
import './globals.css';
import TabBar from './components/TabBar';
import SupportChat from './components/SupportChat';
import { AuthProvider } from './components/AuthProvider';
import InstallPWA from './components/InstallPWA';

export const metadata: Metadata = {
  title: 'Hopla - Vos courses à Strasbourg',
  description: 'Faites-vous livrer par vos voisins en un clin d\'œil.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hopla',
  },
  formatDetection: {
    telephone: false,
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#007AFF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body>
        <AuthProvider>
          <main>{children}</main>
          <TabBar />
          <SupportChat />
          <InstallPWA />
        </AuthProvider>
      </body>
    </html>
  );
}
