function setToken(token) {
  localStorage.setItem("token", token);
}

function showToast(msg) {
  alert(msg);
}

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` })
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "API error");
  }

  return res.json();
}