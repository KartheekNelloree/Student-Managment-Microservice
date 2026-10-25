import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { courseApi } from "../services/api";
import { useToast } from "../components/Toast";

const emptyCourse = { name: "", code: "", description: "", department: "" };

export default function CourseForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const notify = useToast();
  const [form, setForm] = useState(emptyCourse);
  const [loading, setLoading] = useState(editing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editing) return;
    courseApi.get(id).then(setForm).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [editing, id]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (editing) await courseApi.update(id, form);
      else await courseApi.create(form);
      notify(editing ? "Course details updated." : "Course added.");
      navigate("/courses");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="panel state-card">Loading course…</div>;
  return (
    <div className="form-page">
      <Link to="/courses" className="back-link">← Back to courses</Link>
      <div className="page-heading compact-heading"><div><p className="eyebrow">COURSE CATALOG</p><h1>{editing ? "Edit course" : "Add a course"}</h1><p>{editing ? "Update details in your course catalog." : "Add a new course to your campus catalog."}</p></div></div>
      <form className="panel record-form" onSubmit={handleSubmit}>
        {error && <div className="form-alert" role="alert">{error}</div>}
        <div className="form-grid"><label>Course name<input required minLength="2" maxLength="120" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Applied Physics" /></label><label>Course code<input required minLength="2" maxLength="30" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="PHY-201" /></label><label className="form-span">Department<input required minLength="2" maxLength="120" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Science" /></label><label className="form-span">Description <span className="optional">OPTIONAL</span><textarea maxLength="1000" rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A short overview of this course…" /></label></div>
        <div className="form-actions"><Link className="button button-plain" to="/courses">Cancel</Link><button className="button button-primary" disabled={submitting}>{submitting ? "Saving…" : editing ? "Save changes" : "Add course"}</button></div>
      </form>
    </div>
  );
}
