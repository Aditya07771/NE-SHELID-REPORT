import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';

export const metadata: Metadata = {
  title: 'NE-SHIELD Crowd Reporter PWA',
  description: 'Mobile-first PWA for crowd-sourced disaster & hazard reporting in Northeast India',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NE-SHIELD Crowd',
  },
};

export const viewport: Viewport = {
  themeColor: '#166534',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F7FAF8] text-gray-900 min-h-screen antialiased">
        <div className="max-w-md mx-auto min-h-screen bg-[#F7FAF8] border-x border-[#E5EDE8] flex flex-col relative pb-20 shadow-xl">
          <Header />
          <main className="flex-1 px-4 py-4 overflow-y-auto">{children}</main>
          <BottomNav />
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('[PWA SW] Registered:', registration.scope);
                    },
                    function(err) {
                      console.log('[PWA SW] Registration failed:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
