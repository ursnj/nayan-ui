import { NView } from 'nayan-ui/components';
import type { Metadata } from 'next';
import Script from 'next/script';
import Footer from '@/components/helpers/Footer';
import Header from '@/components/helpers/Header';
import JsonLd from '@/components/helpers/JsonLd';
import ThemeProvider from '@/components/helpers/ThemeProvider';
import './globals.css';
import { moduleReferences } from '@/services/nayan-ui/module-reference';
import {
  BANNER_HEIGHT,
  BANNER_WIDTH,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  seoBannerUrl,
  organizationSchema,
  softwareApplicationSchema,
  websiteSchema
} from '@/services/seo';

const moduleSlugs = moduleReferences.map(({ slug }) => slug);

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} - Open Source Engine for React & React Native`,
    template: `${SITE_NAME} - %s`
  },
  description: SITE_DESCRIPTION,
  keywords:
    'React Component Library, React Native Components, React Reusable Components, React UI Library, Tailwind CSS Components, TypeScript UI Library, Accessibility, Dark Mode, Open Source, Nayan UI',
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
    images: [
      {
        url: seoBannerUrl('/'),
        width: BANNER_WIDTH,
        height: BANNER_HEIGHT,
        alt: `${SITE_NAME} - Apps and games for React & React Native`
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@nayanui',
    images: [seoBannerUrl('/')]
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  icons: { icon: '/logo.webp' },
  other: { llm: 'index, follow' }
};

const documentUtilities = [
  'site-light dark:site-dark',
  '[--site-header-height:4.25rem]',
  '[--site-grid-line:color-mix(in_srgb,_var(--accent)_8%,_transparent)]',
  '[&:has(.fullscreen-workspace)_:is(.site-header,.site-footer,.site-skip-link)]:hidden',
  '[&:has(.fullscreen-workspace)_.site-main]:min-h-0',
  '[&:has(.fullscreen-workspace)_.site-main]:pt-0',
  '[&:has(.video-editor-workspace)]:[--field-border:var(--separator)]',
  '[&:has(.video-editor-workspace)]:[--field-border-width:1px]',
  '[&:has(.video-editor-workspace)]:[--field-height:1.875rem]',
  '[&:has(.video-editor-workspace)]:[--ring-offset-width:0px]',
  '[&:has(.video-editor-workspace)]:[--editor-chrome:var(--surface-secondary)]',
  '[&:has(.video-editor-workspace)]:[--editor-canvas:var(--editor-chrome)]',
  '[&:has(.video-editor-workspace)]:[--editor-panel:var(--surface)]',
  '[&:has(.video-editor-workspace)]:[--editor-track:var(--surface-secondary)]',
  '[&:has(.video-editor-workspace)]:[--editor-track-alt:var(--surface-tertiary)]',
  '[&:has(.video-editor-workspace)]:[--editor-ruler:var(--surface-secondary)]',
  '[&:has(.video-editor-workspace)]:[--playhead:hsl(352_84%_54%)]',
  '[&:has(.video-editor-workspace)]:[--elevation:0_1px_2px_hsl(231_32%_14%_/_0.07)]',
  '[&:has(.video-editor-workspace)]:[--elevation-lg:0_12px_36px_hsl(231_32%_14%_/_0.16)]',
  '[&.dark:has(.video-editor-workspace)]:[--editor-chrome:hsl(230_16%_18%)]',
  '[&.dark:has(.video-editor-workspace)]:[--editor-panel:hsl(230_17%_14%)]',
  '[&.dark:has(.video-editor-workspace)]:[--editor-track:hsl(230_14%_15%)]',
  '[&.dark:has(.video-editor-workspace)]:[--editor-track-alt:hsl(230_15%_17%)]',
  '[&.dark:has(.video-editor-workspace)]:[--editor-ruler:hsl(230_16%_20%)]',
  '[&.dark:has(.video-editor-workspace)]:[--playhead:hsl(352_95%_68%)]',
  '[&.dark:has(.video-editor-workspace)]:[--elevation:0_1px_2px_hsl(0_0%_0%_/_0.36)]',
  '[&.dark:has(.video-editor-workspace)]:[--elevation-lg:0_12px_36px_hsl(0_0%_0%_/_0.45)]',
  '[&:has(.video-editor-workspace)_body]:[user-select:none]',
  '[&:has(.video-editor-workspace)_body]:[overscroll-behavior:none]',
  '[&:has(.video-editor-workspace)_:is(input,textarea,[contenteditable])]:[user-select:text]',
  '[&:has(.video-editor-workspace)_[tabindex]:not(a,button,input,select,textarea,[role]):focus-visible]:[outline:none]',
  '[&:has(.video-editor-workspace)_*]:[scrollbar-width:thin]',
  '[&:has(.video-editor-workspace)_*]:[scrollbar-color:var(--separator)_transparent]',
  '[&:has(.video-editor-workspace)_*::-webkit-scrollbar]:w-2.5',
  '[&:has(.video-editor-workspace)_*::-webkit-scrollbar]:h-2.5',
  '[&:has(.video-editor-workspace)_*::-webkit-scrollbar-track]:[background:transparent]',
  '[&:has(.video-editor-workspace)_*::-webkit-scrollbar-thumb]:[background:var(--separator)]',
  '[&:has(.video-editor-workspace)_*::-webkit-scrollbar-thumb]:[border:3px_solid_transparent]',
  '[&:has(.video-editor-workspace)_*::-webkit-scrollbar-thumb]:[border-radius:999px]',
  '[&:has(.video-editor-workspace)_*::-webkit-scrollbar-thumb]:[background-clip:content-box]',
  '[&:has(.video-editor-workspace)_*::-webkit-scrollbar-thumb:hover]:[background:var(--muted)]',
  '[&:has(.video-editor-workspace)_*::-webkit-scrollbar-thumb:hover]:[background-clip:content-box]',
  '[&:has(.video-editor-workspace)_*::-webkit-scrollbar-corner]:[background:transparent]',
  '[scroll-padding-top:var(--site-header-height)]',
  '[&:has(.nyn-game-page)]:overflow-hidden',
  '[&:has(.nyn-game-page)]:[overscroll-behavior:none]',
  '[&:has(.nyn-game-page)_body]:overflow-hidden',
  '[&:has(.nyn-game-page)_body]:[overscroll-behavior:none]'
].join(' ');

const bodyUtilities = [
  '[&_[role=button]]:cursor-pointer',
  '[&_:where(a,button,input,select,textarea,summary,[tabindex]):focus-visible]:[outline:2px_solid_var(--focus)]',
  '[&_:where(a,button,input,select,textarea,summary,[tabindex]):focus-visible]:[outline-offset:3px]',
  '[&_[data-tone=violet]]:[--tone:#9d70f5]',
  '[&_[data-tone=violet]]:[--tone-paper:#e9deff]',
  '[&_[data-tone=violet]]:[--tone-ink:#5523a4]',
  '[&_[data-tone=lime]]:[--tone:#b3d739]',
  '[&_[data-tone=lime]]:[--tone-paper:#edf7bd]',
  '[&_[data-tone=lime]]:[--tone-ink:#425704]',
  '[&_[data-tone=peach]]:[--tone:#ef9a5e]',
  '[&_[data-tone=peach]]:[--tone-paper:#ffdfc8]',
  '[&_[data-tone=peach]]:[--tone-ink:#843a10]',
  '[&_[data-genre=Action]]:[--tone:#ef9a5e]',
  '[&_[data-genre=Action]]:[--tone-paper:#ffdfc8]',
  '[&_[data-genre=Action]]:[--tone-ink:#843a10]',
  '[&_[data-tone=pink]]:[--tone:#e783b5]',
  '[&_[data-tone=pink]]:[--tone-paper:#fbe0ef]',
  '[&_[data-tone=pink]]:[--tone-ink:#8b265b]',
  '[&_[data-genre=Arcade]]:[--tone:#e783b5]',
  '[&_[data-genre=Arcade]]:[--tone-paper:#fbe0ef]',
  '[&_[data-genre=Arcade]]:[--tone-ink:#8b265b]',
  '[&_[data-tone=blue]]:[--tone:#8d9af8]',
  '[&_[data-tone=blue]]:[--tone-paper:#e0e5ff]',
  '[&_[data-tone=blue]]:[--tone-ink:#383e9c]',
  '[&_[data-genre=Puzzle]]:[--tone:#8d9af8]',
  '[&_[data-genre=Puzzle]]:[--tone-paper:#e0e5ff]',
  '[&_[data-genre=Puzzle]]:[--tone-ink:#383e9c]',
  '[&_[data-tone=mint]]:[--tone:#6dceb1]',
  '[&_[data-tone=mint]]:[--tone-paper:#d7f4e9]',
  '[&_[data-tone=mint]]:[--tone-ink:#18644f]',
  '[&_[data-genre=Strategy]]:[--tone:#6dceb1]',
  '[&_[data-genre=Strategy]]:[--tone-paper:#d7f4e9]',
  '[&_[data-genre=Strategy]]:[--tone-ink:#18644f]',
  'dark:[&_:is([data-tone],[data-genre])]:[--tone-paper:color-mix(in_srgb,_var(--tone,_#ab82f0)_20%,_var(--surface))]',
  'dark:[&_:is([data-tone],[data-genre])]:[--tone-ink:color-mix(in_srgb,_var(--tone,_#ab82f0)_66%,_#fff)]',
  'motion-reduce:[&_*]:[animation-duration:0.01ms]!',
  'motion-reduce:[&_*]:[transition-duration:0.01ms]!',
  'motion-reduce:[&_*::before]:[animation-duration:0.01ms]!',
  'motion-reduce:[&_*::before]:[transition-duration:0.01ms]!',
  'motion-reduce:[&_*::after]:[animation-duration:0.01ms]!',
  'motion-reduce:[&_*::after]:[transition-duration:0.01ms]!',
  'text-foreground',
  '[background:var(--background)]',
  'text-base',
  'font-sans',
  'overflow-x-hidden',
  'antialiased',
  '[&_a.active]:text-accent!',
  '[&_[data-testid=game-settings-popover]]:[-webkit-backdrop-filter:blur(20px)]',
  '[&_[data-testid=game-settings-popover]]:[backdrop-filter:blur(20px)]'
].join(' ');

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={documentUtilities} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('THEME');if(t){t=JSON.parse(t)}if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark')}else{document.documentElement.classList.add('light');document.documentElement.setAttribute('data-theme','light')}}catch(e){}})()`
          }}
        />
        <JsonLd data={[organizationSchema, softwareApplicationSchema, websiteSchema]} />
      </head>
      <body className={bodyUtilities}>
        <ThemeProvider>
          <NView
            tag="a"
            href="#main-content"
            className="site-skip-link fixed [z-index:60] [top:0.75rem] [left:0.75rem] [padding:0.625rem_1rem] [transform:translateY(calc(-100%_-_1rem))] [border-radius:0.5rem] [background:var(--accent)] text-accent-foreground font-semibold focus:[transform:none]"
          >
            Skip to content
          </NView>
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
