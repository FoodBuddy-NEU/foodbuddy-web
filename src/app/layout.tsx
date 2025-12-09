import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/AuthProvider';
import { ThemeProvider } from '@/lib/ThemeProvider';
import Header from '@/components/Header';
import UsernameChecker from '@/components/UsernameChecker';

// Skip prerendering for all pages since the app requires Firebase initialization
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'FoodBuddy',
  description: 'Find restaurants, deals, and more',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Disable browser color scheme media query and force light mode */}
        <meta name="color-scheme" content="light only" />
        <style>{`
          /* Force light color scheme - prevent browser dark mode */
          html { color-scheme: light !important; }
          html * { -webkit-color-scheme: light !important; }
          @media (prefers-color-scheme: dark) {
            html { color-scheme: light !important; }
            html * { -webkit-color-scheme: light !important; }
          }
        `}</style>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof document === 'undefined') return;
                try {
                  var html = document.documentElement;
                  html.classList.remove('dark');
                  html.style.colorScheme = 'light';
                } catch (error) {
                  // No-op: best effort to enforce light before hydration
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <UsernameChecker>
              <Header />
              {/* Page content */}
              {children}
            </UsernameChecker>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
