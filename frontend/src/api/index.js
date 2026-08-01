import axios from "axios";

/*
 * Centralised axios instance.
 * withCredentials: true → sends the session cookie (pro.me.sid) on every request.
 * The Vite dev-server proxy forwards /api/* to http://localhost:9000.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

export default api;
