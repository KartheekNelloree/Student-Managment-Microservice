import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { courseApi, studentApi } from "../services/api";

export default function Dashboard() {
  const [data, setData] = useState({ students: [], courses: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function loadDashboard() {
    setLoading(true);
    setError("");
    Promise.all([studentApi.list(), courseApi.list()])
      .then(([students, courses]) => setData({ students, courses }))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div>
      <div className="page-heading">
        <div><p className="eyebrow">OVERVIEW</p><h1>Good day, {new Date().toLocaleDateString("en", { weekday: "long" })}.</h1><p>Here’s what’s happening across your campus.</p></div>
        <Link className="button button-primary" to="/students/new">＋ Add student</Link>
      </div>
      {error ? <div className="panel state-card error-state"><div role="alert">{error}</div><button className="button button-subtle" onClick={loadDashboard}>Try again</button></div> : loading ? <div className="panel state-card">Loading your campus overview…</div> : (
        <>
          <section className="stats-grid">
            <article className="stat-card"><div className="stat-top"><span>Total students</span><span className="stat-icon icon-peach">ST</span></div><strong>{data.students.length}</strong><small>In your student directory</small></article>
            <article className="stat-card"><div className="stat-top"><span>Active courses</span><span className="stat-icon icon-blue">CO</span></div><strong>{data.courses.length}</strong><small>Available in your catalog</small></article>
            <article className="stat-card stat-highlight"><span>Campus at a glance</span><strong>{data.students.length + data.courses.length}</strong><small>Students and courses managed</small><span className="highlight-decoration">+</span></article>
          </section>
          <section className="dashboard-grid">
            <div className="panel">
              <div className="panel-heading"><div><p className="eyebrow">DIRECTORY</p><h2>Recently added students</h2></div><Link to="/students">View all <span aria-hidden="true">→</span></Link></div>
              {data.students.length === 0 ? <div className="empty-state"><span className="empty-mark">ST</span><strong>Your student directory is ready</strong><p>Add your first student to start building your campus list.</p><Link className="button button-subtle" to="/students/new">Add a student</Link></div> : (
                <div className="mini-list">{data.students.slice(0, 5).map((student) => <div className="mini-row" key={student.id}><span className="avatar avatar-soft">{student.name.slice(0, 1).toUpperCase()}</span><span className="mini-copy"><strong>{student.name}</strong><small>{student.email}</small></span><span className="department-pill">{student.department}</span></div>)}</div>
              )}
            </div>
            <div className="panel quick-panel"><p className="eyebrow">QUICK ACTIONS</p><h2>Keep things moving</h2><Link className="quick-link" to="/students/new"><span className="quick-icon icon-peach">＋</span><span><strong>Add a student</strong><small>Create a new student record</small></span><b>→</b></Link><Link className="quick-link" to="/courses/new"><span className="quick-icon icon-blue">＋</span><span><strong>Add a course</strong><small>Grow your course catalog</small></span><b>→</b></Link><Link className="quick-link" to="/courses"><span className="quick-icon icon-mint">CO</span><span><strong>Browse courses</strong><small>Review your active catalog</small></span><b>→</b></Link></div>
          </section>
        </>
      )}
    </div>
  );
}
