const heroBg = document.getElementById("heroBg");
const shopNowBtn = document.getElementById("shopNowBtn");
const productGrid = document.getElementById("productGrid");
const emptyState = document.getElementById("emptyState");
const filterChips = document.querySelectorAll(".filterChip");
const navButtons = document.querySelectorAll(".nav__button");
const searchInput = document.getElementById("searchInput");
const heroDots = document.getElementById("heroDots");
const wishlistCountBadge = document.getElementById("wishlistCountBadge");
const trendingTrack = document.getElementById("trendingTrack");
const trendPrev = document.getElementById("trendPrev");
const trendNext = document.getElementById("trendNext");

const heroSlides = [
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1464863979621-258859e62245?q=80&w=1600&auto=format&fit=crop"
];

let heroIndex = 0;
let allProducts = [];
let activeCategory = "All";
let searchTerm = "";
let wishlist = new Set(JSON.parse(localStorage.getItem("wishlistIds") || "[]"));
let trendOffset = 0;

function renderProductSkeleton(count = 8) {
  if (!productGrid) return;
  productGrid.innerHTML = "";
  for (let i = 0; i < count; i += 1) {
    const el = document.createElement("article");
    el.className = "productCard skeletonCard";
    el.innerHTML = `
      <div class="skeleton skeletonImage"></div>
      <div class="skeleton skeletonLine"></div>
      <div class="skeleton skeletonLine short"></div>
      <div class="skeleton skeletonBtn"></div>
    `;
    productGrid.appendChild(el);
  }
}

function setHeroImage() {
  if (!heroBg) return;
  heroBg.style.backgroundImage = `url("${heroSlides[heroIndex]}")`;
  if (heroDots) {
    heroDots.innerHTML = heroSlides
      .map((_, i) => `<button class="dot ${i === heroIndex ? "is-active" : ""}" data-dot-index="${i}" type="button"></button>`)
      .join("");
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m])
  );
}

function productCardHtml(product) {
  const price = Number(product.price || 0);
  const rating = Number(product.rating || 4.3).toFixed(1);
  const productId = String(product._id || product.id);
  const liked = wishlist.has(productId);

  return `
    <article class="productCard">
      <img src="${product.imageUrl}" alt="${escapeHtml(product.name)}" />
      <div class="ratingBadge">★ ${rating}</div>
      <button class="wishBtn ${liked ? "is-liked" : ""}" data-wish-product-id="${productId}" type="button">❤</button>
      <h3>${escapeHtml(product.name)}</h3>
      <p>${formatINR(price)}</p>
      <button data-add-product-id="${productId}">Add to Bag</button>
    </article>
  `;
}

function updateWishlistBadge() {
  if (wishlistCountBadge) wishlistCountBadge.textContent = String(wishlist.size);
}

function saveWishlist() {
  localStorage.setItem("wishlistIds", JSON.stringify([...wishlist]));
  updateWishlistBadge();
}

function normalizeCategory(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (value.startsWith("men")) return "Men";
  if (value.startsWith("women") || value.startsWith("woman") || value.startsWith("lad")) return "Women";
  if (value.startsWith("kid") || value.startsWith("boy") || value.startsWith("girl")) return "Kids";
  return "All";
}

