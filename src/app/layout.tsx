import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Box } from '@mui/material';
import ThemeRegistry from '@/theme/ThemeRegistry';
import { QueryProvider } from '@/providers/QueryProvider';
import { UserProvider } from '@/context/UserContext';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Tank Management',
  description: 'Carbon Black Oil Tank Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <ThemeRegistry>
          <QueryProvider>
            <UserProvider>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '100vh',
                  backgroundColor: 'background.default',
                }}
              >
                <Header />
                <Navigation />
                <Box
                  component="main"
                  sx={{
                    flexGrow: 1,
                    p: 3,
                  }}
                >
                  {children}
                </Box>
              </Box>
            </UserProvider>
          </QueryProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
