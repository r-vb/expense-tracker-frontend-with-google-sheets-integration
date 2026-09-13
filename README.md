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
- Two private Apps Script API executables: one for the monthly sheet and one for the yearly sheet

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
VITE_MONTHLY_SCRIPT_ID=YOUR_MONTHLY_APPS_SCRIPT_PROJECT_ID
VITE_YEARLY_SCRIPT_ID=YOUR_YEARLY_APPS_SCRIPT_PROJECT_ID
VITE_MONTHLY_FUNCTION_NAME=addExpense
VITE_YEARLY_FUNCTION_NAME=addExpense
VITE_APPS_SCRIPT_SCOPES=https://www.googleapis.com/auth/script.projects https://www.googleapis.com/auth/spreadsheets
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

## Private Google Sheets / Apps Script setup

Do **not** deploy a public Apps Script Web App or use a `/exec` URL. The app calls the authenticated Google Apps Script Execution API (`scripts.run`) instead.

For each sheet:

1. Open its Apps Script project and copy the **Script ID** from **Project Settings**.
2. In **Deploy → New deployment**, select **API executable**.
3. Set **Who has access** to **Only myself**, then deploy.
4. In Apps Script **Project Settings**, change its Google Cloud project to the same standard Google Cloud project that owns `VITE_GOOGLE_CLIENT_ID`.
5. In that Google Cloud project, enable the **Google Apps Script API**.
6. Ensure the function named by `VITE_MONTHLY_FUNCTION_NAME` or `VITE_YEARLY_FUNCTION_NAME` accepts one plain JavaScript object and returns a plain object such as `{ success: true }`.

The frontend asks Google for an OAuth access token when an expense is saved. Google then allows `scripts.run` only for the signed-in account and scopes permitted by the private API executable. Set `VITE_APPS_SCRIPT_SCOPES` to include every scope used by your scripts; the default covers the Apps Script API and spreadsheet access.

| Ledger | Route | Environment variable | Destination |
| --- | --- | --- | --- |
| Monthly | `/monthly` | `VITE_MONTHLY_SCRIPT_ID` | Monthly Google Sheet |
| Yearly | `/yearly` | `VITE_YEARLY_SCRIPT_ID` | Yearly Google Sheet |

The refactored monthly script is available at [`apps-script/monthly.gs`](apps-script/monthly.gs). Copy it into the existing monthly Apps Script project, then deploy that project as the private API executable. It preserves the original `_TEMPLATE` sheet behavior, creates sheets such as `Sep26`, and writes entries to columns B–H starting at row 22.

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

The browser UI only permits `rahulvb27@gmail.com`; its sign-in session lasts until the user signs out or closes the browser session. Saving asks Google for OAuth authorization, and the Apps Script API executable also restricts execution to **Only myself**. Keep the executable setting private even though the Script IDs and OAuth client ID are visible in the browser—they are identifiers, not credentials.

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
