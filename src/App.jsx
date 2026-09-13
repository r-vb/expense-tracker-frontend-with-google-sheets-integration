import React, { useEffect, useMemo, useState } from "react";

const ALLOWED_EMAIL = "rahulvb27@gmail.com";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCRIPT_URLS = {
  monthly: import.meta.env.VITE_MONTHLY_SCRIPT_URL || import.meta.env.VITE_SCRIPT_URL,
  yearly: import.meta.env.VITE_YEARLY_SCRIPT_URL,
};
const initialForm = () => ({ date: new Date().toISOString().split("T")[0], description: "", category: "Groceries & Food", paymentMethod: "UPI - Bank", paymentBank: "HDFC Bank", amount: "", notes: "" });
const categories = ["Housing & Rent", "Groceries & Food", "Utilities & Bills", "Transportation", "Dining & Drinks", "Entertainment", "Healthcare & Fitness", "Shopping & Personal Care", "Insurance & Policies", "Mutual Funds & Stocks", "Other"];
const paymentMethods = ["UPI - Bank", "UPI - Wallet", "UPI - Credit Card", "Credit Card", "Debit Card", "Cash", "Bank Transfer"];
const paymentBanks = ["HDFC Bank", "Karnataka Bank", "State Bank of India (SBI)", "Axis Bank"];
const routeFromLocation = () => ["monthly", "yearly"].includes(location.pathname.replaceAll("/", "")) ? location.pathname.replaceAll("/", "") : null;

function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(sessionStorage.getItem("expense-user")); } catch { return null; } });
  const [route, setRoute] = useState(routeFromLocation);
  useEffect(() => { const listen = () => setRoute(routeFromLocation()); addEventListener("popstate", listen); return () => removeEventListener("popstate", listen); }, []);
  const navigate = (target) => { history.pushState({}, "", target === "home" ? "/" : `/${target}`); setRoute(target === "home" ? null : target); };
  const signOut = () => { sessionStorage.removeItem("expense-user"); history.replaceState({}, "", "/"); setRoute(null); setUser(null); };
  if (!user) return <SignIn onSignedIn={setUser} />;
  if (!route) return <Dashboard user={user} onNavigate={navigate} onSignOut={signOut} />;
  return <ExpenseForm period={route} user={user} onNavigate={navigate} onSignOut={signOut} />;
}

function SignIn({ onSignedIn }) {
  const [error, setError] = useState("");
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) { setError("Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID to .env."); return; }
    const initialize = () => {
      google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: ({ credential }) => {
        try {
          const profile = JSON.parse(atob(credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
          if (profile.email !== ALLOWED_EMAIL || !profile.email_verified) throw new Error();
          const user = { email: profile.email, name: profile.name || "Rahul" };
          sessionStorage.setItem("expense-user", JSON.stringify(user)); onSignedIn(user);
        } catch { setError(`Please sign in with ${ALLOWED_EMAIL}.`); }
      }});
      google.accounts.id.renderButton(document.getElementById("google-signin"), { theme: "outline", size: "large", text: "signin_with", shape: "pill", width: 300 });
    };
    if (window.google) initialize(); else { const script = document.createElement("script"); script.src = "https://accounts.google.com/gsi/client"; script.async = true; script.onload = initialize; document.head.appendChild(script); }
  }, [onSignedIn]);
  return <main className="auth-page"><section className="auth-card"><span className="brand-mark">₹</span><p className="eyebrow">POCKET LEDGER</p><h1>Your expenses, in one clear place.</h1><p>Sign in to continue to your personal expense tracker.</p><div id="google-signin" className="google-signin" />{error && <div className="status error">{error}</div>}</section></main>;
}

function Header({ user, onNavigate, onSignOut }) { return <nav className="topbar"><button className="brand" onClick={() => onNavigate("home")}><span className="brand-mark">₹</span><span>Pocket Ledger</span></button><div className="account"><span>{user.email}</span><button className="signout" onClick={onSignOut}>Sign out</button></div></nav>; }
function Dashboard({ user, onNavigate, onSignOut }) { return <main className="app-shell"><Header user={user} onNavigate={onNavigate} onSignOut={onSignOut}/><section className="choice-hero"><p className="eyebrow">WELCOME BACK</p><h1>Where would you like to track expenses?</h1><p>Choose the ledger that fits the view you need today.</p><div className="period-cards"><button className="period-card" onClick={() => onNavigate("monthly")}><span>01</span><strong>Monthly expense</strong><small>Day-to-day spending, saved to your monthly Google Sheet.</small><b>Open monthly →</b></button><button className="period-card yearly" onClick={() => onNavigate("yearly")}><span>12</span><strong>Yearly expense</strong><small>Annual tracking, saved to your separate yearly Google Sheet.</small><b>Open yearly →</b></button></div></section></main>; }

