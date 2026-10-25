import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { signIn, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;
  if (loading) return <div className="full-page-state">Checking your session…</div>;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link to="/login" className="brand auth-brand"><span className="brand-mark">C</span><span>Campus<span className="brand-light">Desk</span></span></Link>
        <div className="auth-heading">
          <p className="eyebrow">WELCOME BACK</p>
          <h1>Sign in to your workspace</h1>
          <p>Manage your campus community, all in one place.</p>
        </div>
        {location.state?.registered && <div className="success-alert" role="status">Account created. Sign in to continue.</div>}
        {error && <div className="form-alert" role="alert">{error}</div>}
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>Email address<input type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@school.edu" /></label>
          <label>Password<input type="password" autoComplete="current-password" required minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" /></label>
          <button className="button button-primary button-wide" disabled={submitting}>{submitting ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="auth-switch">New to CampusDesk? <Link to="/register">Create an account</Link></p>
      </section>
      <aside className="auth-art">
        <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
        <div className="art-copy"><span className="art-kicker">YOUR CAMPUS, CONNECTED</span><h2>Make student life<br />a little simpler.</h2><p>A calmer way to organize students, courses and the details that keep your campus moving.</p></div>
        <div className="art-note"><span className="note-dot" /> One clear view of your community</div>
      </aside>
    </main>
  );
}
