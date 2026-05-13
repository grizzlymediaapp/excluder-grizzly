# Excluder — by Grizzly Media

TikTok AI content detection tool. Checks video URLs for the AI-generated content label and exports flagged video IDs for GMV Max exclusion.

## Deploy to Vercel

1. Push this repo to GitHub
2. Connect to Vercel → New Project → import repo
3. No environment variables needed
4. Deploy

## Usage

- Login: username `admin` / password `Astaextr43!`
- Paste TikTok URLs (one per line) or upload a CSV
- Click Run Check
- Export CSV when done — use the flagged Video IDs to build your GMV Max exclude list

## How it works

Fetches each TikTok video page server-side, parses the embedded JSON data block, and reads the `IsAigc` field TikTok includes in every video's page data. No browser, no scraping — direct JSON read.

## File structure

```
/api/check.js       — Vercel serverless function (the checker)
/public/index.html  — Frontend (login + UI)
/vercel.json        — Routing config
```
