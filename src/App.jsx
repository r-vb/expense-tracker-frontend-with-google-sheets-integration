import React, { useEffect, useMemo, useState } from "react";

const ALLOWED_EMAIL = "rahulvb27@gmail.com";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCRIPT_CONFIG = {
  monthly: { scriptId: import.meta.env.VITE_MONTHLY_SCRIPT_ID, functionName: import.meta.env.VITE_MONTHLY_FUNCTION_NAME || "addExpense" },
  yearly: { scriptId: import.meta.env.VITE_YEARLY_SCRIPT_ID, functionName: import.meta.env.VITE_YEARLY_FUNCTION_NAME || "addExpense" },
};
const APPS_SCRIPT_SCOPES = import.meta.env.VITE_APPS_SCRIPT_SCOPES || "https://www.googleapis.com/auth/script.projects https://www.googleapis.com/auth/spreadsheets";

function normalizeUserEmail(value) {
  return String(value || "").trim().toLowerCase();
}

const initialForm = () => ({
  date: new Date().toISOString().split("T")[0],
  description: "",
  category: "Groceries & Food",
  paymentMethod: "UPI - Bank",
  paymentBank: "HDFC Bank",
  amount: "",
  notes: "",
});

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

const paymentMethods = ["UPI - Bank", "UPI - Wallet", "UPI - Credit Card", "Credit Card", "Debit Card", "Cash", "Bank Transfer"];
const paymentBanks = ["HDFC Bank", "Karnataka Bank", "State Bank of India (SBI)", "Axis Bank"];
const routeFromLocation = () => (['monthly', 'yearly'].includes(location.pathname.replaceAll('/', '')) ? location.pathname.replaceAll('/', '') : null);

function requestAppsScriptToken() {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      return reject(new Error("Google sign-in is still loading. Please try again."));
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: APPS_SCRIPT_SCOPES,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || "Google authorization was not completed."));
          return;
        }
        resolve(response.access_token);
      },
    });

    tokenClient.requestAccessToken({ prompt: "" });
  });
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("expense-user"));
    } catch {
      return null;
    }
  });

  const [route, setRoute] = useState(routeFromLocation);

  useEffect(() => {
    const listen = () => setRoute(routeFromLocation());
    addEventListener("popstate", listen);
    return () => removeEventListener("popstate", listen);
  }, []);

  const navigate = (target) => {
    history.pushState({}, "", target === "home" ? "/" : `/${target}`);
    setRoute(target === "home" ? null : target);
  };

  const signOut = () => {
    sessionStorage.removeItem("expense-user");
    history.replaceState({}, "", "/");
    setRoute(null);
    setUser(null);
  };

  if (!user) return <SignIn onSignedIn={setUser} />;
  if (!route) return <Dashboard user={user} onNavigate={navigate} onSignOut={signOut} />;
  return <ExpenseForm period={route} user={user} onNavigate={navigate} onSignOut={signOut} />;
}

function SignIn({ onSignedIn }) {
  const [error, setError] = useState("");

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError("Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID to .env.");
      return;
    }

    const initialize = () => {
      if (!window.google?.accounts?.id) {
        setError("Google identity services are not available. Please refresh the page.");
        return;
      }

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: ({ credential }) => {
          try {
            const profile = JSON.parse(atob(credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
            const email = normalizeUserEmail(profile.email);
            if (email !== normalizeUserEmail(ALLOWED_EMAIL) || !profile.email_verified) {
              throw new Error();
            }
            const user = { email, name: profile.name || "Rahul" };
            sessionStorage.setItem("expense-user", JSON.stringify(user));
            onSignedIn(user);
          } catch {
            setError(`Please sign in with ${ALLOWED_EMAIL}.`);
          }
        },
      });

      const buttonTarget = document.getElementById("google-signin");
      if (buttonTarget) {
        google.accounts.id.renderButton(buttonTarget, {
          theme: "filled_black",
          size: "large",
          shape: "pill",
          width: 320,
          text: "continue_with",
          logo_alignment: "left",
        });
      }
    };

    if (window.google) {
      initialize();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = initialize;
      document.head.appendChild(script);
    }
  }, [onSignedIn]);

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-visual">
          <div className="brand-lockup">
            <span className="brand-mark">₹</span>
            <span>Pocket Ledger</span>
          </div>

          <p className="eyebrow">SMART FINANCE</p>
          <h1>Track every rupee with less effort and more clarity.</h1>
          <p className="auth-copy">
            Designed for fast capture, clean categories, and a calmer view of your spending habits.
          </p>

          <div className="feature-list">
            <div>
              <strong>01</strong>
              <span>Fast daily entry</span>
            </div>
            <div>
              <strong>02</strong>
              <span>Monthly + yearly views</span>
            </div>
            <div>
              <strong>03</strong>
              <span>Google Sheets sync</span>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <p className="eyebrow">WELCOME</p>
          <h2>Sign in to continue</h2>
          <p className="auth-copy muted">Use your approved Google account to access your ledger.</p>
          <div id="google-signin" className="google-signin" />
          {error && <div className="status error">{error}</div>}
        </section>
      </div>
    </main>
  );
}

