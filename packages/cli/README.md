# Nayan UI CLI

Command Line Interface for Nayan UI - Create projects, generate sitemaps, and manage robots.txt files.

## Features

- 🚀 **Project Creation** - Create new projects from nayan-ui templates (Expo, Vite, Games)
- 🗺️ **Sitemap Generation** - Automatically crawl and generate XML sitemaps
- 🤖 **Robots.txt Management** - Generate and validate robots.txt files
- ✅ **Validation Tools** - Validate sitemaps and robots.txt files

## Installation

### Global Installation

```bash
npm install -g @nayan-ui/cli
```

### Using npx (No Installation Required)

```bash
npx @nayan-ui/cli [command]
# or
npx @nayan-ui/cli@latest [command]
```

### Available Commands

```bash
nayan --help              # Show all commands
nayan new                 # Create a new project (interactive)
nayan create              # Generate sitemaps or robots.txt
nayan validate            # Validate sitemaps or robots.txt
```

## Usage

### Create New Project

#### Interactive Mode (Recommended)

```bash
npx @nayan-ui/cli new
# or
nayan new
```

This will prompt you to:

1. Enter your project name
2. Select a template (expo, games, vite)

#### Non-Interactive Mode

```bash
npx @nayan-ui/cli new my-app -t expo
# or
nayan new my-app -t vite
```

#### Available Templates

| Template | Description                                   |
| -------- | --------------------------------------------- |
| expo     | React Native Application with Expo & Nayan UI |
| games    | React Native Games example project            |
| vite     | React Application with Vite and Nayan UI      |

### Generate Sitemap

```bash
# Basic usage
npx @nayan-ui/cli create sitemap -w https://example.com

# With options
npx @nayan-ui/cli create sitemap -w https://example.com -d 10 -f daily -o ./sitemap.xml

# If installed globally
nayan create sitemap -w https://example.com
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
npx @nayan-ui/cli validate sitemap -i ./sitemap.xml

# Remote URL
npx @nayan-ui/cli validate sitemap -i https://example.com/sitemap.xml --isremote

# If installed globally
nayan validate sitemap -i ./sitemap.xml
```

#### Parameters

| Name          | Parameter        | Default       | Description                          |
| ------------- | ---------------- | ------------- | ------------------------------------ |
| Input sitemap | --input / -i     | ./sitemap.xml | Path to sitemap file or URL          |
| Is Remote     | --isremote / -ir | false         | Set to true if input is a remote URL |

### Generate Robots.txt

```bash
# Basic usage
npx @nayan-ui/cli create robots -d /admin -s https://example.com/sitemap.xml

# With allowed and disallowed paths
npx @nayan-ui/cli create robots -a /home,/about -d /admin -s https://example.com/sitemap.xml -o ./robots.txt

# If installed globally
nayan create robots -d /admin -s https://example.com/sitemap.xml
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
# Local file
npx @nayan-ui/cli validate robots -i ./robots.txt

# Remote URL
npx @nayan-ui/cli validate robots -i https://example.com/robots.txt --isremote

# If installed globally
nayan validate robots -i ./robots.txt
```

#### Parameters

| Name             | Parameter        | Default      | Description                          |
| ---------------- | ---------------- | ------------ | ------------------------------------ |
| Input Robots.txt | --input / -i     | ./robots.txt | Path to robots.txt file or URL       |
| Is Remote        | --isremote / -ir | false        | Set to true if input is a remote URL |

## Requirements

- Node.js >= 18

## License

MIT

## Contributing

Submit issues and pull requests on [GitHub](https://github.com/ursnj/nayan-ui).

## Support

- 📖 [Documentation](https://www.nayanui.com/cli)
- 🐛 [Report Issues](https://github.com/ursnj/nayan-ui/issues)
- 💬 [Discussions](https://github.com/ursnj/nayan-ui/discussions)
