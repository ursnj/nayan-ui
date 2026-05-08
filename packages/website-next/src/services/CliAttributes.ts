export const sitemapsCreateAttributes = [
  { name: 'Website URL', attribute: '--website / -w', type: 'string', default: '', details: 'The URL of the website to crawl.' },
  {
    name: 'Replacement Website',
    attribute: '--replacer / -r',
    type: 'string',
    default: '',
    details: 'The URL of the website to be replaced. This will be mostly useful to crawl localhost and replace it with original URL.'
  },
  {
    name: 'Crawling depth',
    attribute: '--depth / -d',
    type: 'number',
    default: '10',
    details: 'Depth of the website to crawl.'
  },
  {
    name: 'Change frequency',
    attribute: '--changefreq / -f',
    type: 'string',
    default: 'daily',
    details: 'Change frequency for the sitemap. Possible options are: always, hourly, daily, weekly, monthly, yearly, never.'
  },
  {
    name: 'Output',
    attribute: '--output / -o',
    type: 'string',
    default: './sitemap.xml',
    details: 'Output path for the sitemap.xml.'
  }
];

export const sitemapsValidationAttributes = [
  {
    name: 'Input sitemap',
    attribute: '--input / -i',
    type: 'string',
    default: './sitemap.xml',
    details: 'Input path for the sitemap.xml.'
  },
  {
    name: 'Is Remote',
    attribute: '--isremote / -ir',
    type: 'boolean',
    default: 'false',
    details: 'Pass true if sitemap is hosted somewhere.'
  }
];

export const robotsCreateAttributes = [
  {
    name: 'Allowed paths',
    attribute: '--allowed / -a',
    type: 'string',
    default: '',
    details: 'Allowed paths for the robots.txt.'
  },
  {
    name: 'Disallowed paths',
    attribute: '--disallowed / -d',
    type: 'string',
    default: '',
    details: 'Disallowed paths for the robots.txt.'
  },
  { name: 'Sitemap', attribute: '--sitemap / -s', type: 'string', default: '', details: 'Sitemap url for the robots.txt.' },
  {
    name: 'Output',
    attribute: '--output / -o',
    type: 'string',
    default: './robots.txt',
    details: 'Output path for the robots.txt.'
  }
];

export const robotsValidationAttributes = [
  {
    name: 'Input Robots.txt',
    attribute: '--input / -i',
    type: 'string',
    default: './robots.txt',
    details: 'Input path for the robots.txt.'
  },
  {
    name: 'Is Remote',
    attribute: '--isremote / -ir',
    type: 'boolean',
    default: 'false',
    details: 'Pass true if robots.txt is hosted somewhere.'
  }
];
