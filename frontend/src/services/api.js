const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function apiRequest(path, options = {}) {
  const token = sessionStorage.getItem("access_token");
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error("Could not reach the API gateway. Check that it is running.");
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    const detail = typeof data === "object" && data !== null ? data.detail : "";
    throw new Error(detail || `Request failed (${response.status})`);
  }
  return data;
}

export const authApi = {
  register: (data) =>
    apiRequest("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data) =>
    apiRequest("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: () => apiRequest("/auth/me"),
};

export const studentApi = {
  list: (search = "") =>
    apiRequest(`/students${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  get: (id) => apiRequest(`/students/${id}`),
  create: (data) =>
    apiRequest("/students", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/students/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id) => apiRequest(`/students/${id}`, { method: "DELETE" }),
};

export const courseApi = {
  list: () => apiRequest("/courses"),
  get: (id) => apiRequest(`/courses/${id}`),
  create: (data) =>
    apiRequest("/courses", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/courses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id) => apiRequest(`/courses/${id}`, { method: "DELETE" }),
  enroll: (courseId, studentId) =>
    apiRequest(`/courses/${courseId}/students/${studentId}`, { method: "POST" }),
  unenroll: (courseId, studentId) =>
    apiRequest(`/courses/${courseId}/students/${studentId}`, { method: "DELETE" }),
};
