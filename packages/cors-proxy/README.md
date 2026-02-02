# CORS Proxy

A simple Cloudflare Worker that proxies RSS feed requests to bypass CORS restrictions.

## Local Development

```bash
npm install
npm run dev
```

The worker will be available at `http://localhost:8787`.

## Usage

```
GET /?url=<encoded-feed-url>
```

Example:
```
http://localhost:8787/?url=https%3A%2F%2Fexample.com%2Ffeed.xml
```

## Deployment

### Manual Deployment

1. Login to Cloudflare:
   ```bash
   npx wrangler login
   ```

2. Deploy:
   ```bash
   npm run deploy
   ```

## Configuration

Edit `wrangler.toml` to configure:
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS
