import { Geist } from 'next/font/google';
import '../styles/globals.css';
import { ThemeProvider } from '@/components/ui/theme-provider';

const geist = Geist({ subsets: ['latin'] });

export const metadata = {
  title: {
    template: '%s | Argus',
    default: 'Argus - MongoDB Slow Query Analyzer',
  },
  description: 'AI-powered MongoDB slow query analyzer for performance optimization',
  icons: {
    icon: '/logo.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
} 