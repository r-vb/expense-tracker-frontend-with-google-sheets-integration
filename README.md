# Pocket Ledger

A responsive personal expense tracker built with React and Vite. Add an expense from the app and save it directly to a connected Google Apps Script web app (such as one that writes to Google Sheets).

## Features

- Mobile-first app-style expense entry interface
- Categories, payment methods, and bank selection
- Live amount preview while entering an expense
- Success and error feedback for submissions
- Responsive layout and reduced-motion support

## Requirements

- Node.js 20 or later
- A deployed Google Apps Script web app endpoint

## Getting started

Install dependencies:

```bash
npm install
```

Create a local environment file by copying the example:

```bash
copy .env.example .env
```

Then set your deployed Apps Script URL in `.env`:

```env
VITE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Start the development server:

```bash
npm run dev
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Creates an optimized production build in `dist`. |
| `npm run preview` | Serves the production build locally. |

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_SCRIPT_URL` | Yes | Google Apps Script web app URL that receives submitted expenses. |

Vite only exposes variables prefixed with `VITE_` to the browser. Do not put private secrets in this file, since the value is included in the client-side app at build time.

## Submission payload

The app sends a JSON `POST` request containing:

```json
{
  "date": "2026-09-13",
  "description": "Grocery run",
  "category": "Groceries & Food",
  "paymentMethod": "UPI - Bank",
  "paymentBank": "HDFC Bank",
  "amount": 500,
  "notes": "Optional notes"
}
```
