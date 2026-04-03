const authButton = document.getElementById("authButton");
const authModal = document.getElementById("authModal");
const authOverlay = document.getElementById("authOverlay");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

function updateAuthButton() {
  if (!authButton) return;
  authButton.textContent = getToken() ? "Signed in" : "Sign in";
}

function openAuthModal() {
  if (!authModal) return;
  authModal.classList.add("is-open");
}

function closeAuthModal() {
  if (!authModal) return;
  authModal.classList.remove("is-open");
}

authButton?.addEventListener("click", () => {
  if (getToken()) {
    clearToken();
    updateAuthButton();
    showToast("Signed out");
    return;
  }

  openAuthModal();
});

authOverlay?.addEventListener("click", closeAuthModal);

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (loginError) loginError.textContent = "";

  const email = document.getElementById("loginEmail")?.value || "";
  const password = document.getElementById("loginPassword")?.value || "";

  try {
    const result = await apiFetch("/api/login", {
      method: "POST",
      body: { email, password }
    });

    setToken(result.token);
    updateAuthButton();
    closeAuthModal();
    showToast("Signed in");
  } catch (err) {
    if (loginError) {
      loginError.textContent = err.message || "Unable to sign in";
    } else {
      showToast(err.message || "Unable to sign in");
    }
  }
});

window.addEventListener("load", updateAuthButton);
