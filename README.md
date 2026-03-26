# CTA Manager — Blockchain-Ads

Centralized CTA management system for the Blockchain-Ads Webflow website. Built with Next.js and deployed via Webflow Cloud.

## Quick Start

```bash
# Install dependencies
npm install

# Set your admin password
cp .env.example .env.local
# Edit .env.local and set CTA_ADMIN_PASSWORD

# Run locally
npm run dev
```

Visit `http://localhost:3000/admin` and enter your password.

## How It Works

1. **Admin Dashboard** → Create CTAs with content per locale, pick a template or paste custom HTML
2. **Embed Code** → Copy `<div data-cta="your-slug"></div>` into any Webflow rich text embed
3. **Client Script** → Add to Webflow Project Settings → Custom Code:
```html
<script src="https://your-domain.com/cta-loader.js"></script>
```
4. **Update Anywhere** → Edit CTA content in the admin, all articles update instantly

## Adding to Webflow

1. Go to **Webflow Designer** → **Project Settings** → **Custom Code**
2. In the **Before `</body>` tag** field, add:
```html
<script>
  window.__CTA_API_BASE = 'https://your-webflow-cloud-domain.com';
</script>
<script src="https://your-webflow-cloud-domain.com/cta-loader.js"></script>
```
3. Publish your Webflow site

## Inserting a CTA in an Article

1. In Webflow Editor, open any blog post
2. Click **+** in the rich text editor → choose **Embed** (`</>`)
3. Paste: `<div data-cta="your-slug"></div>`
4. Done — the CTA renders on the live page

## Deploy to Webflow Cloud

1. Push this repo to GitHub
2. In Webflow Dashboard → **Cloud** → Connect your GitHub repo
3. Map branches: `main` → production, `staging` → staging
4. Auto-deploys on every push

## Project Structure

```
app/
├── api/              # REST API routes
│   ├── cta/          # CRUD operations
│   ├── cta-batch/    # Batch fetch for client script
│   ├── track/        # Analytics events
│   ├── analytics/    # Analytics queries
│   └── auth/         # Login
├── admin/            # Dashboard UI
│   ├── ctas/         # CTA management
│   ├── posts/        # Posts library
│   ├── templates/    # Template gallery
│   └── analytics/    # Performance dashboard
lib/
├── db.ts             # SQLite connection
├── auth.ts           # Password gate
└── templates.ts      # Standard CTA templates
public/
└── cta-loader.js     # Client script for Webflow
```
