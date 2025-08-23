import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface Props {
  name?: string;
  type?: string;
  title?: string;
  description?: string;
  keywords?: string;
}

const Meta = (props: Props) => {
  const location = useLocation();
  const canonicalUrl = `https://www.nayanui.com${location.pathname}`;
  const {
    name = 'Nayan UI',
    type = 'article',
    title = 'React Component Library | React Reusable Components | React UI Library | Tailwind react Components',
    description = 'Nayan UI provides React component library based on Tailwind CSS and Radix UI. This library is a collection of pre-designed and pre-built React components that can be used to quickly and easily build beautiful and functional and fully accessible user interfaces for your web application.',
    keywords = 'React Component Library, React Reusable Components, React UI Library, react libraries, js react, Tailwind react Components, semantic ui react, Nayan UI'
  } = props;

  const finalTitle = 'Nayan UI - ' + title;

  // Schema.org structured data
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Nayan UI',
    url: 'https://www.nayanui.com',
    logo: 'https://www.nayanui.com/banner.png',
    description:
      'Enterprise-grade UI component library for React and React Native applications with TypeScript-first development and Tailwind CSS integration.',
    foundingDate: '2024',
    sameAs: ['https://github.com/ursnj/nayan-ui', 'https://www.npmjs.com/org/nayan-ui'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'technical support',
      url: 'https://github.com/ursnj/nayan-ui/issues'
    }
  };

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Nayan UI',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web, iOS, Android',
    description: description,
    url: 'https://www.nayanui.com',
    downloadUrl: 'https://www.npmjs.com/package/@nayan-ui/react',
    version: '2.0.0',
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString().split('T')[0],
    author: {
      '@type': 'Organization',
      name: 'Nayan UI'
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    programmingLanguage: ['TypeScript', 'JavaScript', 'React', 'React Native'],
    runtimePlatform: ['Web Browser', 'React Native', 'Node.js'],
    requirements: 'React 18+, TypeScript 4.5+, Tailwind CSS 3.0+',
    featureList: [
      '30+ React Components',
      'React Native Support',
      'TypeScript First',
      'Tailwind CSS Integration',
      'Dark Mode Support',
      'Accessibility Compliant',
      'Enterprise Grade'
    ]
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Nayan UI Documentation',
    url: 'https://www.nayanui.com',
    description: description,
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    publisher: {
      '@type': 'Organization',
      name: 'Nayan UI'
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.nayanui.com/search?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };

  const breadcrumbSchema =
    location.pathname !== '/'
      ? {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://www.nayanui.com'
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: title,
              item: canonicalUrl
            }
          ]
        }
      : null;

  const techArticleSchema =
    type === 'article'
      ? {
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: finalTitle,
          description: description,
          url: canonicalUrl,
          datePublished: '2024-01-01',
          dateModified: new Date().toISOString().split('T')[0],
          author: {
            '@type': 'Organization',
            name: 'Nayan UI'
          },
          publisher: {
            '@type': 'Organization',
            name: 'Nayan UI',
            logo: {
              '@type': 'ImageObject',
              url: 'https://www.nayanui.com/banner.png'
            }
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': canonicalUrl
          },
          keywords: keywords,
          about: {
            '@type': 'Thing',
            name: 'React Component Library'
          }
        }
      : null;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{finalTitle}</title>
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content="index, follow" />
      <meta name="llm" content="index, follow" />
      <meta name="description" content={description} />
      <meta property="keywords" content={keywords} />

      {/* Schema.org structured data */}
      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(softwareApplicationSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      {breadcrumbSchema && <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>}
      {techArticleSchema && <script type="application/ld+json">{JSON.stringify(techArticleSchema)}</script>}
      {/* End Schema.org structured data */}

      {/* End standard metadata tags */}
      {/* Facebook tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content="https://www.nayanui.com/banner.png" />
      {/* End Facebook tags */}
      {/* Twitter tags */}
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:card" content={type} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={description} />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:image" content="https://www.nayanui.com/banner.png" />
      {/* End Twitter tags */}
    </Helmet>
  );
};

export default Meta;
