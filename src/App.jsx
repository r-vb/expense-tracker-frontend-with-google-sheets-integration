import React, { useState } from "react";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwB7o7xpmcq1rb8YMY0nitLs3VGd_4kyhQbBRUb3sH5-J-83MjWOS0ONKgXF30jBcn6/exec"
const initialForm = {
  date: new Date().toISOString().split("T")[0],
  description: "",
  category: "Groceries & Food",
  paymentMethod: "UPI - Bank",
  paymentBank: "HDFC Bank",
  amount: "",
  notes: "",
};

const categories = [
  "Housing & Rent",
  "Groceries & Food",
  "Utilities & Bills",
  "Transportation",
  "Dining & Drinks",
  "Entertainment",
  "Healthcare & Fitness",
  "Shopping & Personal Care",
  "Insurance & Policies",
  "Mutual Funds & Stocks",
  "Other",
];

const paymentMethods = [
  "UPI - Bank",
  "UPI - Wallet",
  "UPI - Credit Card",
  "Credit Card",
  "Debit Card",
  "Cash",
  "Bank Transfer",
];

const paymentBanks = [
  "HDFC Bank",
  "Karnataka Bank",
  "State Bank of India (SBI)",
  "Axis Bank",
];

function App() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const displayAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(form.amount) || 0);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function addTransaction(event) {
    event.preventDefault();

    if (!form.description.trim()) {
      setStatus({ type: "error", message: "Please enter a description." });
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setStatus({ type: "error", message: "Please enter a valid amount." });
      return;
    }

    if (SCRIPT_URL === "YOUR_DEPLOYED_WEB_APP_URL") {
      setStatus({
        type: "error",
        message:
          "Set your Google Apps Script Web App URL in src/App.jsx first.",
      });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          date: form.date,
          description: form.description,
          category: form.category,
          paymentMethod: form.paymentMethod,
          paymentBank: form.paymentBank,
          amount: Number(form.amount),
          notes: form.notes || "",
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const result = await response.json();

      if (result.success === false) {
        throw new Error(result.message || "Transaction could not be saved.");
      }

      setStatus({
        type: "success",
        message: "Expense added successfully.",
      });

      setForm({ ...initialForm, date: form.date });
    } catch (error) {
      console.error(error);
      setStatus({
        type: "error",
        message:
          error.message ||
          "Unable to save the expense. Check your Apps Script URL and deployment.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="Expense tracker">
        <a className="brand" href="#expense-entry" aria-label="Pocket Ledger home">
          <span className="brand-mark">₹</span>
          <span>Pocket Ledger</span>
        </a>
        <span className="sync-status"><i />Synced</span>
      </nav>

      <section className="hero" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">TODAY&apos;S MONEY MOMENT</p>
          <h1 id="page-title">Keep every rupee in view.</h1>
          <p>Capture the little things before they become a blur.</p>
        </div>
        <div className="live-total" aria-label={`Current entry: ${displayAmount}`}>
          <span>New expense</span>
          <strong>{displayAmount}</strong>
          <small>{form.category}</small>
        </div>
      </section>

      <section className="workspace" id="expense-entry">
        <form className="expense-composer" onSubmit={addTransaction}>
          <div className="composer-heading">
            <div className="entry-icon">+</div>
            <div>
              <p>QUICK ENTRY</p>
              <h2>What did you spend?</h2>
            </div>
          </div>

          <div className="entry-grid">
            <div className="field amount-field">
              <label htmlFor="amount">Amount</label>
              <div className="amount-input">
                <span>₹</span>
                <input id="amount" name="amount" type="number" min="0" step="0.01" placeholder="0" value={form.amount} onChange={handleChange} required />
              </div>
            </div>

            <div className="field date-field">
              <label htmlFor="date">When</label>
              <input id="date" name="date" type="date" value={form.date} onChange={handleChange} required />
            </div>

            <div className="field description-field">
              <label htmlFor="description">For</label>
              <input id="description" name="description" type="text" placeholder="Coffee, groceries, a cab..." value={form.description} onChange={handleChange} required />
            </div>

            <div className="field">
              <label htmlFor="category">Category</label>
              <select id="category" name="category" value={form.category} onChange={handleChange}>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>

            <div className="field">
              <label htmlFor="paymentMethod">Paid with</label>
              <select id="paymentMethod" name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
                {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
              </select>
            </div>

            <div className="field">
              <label htmlFor="paymentBank">From account</label>
              <select id="paymentBank" name="paymentBank" value={form.paymentBank} onChange={handleChange}>
                {paymentBanks.map((bank) => <option key={bank} value={bank}>{bank}</option>)}
              </select>
            </div>

            <div className="field notes-field">
              <label htmlFor="notes">A note <span>optional</span></label>
              <textarea id="notes" name="notes" rows="2" placeholder="Add a detail for future you..." value={form.notes} onChange={handleChange} />
            </div>
          </div>

          {status && <div className={`status ${status.type}`}>{status.message}</div>}

          <button type="submit" disabled={loading}>
            <span>{loading ? "Saving entry..." : "Save expense"}</span>
            {!loading && <b>→</b>}
          </button>
        </form>

        <aside className="insight-panel" aria-label="Expense entry summary">
          <div className="insight-orb">✦</div>
          <p className="panel-kicker">A SMALL HABIT</p>
          <h2>Clarity is built one entry at a time.</h2>
          <p className="panel-copy">Your expense will be saved securely to your connected Google Sheet.</p>
          <div className="entry-preview">
            <span>{form.paymentBank}</span>
            <strong>{displayAmount}</strong>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default App;
