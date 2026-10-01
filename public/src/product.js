
const P = "https://whitelevel-api.bayazidzaman.workers.dev/api/v1";
let T = null,
  k = null,
  _ = 1;
async function D() {
  let e = window.__PRODUCT_SLUG__ || null;
  if (!e) {
    const l = window.location.pathname.replace(/\/$/, "").split("/");
    ((e = l[l.length - 1]),
      (e === "product.html" || e === "product" || e === "") &&
        (e = new URLSearchParams(window.location.search).get("slug")));
  }
  if (!e) {
    document.getElementById("productContainer").innerHTML = `
            <div class="error-page-container">
                <i class="ph-bold ph-warning-circle error-icon"></i>
                <h1 class="error-title">Product Not Found</h1>
                <p class="error-desc">We couldn't find the product you're looking for.</p>
                <a href="/" class="error-btn">Return Home</a>
            </div>
        `;
    return;
  }
  const c = document.getElementById("productContainer");
  c &&
    (c.innerHTML = `
            <div class="product-detail-skeleton">
                <div>
                    <div class="sk-gallery"></div>
                    <div class="sk-thumbs">
                        <div class="sk-thumb"></div>
                        <div class="sk-thumb"></div>
                        <div class="sk-thumb"></div>
                        <div class="sk-thumb"></div>
                    </div>
                </div>
                <div class="sk-details">
                    <div class="sk-d-line sk-d-title"></div>
                    <div class="sk-d-line sk-d-subtitle"></div>
                    <div class="sk-d-line sk-d-price"></div>
                    <div class="sk-d-line sk-d-text-sm" style="width:100%;"></div>
                    <div class="sk-d-line sk-d-text-sm" style="width:90%;"></div>
                    <div class="sk-d-line sk-d-text-sm" style="width:70%;"></div>
                    <div class="sk-d-line sk-d-text-sm" style="width:50%;margin-top:0.5rem;"></div>
                    <div class="sk-d-line sk-d-btn"></div>
                    <div class="sk-d-line sk-d-btn"></div>
                </div>
            </div>
        `);
  try {
    const l = await fetch(`${P}/products/${e}`);
    if (!l.ok) throw new Error("Product not found");
    const m = await l.json();
    if (m.success && m.data && m.data.product)
      ((T = m.data.product),
        m.data.variants &&
          m.data.variants.length > 0 &&
          (T.variants = m.data.variants),
        m.data.reviews && (T.reviews = m.data.reviews));
    else throw new Error("Product not found in data");
    ((document.title = `${T.title} - Kothbel.com`), N(T));
  } catch (l) {
    (console.error(l),
      (document.getElementById("productContainer").innerHTML = `
            <div class="error-page-container">
                <i class="ph-bold ph-warning-circle error-icon"></i>
                <h1 class="error-title">Error Loading Product</h1>
                <p class="error-desc">There was a problem loading the product details.</p>
                <a href="/" class="error-btn">Return Home</a>
            </div>
        `));
  }
}
function N(e) {
  const c = document.getElementById("productContainer"),
    l = e.category || "General";
  let E = `
        <div class="breadcrumb-nav">
            <a href="/"><i class="ph-fill ph-house"></i></a>
            <span class="breadcrumb-separator"><i class="ph-bold ph-caret-right"></i></span>
            <a href="/category/${l.toLowerCase().replace(/\s+/g, "-")}">${l}</a>
            <span class="breadcrumb-separator"><i class="ph-bold ph-caret-right"></i></span>
            <span style="color:#9CA3AF; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${e.title}</span>
        </div>
    `;
  const p =
    e.images && e.images.length > 0
      ? e.images
      : ["https://placehold.co/600x600/E5E7EB/A1A1AA?text=No+Image"];
  let n = "";
  p.length === 1
    ? (n = `
            <div class="product-gallery" id="productGallery">
                <div class="pg-viewport">
                    <div class="pg-track">
                        <div class="pg-slide"><img src="${p[0]}" style="width:100%; height:100%; object-fit:contain; background:#fff;"></div>
                    </div>
                </div>
            </div>
        `)
    : (n = `
            <div class="product-gallery" id="productGallery">
                <div class="pg-viewport" id="pgViewport">
                    <div class="pg-track" id="pgTrack">
                        <!-- Cloned last slide for infinite loop -->
                        <div class="pg-slide"><img src="${p[p.length - 1]}" loading="lazy"></div>
                        <!-- Actual slides -->
                        ${p.map((t) => `<div class="pg-slide"><img src="${t}" loading="lazy"></div>`).join("")}
                        <!-- Cloned first slide for infinite loop -->
                        <div class="pg-slide"><img src="${p[0]}" loading="lazy"></div>
                    </div>
                    <div class="pg-dots" id="pgDots">
                        ${p.map((t, o) => `<div class="pg-dot ${o === 0 ? "active" : ""}"></div>`).join("")}
                    </div>
                    <button class="pg-arrow pg-prev" type="button" id="pgPrev">&#10094;</button>
                    <button class="pg-arrow pg-next" type="button" id="pgNext">&#10095;</button>
                </div>
            </div>
        `);
  let d = "";
  if (e.original_price > e.base_price) {
    const t = Math.round(
      ((e.original_price - e.base_price) / e.original_price) * 100,
    );
    d = `
           <span class="current-price" id="displayPrice">৳${e.base_price}</span> 
           <span class="original-price" id="displayOrigPrice" style="text-decoration: line-through; color: #9CA3AF;">৳${e.original_price}</span>
           <span class="discount-badge" id="displayDiscount">${t}% OFF</span>
        `;
  } else
    d = `<span class="current-price" id="displayPrice">৳${e.base_price}</span>`;
  let h = "";
  if (((e.isVariantBulkMode = !1), e.variants && e.variants.length > 0)) {
    const t = (a) => {
        if (!a.options) return {};
        if (typeof a.options == "string")
          try {
            return JSON.parse(a.options);
          } catch {
            return {};
          }
        return a.options || {};
      },
      o = t(e.variants[0]),
      r = Object.keys(o);
    if (e.is_variant_bulk_mode && r.length >= 2) {
      e.isVariantBulkMode = !0;
      const a =
          r.find((s) =>
            ["color", "colour", "rong", "colour", "রঙ"].includes(
              s.toLowerCase(),
            ),
          ) || r[0],
        i = r.find((s) => s !== a) || r[1],
        v = [...new Set(e.variants.map((s) => t(s)[a]).filter(Boolean))],
        f = [...new Set(e.variants.map((s) => t(s)[i]).filter(Boolean))],
        u = v
          .map((s) => {
            const y = f
              .map((b) => {
                const L = e.variants.find((A) => {
                    const S = t(A);
                    return S[a] === s && S[i] === b;
                  }),
                  I = L ? L.price : e.base_price,
                  B = L ? (L.is_unlimited_stock ? 9999 : L.stock) : 0,
                  M = B <= 0,
                  C = L ? e.variants.indexOf(L) : -1;
                return `<span class="mv-size-btn${M ? " mv-size-oos" : ""}" data-idx="${C}" data-colour="${s}" data-size="${b}" data-max="${B}" data-price="${I}">${b}</span>`;
              })
              .join("");
            return `
                <div class="mv-combo-row mv-row-inactive" data-colour="${s}">
                    <label class="mv-row-check-label">
                        <input type="checkbox" class="mv-row-checkbox" value="${s}">
                        <span class="mv-row-colour">${s}</span>
                    </label>
                    <div class="mv-size-group">${y}</div>
                    <div class="mv-qty-ctrl mv-qty-hidden">
                        <button type="button" class="mv-btn mv-decrease">-</button>
                        <input type="number" class="mv-qty-input" value="1" min="1" max="9999">
                        <button type="button" class="mv-btn mv-increase">+</button>
                    </div>
                </div>`;
          })
          .join("");
      h = `
                <div class="form-group" style="margin-top:1.5rem;" id="variantsContainer">
                    <label style="font-weight:600; margin-bottom:0.5rem; display:block;">Select ${a} &amp; ${i}</label>
                    <div class="mv-combo-list" id="mvComboList">${u}</div>
                    <div id="mvSummary" style="display:none; justify-content:space-between; align-items:center; margin-top:0.75rem; padding:0.65rem 1rem; background:#FFF7ED; border-radius:8px; border:1px solid #FED7AA; font-weight:600; color:#9A3412;"></div>
                </div>`;
    } else if (!e.is_variant_bulk_mode && r.length > 0) {
      const a = {};
      r.forEach((v) => {
        a[v] = [...new Set(e.variants.map((f) => t(f)[v]).filter(Boolean))];
      });
      let i = "";
      (r.forEach((v) => {
        const f = a[v];
        i += `
                    <div class="variant-option-group" data-key="${v}" style="margin-bottom:1rem;">
                        <div style="font-size:0.88rem; font-weight:600; color:#374151; margin-bottom:0.5rem;">
                            ${v}: <span class="selected-option-label" id="selected-${v}" style="color:#FF6B35; font-weight:700;"></span>
                        </div>
                        <div class="variant-chip-list">
                            ${f
                              .map((u) => {
                                const s = e.variants.find((b) => t(b)[v] === u);
                                return `<div class="variant-chip option-btn${s && !s.is_unlimited_stock && s.stock <= 0 ? " oos" : ""}" data-key="${v}" data-val="${u}">${u}</div>`;
                              })
                              .join("")}
                        </div>
                    </div>`;
      }),
        (h = `
                <div class="form-group" style="margin-top:1.5rem;" id="variantsContainer">
                    ${i}
                </div>`));
    } else
      h = `
                <div class="form-group" style="margin-top:1.5rem;" id="variantsContainer">
                    <div style="font-size:0.88rem; font-weight:600; color:#374151; margin-bottom:0.5rem;">Select Option:</div>
                    <div class="variant-chip-list" id="variantSelector">
                        ${e.variants.map((a, i) => `<div class="variant-chip${a.stock <= 0 && !a.is_unlimited_stock ? " oos" : ""}" data-idx="${i}">${a.name}</div>`).join("")}
                    </div>
                </div>`;
  }
  const g = `
        <div class="product-info-sections">
            <div class="info-section-row">
                <i class="ph-bold ph-truck info-section-icon"></i>
                <div class="info-section-content">
                    <span class="info-section-label">Delivery</span>
                    <span class="info-section-value">Inside Dhaka ৳70, Outside ৳120</span>
                </div>
            </div>
            <div class="info-section-row">
                <i class="ph-bold ph-money info-section-icon"></i>
                <div class="info-section-content">
                    <span class="info-section-label">Payment</span>
                    <span class="info-section-value">Cash on Delivery Available</span>
                </div>
            </div>
            <div class="info-section-row">
                <i class="ph-bold ph-arrow-u-up-left info-section-icon"></i>
                <div class="info-section-content">
                    <span class="info-section-label">Return</span>
                    <span class="info-section-value">7 Days Easy Return</span>
                </div>
            </div>
        </div>
    `;
  ((c.innerHTML = `
        <div class="product-page">
            ${E}
            <div class="product-layout">
                ${n}
                <div class="product-details">
                    <h1 class="product-title">${e.title}</h1>
                
                <div class="product-meta-info">
                    ${e.sku ? `<div class="meta-badge"><strong>SKU:</strong> ${e.sku}</div>` : ""}
                    ${e.brand ? `<div class="meta-badge"><strong>Brand:</strong> ${e.brand}</div>` : ""}
                    <div class="stock-badge ${e.stock > 0 || e.is_unlimited_stock ? "in-stock" : "out-of-stock"}" id="displayStock">
                        ${e.stock > 0 || e.is_unlimited_stock ? "✓ In Stock" : "✕ Out of Stock"}
                    </div>
                </div>

                <div class="product-price-container">
                    <div class="product-price">${d}</div>
                </div>

                ${h}

                <div class="quantity-selector" id="mainQtySelector" style="${e.isVariantBulkMode ? "display:none;" : ""}">
                    <span>Quantity</span>
                    <div class="quantity-controls">
                        <button type="button" class="qty-btn" id="btnQtyMinus">-</button>
                        <input type="number" class="qty-input" id="inputQty" value="1" min="1" max="99">
                        <button type="button" class="qty-btn" id="btnQtyPlus">+</button>
                    </div>
                </div>

                <div class="product-actions-grid">
                    <button type="button" class="btn btn-secondary-blue" id="btnBuyNowPc">
                        Buy Now
                    </button>
                    <button type="button" class="btn btn-primary-orange" id="btnAddToCartPc">
                        <i class="ph-bold ph-shopping-cart" style="margin-right: 8px;"></i> Add to Cart
                    </button>
                </div>

                ${g}
            </div>
        </div>

        <div class="product-description-container">
            <h2 style="margin-bottom: 1rem; font-size: 1.25rem;">Product Details</h2>
            <div style="line-height: 1.8;">
                ${e.description ? e.description.replace(/\n/g, "<br>") : "No description available."}
            </div>
        </div>

        <div class="product-reviews-container" id="daraz-review-container" style="margin-top: 2rem; background: var(--bg-color); padding: 1.5rem; border-radius: var(--radius-lg); box-shadow: var(--shadow);">
            <!-- ReviewEngine will populate this -->
            <div style="text-align:center; padding: 2rem; color: #6b7280;">Loading reviews...</div>
        </div>

        <div class="related-products-container" style="margin-top: 2rem;">
            <h2 style="margin-bottom: 1rem; font-size: 1.25rem;">You Might Also Like</h2>
            <div class="product-grid" id="relatedProductsGrid">
                <!-- Fetching... -->
            </div>
        </div>

        <!-- Mobile Sticky Footer -->
        <div class="sticky-product-bar">
            <button type="button" class="sticky-btn sticky-buy" id="btnBuyNowMobile">Buy Now</button>
            <button type="button" class="sticky-btn sticky-cart" id="btnAddToCartMobile">Add to Cart</button>
        </div>
    `),
    p.length > 1 && H(p.length),
    F(e),
    window.reviewEngine.init(e.id, e.slug, e.reviews || []),
    R(e.category, e.slug));
}
async function R(e, c) {
  const l = document.getElementById("relatedProductsGrid");
  if (l) {
    l.innerHTML = "";
    for (let m = 0; m < 4; m++)
      l.innerHTML += `
            <div class="product-card-skeleton">
                <div class="sk-image"></div>
                <div class="sk-info">
                    <div class="sk-title-1"></div>
                    <div class="sk-title-2"></div>
                    <div class="sk-price"></div>
                </div>
            </div>
        `;
    try {
      let m = [];
      const E = sessionStorage.getItem("kothbel_products");
      if (E) m = JSON.parse(E);
      else {
        const g = await fetch(`${P}/products`);
        if (!g.ok) throw new Error("API Error");
        const t = await g.json();
        t.success &&
          t.data &&
          t.data.products &&
          ((m = t.data.products),
          sessionStorage.setItem("kothbel_products", JSON.stringify(m)));
      }
      let p = m.filter((g) => g.slug !== c);
      if (
        (e &&
          p.sort((g, t) => {
            const o = g.category === e,
              r = t.category === e;
            return o === r ? 0 : o ? -1 : 1;
          }),
        p.length === 0)
      ) {
        l.innerHTML =
          '<p style="text-align:center; grid-column:1/-1; padding:2rem; color:#888;">No related products found.</p>';
        return;
      }
      const n = 8;
      let d = 0;
      l.innerHTML = "";
      const h = () => {
        const g = p.slice(d, d + n);
        if (g.length === 0) return !1;
        const t = g
          .map((o) => {
            const r =
              o.images && o.images.length > 0
                ? o.images[0]
                : "https://placehold.co/400x400/E5E7EB/A1A1AA?text=No+Image";
            let a = "";
            if (o.original_price > o.base_price) {
              const i = Math.round(
                ((o.original_price - o.base_price) / o.original_price) * 100,
              );
              a = `
                        <span class="home-current-price">৳${o.base_price}</span> 
                        <span class="home-original-price" style="display:inline-block;">৳${o.original_price}</span>
                        <span class="home-discount-badge" style="display:inline-block;">${i}% OFF</span>
                    `;
            } else
              a = `<span class="home-current-price">৳${o.base_price}</span>`;
            return `
                <div class="product-card">
                    <a href="/product/${o.slug}" class="full-link"></a>
                    <div class="product-image">
                        <div class="img-skeleton-wrap">
                            <img src="${r}" alt="${o.title}" loading="lazy"
                                 onload="this.closest('.img-skeleton-wrap').classList.add('loaded')"
                                 onerror="this.closest('.img-skeleton-wrap').classList.add('loaded')">
                        </div>
                    </div>
                    <div class="product-info">
                        <h3 class="product-title"><a href="/product/${o.slug}">${o.title}</a></h3>
                        <div class="product-price-home">${a}</div>
                    </div>
                </div>`;
          })
          .join("");
        return (l.insertAdjacentHTML("beforeend", t), (d += n), d < p.length);
      };
      if ((h(), p.length > n)) {
        const g = document.createElement("div");
        ((g.style.cssText =
          "height:60px;display:flex;align-items:center;justify-content:center;grid-column:1/-1;"),
          (g.innerHTML =
            "<div id='relatedSpinner' style='display:none;flex-direction:column;align-items:center;gap:8px;'><div style='width:28px;height:28px;border:3px solid #eee;border-top-color:var(--primary-color);border-radius:50%;animation:spin 0.75s linear infinite;'></div></div>"),
          l.appendChild(g));
        let t = !1;
        const o = new IntersectionObserver(
          (r) => {
            if (!r[0].isIntersecting || t) return;
            t = !0;
            const a = document.getElementById("relatedSpinner");
            (a && (a.style.display = "flex"),
              setTimeout(() => {
                const i = h();
                (a && (a.style.display = "none"),
                  i ? l.appendChild(g) : (o.disconnect(), g.remove()),
                  (t = !1));
              }, 300));
          },
          { rootMargin: "150px" },
        );
        o.observe(g);
      }
    } catch (m) {
      (console.error(m),
        (l.innerHTML =
          '<p style="text-align:center; grid-column:1/-1; color:red;">Failed to load related products.</p>'));
    }
  }
}
function F(e) {
  var m, E, p, n;
  const c = document.getElementById("inputQty");
  if (
    (document.getElementById("btnQtyMinus").addEventListener("click", () => {
      let d = parseInt(c.value) || 1;
      (d > 1 && (c.value = d - 1), (_ = parseInt(c.value)));
    }),
    document.getElementById("btnQtyPlus").addEventListener("click", () => {
      let d = parseInt(c.value) || 1,
        h = k ? k.stock : e.stock;
      ((e.is_unlimited_stock || (k && k.is_unlimited_stock)) && (h = 999),
        d < h && (c.value = d + 1),
        (_ = parseInt(c.value)));
    }),
    c.addEventListener("change", () => {
      let d = parseInt(c.value) || 1,
        h = k ? k.stock : e.stock;
      ((e.is_unlimited_stock || (k && k.is_unlimited_stock)) && (h = 999),
        d < 1 && (d = 1),
        d > h && (d = h),
        (c.value = d),
        (_ = d));
    }),
    e.is_variant_bulk_mode && e.variants && e.variants.length > 0)
  ) {
    const d = document.getElementById("mvComboList");
    if (d && e.isVariantBulkMode) {
      const h = d.querySelectorAll(".mv-combo-row"),
        g = () => {
          let t = 0,
            o = 0;
          h.forEach((a) => {
            const i = a.querySelector(".mv-row-checkbox");
            if (i && i.checked) {
              const v = Array.from(a.querySelectorAll(".mv-size-btn")).find(
                (f) => f.classList.contains("mv-size-selected"),
              );
              if (v) {
                const f = parseInt(a.querySelector(".mv-qty-input").value) || 1,
                  u = parseInt(v.dataset.price) || e.base_price;
                ((t += f), (o += f * u));
              }
            }
          });
          const r = document.getElementById("mvSummary");
          r &&
            (t > 0
              ? ((r.innerHTML = `<span>মোট: ${t} টি</span> <span style="font-size: 1.1em;">৳${o}</span>`),
                (r.style.display = "flex"))
              : (r.style.display = "none"));
        };
      (h.forEach((t) => {
        const o = t.querySelector(".mv-row-checkbox"),
          r = t.querySelectorAll(".mv-size-btn"),
          a = t.querySelector(".mv-qty-ctrl"),
          i = t.querySelector(".mv-qty-input"),
          v = t.querySelector(".mv-increase"),
          f = t.querySelector(".mv-decrease"),
          u = () => {
            const s = o.checked,
              y = Array.from(r).find((b) =>
                b.classList.contains("mv-size-selected"),
              );
            (s
              ? (t.classList.remove("mv-row-inactive"),
                y
                  ? (a.classList.remove("mv-qty-hidden"),
                    (i.max = y.dataset.max))
                  : a.classList.add("mv-qty-hidden"))
              : (t.classList.add("mv-row-inactive"),
                a.classList.add("mv-qty-hidden")),
              g());
          };
        (o.addEventListener("change", u),
          r.forEach((s) => {
            s.addEventListener("click", () => {
              if (
                t.classList.contains("mv-row-inactive") ||
                s.classList.contains("mv-size-oos")
              )
                return;
              (r.forEach((b) => b.classList.remove("mv-size-selected")),
                s.classList.add("mv-size-selected"));
              const y = parseInt(s.dataset.idx);
              if (y >= 0 && e.variants[y]) {
                const b = e.variants[y];
                if (b.image_url && window.pgGoTo) {
                  const L = (e.images || []).indexOf(b.image_url);
                  L > -1 && window.pgGoTo(L);
                }
              }
              u();
            });
          }),
          v.addEventListener("click", () => {
            let s = parseInt(i.value) || 1;
            const y = parseInt(i.max) || 9999;
            (s < y && (i.value = s + 1), g());
          }),
          f.addEventListener("click", () => {
            let s = parseInt(i.value) || 1;
            (s > 1 && (i.value = s - 1), g());
          }));
      }),
        g());
    }
  }
  if (!e.is_variant_bulk_mode && e.variants && e.variants.length > 0) {
    const d = (t) => {
        if (!t.options) return {};
        if (typeof t.options == "string")
          try {
            return JSON.parse(t.options);
          } catch {
            return {};
          }
        return t.options || {};
      },
      h = d(e.variants[0]),
      g = Object.keys(h);
    if (g.length > 0) {
      const t = {},
        o = document.getElementById("variantsContainer"),
        r = () =>
          e.variants.find((i) => {
            const v = d(i);
            return g.every((f) => !t[f] || v[f] === t[f]);
          }) || null,
        a = (i) => {
          k = i;
          const v = document.getElementById("displayPrice"),
            f = document.getElementById("displayOrigPrice"),
            u = document.getElementById("displayDiscount"),
            s = document.getElementById("displayStock");
          if (i) {
            if (
              (v && (v.textContent = `৳${i.price}`),
              f &&
                (i.original_price > i.price
                  ? ((f.textContent = `৳${i.original_price}`),
                    (f.style.display = "inline-block"),
                    u &&
                      ((u.textContent = `${Math.round(((i.original_price - i.price) / i.original_price) * 100)}% OFF`),
                      (u.style.display = "inline-block")))
                  : ((f.style.display = "none"),
                    u && (u.style.display = "none"))),
              s &&
                (i.stock > 0 || i.is_unlimited_stock
                  ? ((s.className = "stock-badge in-stock"),
                    (s.textContent = "✓ In Stock"))
                  : ((s.className = "stock-badge out-of-stock"),
                    (s.textContent = "✕ Out of Stock"))),
              i.image_url && window.pgGoTo)
            ) {
              const y = (e.images || []).indexOf(i.image_url);
              y > -1 && window.pgGoTo(y);
            }
            ((c.value = 1), (_ = 1));
          }
        };
      o &&
        o.addEventListener("click", (i) => {
          const v = i.target.closest(".option-btn");
          if (!v || v.classList.contains("oos")) return;
          const f = v.dataset.key,
            u = v.dataset.val;
          (o
            .querySelectorAll(`.option-btn[data-key="${f}"]`)
            .forEach((b) => b.classList.remove("active")),
            v.classList.add("active"));
          const s = document.getElementById(`selected-${f}`);
          (s && (s.textContent = u), (t[f] = u));
          const y = r();
          y && a(y);
        });
    } else {
      const t = document.querySelectorAll(".variant-chip:not(.oos)");
      t.forEach((o) => {
        o.addEventListener("click", () => {
          (t.forEach((i) => i.classList.remove("active")),
            o.classList.add("active"));
          const r = parseInt(o.dataset.idx);
          k = e.variants[r];
          const a = document.getElementById("displayPrice");
          (a && k && (a.textContent = `৳${k.price}`), (c.value = 1), (_ = 1));
        });
      });
    }
  }
  const l = (d) => {
    if (e.isVariantBulkMode && e.variants && e.variants.length > 0) {
      const r = document.getElementById("mvComboList"),
        a = [],
        i = r.querySelectorAll(".mv-combo-row");
      let v = !1,
        f = [];
      if (
        (i.forEach((u) => {
          if (u.querySelector(".mv-row-checkbox").checked) {
            v = !0;
            const y = Array.from(u.querySelectorAll(".mv-size-btn")).find((b) =>
              b.classList.contains("mv-size-selected"),
            );
            if (!y) f.push(u.dataset.colour);
            else {
              const b = parseInt(u.querySelector(".mv-qty-input").value) || 1,
                L = parseInt(y.dataset.idx),
                I = e.variants[L];
              let B =
                I && I.image_url
                  ? I.image_url
                  : e.images && e.images.length > 0
                    ? e.images[0]
                    : "https://placehold.co/400";
              a.push({
                slug: e.slug,
                variantId: I.id || I.name,
                title: e.title,
                price: I.price,
                image: B,
                quantity: b,
                variantName: I.name,
                sku: I.sku || e.sku,
              });
            }
          }
        }),
        f.length > 0)
      ) {
        (r.classList.remove("shake"),
          r.offsetWidth,
          r.classList.add("shake"),
          setTimeout(() => r.classList.remove("shake"), 500),
          showToast(`For "${f.join(", ")}", please select a Size.`, "error"));
        return;
      }
      if (!v || a.length === 0) {
        (r.classList.remove("shake"),
          r.offsetWidth,
          r.classList.add("shake"),
          setTimeout(() => r.classList.remove("shake"), 500),
          showToast("Please check a Color and select a Size.", "error"));
        return;
      }
      if (d === "cart")
        a.forEach((u) => {
          window.addToCart &&
            window.addToCart(
              u.slug,
              e.title,
              u.price,
              u.image,
              u.quantity,
              u.variantName,
              u.sku,
            );
        });
      else if (d === "buy" && window.openCheckoutDirectly) {
        const u = a.map((s) => ({
          id: s.slug,
          title: e.title,
          price: s.price,
          image: s.image,
          quantity: s.quantity,
          variant: s.variantName,
          sku: s.sku,
        }));
        window.openCheckoutDirectly(u);
      }
      return;
    } else if (e.variants && e.variants.length > 0 && !k) {
      const r = document.getElementById("variantsContainer");
      (r &&
        (r.classList.remove("shake"),
        r.offsetWidth,
        r.classList.add("shake"),
        setTimeout(() => r.classList.remove("shake"), 500),
        r.scrollIntoView({ behavior: "smooth", block: "center" })),
        showToast("Please select your options.", "error"));
      return;
    }
    let h = e.id,
      g = k ? k.price : e.base_price,
      t = k ? k.name : null,
      o =
        k && k.image_url
          ? k.image_url
          : e.images && e.images.length > 0
            ? e.images[0]
            : "https://placehold.co/400";
    d === "cart"
      ? window.addToCart
        ? window.addToCart(h, e.title, g, o, _, t, (k && k.sku) || e.sku)
        : console.error("window.addToCart is not defined!")
      : window.openCheckoutDirectly &&
        window.openCheckoutDirectly({
          id: h,
          title: e.title,
          price: g,
          image: o,
          quantity: _,
          variant: t,
          sku: (k && k.sku) || e.sku,
        });
  };
  ((m = document.getElementById("btnAddToCartPc")) == null ||
    m.addEventListener("click", () => l("cart")),
    (E = document.getElementById("btnAddToCartMobile")) == null ||
      E.addEventListener("click", () => l("cart")),
    (p = document.getElementById("btnBuyNowPc")) == null ||
      p.addEventListener("click", () => l("buy")),
    (n = document.getElementById("btnBuyNowMobile")) == null ||
      n.addEventListener("click", () => l("buy")));
}
document.addEventListener("DOMContentLoaded", D);
function H(e) {
  const c = document.getElementById("pgViewport"),
    l = document.getElementById("pgTrack"),
    m = document.getElementById("pgDots"),
    E = document.getElementById("pgPrev"),
    p = document.getElementById("pgNext");
  if (!c || !l) return;
  let n = 1,
    d = !1,
    h;
  const g = Array.from(m.children);
  let t = !1,
    o = 0,
    r = 0,
    a = 0,
    i = 0,
    v,
    f = 0,
    u;
  const s = () => c.getBoundingClientRect().width,
    y = (w, x) => {
      const $ = s(),
        z = `translate3d(${-w * $}px, 0, 0)`;
      if (l.style.transform === z && x) {
        d = !1;
        return;
      }
      ((d = x),
        (l.style.transition = x
          ? "transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1)"
          : "none"),
        (l.style.transform = z),
        (i = -w * $),
        (a = i));
    },
    b = () => {
      const w = (n - 1 + e) % e;
      g.forEach((x, $) => x.classList.toggle("active", $ === w));
    };
  (setTimeout(() => {
    (y(n, !1), b());
  }, 50),
    window.addEventListener("resize", () => y(n, !1)),
    l.addEventListener("transitionend", () => {
      (n === 0 && ((n = e), y(n, !1)),
        n === e + 1 && ((n = 1), y(n, !1)),
        (d = !1),
        b());
    }));
  const L = () => {
      d || (n++, b(), y(n, !0));
    },
    I = () => {
      d || (n--, b(), y(n, !0));
    };
  (p.addEventListener("click", () => {
    (L(), q());
  }),
    E.addEventListener("click", () => {
      (I(), q());
    }),
    g.forEach((w, x) => {
      w.addEventListener("click", () => {
        d || ((n = x + 1), b(), y(n, !0), q());
      });
    }));
  function B(w) {
    ((t = !0),
      (u = void 0),
      (f = Date.now()),
      w.type === "mousedown"
        ? ((o = w.pageX), (c.style.cursor = "grabbing"))
        : ((o = w.touches[0].clientX), (r = w.touches[0].clientY)),
      clearInterval(h),
      (l.style.transition = "none"),
      n === 0 && ((n = e), y(n, !1)),
      n === e + 1 && ((n = 1), y(n, !1)),
      (i = -n * s()),
      (a = i),
      (v = requestAnimationFrame(A)));
  }
  function M(w) {
    if (!t) return;
    let x;
    if (w.type === "mousemove") ((x = w.pageX), (a = i + (x - o)));
    else {
      x = w.touches[0].clientX;
      const $ = w.touches[0].clientY,
        z = o - x,
        O = r - $;
      if ((typeof u > "u" && (u = Math.abs(O) > Math.abs(z)), u)) {
        t = !1;
        return;
      }
      (w.cancelable && w.preventDefault(), (a = i + (x - o)));
    }
  }
  function C() {
    if (!t) return;
    ((t = !1), cancelAnimationFrame(v), (c.style.cursor = "grab"));
    const w = a - i,
      x = Date.now() - f,
      $ = s();
    (w < -$ * 0.2 || (w < -20 && x < 300)
      ? n++
      : (w > $ * 0.2 || (w > 20 && x < 300)) && n--,
      y(n, !0),
      b(),
      S());
  }
  function A() {
    t &&
      ((l.style.transform = `translate3d(${a}px, 0, 0)`),
      requestAnimationFrame(A));
  }
  (c.addEventListener("mousedown", B),
    c.addEventListener("mousemove", M),
    c.addEventListener("mouseup", C),
    c.addEventListener("mouseleave", C),
    c.addEventListener("touchstart", B, { passive: !0 }),
    c.addEventListener("touchmove", M, { passive: !1 }),
    c.addEventListener("touchend", C));
  const S = () => {
      h = setInterval(L, 5e3);
    },
    q = () => {
      (clearInterval(h), S());
    };
  (S(),
    (window.pgGoTo = (w) => {
      ((n = w + 1), b(), y(n, !0), q());
    }));
}
class j {
  constructor() {
    ((this.productId = null), (this.productSlug = null), (this.reviews = []));
  }
  getRating() {
    const c = document.querySelectorAll(".star-rating-input span.active");
    return c.length > 0 ? c.length : 0;
  }
  openModal() {
    (this.createModal(),
      document.getElementById("reviewModalOverlay").classList.add("active"));
  }
  async init(c, l, m) {
    ((this.productId = c),
      (this.productSlug = l),
      (this.reviews = m || []),
      this.renderDarazReviewSection());
  }
  renderDarazReviewSection() {
    const c = document.getElementById("daraz-review-container");
    if (!c) return;
    let l = `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e5e7eb; padding-bottom:10px; margin-bottom:15px;">
                <h2 style="margin:0; font-size:1.25rem;">Ratings & Reviews</h2>
                <button type="button" onclick="window.reviewEngine.openModal()" style="background:none; border:none; color:#FF6B35; font-weight:600; cursor:pointer;">Write Review</button>
            </div>
        `;
    if (this.reviews.length === 0)
      l +=
        '<div style="text-align:center; padding: 2rem; color: #6b7280;">No reviews yet. Be the first to review!</div>';
    else {
      const E = (
        this.reviews.reduce((p, n) => p + n.rating, 0) / this.reviews.length
      ).toFixed(1);
      ((l += `
                <div style="display:flex; gap:20px; align-items:center; margin-bottom:20px; background:#f9fafb; padding:15px; border-radius:8px;">
                    <div style="text-align:center;">
                        <div style="font-size:3rem; font-weight:700; color:#1f2937; line-height:1;">${E}</div>
                        <div style="font-size:0.9rem; color:#6b7280;">out of 5</div>
                    </div>
                    <div>
                        <div style="color:#f59e0b; font-size:1.2rem;">${"★".repeat(Math.round(E))}${"☆".repeat(5 - Math.round(E))}</div>
                        <div style="font-size:0.85rem; color:#6b7280; margin-top:4px;">Based on ${this.reviews.length} reviews</div>
                    </div>
                </div>
                <div class="review-list" style="display:flex; flex-direction:column; gap:15px;">
            `),
        this.reviews.forEach((p) => {
          const n = new Date(p.created_at).toLocaleDateString();
          l += `
                    <div style="border-bottom:1px solid #eee; padding-bottom:15px;">
                        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
                            <div>
                                <div style="color:#f59e0b; font-size:1rem; margin-bottom:4px;">${"★".repeat(p.rating)}${"☆".repeat(5 - p.rating)}</div>
                                <div style="font-size:0.9rem; font-weight:600; color:#374151;">
                                    ${p.reviewer_name}
                                    ${p.verified ? '<span style="color:#10b981; font-size:0.75rem; margin-left:5px; font-weight:normal;"><i class="ph-fill ph-check-circle"></i> Verified Purchase</span>' : ""}
                                </div>
                            </div>
                            <div style="font-size:0.8rem; color:#9ca3af;">${n}</div>
                        </div>
                        <div style="font-size:0.95rem; color:#4b5563; line-height:1.5;">${p.body || ""}</div>
                    </div>
                `;
        }),
        (l += "</div>"));
    }
    c.innerHTML = l;
  }
  createModal() {
    if (document.getElementById("reviewModalOverlay")) return;
    const c = document.createElement("div");
    ((c.className = "review-modal-overlay"),
      (c.id = "reviewModalOverlay"),
      (c.innerHTML = `
            <div class="review-modal-box">
                <div class="review-modal-header">
                    <h3>Write a Review</h3>
                    <button class="review-modal-close" onclick="window.reviewEngine.closeModal()">&times;</button>
                </div>
                <div class="review-modal-body">
                    <div style="margin-bottom: 1rem;">
                        <label>Your Rating</label>
                        <div class="star-rating-input" id="starRatingInput">
                            <span data-val="1">★</span><span data-val="2">★</span><span data-val="3">★</span><span data-val="4">★</span><span data-val="5">★</span>
                        </div>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label>Review Description</label>
                        <textarea id="reviewDescInput" rows="4" placeholder="What did you like or dislike about this product?"></textarea>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label>Your Name</label>
                        <input type="text" id="reviewNameInput" placeholder="John Doe">
                    </div>
                    <button type="button" class="btn btn-primary-orange" style="width:100%;" id="btnSubmitReview" onclick="window.reviewEngine.submitReview()">Submit Review</button>
                </div>
            </div>
        `),
      document.body.appendChild(c));
    const l = document.querySelectorAll(".star-rating-input span");
    l.forEach((m) => {
      m.addEventListener("click", (E) => {
        const p = parseInt(E.target.dataset.val);
        l.forEach((n) => {
          parseInt(n.dataset.val) <= p
            ? (n.classList.add("active"), (n.style.color = "#f59e0b"))
            : (n.classList.remove("active"), (n.style.color = "#e5e7eb"));
        });
      });
    });
  }
  closeModal() {
    document.getElementById("reviewModalOverlay").classList.remove("active");
  }
  async submitReview() {
    const c = this.getRating(),
      l = document.getElementById("reviewDescInput").value,
      m = document.getElementById("reviewNameInput").value;
    if (c === 0) {
      alert("Please select a star rating.");
      return;
    }
    if (!m) {
      alert("Please enter your name.");
      return;
    }
    const E = document.getElementById("btnSubmitReview"),
      p = E.textContent;
    ((E.textContent = "Submitting..."), (E.disabled = !0));
    try {
      const d = await (
        await fetch(`${P}/products/${this.productSlug}/reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: c, reviewer_name: m, review_body: l }),
        })
      ).json();
      d.success
        ? (alert(
            "Thank you for your review! It will be visible after moderation.",
          ),
          this.closeModal(),
          (document.getElementById("reviewDescInput").value = ""),
          (document.getElementById("reviewNameInput").value = ""),
          document.querySelectorAll(".star-rating-input span").forEach((h) => {
            (h.classList.remove("active"), (h.style.color = "#e5e7eb"));
          }))
        : alert(d.message || "Failed to submit review");
    } catch {
      alert("Error submitting review");
    } finally {
      ((E.textContent = p), (E.disabled = !1));
    }
  }
}
window.reviewEngine = new j();
