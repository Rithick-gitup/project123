function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch {
    return [];
  }
}

function setCart(items) {
  localStorage.setItem("cart", JSON.stringify(items || []));
}

function getCartCount(items) {
  return (items || []).reduce((sum, i) => sum + Number(i.quantity || 1), 0);
}

function getCartTotal(items) {
  return (items || []).reduce((sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 1), 0);
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const cartCountBadge = document.getElementById("cartCountBadge");
  const cartTotalStrong = document.getElementById("cartTotalStrong");
  if (!cartItems || !cartCountBadge || !cartTotalStrong) return;

  const items = getCart();
  cartCountBadge.textContent = String(getCartCount(items));
  cartTotalStrong.textContent = formatINR(getCartTotal(items));

  cartItems.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "lineRow";
    row.innerHTML = `
      <span>${item.name || "Product"}</span>
      <div class="qtyRow">
        <button type="button" data-cart-action="dec" data-cart-id="${item.productId}">-</button>
        <strong>${item.quantity || 1}</strong>
        <button type="button" data-cart-action="inc" data-cart-id="${item.productId}">+</button>
        <button type="button" data-cart-action="remove" data-cart-id="${item.productId}">x</button>
      </div>
      <strong>${formatINR((item.price || 0) * (item.quantity || 1))}</strong>
    `;
    cartItems.appendChild(row);
  });
}

window.addToCart = async function addToCart(productId, quantity) {
  try {
    let selected = window.getProductById ? window.getProductById(productId) : null;
    if (!selected) {
      const cached = JSON.parse(localStorage.getItem("catalogCache") || "[]");
      selected = cached.find((p) => String(p.id || p._id) === String(productId));
    }
    if (!selected) throw new Error("Product not found");

    const items = getCart();
    const existing = items.find((i) => String(i.productId) === String(productId));
    if (existing) {
      existing.quantity = Number(existing.quantity || 0) + Number(quantity || 1);
    } else {
      items.push({
        productId: selected._id || selected.id,
        name: selected.name,
        price: selected.price,
        quantity: Number(quantity || 1)
      });
    }

    setCart(items);
    renderCart();
    if (typeof showToast === "function") showToast("Added to cart");
  } catch (err) {
    if (typeof showToast === "function") showToast(err.message || "Failed to add");
  }
};

window.addEventListener("load", () => {
  const cartDrawer = document.getElementById("cartDrawer");
  const openCartBtn = document.getElementById("openCartBtn");
  const closeCartBtn = document.getElementById("closeCartBtn");
  const cartOverlay = document.getElementById("cartOverlay");
  const goToCheckoutBtn = document.getElementById("goToCheckoutBtn");
  const cartItems = document.getElementById("cartItems");

  openCartBtn?.addEventListener("click", () => cartDrawer?.classList.add("is-open"));
  closeCartBtn?.addEventListener("click", () => cartDrawer?.classList.remove("is-open"));
  cartOverlay?.addEventListener("click", () => cartDrawer?.classList.remove("is-open"));
  goToCheckoutBtn?.addEventListener("click", () => {
    window.location.href = "/checkout";
  });
  cartItems?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cart-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-cart-action");
    const id = btn.getAttribute("data-cart-id");
    const items = getCart();
    const idx = items.findIndex((i) => String(i.productId) === String(id));
    if (idx < 0) return;

    if (action === "inc") items[idx].quantity = Number(items[idx].quantity || 1) + 1;
    if (action === "dec") items[idx].quantity = Math.max(1, Number(items[idx].quantity || 1) - 1);
    if (action === "remove") items.splice(idx, 1);
    setCart(items);
    renderCart();
  });

  renderCart();
});