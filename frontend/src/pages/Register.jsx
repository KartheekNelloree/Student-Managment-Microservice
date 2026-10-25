import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await authApi.register(form);
      navigate("/login", { state: { registered: true } });
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
          <p className="eyebrow">GET STARTED</p>
          <h1>Create your workspace</h1>
          <p>Set up your account to start managing your campus.</p>
        </div>
        {error && <div className="form-alert" role="alert">{error}</div>}
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>Full name<input type="text" autoComplete="name" required minLength="2" maxLength="100" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jordan Lee" /></label>
          <label>Email address<input type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@school.edu" /></label>
          <label>Password<input type="password" autoComplete="new-password" required minLength="8" maxLength="128" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" /></label>
          <button className="button button-primary button-wide" disabled={submitting}>{submitting ? "Creating account…" : "Create account"}</button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </section>
      <aside className="auth-art"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-copy"><span className="art-kicker">A BETTER CAMPUS VIEW</span><h2>More time for<br />what matters.</h2><p>Bring the everyday pieces of student administration into one thoughtful workspace.</p></div><div className="art-note"><span className="note-dot" /> Built for the people behind campus</div></aside>
    </main>
  );
}
