import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/index.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  /* loading stays true until the /me check resolves — prevents flash of "not logged in" UI */
  const [loading, setLoading] = useState(true);

  /* On first mount, restore session from the server cookie */
  useEffect(() => {
    api.get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  /* Returns the full user object on success, throws on failure */
  const login = async (email, password) => {
    await api.post("/auth/login", { email, password });
    /* Fetch the full profile so createdAt and all fields are available */
    const meRes = await api.get("/auth/me");
    setUser(meRes.data.user);
    return meRes.data.user;
  };

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    setUser(null);
  };

  const refreshUser = async () => {
    const meRes = await api.get("/auth/me");
    setUser(meRes.data.user);
    return meRes.data.user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
