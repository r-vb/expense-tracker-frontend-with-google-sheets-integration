# Pocket Ledger

Pocket Ledger is a retro-styled expense tracker built with React and Vite. It lets the user log spending into either a monthly or yearly ledger, then send each entry to a Google Apps Script-backed Google Sheet.

The app is designed around a dark arcade / CRT aesthetic, while keeping the interface readable and responsive on desktop, tablet, and phone screens.

## Features

- Google sign-in restricted to the allowed account: `rahulvb27@gmail.com`
- Monthly and yearly ledger selection
- Separate Apps Script integrations for each ledger
- Expense fields for date, amount, description, category, payment method, bank, and notes
- Live INR preview while entering a transaction
- Save feedback and success modal flow
- Responsive layout tuned for laptop, tablet, and mobile devices
- Retro arcade UI styling with strong contrast and readable text

## Tech stack

- React 19
- Vite 7
- Google Identity Services
- Google Apps Script Execution API
- Google Sheets

## Requirements

- Node.js 20 or newer
- A Google Cloud OAuth 2.0 client for a web app
- One private Apps Script project for the monthly ledger
- One private Apps Script project for the yearly ledger

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root:

```env
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com
VITE_MONTHLY_SCRIPT_ID=YOUR_MONTHLY_APPS_SCRIPT_PROJECT_ID
VITE_YEARLY_SCRIPT_ID=YOUR_YEARLY_APPS_SCRIPT_PROJECT_ID
VITE_MONTHLY_FUNCTION_NAME=addExpense
VITE_YEARLY_FUNCTION_NAME=addExpense
VITE_APPS_SCRIPT_SCOPES=https://www.googleapis.com/auth/script.projects https://www.googleapis.com/auth/spreadsheets
```

3. Start the app:

```bash
npm run dev
```

4. Open the local URL shown by Vite, typically:

```text
http://localhost:5173
```

## Google OAuth configuration

Create a Google OAuth 2.0 Client ID in Google Cloud Console using the **Web application** type.

Add the following authorized JavaScript origins:

```text
http://localhost:5173
https://expense.rahul.asia
```

This app uses Google Identity Services popup-based sign-in, so no redirect URI is required for the basic flow.

Important:
- Copy the client ID into `VITE_GOOGLE_CLIENT_ID`
- Do not commit downloaded `client_secret_*.json` files
- Do not include secret values in frontend env variables

## Security model

This project does not use a database. The real trust boundary is the private Google Apps Script executable plus the Google Sheet it writes to.

- The browser-side check is only a user experience guard: it blocks the wrong Google account before the request is made.
- The Apps Script function is the actual authorization gate. It rejects any request whose `userEmail` does not exactly match the allowed account.
- The Apps Script project itself should remain private and should not be published as a public Web App.
- Each script validates the incoming payload, checks the ledger type, checks the amount, and writes only sanitized values into Sheets.

This keeps the app simple and effective without a separate backend, while still preventing unauthorized entries from being written to the Sheet.

## Apps Script and Sheets setup

This frontend does not use a public Web App endpoint. It calls the authenticated Google Apps Script Execution API via `scripts.run`.

For each ledger, create a separate standalone Apps Script project. The script should:
- accept a JS object payload
- validate the incoming entry
- append the transaction to the correct Google Sheet
- return a success object or error information

Example payload shape:

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

The sample monthly script is available in [`apps-script/monthly.gs`](apps-script/monthly.gs). Use it as a reference or copy it into your monthly Apps Script project.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Login and ledger selection |
| `/monthly` | Monthly expense entry page |
| `/yearly` | Yearly expense entry page |

## Deployment

Build the production bundle:

```bash
npm run build
```

Then deploy the files in `dist/` to the web host. Make sure the host is configured to serve `index.html` when visiting `/monthly` and `/yearly` so deep links do not 404 on refresh.

Set all `VITE_` variables in the deployment environment before building.

## Project structure

```text
expense-frontend/
├── apps-script/
│   ├── monthly.gs
│   └── yearly.gs
├── src/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── README.md
└── .env
```

## Commands

```bash
npm run dev
npm run build
npm run preview
```

## Notes

- The app enforces a hardcoded allowed Google account in the frontend to keep access restricted.
- The Apps Script deployments should remain private and should not be public web apps.
- The app is intentionally designed to be minimal, readable, and resilient while keeping the retro arcade feel intact.
