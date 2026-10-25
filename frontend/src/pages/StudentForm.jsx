import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { courseApi, studentApi } from "../services/api";
import { useToast } from "../components/Toast";

const emptyStudent = { name: "", email: "", phone: "", department: "", course_id: "" };

export default function StudentForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const notify = useToast();
  const [form, setForm] = useState(emptyStudent);
  const [courses, setCourses] = useState([]);
  const [initialCourseId, setInitialCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([courseApi.list(), editing ? studentApi.get(id) : Promise.resolve(null)])
      .then(([availableCourses, student]) => {
        setCourses(availableCourses);
        if (student) {
          const courseId = student.course_id?.toString() ?? "";
          setForm({ ...student, course_id: courseId });
          setInitialCourseId(courseId);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [editing, id]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const payload = { ...form, course_id: form.course_id ? Number(form.course_id) : null };
    try {
      if (!editing) {
        const student = await studentApi.create(payload);
        if (payload.course_id) {
          try {
            await courseApi.enroll(payload.course_id, student.id);
          } catch (enrollmentError) {
            try {
              await studentApi.remove(student.id);
            } catch (cleanupError) {
              throw new Error(
                `Student was saved, but course enrollment failed: ${enrollmentError.message}. The student record could not be removed: ${cleanupError.message}`,
              );
            }
            throw new Error(
              `Course enrollment failed, so the student record was removed: ${enrollmentError.message}`,
            );
          }
        }
      } else {
        const previousCourseId = initialCourseId ? Number(initialCourseId) : null;
        const nextCourseId = payload.course_id;
        const changedCourse = previousCourseId !== nextCourseId;
        if (changedCourse && nextCourseId) {
          await courseApi.enroll(nextCourseId, Number(id));
        }
        try {
          await studentApi.update(id, payload);
        } catch (updateError) {
          if (changedCourse && nextCourseId) {
            try {
              await courseApi.unenroll(nextCourseId, Number(id));
            } catch (cleanupError) {
              throw new Error(
                `Student update failed: ${updateError.message}. The new course enrollment could not be removed: ${cleanupError.message}`,
              );
            }
          }
          throw updateError;
        }
        if (changedCourse && previousCourseId) {
          try {
            await courseApi.unenroll(previousCourseId, Number(id));
          } catch (cleanupError) {
            throw new Error(
              `Student details were saved, but the previous course enrollment could not be removed: ${cleanupError.message}`,
            );
          }
        }
      }
      notify(editing ? "Student details updated." : "Student added.");
      navigate("/students");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="panel state-card">Loading student and course catalog…</div>;
  return (
    <div className="form-page">
      <Link to="/students" className="back-link">← Back to students</Link>
      <div className="page-heading compact-heading"><div><p className="eyebrow">STUDENT DIRECTORY</p><h1>{editing ? "Edit student" : "Add a student"}</h1><p>{editing ? "Update this student’s information." : "Add a new record to your student directory."}</p></div></div>
      <form className="panel record-form" onSubmit={handleSubmit}>
        {error && <div className="form-alert" role="alert">{error}</div>}
        <div className="form-grid"><label>Full name<input required minLength="2" maxLength="120" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Taylor Morgan" /></label><label>Email address<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="taylor@school.edu" /></label><label>Department<input required minLength="2" maxLength="120" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Computer Science" /></label><label>Phone number <span className="optional">OPTIONAL</span><input maxLength="40" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="555-0100" /></label><label className="form-span">Choose a course <span className="optional">OPTIONAL</span><select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}><option value="">No course selected</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.name} ({course.department})</option>)}</select>{courses.length === 0 && <small className="field-hint">Your course catalog is empty. <Link to="/courses/new">Add a course</Link> to offer course choices.</small>}</label></div>
        <div className="form-actions"><Link className="button button-plain" to="/students">Cancel</Link><button className="button button-primary" disabled={submitting}>{submitting ? "Saving…" : editing ? "Save changes" : "Add student"}</button></div>
      </form>
    </div>
  );
}
