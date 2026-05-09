import type { Metadata } from 'next';

export const SITE_URL = 'https://www.nayanui.com';
export const SITE_NAME = 'Nayan UI';
export const SITE_DESCRIPTION =
  'Nayan UI is an open source component library for React and React Native. 50+ accessible, customizable, and production-ready UI components built on HeroUI and Tailwind CSS.';

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/banner.png`,
  description: SITE_DESCRIPTION,
  foundingDate: '2024',
  sameAs: ['https://github.com/ursnj/nayan-ui', 'https://www.npmjs.com/org/nayan-ui'],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'technical support',
    url: 'https://github.com/ursnj/nayan-ui/issues'
  }
};

export const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_NAME,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web, iOS, Android',
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  downloadUrl: 'https://www.npmjs.com/package/@nayan-ui/react',
  version: '2.0.0',
  datePublished: '2024-01-01',
  dateModified: new Date().toISOString().split('T')[0],
  author: { '@type': 'Organization', name: SITE_NAME },
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  programmingLanguage: ['TypeScript', 'JavaScript', 'React', 'React Native'],
  runtimePlatform: ['Web Browser', 'React Native', 'Node.js'],
  requirements: 'React 18+, TypeScript 4.5+, Tailwind CSS 4.0+',
  featureList: [
    '50+ React Components',
    'React Native Support',
    'TypeScript First',
    'Tailwind CSS Integration',
    'HeroUI Foundation',
    'Dark Mode Support',
    'Accessibility Compliant',
    'MIT Licensed'
  ]
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: `${SITE_NAME} Documentation`,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: 'en-US',
  isAccessibleForFree: true,
  publisher: { '@type': 'Organization', name: SITE_NAME }
};

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function buildTechArticleSchema(opts: { title: string; description: string; url: string; keywords?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: `${SITE_NAME} - ${opts.title}`,
    description: opts.description,
    url: opts.url,
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString().split('T')[0],
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/banner.png` }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': opts.url },
    keywords: opts.keywords,
    about: { '@type': 'Thing', name: 'React Component Library' }
  };
}

export function buildPageMetadata(opts: { title: string; description: string; path: string; keywords?: string; ogType?: string }): Metadata {
  const url = `${SITE_URL}${opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    keywords: opts.keywords || 'React Component Library, React Native, UI Library, Nayan UI, Tailwind CSS, HeroUI, TypeScript, Accessibility',
    alternates: { canonical: url },
    openGraph: {
      title: `${SITE_NAME} - ${opts.title}`,
      description: opts.description,
      url,
      type: (opts.ogType as any) || 'article',
      siteName: SITE_NAME,
      images: [{ url: `${SITE_URL}/banner.png` }]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_NAME} - ${opts.title}`,
      description: opts.description,
      images: [`${SITE_URL}/banner.png`]
    }
  };
}
