# Nayan UI CLI

Generate and validate sitemaps and robots.txt files for better SEO optimization.

## Installation

```bash
npm install -g @nayan-ui/cli
```

## Usage

### Generate Sitemap

```bash
# Basic usage
npx nayan create sitemap -w https://example.com

# With options
npx nayan create sitemap -w https://example.com -d 10 -f daily -o ./sitemap.xml
```

#### Parameters

| Name                | Parameter         | Default       | Description                                                             |
| ------------------- | ----------------- | ------------- | ----------------------------------------------------------------------- |
| Website URL         | --website / -w    | ''            | Website base URL to start crawling                                      |
| Replacement Website | --replacer / -r   | ''            | Replacement URL (useful for localhost to production URL replacement)    |
| Crawling depth      | --depth / -d      | 10            | How deep to crawl the website                                           |
| Change frequency    | --changefreq / -f | daily         | Change frequency: always, hourly, daily, weekly, monthly, yearly, never |
| Output              | --output / -o     | ./sitemap.xml | Output path for generated sitemap                                       |

### Validate Sitemap

```bash
# Local file
npx nayan validate sitemap -i ./sitemap.xml

# Remote URL
npx nayan validate sitemap -i https://example.com/sitemap.xml --isremote true
```

#### Parameters

| Name          | Parameter        | Default       | Description                          |
| ------------- | ---------------- | ------------- | ------------------------------------ |
| Input sitemap | --input / -i     | ./sitemap.xml | Path to sitemap file or URL          |
| Is Remote     | --isremote / -ir | false         | Set to true if input is a remote URL |

### Generate Robots.txt

```bash
npx nayan create robots -a /home,/about -d /admin -s https://example.com/sitemap.xml -o ./robots.txt
```

#### Parameters

| Name             | Parameter         | Default      | Description                                |
| ---------------- | ----------------- | ------------ | ------------------------------------------ |
| Allowed paths    | --allowed / -a    | ''           | Comma-separated paths to allow crawling    |
| Disallowed paths | --disallowed / -d | ''           | Comma-separated paths to disallow crawling |
| Sitemap          | --sitemap / -s    | ''           | Sitemap URL for your website               |
| Output           | --output / -o     | ./robots.txt | Output path for generated robots.txt       |

### Validate Robots.txt

```bash
npx nayan validate robots -i ./robots.txt
```

#### Parameters

| Name             | Parameter        | Default      | Description                          |
| ---------------- | ---------------- | ------------ | ------------------------------------ |
| Input Robots.txt | --input / -i     | ./robots.txt | Path to robots.txt file or URL       |
| Is Remote        | --isremote / -ir | false        | Set to true if input is a remote URL |

## Contributing

Submit issues and pull requests on [GitHub](https://github.com/ursnj/nayan).
