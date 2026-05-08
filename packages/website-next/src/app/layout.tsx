import type { Metadata } from 'next';
import Footer from '@/helpers/Footer';
import Header from '@/helpers/Header';
import ThemeProvider from '@/helpers/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Nayan UI - Modern React & React Native Component Library',
    template: 'Nayan UI - %s'
  },
  description:
    'Nayan UI provides React component library based on Tailwind CSS and HeroUI. A collection of pre-designed and pre-built React components for building beautiful and functional user interfaces.',
  keywords: 'React Component Library, React Reusable Components, React UI Library, Tailwind react Components, Nayan UI',
  metadataBase: new URL('https://www.nayanui.com'),
  openGraph: {
    type: 'website',
    siteName: 'Nayan UI',
    images: [{ url: '/banner.png' }]
  },
  twitter: {
    card: 'summary_large_image',
    creator: 'Nayan UI',
    images: ['/banner.png']
  },
  robots: { index: true, follow: true },
  icons: { icon: '/logo.webp' }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Header />
          <main className="mt-[58px]">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
