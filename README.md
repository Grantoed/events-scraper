# 🗓️ DOU Events to Google Sheets

Scrapes DOU management events and syncs them to Google Sheets. Each month gets its own sheet, new events are highlighted in green, and existing data is preserved.

## ⚙️ Quick Start

```bash
# Clone and install
git clone https://github.com/Grantoed/events-scraper.git
cd events-scraper
npm install

# Create .env file
CLIENT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...rest...\n-----END PRIVATE KEY-----\n"
SHEET_ID=your_google_sheet_id

# Run
npm run dev          # Development
npm run build        # Build for production
npm start            # Run production build
```

## 🔑 Google Setup

1. **Enable Google Sheets API** in [Google Cloud Console](https://console.cloud.google.com)
2. **Create Service Account** → Download JSON key
3. **Copy credentials** to `.env`:
   - `client_email` → `CLIENT_EMAIL`
   - `private_key` → `PRIVATE_KEY` (replace newlines with `\n`)
4. **Share your Google Sheet** with the service account email (Editor access)
5. **Get Sheet ID** from URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`

## 🧠 How It Works

- Scrapes events from `https://dou.ua/calendar/tags/менеджмент/`
- Groups events by month into separate sheets
- Highlights new events in green
- Skips existing events (based on URL)
- Preserves all existing data and comments
