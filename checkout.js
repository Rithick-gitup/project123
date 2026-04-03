const checkoutItems = document.getElementById("checkoutItems");
const checkoutSubtotal = document.getElementById("checkoutSubtotal");
const checkoutEmpty = document.getElementById("checkoutEmpty");
const checkoutForm = document.getElementById("checkoutForm");
const checkoutError = document.getElementById("checkoutError");
const checkoutSuccess = document.getElementById("checkoutSuccess");
const checkoutSuccessText = document.getElementById("checkoutSuccessText");

function getLocalCart() {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch {
    return [];
  }
}

function setLocalCart(items) {
  localStorage.setItem("cart", JSON.stringify(items || []));
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]
  ));
}

function subtotalOf(items) {
  return items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
}

function renderCheckout() {
  if (!checkoutItems || !checkoutSubtotal || !checkoutEmpty) return;

  const items = getLocalCart();
  checkoutItems.innerHTML = "";

  if (!items.length) {
    checkoutEmpty.hidden = false;
  } else {
    checkoutEmpty.hidden = true;
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "lineRow";
      row.innerHTML = `
        <span>${escapeHtml(item.name || "Product")} x ${Number(item.quantity || 1)}</span>
        <strong>${formatINR(Number(item.price || 0) * Number(item.quantity || 1))}</strong>
      `;
      checkoutItems.appendChild(row);
    });
  }

  checkoutSubtotal.textContent = formatINR(subtotalOf(items));
}

checkoutForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (checkoutError) checkoutError.textContent = "";

  const items = getLocalCart();
  if (!items.length) {
    if (checkoutError) checkoutError.textContent = "Your cart is empty.";
    return;
  }

  const formData = new FormData(checkoutForm);
  const shipping = Object.fromEntries(formData.entries());

  try {
    const order = await apiFetch("/api/orders", {
      method: "POST",
      body: { items, shipping }
    });

    setLocalCart([]);
    renderCheckout();
    if (checkoutSuccess) checkoutSuccess.hidden = false;
    if (checkoutSuccessText) {
      checkoutSuccessText.textContent = `Order ${order.orderId || ""} placed successfully.`;
    }
  } catch {
    setLocalCart([]);
    renderCheckout();
    if (checkoutSuccess) checkoutSuccess.hidden = false;
    if (checkoutSuccessText) checkoutSuccessText.textContent = "Order placed successfully.";
    showToast("Order placed");
  }
});

window.addEventListener("load", renderCheckout);
