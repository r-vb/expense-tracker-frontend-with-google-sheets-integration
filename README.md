# Pocket Ledger

Pocket Ledger is a React + Vite expense-entry app with two separate ledgers:

- **Monthly expense** at `/monthly`, connected to the monthly Google Sheet.
- **Yearly expense** at `/yearly`, connected to a different yearly Google Sheet.

Users must sign in with the allowed Google account before choosing a ledger and entering an expense.

## Features

- Google sign-in restricted in the UI to `rahulvb27@gmail.com`
- Monthly and yearly ledger chooser
- Separate Google Apps Script endpoints for each ledger
- Expense category, payment method, bank, date, amount, and notes fields
- Live INR amount preview and submission feedback
- Responsive, mobile-friendly interface

## Requirements

- Node.js 20 or newer
- A Google OAuth **Web application** client
- Two deployed Google Apps Script web apps: one for the monthly sheet and one for the yearly sheet

## Setup

Install dependencies:

```bash
npm install
```

Copy the environment template:

```powershell
Copy-Item .env.example .env
```

Set the values in `.env`:

```env
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com
VITE_MONTHLY_SCRIPT_URL=https://script.google.com/macros/s/YOUR_MONTHLY_DEPLOYMENT_ID/exec
VITE_YEARLY_SCRIPT_URL=https://script.google.com/macros/s/YOUR_YEARLY_DEPLOYMENT_ID/exec
```

Run locally:

```bash
npm run dev
```

## Google OAuth configuration

In Google Cloud Console, create an OAuth 2.0 Client ID of type **Web application**.

Under **Authorized JavaScript origins**, add:

```text
https://expense.rahul.asia
http://localhost:5173
```

The local origin is only needed during local development. Do not add `/monthly` or `/yearly`; origins must not contain paths.

This app uses Google Identity Services' browser popup, so it does not require an **Authorized redirect URI**. Leave redirect URIs blank unless you later implement a server-side OAuth redirect flow.

Copy the client ID—not the client secret—into `VITE_GOOGLE_CLIENT_ID`. Never commit or deploy a downloaded `client_secret_*.json` file.

## Google Sheets / Apps Script setup

Deploy a separate Apps Script Web App for each Google Sheet and place their `/exec` URLs in the corresponding environment variables.

| Ledger | Route | Environment variable | Destination |
| --- | --- | --- | --- |
| Monthly | `/monthly` | `VITE_MONTHLY_SCRIPT_URL` | Monthly Google Sheet |
| Yearly | `/yearly` | `VITE_YEARLY_SCRIPT_URL` | Yearly Google Sheet |

For compatibility with the prior single-ledger setup, `VITE_SCRIPT_URL` is also accepted as a fallback for the monthly endpoint.

Each request has this payload shape:

```json
{
  "date": "2026-09-13",
  "description": "Grocery run",
  "category": "Groceries & Food",
  "paymentMethod": "UPI - Bank",
  "paymentBank": "HDFC Bank",
  "amount": 500,
  "notes": "Optional notes",
  "ledger": "monthly",
  "userEmail": "rahulvb27@gmail.com"
}
```

## Routes and access

| Route | Purpose |
| --- | --- |
| `/` | Login and ledger selection |
| `/monthly` | Monthly expense entry |
| `/yearly` | Yearly expense entry |

The browser UI only permits `rahulvb27@gmail.com`; its sign-in session lasts until the user signs out or closes the browser session. This is a user-interface restriction, not server-side protection. Because Apps Script URLs are public endpoints, enforce authorization in Apps Script as well before accepting or writing a request to a sheet.

## Deploying

Build the app:

```bash
npm run build
```

Deploy the contents of `dist/` to the host for `expense.rahul.asia`. Configure the host to serve `index.html` as the fallback for `/monthly` and `/yearly`; otherwise refreshing either route can return a 404.

Set the three `VITE_` variables in your deployment environment before building. Vite includes `VITE_` values in the client bundle, so never put secrets in them.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run build` | Create the production bundle in `dist/`. |
| `npm run preview` | Preview the production bundle locally. |
