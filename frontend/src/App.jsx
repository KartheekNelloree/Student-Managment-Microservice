import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import CourseForm from "./pages/CourseForm";
import Courses from "./pages/Courses";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentForm from "./pages/StudentForm";
import Students from "./pages/Students";
import { ToastProvider } from "./components/Toast";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/students" element={<Students />} />
                <Route path="/students/new" element={<StudentForm />} />
                <Route path="/students/:id/edit" element={<StudentForm />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/courses/new" element={<CourseForm />} />
                <Route path="/courses/:id/edit" element={<CourseForm />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
