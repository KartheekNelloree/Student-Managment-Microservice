import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { courseApi, studentApi } from "../services/api";
import { useToast } from "../components/Toast";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const notify = useToast();

  async function loadStudents(term = search) {
    setLoading(true);
    setError("");
    try {
      const [studentRecords, courseRecords] = await Promise.all([
        studentApi.list(term.trim()),
        courseApi.list(),
      ]);
      setStudents(studentRecords);
      setCourses(courseRecords);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => loadStudents(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  async function removeStudent(student) {
    if (!window.confirm(`Delete ${student.name}? This cannot be undone.`)) return;
    try {
      await studentApi.remove(student.id);
      notify("Student deleted.");
      loadStudents();
    } catch (err) {
      notify(err.message, "error");
    }
  }

  return (
    <div>
      <div className="page-heading"><div><p className="eyebrow">DIRECTORY</p><h1>Students</h1><p>Keep student information organized and easy to find.</p></div><Link className="button button-primary" to="/students/new">＋ Add student</Link></div>
      <section className="panel table-panel">
        <div className="table-toolbar"><div><h2>All students</h2><p>{students.length} {students.length === 1 ? "record" : "records"}</p></div>        <label className="search-box"><span>⌕</span><input type="search" aria-label="Search students" placeholder="Search name or email…" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
        {loading ? <div className="state-card">Loading students…</div> : error ? <div className="empty-state"><div className="form-alert" role="alert">{error}</div><button className="button button-subtle" onClick={() => loadStudents()}>Try again</button></div> : students.length === 0 ? <div className="empty-state"><span className="empty-mark">ST</span><strong>{search ? "No students match your search" : "No students yet"}</strong><p>{search ? "Try another name or email address." : "Add a student record to see it here."}</p>{!search && <Link className="button button-subtle" to="/students/new">Add your first student</Link>}</div> : (
          <div className="table-wrap"><table><thead><tr><th>STUDENT</th><th>DEPARTMENT</th><th>PHONE</th><th>COURSE</th><th aria-label="Actions" /></tr></thead><tbody>{students.map((student) => { const course = courses.find((item) => item.id === student.course_id); return <tr key={student.id}><td><div className="student-cell"><span className="avatar avatar-soft">{student.name.slice(0, 1).toUpperCase()}</span><span><strong>{student.name}</strong><small>{student.email}</small></span></div></td><td><span className="department-pill">{student.department}</span></td><td>{student.phone || "—"}</td><td>{course ? `${course.code} · ${course.name}` : student.course_id ? `#${student.course_id}` : "—"}</td><td><div className="row-actions"><Link to={`/students/${student.id}/edit`}>Edit</Link><button className="text-danger" onClick={() => removeStudent(student)}>Delete</button></div></td></tr>; })}</tbody></table></div>
        )}
      </section>
    </div>
  );
}
