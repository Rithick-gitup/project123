const wishlistGrid = document.getElementById("wishlistGrid");
const wishlistEmpty = document.getElementById("wishlistEmpty");

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]
  ));
}

function getWishlistIds() {
  return JSON.parse(localStorage.getItem("wishlistIds") || "[]");
}

function getCatalog() {
  return JSON.parse(localStorage.getItem("catalogCache") || "[]");
}

function renderWishlist() {
  if (!wishlistGrid || !wishlistEmpty) return;

  const ids = new Set(getWishlistIds().map(String));
  const items = getCatalog().filter((product) => ids.has(String(product.id || product._id)));
  wishlistGrid.innerHTML = "";
  wishlistEmpty.hidden = items.length !== 0;

  items.forEach((product) => {
    const card = document.createElement("article");
    card.className = "productCard";
    card.innerHTML = `
      <img src="${product.imageUrl}" alt="${escapeHtml(product.name)}" />
      <h3>${escapeHtml(product.name)}</h3>
      <p>${formatINR(product.price)}</p>
      <button data-add-product-id="${product.id || product._id}">Add to Bag</button>
    `;
    wishlistGrid.appendChild(card);
  });
}

wishlistGrid?.addEventListener("click", async (event) => {
  const btn = event.target.closest("[data-add-product-id]");
  if (!btn) return;
  await window.addToCart(btn.getAttribute("data-add-product-id"), 1);
});

window.addEventListener("load", renderWishlist);