function Header({ user, onNavigate, onSignOut }) {
  return (
    <nav className="topbar">
      <button className="brand" onClick={() => onNavigate("home")}>
        <span className="brand-mark">₹</span>
        <span>Pocket Ledger</span>
      </button>

      <div className="account">
        <span>{user.email}</span>
        <button className="signout" onClick={onSignOut}>Sign out</button>
      </div>
    </nav>
  );
}

function Dashboard({ user, onNavigate, onSignOut }) {
  return (
    <main className="app-shell">
      <Header user={user} onNavigate={onNavigate} onSignOut={onSignOut} />

      <section className="choice-hero luxury-hero">
        <div className="hero-intro">
          <p className="eyebrow">WELCOME BACK</p>
          <h1>Choose where you want to log this month’s story.</h1>
          <p>Pick the ledger that fits how you want to track spending today.</p>
        </div>

        <div className="period-cards">
          <button className="period-card primary" onClick={() => onNavigate("monthly")}>
            <span>1/2</span>
            <strong>Monthly expense</strong>
            <small>Track everyday spending and keep your monthly record tidy.</small>
            <b>Open monthly →</b>
          </button>

          <button className="period-card secondary" onClick={() => onNavigate("yearly")}>
            <span>12</span>
            <strong>Yearly expense</strong>
            <small>Review annual trends and keep long-term budget habits visible.</small>
            <b>Open yearly →</b>
          </button>
        </div>
      </section>
    </main>
  );
}

