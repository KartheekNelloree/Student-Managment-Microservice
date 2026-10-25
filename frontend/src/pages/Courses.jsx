import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { courseApi } from "../services/api";
import { useToast } from "../components/Toast";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const notify = useToast();

  async function loadCourses() {
    setLoading(true);
    setError("");
    try {
      setCourses(await courseApi.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCourses(); }, []);

  async function removeCourse(course) {
    if (!window.confirm(`Delete ${course.name}? Its local enrollment records will also be removed.`)) return;
    try {
      await courseApi.remove(course.id);
      notify("Course deleted.");
      loadCourses();
    } catch (err) {
      notify(err.message, "error");
    }
  }

  return (
    <div>
      <div className="page-heading"><div><p className="eyebrow">CATALOG</p><h1>Courses</h1><p>Explore and manage the courses offered on your campus.</p></div><Link className="button button-primary" to="/courses/new">＋ Add course</Link></div>
      {loading ? <div className="panel state-card">Loading courses…</div> : error ? <div className="panel empty-state"><div className="form-alert" role="alert">{error}</div><button className="button button-subtle" onClick={loadCourses}>Try again</button></div> : courses.length === 0 ? <div className="panel empty-state"><span className="empty-mark">CO</span><strong>Your course catalog is ready</strong><p>Add your first course to get started.</p><Link className="button button-subtle" to="/courses/new">Add a course</Link></div> : <div className="course-grid">{courses.map((course, index) => <article className="course-card" key={course.id}><div className="course-card-top"><span className={`course-symbol course-symbol-${index % 3}`}>{course.code.slice(0, 2)}</span><span className="course-code">{course.code}</span></div><p className="eyebrow">{course.department}</p><h2>{course.name}</h2><p className="course-description">{course.description || "No course description has been added."}</p><div className="course-card-footer"><span>Course #{course.id}</span><div className="row-actions"><Link to={`/courses/${course.id}/edit`}>Edit</Link><button className="text-danger" onClick={() => removeCourse(course)}>Delete</button></div></div></article>)}</div>}
    </div>
  );
}
