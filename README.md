# PlainSense

PlainSense is a Chrome extension that helps everyday investors understand financial news by providing AI-powered analysis of market impact and portfolio implications.

## Features

- AI-powered analysis of financial news articles
- Portfolio tracking and personalized impact analysis
- Simple, user-friendly interface
- Secure authentication and data management

## Project Structure

```
├── extension/           # Chrome extension files
│   ├── icons/          # Extension icons
│   ├── lib/            # Shared libraries
│   ├── popup/          # Extension popup UI
│   ├── content/        # Content scripts
│   └── manifest.json   # Extension manifest
├── verify/             # Email verification landing page
│   ├── index.html     # Verification page
│   └── logo.svg       # Logo asset
└── README.md          # This file
```

## Development

### Prerequisites

- Node.js 16+
- Chrome browser
- Supabase account

### Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/plainsense.git
cd plainsense
```

2. Install dependencies
```bash
cd extension
npm install
```

3. Load the extension in Chrome
- Open Chrome and go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked" and select the `extension` directory

### Environment Variables

Create a `.env` file in the `extension` directory:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

## Deployment

The verification page is automatically deployed to Vercel when changes are pushed to the main branch.

## License

MIT License - see LICENSE file for details 