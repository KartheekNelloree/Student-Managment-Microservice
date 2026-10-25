import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem("access_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        sessionStorage.removeItem("access_token");
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function signIn(email, password) {
    const result = await authApi.login({ email, password });
    sessionStorage.setItem("access_token", result.access_token);
    setUser(result.user);
    setToken(result.access_token);
  }

  function signOut() {
    sessionStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: Boolean(token && user), signIn, signOut }),
    [user, loading, token],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
