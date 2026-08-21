const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

export const api = {
  venues: (params = {}) => request(`/venues?${new URLSearchParams(params)}`),
  venue: (id) => request(`/venues/${id}`),
  availability: (id, date) => request(`/venues/${id}/availability?${new URLSearchParams({ date })}`),
  requestAvailability: (body) => request("/availability-request", { method: "POST", body: JSON.stringify(body) }),
  requestOtp: (body) => request("/auth/request-otp", { method: "POST", body: JSON.stringify(body) }),
  verifyOtp: (body) => request("/auth/verify-otp", { method: "POST", body: JSON.stringify(body) }),
  me: (token) => request("/auth/me", { headers: { Authorization: `Bearer ${token}` } }),
  profile: (token) => request("/profile", { headers: { Authorization: `Bearer ${token}` } }),
  createHold: (token, body) => request("/holds", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) }),
  createBooking: (token, body) => request("/bookings", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) }),
  createEnquiry: (body) => request("/enquiries", { method: "POST", body: JSON.stringify(body) }),
  wedding: (token) => request("/weddings", { headers: { Authorization: `Bearer ${token}` } }),
  estimates: (token) => request("/estimates", { headers: { Authorization: `Bearer ${token}` } }),
  budgetEstimate: (token, body) => request("/budget-estimate", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
};
