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
  const ids = new Set(getWishlistIds().map(String));
  const items = getCatalog().filter((p) => ids.has(String(p.id || p._id)));
  wishlistGrid.innerHTML = "";
  wishlistEmpty.hidden = items.length !== 0;

  items.forEach((p) => {
    const card = document.createElement("article");
    card.className = "productCard";
    card.innerHTML = `
      <img src="${p.imageUrl}" alt="${escapeHtml(p.name)}" />
      <h3>${escapeHtml(p.name)}</h3>
      <p>${formatINR(p.price)}</p>
      <button data-add-product-id="${p.id || p._id}">Add to Bag</button>
    `;
    wishlistGrid.appendChild(card);
  });
}

wishlistGrid?.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-add-product-id]");
  if (!btn) return;
  await window.addToCart(btn.getAttribute("data-add-product-id"), 1);
});

window.addEventListener("load", renderWishlist);
