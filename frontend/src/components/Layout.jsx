import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Overview", icon: "OV" },
  { to: "/students", label: "Students", icon: "ST" },
  { to: "/courses", label: "Courses", icon: "CO" },
];

export default function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  function logout() {
    signOut();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <span className="brand-mark">C</span>
          <span>Campus<span className="brand-light">Desk</span></span>
        </NavLink>
        <p className="nav-caption">WORKSPACE</p>
        <nav className="main-nav" aria-label="Main navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              <span className="nav-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile">
            <span className="avatar">{user?.name?.slice(0, 1).toUpperCase() || "U"}</span>
            <span className="profile-copy">
              <strong>{user?.name || "Campus user"}</strong>
              <small>Administrator</small>
            </span>
          </div>
          <button className="signout-button" onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <span>Student Management</span>
          <span className="status-label"><i /> Workspace ready</span>
        </header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}