function ExpenseForm({ period, user, onNavigate, onSignOut }) {
  const [form, setForm] = useState(initialForm); const [loading, setLoading] = useState(false); const [status, setStatus] = useState(null);
  const title = `${period[0].toUpperCase() + period.slice(1)} expense`;
  const amount = useMemo(() => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(form.amount) || 0), [form.amount]);
  const change = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.value }));
  async function submit(event) {
    event.preventDefault(); if (!form.description.trim() || Number(form.amount) <= 0) return setStatus({ type: "error", message: "Enter a description and a valid amount." });
    const endpoint = SCRIPT_URLS[period]; if (!endpoint || endpoint === "YOUR_DEPLOYED_WEB_APP_URL") return setStatus({ type: "error", message: `Set VITE_${period.toUpperCase()}_SCRIPT_URL in .env.` });
    setLoading(true); setStatus(null);
    try { const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ ...form, amount: Number(form.amount), ledger: period, userEmail: user.email }) }); if (!response.ok) throw new Error(`Request failed with status ${response.status}`); const result = await response.json(); if (result.success === false) throw new Error(result.message || "Transaction could not be saved."); setStatus({ type: "success", message: `${title} added successfully.` }); setForm({ ...initialForm(), date: form.date }); } catch (error) { setStatus({ type: "error", message: error.message || "Unable to save the expense." }); } finally { setLoading(false); }
  }
  return <main className="app-shell"><Header user={user} onNavigate={onNavigate} onSignOut={onSignOut}/><a className="back-link" href="/" onClick={(event) => { event.preventDefault(); onNavigate("home"); }}>← Change ledger</a><section className="hero"><div><p className="eyebrow">{period.toUpperCase()} LEDGER</p><h1>{title}.</h1><p>Capture the little things before they become a blur.</p></div><div className="live-total"><span>New expense</span><strong>{amount}</strong><small>{form.category}</small></div></section><section className="workspace"><form className="expense-composer" onSubmit={submit}><div className="composer-heading"><div className="entry-icon">+</div><div><p>QUICK ENTRY</p><h2>What did you spend?</h2></div></div><div className="entry-grid"><Field label="Amount" className="amount-field"><div className="amount-input"><span>₹</span><input name="amount" type="number" min="0" step="0.01" placeholder="0" value={form.amount} onChange={change} required/></div></Field><Field label="When" className="date-field"><input name="date" type="date" value={form.date} onChange={change} required/></Field><Field label="For" className="description-field"><input name="description" placeholder="Coffee, groceries, a cab..." value={form.description} onChange={change} required/></Field><Select label="Category" name="category" values={categories} form={form} onChange={change}/><Select label="Paid with" name="paymentMethod" values={paymentMethods} form={form} onChange={change}/><Select label="From account" name="paymentBank" values={paymentBanks} form={form} onChange={change}/><Field label="A note (optional)" className="notes-field"><textarea name="notes" rows="2" placeholder="Add a detail for future you..." value={form.notes} onChange={change}/></Field></div>{status && <div className={`status ${status.type}`}>{status.message}</div>}<button type="submit" disabled={loading}><span>{loading ? "Saving entry..." : "Save expense"}</span>{!loading && <b>→</b>}</button></form><aside className="insight-panel"><div className="insight-orb">✦</div><p className="panel-kicker">{period.toUpperCase()} TRACKING</p><h2>Clarity is built one entry at a time.</h2><p className="panel-copy">This entry will be saved to your {period} Google Sheet.</p><div className="entry-preview"><span>{form.paymentBank}</span><strong>{amount}</strong></div></aside></section></main>;
}
function Field({ label, className = "", children }) { return <div className={`field ${className}`}><label>{label}</label>{children}</div>; }
function Select({ label, name, values, form, onChange }) { return <Field label={label}><select name={name} value={form[name]} onChange={onChange}>{values.map((value) => <option key={value}>{value}</option>)}</select></Field>; }
export default App;
