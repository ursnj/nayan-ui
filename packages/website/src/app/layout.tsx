import { NView } from 'nayan-ui/components';
import type { Metadata } from "next";
import Script from "next/script";
import Footer from "@/components/helpers/Footer";
import Header from "@/components/helpers/Header";
import JsonLd from "@/components/helpers/JsonLd";
import ThemeProvider from "@/components/helpers/ThemeProvider";
import { browserStylesVersion } from "./nayan-ui-styles";
import { moduleReferences } from "@/services/nayan-ui/module-reference";
import {
  BANNER_HEIGHT,
  BANNER_WIDTH,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  seoBannerUrl,
  organizationSchema,
  softwareApplicationSchema,
  websiteSchema,
} from "@/services/seo";

const moduleSlugs = moduleReferences.map(({ slug }) => slug);

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} - Open Source Engine for React & React Native`,
    template: `${SITE_NAME} - %s`,
  },
  description: SITE_DESCRIPTION,
  keywords:
    "React Component Library, React Native Components, React Reusable Components, React UI Library, Tailwind CSS Components, TypeScript UI Library, Accessibility, Dark Mode, Open Source, Nayan UI",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    images: [
      {
        url: seoBannerUrl("/"),
        width: BANNER_WIDTH,
        height: BANNER_HEIGHT,
        alt: `${SITE_NAME} - Apps and games for React & React Native`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@nayanui",
    images: [seoBannerUrl("/")],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  icons: { icon: "/logo.webp" },
  other: { llm: "index, follow" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href={`/nayan-ui/styles?v=${browserStylesVersion}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('THEME');if(t){t=JSON.parse(t)}if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';document.documentElement.setAttribute('data-theme','dark')}else{document.documentElement.classList.add('light');document.documentElement.style.colorScheme='light';document.documentElement.setAttribute('data-theme','light')}}catch(e){}})()`,
          }}
        />
        <JsonLd data={[organizationSchema, softwareApplicationSchema, websiteSchema]} />
      </head>
      <body>
        <ThemeProvider>
          <NView tag="a" href="#main-content" className="site-skip-link">Skip to content</NView>
          <Header moduleSlugs={moduleSlugs} />
          <NView tag="main" id="main-content" className="site-main min-h-[70vh] pt-[var(--site-header-height)] focus:outline-none" tabIndex={-1}>
            {children}
          </NView>
          <Footer />
        </ThemeProvider>
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","sz9iu23mcr");`}
        </Script>
      </body>
    </html>
  );
}
