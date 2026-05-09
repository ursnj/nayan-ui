import type { Metadata } from 'next';
import Footer from '@/helpers/Footer';
import Header from '@/helpers/Header';
import JsonLd from '@/helpers/JsonLd';
import ThemeProvider from '@/helpers/ThemeProvider';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, organizationSchema, softwareApplicationSchema, websiteSchema } from '@/services/seo';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} - Open Source React & React Native Component Library`,
    template: `${SITE_NAME} - %s`
  },
  description: SITE_DESCRIPTION,
  keywords:
    'React Component Library, React Native Components, React Reusable Components, React UI Library, Tailwind CSS Components, HeroUI Components, TypeScript UI Library, Accessibility, Dark Mode, Open Source, Nayan UI',
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
    images: [{ url: '/banner.png', width: 1200, height: 630, alt: `${SITE_NAME} - React & React Native Component Library` }]
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@nayanui',
    images: ['/banner.png']
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  icons: { icon: '/logo.webp' },
  other: { llm: 'index, follow' }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd data={[organizationSchema, softwareApplicationSchema, websiteSchema]} />
      </head>
      <body>
        <ThemeProvider>
          <Header />
          <main className="mt-[60px]">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