function ExpenseForm({ period, user, onNavigate, onSignOut }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [successModal, setSuccessModal] = useState(null);

  const title = `${period[0].toUpperCase() + period.slice(1)} expense`;
  const amount = useMemo(
    () => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(form.amount) || 0),
    [form.amount],
  );

  const change = ({ target }) => {
    setForm((current) => ({ ...current, [target.name]: target.value }));
  };

  async function submit(event) {
    event.preventDefault();

    if (!form.description.trim() || Number(form.amount) <= 0) {
      setStatus({ type: "error", message: "Enter a description and a valid amount." });
      return;
    }

    const script = SCRIPT_CONFIG[period];
    if (!script.scriptId) {
      setStatus({ type: "error", message: `Set VITE_${period.toUpperCase()}_SCRIPT_ID in .env.` });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const accessToken = await requestAppsScriptToken();
      const payload = {
        date: form.date,
        description: form.description.trim(),
        category: form.category,
        paymentMethod: form.paymentMethod,
        paymentBank: form.paymentBank,
        amount: Number(form.amount),
        notes: form.notes ? form.notes.trim() : "",
        ledger: period === "yearly" ? "yearly" : period,
        userEmail: normalizeUserEmail(user.email),
        ...(period === "yearly" && { sheet: new Date(form.date).getFullYear().toString() }),
      };

      const response = await fetch(`https://script.googleapis.com/v1/scripts/${script.scriptId}:run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ function: script.functionName, parameters: [payload] }),
      });

      const result = await response.json();

      if (!response.ok || result.error || result.response?.error) {
        throw new Error(
          result.error?.message ||
            result.response?.error?.details?.[0]?.errorMessage ||
            "Transaction could not be saved.",
        );
      }

      const backendResult = result.response?.result;
      if (backendResult?.success === false) {
        throw new Error(backendResult.message || "Transaction could not be saved.");
      }

      const savedLabel = `${form.description.trim()} • ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(form.amount))}`;
      setSuccessModal({
        title: `${title} added successfully`,
        detail: backendResult?.message || backendResult?.notes
          ? `${backendResult.message || `${savedLabel} was saved to your ${period} ledger.`} ${backendResult.notes ? `Notes: ${backendResult.notes}` : ""}`.trim()
          : `${savedLabel} was saved to your ${period} ledger.`,
      });
      setForm({ ...initialForm(), date: form.date });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Unable to save the expense." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <Header user={user} onNavigate={onNavigate} onSignOut={onSignOut} />

      <a className="back-link" href="/" onClick={(event) => {
        event.preventDefault();
        onNavigate("home");
      }}>
        ← Change ledger
      </a>

      <section className="hero">
        <div>
          <p className="eyebrow">{period.toUpperCase()} LEDGER</p>
          <h1>{title}.</h1>
          <p>Capture the little things before they turn into big habits.</p>
        </div>

        <div className="live-total">
          <span>New expense</span>
          <strong>{amount}</strong>
          <small>{form.category}</small>
        </div>
      </section>

      <section className="workspace">
        <form className="expense-composer" onSubmit={submit}>
          <div className="composer-heading">
            <div className="entry-icon">+</div>
            <div>
              <p>QUICK ENTRY</p>
              <h2>What did you spend?</h2>
            </div>
          </div>

          <div className="entry-grid">
            <Field label="Amount" className="amount-field">
              <div className="amount-input">
                <span>₹</span>
                <input
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={form.amount}
                  onChange={change}
                  required
                />
              </div>
            </Field>

            <Field label="When" className="date-field">
              <input name="date" type="date" value={form.date} onChange={change} required />
            </Field>

            <Field label="For" className="description-field">
              <input
                name="description"
                placeholder="Coffee, groceries, cab..."
                value={form.description}
                onChange={change}
                required
              />
            </Field>

            <Select label="Category" name="category" values={categories} form={form} onChange={change} />
            <Select label="Paid with" name="paymentMethod" values={paymentMethods} form={form} onChange={change} />
            <Select label="From account" name="paymentBank" values={paymentBanks} form={form} onChange={change} />

            <Field label="A note (optional)" className="notes-field">
              <textarea
                name="notes"
                rows="2"
                placeholder="Add a detail for future you..."
                value={form.notes}
                onChange={change}
              />
            </Field>
          </div>

          {status && <div className={`status ${status.type}`}>{status.message}</div>}

          <button type="submit" disabled={loading}>
            <span>{loading ? "Saving entry..." : "Save expense"}</span>
            {!loading && <b>→</b>}
          </button>
        </form>

        {successModal && (
          <div className="success-overlay" role="dialog" aria-modal="true" aria-live="polite">
            <div className="success-modal">
              <div className="success-badge">
                <div className="success-ring" />
                <div className="success-check">✓</div>
              </div>
              <p className="eyebrow success-kicker">Saved</p>
              <h2>{successModal.title}</h2>
              <p>{successModal.detail}</p>
              <div className="success-actions">
                <button type="button" className="success-primary" onClick={() => setSuccessModal(null)}>
                  Add another
                </button>
                <button type="button" className="success-secondary" onClick={() => {
                  setSuccessModal(null);
                  onNavigate("home");
                }}>
                  Back to dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        <aside className="insight-panel">
          <div className="insight-orb">✦</div>
          <p className="panel-kicker">ENTRY SUMMARY</p>
          <h2>{form.description || "A fresh spending entry"}</h2>
          <p className="panel-copy">
            {form.notes || "Add context for future budgeting and a clearer picture of where your money is going."}
          </p>

          <div className="metric-stack">
            <div className="metric-row">
              <span>Category</span>
              <strong>{form.category}</strong>
            </div>
            <div className="metric-row">
              <span>Payment</span>
              <strong>{form.paymentMethod}</strong>
            </div>
            <div className="metric-row">
              <span>Account</span>
              <strong>{form.paymentBank}</strong>
            </div>
          </div>

          <div className="entry-preview">
            <span>{form.date}</span>
            <strong>{amount}</strong>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Field({ label, className = "", children }) {
  return (
    <div className={`field ${className}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function Select({ label, name, values, form, onChange }) {
  return (
    <Field label={label}>
      <select name={name} value={form[name]} onChange={onChange}>
        {values.map((value) => (
          <option key={value}>{value}</option>
        ))}
      </select>
    </Field>
  );
}

export default App;