function fallbackProducts() {
  return [
    { id: "m1", name: "Men Regular Fit Shirt", price: 1299, category: "Men", rating: 4.4, imageUrl: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=900&auto=format&fit=crop" },
    { id: "m2", name: "Men Casual Jacket", price: 2499, category: "Men", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?q=80&w=900&auto=format&fit=crop" },
    { id: "w1", name: "Women Elegant Dress", price: 1899, category: "Women", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=900&auto=format&fit=crop" },
    { id: "w2", name: "Women Oversized Hoodie", price: 1599, category: "Women", rating: 4.3, imageUrl: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=900&auto=format&fit=crop" },
    { id: "k1", name: "Kids Printed Tee", price: 699, category: "Kids", rating: 4.2, imageUrl: "https://images.unsplash.com/photo-1519238367310-5e70f7b8de0b?q=80&w=900&auto=format&fit=crop" },
    { id: "k2", name: "Kids Party Dress", price: 999, category: "Kids", rating: 4.4, imageUrl: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=900&auto=format&fit=crop" }
  ];
}

async function fetchProducts() {
  try {
    const json = await apiFetch("/api/products");
    const products = Array.isArray(json) ? json : (json.products || []);
    const mapped = products.map((product) => ({
      ...product,
      id: product.id || product._id,
      imageUrl: product.imageUrl || product.image || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=900&auto=format&fit=crop",
      category: normalizeCategory(product.category),
      rating: product.rating || (3.8 + Math.random())
    }));
    return mapped.length ? mapped : fallbackProducts();
  } catch (err) {
    console.error("Fetch error:", err);
    return fallbackProducts();
  }
}

function setActiveFilter(category) {
  navButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.category === category));
  filterChips.forEach((chip) => chip.classList.toggle("is-active", chip.dataset.category === category));
}

function filteredProducts() {
  return allProducts.filter((product) => {
    const matchCategory = activeCategory === "All" || product.category === activeCategory;
    const matchSearch = !searchTerm || product.name.toLowerCase().includes(searchTerm);
    return matchCategory && matchSearch;
  });
}

function renderProducts() {
  if (!productGrid) return;
  productGrid.innerHTML = "";
  if (emptyState) emptyState.hidden = true;

  const products = filteredProducts();
  if (products.length === 0) {
    if (emptyState) emptyState.hidden = false;
    return;
  }

  products.forEach((product) => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = productCardHtml(product);
    productGrid.appendChild(wrapper.firstElementChild);
  });
}

function renderTrending() {
  if (!trendingTrack) return;
  const picks = allProducts.slice(0, 8);
  trendingTrack.innerHTML = picks.map((product) => {
    const productId = String(product._id || product.id);
    return `
      <article class="trendCard">
        <img src="${product.imageUrl}" alt="${escapeHtml(product.name)}" />
        <div class="trendCard__meta">
          <h4>${escapeHtml(product.name)}</h4>
          <p>${formatINR(product.price)}</p>
          <button data-add-product-id="${productId}">Add to Bag</button>
        </div>
      </article>
    `;
  }).join("");

  trendingTrack.style.transform = `translateX(-${trendOffset * 266}px)`;
}

function wireProductAdd() {
  if (!productGrid) return;

  productGrid.addEventListener("click", async (event) => {
    const wishBtn = event.target.closest("[data-wish-product-id]");
    if (wishBtn) {
      const id = String(wishBtn.getAttribute("data-wish-product-id"));
      if (wishlist.has(id)) {
        wishlist.delete(id);
      } else {
        wishlist.add(id);
      }
      saveWishlist();
      renderProducts();
      return;
    }

    const addBtn = event.target.closest("[data-add-product-id]");
    if (!addBtn) return;
    await window.addToCart(addBtn.getAttribute("data-add-product-id"), 1);
  });

  trendingTrack?.addEventListener("click", async (event) => {
    const addBtn = event.target.closest("[data-add-product-id]");
    if (!addBtn) return;
    await window.addToCart(addBtn.getAttribute("data-add-product-id"), 1);
  });
}

function wireFilters() {
  filterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      activeCategory = chip.dataset.category;
      setActiveFilter(activeCategory);
      renderProducts();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.category;
      setActiveFilter(activeCategory);
      renderProducts();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  shopNowBtn?.addEventListener("click", () => {
    activeCategory = "Men";
    document.querySelector('[data-category="Men"]')?.click();
    document.querySelector("main")?.scrollIntoView({ behavior: "smooth" });
  });

  searchInput?.addEventListener("input", (event) => {
    searchTerm = String(event.target.value || "").trim().toLowerCase();
    renderProducts();
  });

  trendPrev?.addEventListener("click", () => {
    trendOffset = Math.max(0, trendOffset - 1);
    if (trendingTrack) trendingTrack.style.transform = `translateX(-${trendOffset * 266}px)`;
  });

  trendNext?.addEventListener("click", () => {
    const maxOffset = Math.max(0, Math.min(4, allProducts.length - 4));
    trendOffset = Math.min(maxOffset, trendOffset + 1);
    if (trendingTrack) trendingTrack.style.transform = `translateX(-${trendOffset * 266}px)`;
  });

  heroDots?.addEventListener("click", (event) => {
    const dot = event.target.closest("[data-dot-index]");
    if (!dot) return;
    heroIndex = Number(dot.getAttribute("data-dot-index")) || 0;
    setHeroImage();
  });
}

window.addEventListener("load", async () => {
  try {
    renderProductSkeleton();
    setHeroImage();
    setInterval(() => {
      heroIndex = (heroIndex + 1) % heroSlides.length;
      setHeroImage();
    }, 3500);

    wireProductAdd();
    wireFilters();
    allProducts = await fetchProducts();
    localStorage.setItem("catalogCache", JSON.stringify(allProducts));
    window.getProductById = (id) => allProducts.find((product) => String(product.id || product._id) === String(id)) || null;
    updateWishlistBadge();
    renderTrending();
    setActiveFilter("All");
    renderProducts();
  } catch (err) {
    console.error("Init error:", err);
  }
});
