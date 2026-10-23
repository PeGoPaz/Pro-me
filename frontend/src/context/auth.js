import { createContext, useContext } from "react";

/* The session context and its hook, kept apart from AuthProvider.jsx: Vite's
   Fast Refresh only hot-swaps a file that exports nothing but components. */
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}
