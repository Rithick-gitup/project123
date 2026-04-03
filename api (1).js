const API_BASE = "";

function getToken() {
  return localStorage.getItem("token") || "";
}

function setToken(token) {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
}

function clearToken() {
  localStorage.removeItem("token");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, { method = "GET", body, headers = {} } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  let json = {};
  try {
    json = await res.json();
  } catch {
    json = {};
  }

  if (!res.ok) {
    const message = json.message || json.error || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return json;
}

function formatINR(amount) {
  const num = Number(amount || 0);
  return num.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  });
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = msg;
  toast.hidden = false;
  toast.classList.add("is-show");

  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.classList.remove("is-show");
    toast.hidden = true;
  }, 2600);
}