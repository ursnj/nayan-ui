import type { Metadata } from 'next';
import ThemeWrapper from './ThemeWrapper';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nayan UI - Next.js Example',
  description: 'Next.js app using @nayan-ui/react with Tailwind CSS v4 and HeroUI'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeWrapper>{children}</ThemeWrapper>
      </body>
    </html>
  );
}
