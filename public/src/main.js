import { f as ce, i as re } from "./checkout.js";
const G = "https://whitelevel-api.bayazidzaman.workers.dev/api/v1";
window.applyCoupon = async function () {
  const e = document.getElementById("coCouponCode"),
    t = document.getElementById("coCouponMsg"),
    o = document.getElementById("coCouponBtn");
  if (!e || !e.value.trim()) return;
  const n = e.value.trim(),
    r = f.reduce((s, c) => s + c.price * c.quantity, 0);
  ((o.disabled = !0),
    (o.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i>'),
    (t.textContent = ""));
  const a = document.getElementById("coSummary");
  a &&
    (a.innerHTML = `
            <div class="skeleton skeleton-text w-100 h-lg" style="margin-bottom: 1rem;"></div>
            <div class="skeleton skeleton-text w-75 h-lg" style="margin-bottom: 1rem;"></div>
            <div class="skeleton skeleton-text w-100 h-xl"></div>
        `);
  try {
    const c = await (
      await fetch(
        `${G}/coupons/validate?code=${encodeURIComponent(n)}&amount=${r}`,
      )
    ).json();
    c.success && c.data.valid
      ? ((b = c.data.coupon),
        (t.style.color = "#10B981"),
        (t.textContent = `Coupon applied! ৳${c.data.coupon.discount_amount} off.`),
        updateCheckoutTotals())
      : ((b = null),
        (t.style.color = "#EF4444"),
        (t.textContent = c.message || "Invalid coupon"),
        updateCheckoutTotals());
  } catch {
    ((t.style.color = "#EF4444"), (t.textContent = "Error checking coupon"));
  } finally {
    ((o.disabled = !1), (o.textContent = "Apply"));
  }
};
let f = JSON.parse(localStorage.getItem("kothbel_cart") || "[]"),
  S = [],
  p = {},
  b = null;
const _ = document.getElementById("productGrid"),
  Z = document.getElementById("cartBadgeCount"),
  N = document.getElementById("cartDrawer"),
  ee = document.getElementById("cartDrawerBody"),
  K = document.getElementById("cartDrawerFooter"),
  ne = document.getElementById("cartDrawerTotal"),
  P = document.getElementById("checkoutDrawer");
async function le() {
  (await ce(), re(), fe(), ye(), await de(), await me(), await ue());
}
async function de() {
  if (window.__PRELOADED_STATE__ && window.__PRELOADED_STATE__.settings) {
    ((p = window.__PRELOADED_STATE__.settings), te(p, !0));
    return;
  }
  const e = sessionStorage.getItem("kothbel_settings");
  if (e)
    try {
      ((p = JSON.parse(e)), te(p));
    } catch {}
  try {
    const t = await fetch(`${G}/settings`);
    if (t.ok) {
      const o = await t.json();
      o.success &&
        o.data &&
        o.data.settings &&
        ((p = o.data.settings),
        sessionStorage.setItem("kothbel_settings", JSON.stringify(p)),
        te(p));
    }
  } catch (t) {
    console.error("Failed to fetch settings", t);
  }
}
function te(e, t = !1) {
  if (e.footer) {
    const o = e.footer,
      n = document.getElementById("footerAbout"),
      r = document.getElementById("footerPhone"),
      a = document.getElementById("footerEmail"),
      s = document.getElementById("footerAddress"),
      c = document.getElementById("footerCopyright");
    (n &&
      (o.about
        ? (n.innerHTML = o.about.replace(/\n/g, "<br>"))
        : (n.innerHTML = "")),
      r &&
        (o.phone
          ? ((r.textContent = o.phone),
            (document.getElementById("footerPhoneWrapper").style.display =
              "block"))
          : (document.getElementById("footerPhoneWrapper").style.display =
              "none")),
      a &&
        (o.email
          ? ((a.textContent = o.email),
            (document.getElementById("footerEmailWrapper").style.display =
              "block"))
          : (document.getElementById("footerEmailWrapper").style.display =
              "none")),
      s &&
        (o.address
          ? ((s.textContent = o.address),
            (document.getElementById("footerAddressWrapper").style.display =
              "block"))
          : (document.getElementById("footerAddressWrapper").style.display =
              "none")),
      c && o.copyright && (c.textContent = o.copyright));
    const l = document.getElementById("footerLinks");
    l &&
      o.links &&
      o.links.length > 0 &&
      (l.innerHTML = o.links
        .map((d) => `<li><a href="${d.url}">${d.title}</a></li>`)
        .join(""));
  }
  if (e.delivery) {
    const o = document.getElementById("coOutsideFeeLabel"),
      n = document.getElementById("coInsideFeeLabel");
    (o && (o.textContent = `৳${e.delivery.outsideFee || 120}`),
      n && (n.textContent = `৳${e.delivery.insideFee || 70}`));
  }
  if ((e.layout && pe(e.layout, t), e.contact && e.contact.whatsapp)) {
    const o = document.getElementById("globalWaBtn");
    if (o) {
      let n = e.contact.whatsapp.replace(/\D/g, "");
      ((o.href = `https://wa.me/${n}`),
        window.location.pathname !== "/checkout" &&
          window.location.pathname !== "/thank-you" &&
          (o.style.display = "flex"));
    }
  }
}
async function ue() {
  if (window.__PRELOADED_STATE__ && window.__PRELOADED_STATE__.flashSale)
    return;
  const e = sessionStorage.getItem("kothbel_flash_sale");
  if (e)
    try {
      const t = JSON.parse(e);
      ie(t);
    } catch {}
  try {
    const t = await fetch(`${G}/products?flash_sale=true&limit=10`);
    if (t.ok) {
      const o = await t.json();
      o.success &&
        o.data &&
        o.data.products &&
        o.data.products.length > 0 &&
        (sessionStorage.setItem(
          "kothbel_flash_sale",
          JSON.stringify(o.data.products),
        ),
        ie(o.data.products));
    }
  } catch (t) {
    console.error("Failed to fetch flash sale", t);
  }
}
function ie(e) {
  if (window.flashSaleDisabled) return;
  const t = document.getElementById("flashSaleSection"),
    o = document.getElementById("flashSlider");
  !t ||
    !o ||
    ((t.style.display = "block"),
    (o.innerHTML = e
      .map((n) => {
        const r =
          n.images && n.images.length > 0
            ? n.images[0]
            : "https://placehold.co/400x400?text=No+Image";
        let a = `<span class="home-current-price">৳${n.base_price}</span>`;
        return (
          n.original_price > n.base_price &&
            (a = `<span class="home-current-price" style="font-size:1rem;">৳${n.base_price}</span> 
            <span class="home-original-price" style="display:inline; font-size:0.8rem; margin-left:4px;">৳${n.original_price}</span>`),
          `
        <div class="flash-card">
            <a href="/product/${n.slug}" class="full-link" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:10;"></a>
            <div style="aspect-ratio:1; background:#fff; position:relative; overflow:hidden;">
                <div class="img-skeleton-wrap" style="aspect-ratio:1;">
                    <img src="${r}" alt="${n.title}" loading="lazy" decoding="async"
                         style="width:100%; height:100%; object-fit:contain; pointer-events:auto;"
                         onload="this.closest('.img-skeleton-wrap').classList.add('loaded')"
                         onerror="this.closest('.img-skeleton-wrap').classList.add('loaded')">
                </div>
            </div>
            <div style="padding:8px; display:flex; flex-direction:column; flex:1;">
                <div style="font-size:0.8rem; font-weight:600; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${n.title}</div>
                <div style="margin-top:auto; padding-top:4px;">${a}</div>
            </div>
        </div>
        `
        );
      })
      .join("")));
}
async function me() {
  let t = new URLSearchParams(window.location.search).get("category");
  if (!t && window.location.pathname.startsWith("/category/")) {
    const a = window.location.pathname.split("/");
    t = decodeURIComponent(a[a.length - 1]);
  }
  let o = `${G}/products`,
    n = "kothbel_products",
    r = !0;
  if (t) {
    ((o += `?category=${encodeURIComponent(t)}`), (r = !1));
    const a = document.getElementById("pageTitle");
    a && (a.textContent = `${t} Products`);
  }
  if (!t && window.__PRELOADED_STATE__ && window.__PRELOADED_STATE__.products) {
    S = window.__PRELOADED_STATE__.products;
    return;
  }
  if (r) {
    const a = sessionStorage.getItem(n);
    if (a)
      try {
        ((S = JSON.parse(a)), se(S));
      } catch {}
  }
  if (_) {
    _.innerHTML = "";
    for (let a = 0; a < 8; a++)
      _.innerHTML += `
                <div class="product-card-skeleton">
                    <div class="sk-image"></div>
                    <div class="sk-info">
                        <div class="sk-title-1"></div>
                        <div class="sk-title-2"></div>
                        <div class="sk-price"></div>
                    </div>
                </div>
            `;
  }
  try {
    const a = await fetch(o);
    if (a.ok) {
      const s = await a.json();
      (s.success && s.data && s.data.products
        ? ((S = s.data.products),
          r && sessionStorage.setItem(n, JSON.stringify(S)))
        : (S = []),
        se(S));
    }
  } catch (a) {
    (console.error("Failed to fetch products", a),
      (!r || !sessionStorage.getItem(n)) &&
        _ &&
        (_.innerHTML =
          '<div style="text-align:center;width:100%;grid-column:1/-1;">Error loading products.</div>'));
  }
}
function se(e) {
  if (_) {
    if (e.length === 0) {
      _.innerHTML =
        '<div style="text-align:center;width:100%;grid-column:1/-1;">No products found.</div>';
      return;
    }
    _.innerHTML = e
      .map((t) => {
        const o =
          t.images && t.images.length > 0
            ? t.images[0]
            : "https://placehold.co/400x400/E5E7EB/A1A1AA?text=No+Image";
        let n = "";
        if (t.original_price > t.base_price) {
          const r = Math.round(
            ((t.original_price - t.base_price) / t.original_price) * 100,
          );
          n = `
                <span class="home-current-price">৳${t.base_price}</span> 
                <span class="home-original-price" style="display:inline-block;">৳${t.original_price}</span>
                <span class="home-discount-badge" style="display:inline-block;">${r}% OFF</span>
            `;
        } else n = `<span class="home-current-price">৳${t.base_price}</span>`;
        return `
        <div class="product-card">
            <a href="/product/${t.slug}" class="full-link"></a>
            <div class="product-image">
                <div class="img-skeleton-wrap" id="sk-${t.id}">
                    <img src="${o}" alt="${t.title}" loading="lazy" decoding="async"
                         onload="this.closest('.img-skeleton-wrap').classList.add('loaded')"
                         onerror="this.closest('.img-skeleton-wrap').classList.add('loaded')">
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-title"><a href="/product/${t.slug}">${t.title}</a></h3>
                <div class="product-price-home">${n}</div>
            </div>
        </div>
        `;
      })
      .join("");
  }
}
function pe(e, t = !1) {
  if (e.logo_url) {
    const s = document.getElementById("siteLogo");
    s &&
      !t &&
      (s.innerHTML = `<img src="${e.logo_url}" alt="Logo" style="height: 35px; width: auto; max-width: 150px; object-fit: contain;">`);
  }
  if (e.favicon_url) {
    let s = document.querySelector("link[rel~='icon']");
    (s ||
      ((s = document.createElement("link")),
      (s.rel = "icon"),
      document.head.appendChild(s)),
      (s.href = e.favicon_url));
  }
  const o = document.getElementById("mobile-menu-target"),
    n = document.getElementById("desktop-menu-target");
  if (e.menu && !t) {
    let s = "",
      c = null;
    (e.menu.forEach((l) => {
      l.title.startsWith("_")
        ? c &&
          c.sublinks.push({ title: l.title.substring(1).trim(), url: l.url })
        : (c && (s += ae(c)),
          (c = { title: l.title.trim(), url: l.url, sublinks: [] }));
    }),
      c && (s += ae(c)),
      o && (o.innerHTML = s),
      n && (n.innerHTML = s));
  }
  const r = document.getElementById("homeHeroBanner");
  if (r) {
    if (e.banners && e.banners.length > 0 && !t) {
      let s = "";
      ((s += `<div class="container">
                    <div class="hero-wrapper-full" style="width: 100%; display: block; margin-top: 15px; margin-bottom: 25px;">
                        <div class="splide hero-viewport" id="bannerSlider" style="border-radius: var(--slider-radius); overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); aspect-ratio: 1250/350; margin: 0 auto;">
                            <div class="splide__track" style="height: 100%;">
                                <ul class="splide__list" style="height: 100%;">
                                    ${e.banners
                                      .map(
                                        (c) => `
                                    <li class="splide__slide" style="height: 100%;">
                                        <a href="${c.url || "#"}" style="display: block; height: 100%;">
                                            <picture style="display: block; height: 100%;">
                                                <source media="(max-width: 768px)" srcset="${c.mobile_image_url || c.image_url}">
                                                <source media="(min-width: 769px)" srcset="${c.image_url}">
                                                <img src="${c.image_url}" class="banner-img" loading="lazy" decoding="async" style="width:100%; height:100%; object-fit:cover; display:block;">
                                            </picture>
                                        </a>
                                    </li>
                                    `,
                                      )
                                      .join("")}
                                </ul>
                            </div>
                            <div class="splide__arrows">
                                <button class="splide__arrow splide__arrow--prev hero-nav-btn nav-prev" style="opacity: 1; display: flex;">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="24" height="24"><path d="m15.5 0.932-4.3 4.38 14.5 14.6-14.5 14.5 4.3 4.4 14.6-14.6 4.4-4.3-4.4-4.4-14.6-14.6z" transform="matrix(-1 0 0 1 40 0)"></path></svg>
                                </button>
                                <button class="splide__arrow splide__arrow--next hero-nav-btn nav-next" style="opacity: 1; display: flex;">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="24" height="24"><path d="m15.5 0.932-4.3 4.38 14.5 14.6-14.5 14.5 4.3 4.4 14.6-14.6 4.4-4.3-4.4-4.4-14.6-14.6z"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`),
        (r.innerHTML = s));
    }
    e.banners &&
      e.banners.length > 0 &&
      window.Splide &&
      new Splide("#bannerSlider", {
        type: "loop",
        autoplay: !0,
        arrows: !0,
        pagination: !0,
        interval: 4e3,
        speed: 800,
        pauseOnHover: !0,
      }).mount();
  }
  const a = document.getElementById("homeCategories");
  if (a && p.home_categories && p.home_categories.length > 0 && !t) {
    let s = `
        <div class="container">
            <div class="category-section-wrapper">
                <span class="category-header">Categories</span>
                <div class="category-grid" id="categoryDynamicGrid">
                    ${p.home_categories
                      .map(
                        (c) => `
                    <a href="${(c.url || `/category/${c.slug}`).replace(/([^:])\/\//g, "$1/")}" class="category-item">
                        <div class="cat-img-box">
                            <img src="${c.image_url}" alt="${c.title}" loading="lazy">
                        </div>
                        <span class="cat-name">${c.title}</span>
                    </a>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        </div>`;
    a.innerHTML = s;
  }
  if (e.flash_sale) {
    const s = document.getElementById("flashSaleSection");
    s &&
      (e.flash_sale.enabled
        ? e.flash_sale.end_time && he(e.flash_sale.end_time)
        : ((s.style.display = "none"), (window.flashSaleDisabled = !0)));
  }
}
let Y;
function he(e) {
  const t = new Date(e).getTime();
  if (isNaN(t)) return;
  const o = document.getElementById("ftDays"),
    n = document.getElementById("ftHours"),
    r = document.getElementById("ftMins"),
    a = document.getElementById("ftSecs");
  o &&
    (Y && clearInterval(Y),
    (Y = setInterval(() => {
      const s = new Date().getTime(),
        c = t - s;
      if (c < 0) {
        (clearInterval(Y),
          (o.textContent = "00"),
          (n.textContent = "00"),
          (r.textContent = "00"),
          (a.textContent = "00"));
        return;
      }
      const l = Math.floor(c / (1e3 * 60 * 60 * 24)),
        d = Math.floor((c % (1e3 * 60 * 60 * 24)) / (1e3 * 60 * 60)),
        y = Math.floor((c % (1e3 * 60 * 60)) / (1e3 * 60)),
        w = Math.floor((c % (1e3 * 60)) / 1e3);
      ((o.textContent = l < 10 ? "0" + l : l),
        (n.textContent = d < 10 ? "0" + d : d),
        (r.textContent = y < 10 ? "0" + y : y),
        (a.textContent = w < 10 ? "0" + w : w));
    }, 1e3)));
}
function ae(e) {
  if (e.sublinks.length > 0) {
    let t = `<li class="menu-item-wrapper has-submenu" style="position:relative;">
            <a href="${e.url}" class="menu-link">${e.title} <i class="ph-bold ph-caret-down" style="float:right;"></i></a>
            <ul class="submenu" style="list-style:none; padding-left:1rem; margin-top:0.5rem;">`;
    return (
      e.sublinks.forEach((o) => {
        t += `<li style="margin-bottom:0.5rem;"><a href="${o.url}" style="color:#64748b; text-decoration:none;">${o.title}</a></li>`;
      }),
      (t += "</ul></li>"),
      t
    );
  } else
    return `<li class="menu-item-wrapper"><a href="${e.url}" class="menu-link">${e.title}</a></li>`;
}
window.addToCart = function (e, t, o, n, r = 1, a = null, s = null, c = !0) {
  const l = f.find((d) => d.id === e && d.variant === a);
  (l
    ? (l.quantity += r)
    : f.push({
        id: e,
        title: t,
        price: o,
        image: n,
        quantity: r,
        variant: a,
        sku: s,
      }),
    q(),
    B("Added to cart"),
    c && X());
};
function q() {
  (localStorage.setItem("kothbel_cart", JSON.stringify(f)), $());
}
function fe() {
  $();
}
function $() {
  const e = f.reduce((o, n) => o + n.quantity, 0);
  if (
    (Z && ((Z.textContent = e), (Z.style.display = e > 0 ? "flex" : "none")),
    !ee)
  )
    return;
  if (f.length === 0) {
    ((ee.innerHTML =
      '<div class="cart-drawer-empty"><p>Cart is empty</p></div>'),
      K && (K.style.display = "none"));
    return;
  }
  let t = 0;
  ((ee.innerHTML = f
    .map((o, n) => {
      const r = o.price * o.quantity;
      return (
        (t += r),
        `
        <div class="cart-item" style="display:flex; gap:10px; padding:10px; border-bottom:1px solid #eee;">
            <img src="${o.image}" loading="lazy" decoding="async" style="width:60px; height:60px; object-fit:cover; border-radius:4px;">
            <div style="flex:1;">
                <div style="font-weight:600; font-size:14px;">${o.title}</div>
                ${o.variant ? `<div style="font-size:12px; color:#666;">${o.variant}</div>` : ""}
                <div style="display:flex; justify-content:space-between; margin-top:5px; align-items:center;">
                    <div style="color:#FF6B35; font-weight:600;">৳${o.price}</div>
                    <div style="display:flex; align-items:center; border:1px solid #ddd; border-radius:4px;">
                        <button onclick="updateCartItem(${n}, -1)" style="padding:2px 8px;">-</button>
                        <span style="padding:2px 8px; font-size:14px;">${o.quantity}</span>
                        <button onclick="updateCartItem(${n}, 1)" style="padding:2px 8px;">+</button>
                    </div>
                </div>
            </div>
            <button onclick="removeFromCart(${n})" style="color:#ef4444; padding:5px;"><i class="ph-bold ph-trash"></i></button>
        </div>
        `
      );
    })
    .join("")),
    K && ((K.style.display = "block"), ne && (ne.textContent = `৳${t}`)));
}
window.updateCartItem = function (e, t) {
  if (f[e]) {
    if (t < 0 && f[e].quantity <= 1) return;
    ((f[e].quantity += t), q(), $());
  }
};
window.removeFromCart = function (e) {
  (f.splice(e, 1), q(), $());
};
window.checkoutCart = [];
window.checkoutSource = "cart";
function X() {
  (window.location.hash !== "#cart" &&
    history.pushState({ drawer: "cart" }, "", "#cart"),
    N && N.classList.add("open"),
    document.getElementById("drawerOverlay") &&
      document.getElementById("drawerOverlay").classList.add("show"),
    (document.body.style.overflow = "hidden"),
    document.body.classList.add("drawer-open"));
}
function J(e = !1) {
  if (!e && window.location.hash === "#cart") {
    history.back();
    return;
  }
  (N && N.classList.remove("open"),
    document.getElementById("drawerOverlay") &&
      document.getElementById("drawerOverlay").classList.remove("show"),
    (!P || !P.classList.contains("open")) &&
      ((document.body.style.overflow = ""),
      document.body.classList.remove("drawer-open")));
}
function W(e = "cart", t = null) {
  if (
    (J(!0),
    (window.checkoutSource = e),
    e === "buy_now" && t
      ? (window.checkoutCart = Array.isArray(t) ? [...t] : [t])
      : (window.checkoutCart = [...f]),
    window.checkoutCart.length === 0)
  ) {
    B("Cart is empty!");
    return;
  }
  (window.location.hash !== "#checkout" &&
    history.pushState({ drawer: "checkout" }, "", "#checkout"),
    P && P.classList.add("open"),
    (document.body.style.overflow = "hidden"),
    document.body.classList.add("drawer-open"));
  const o = JSON.parse(localStorage.getItem("kothbel_profile") || "{}"),
    n = document.getElementById("coForm");
  if (
    n &&
    o.name &&
    (n.elements.name && (n.elements.name.value = o.name),
    n.elements.phone && (n.elements.phone.value = o.phone || ""),
    n.elements.address && (n.elements.address.value = o.address || ""),
    o.city && o.thana)
  ) {
    const r = document.getElementById("coDistrict");
    r &&
      ((r.value = o.city),
      r.dispatchEvent(new Event("change", { bubbles: !0 })),
      setTimeout(() => {
        const a = document.getElementById("coThana");
        a &&
          ((a.value = o.thana),
          a.dispatchEvent(new Event("change", { bubbles: !0 })));
      }, 100));
  }
  (window.renderCheckoutItems
    ? window.renderCheckoutItems()
    : typeof Q == "function" && Q(),
    window.updateCheckoutTotals
      ? window.updateCheckoutTotals()
      : updateCheckoutTotals());
}
window.openCheckout = W;
window.openCheckoutDirectly = function (e) {
  W("buy_now", e);
};
function T(e = !1) {
  if (!e && window.location.hash === "#checkout") {
    history.back();
    return;
  }
  (P && P.classList.remove("open"),
    (!N || !N.classList.contains("open")) &&
      ((document.body.style.overflow = ""),
      document.body.classList.remove("drawer-open")));
}
window.goBackToCart = function () {
  window.location.hash === "#checkout"
    ? history.back()
    : (T(!0), window.checkoutSource === "cart" && X());
};
window.addEventListener("popstate", () => {
  const e = window.location.hash;
  e === ""
    ? (J(!0), T(!0))
    : e === "#cart"
      ? (T(!0), X())
      : e === "#checkout" && (J(!0), W(window.checkoutSource || "cart"));
});
window.updateCheckoutTotals = function () {
  const e = window.checkoutCart.reduce((M, h) => M + h.price * h.quantity, 0),
    t = document.querySelector('input[name="deliveryArea"]:checked'),
    o = t ? t.value : "outside";
  let n = 120;
  p.delivery &&
    (n = o === "inside" ? p.delivery.insideFee : p.delivery.outsideFee);
  let r = 0;
  b &&
    (b.type === "Fixed" ? (r = b.value) : (r = Math.round((e * b.value) / 100)),
    r > e && (r = e));
  const a = e + n - r,
    s = document.getElementById("coSubtotal"),
    c = document.getElementById("coShipping"),
    l = document.getElementById("coDiscount"),
    d = document.getElementById("coTotal"),
    y = document.getElementById("mPaySubtotal"),
    w = document.getElementById("mPayShipping"),
    m = document.getElementById("mPayDiscount"),
    E = document.getElementById("mPayTotal");
  (s && (s.textContent = `৳${e}`),
    y && (y.textContent = `৳${e}`),
    c && (c.textContent = `৳${n}`),
    w && (w.textContent = `৳${n}`),
    l &&
      (r > 0
        ? ((l.textContent = `-৳${r}`),
          (l.parentElement.style.display = "flex"),
          m &&
            ((m.textContent = `-৳${r}`),
            (m.parentElement.style.display = "flex")))
        : ((l.parentElement.style.display = "none"),
          m && (m.parentElement.style.display = "none"))),
    d && (d.textContent = `৳${a}`),
    E && (E.textContent = `৳${a}`));
  const g = document.getElementById("manualPayTotal");
  g && (g.textContent = `৳${a}`);
};
function Q() {
  const e = document.getElementById("coPackageList");
  if (e) {
    if (window.checkoutCart.length === 0) {
      e.innerHTML =
        '<div style="padding:1.5rem;text-align:center;color:#EF4444;">Cart is empty! <button type="button" onclick="closeCheckout()" style="background:none;border:none;color:#3B82F6;text-decoration:underline;cursor:pointer;">Go Shop</button></div>';
      return;
    }
    e.innerHTML = window.checkoutCart
      .map(
        (t, o) => `
        <div class="co-pkg-item">
            <img src="${t.image || "https://placehold.co/60?text=N/A"}" loading="lazy" decoding="async" class="co-pkg-img" onerror="this.src='https://placehold.co/60?text=Error'">
            <div class="co-pkg-details">
                <div class="co-pkg-title">${t.title}</div>
                ${t.variant ? `<div class="co-pkg-variant">${t.variant}</div>` : ""}
                <div class="co-pkg-price-row">
                    <div class="co-pkg-calc">৳${t.price} x ${t.quantity}</div>
                    <div class="co-pkg-total">৳${t.price * t.quantity}</div>
                </div>
                <div class="co-pkg-actions">
                    <div class="co-pkg-qty">
                        <button type="button" class="co-pkg-qty-btn" onclick="updateCheckoutItem(${o}, -1)">-</button>
                        <div class="co-pkg-qty-val">${t.quantity}</div>
                        <button type="button" class="co-pkg-qty-btn" onclick="updateCheckoutItem(${o}, 1)">+</button>
                    </div>
                    <button type="button" class="co-pkg-remove" onclick="removeCheckoutItem(${o})"><i class="ph-bold ph-x"></i> Remove</button>
                </div>
            </div>
        </div>
    `,
      )
      .join("");
  }
}
window.updateCheckoutItem = function (e, t) {
  if (window.checkoutCart[e]) {
    if (t < 0 && window.checkoutCart[e].quantity <= 1) return;
    ((window.checkoutCart[e].quantity += t),
      window.checkoutSource === "cart" &&
        ((f = [...window.checkoutCart]), q(), $()),
      window.checkoutCart.length === 0 ? T() : (Q(), updateCheckoutTotals()));
  }
};
window.removeCheckoutItem = function (e) {
  (window.checkoutCart.splice(e, 1),
    window.checkoutSource === "cart" &&
      ((f = [...window.checkoutCart]), q(), $()),
    window.checkoutCart.length === 0 ? T() : (Q(), updateCheckoutTotals()));
};
function F(e) {
  e &&
    (e.classList.remove("co-field-error"),
    e.offsetWidth,
    e.classList.add("co-field-error"),
    setTimeout(() => e.classList.remove("co-field-error"), 700));
}
async function ge(e) {
  var L, j, i, u, k, x, H, R, V, U, oe;
  if ((e.preventDefault(), window.checkoutCart.length === 0)) return;
  const t = e.target,
    o = new FormData(t),
    n = window.checkoutCart.reduce((v, O) => v + O.price * O.quantity, 0),
    r =
      ((L = document.querySelector('input[name="deliveryArea"]:checked')) ==
      null
        ? void 0
        : L.value) || "outside";
  let a = 120;
  p.delivery &&
    (a = r === "inside" ? p.delivery.insideFee : p.delivery.outsideFee);
  let s = 0,
    c = null;
  b &&
    ((c = b.code),
    b.type === "Fixed" ? (s = b.value) : (s = Math.round((n * b.value) / 100)),
    s > n && (s = n));
  const l = document.getElementById("coConfirmBtn"),
    d = document.getElementById("coGlobalError");
  (d && (d.style.display = "none"),
    l && ((l.disabled = !0), (l.innerHTML = "Processing...")));
  const y =
      ((j = document.querySelector('input[name="paymentMethod"]:checked')) ==
      null
        ? void 0
        : j.value) || "cod",
    w =
      y === "full"
        ? ((i = document.querySelector(
            'input[name="provider_full"]:checked',
          )) == null
            ? void 0
            : i.value) || "bKash"
        : null,
    m =
      ((u = document.getElementById("coSenderNumber")) == null
        ? void 0
        : u.value) || null,
    E =
      ((k = document.getElementById("coDistrict")) == null
        ? void 0
        : k.value) || "",
    g =
      ((x = document.getElementById("coThana")) == null ? void 0 : x.value) ||
      "",
    M = (o.get("name") || "").trim(),
    h = (o.get("phone") || "").trim(),
    D = (o.get("address") || "").trim();
  let A = !1;
  if (
    (M || (F(document.getElementById("coName")), (A = !0)),
    (!h || h.length < 11) && (F(document.getElementById("coPhone")), (A = !0)),
    D || (F(document.getElementById("coAddress")), (A = !0)),
    A)
  ) {
    (l && ((l.disabled = !1), (l.innerHTML = "Confirm Order")),
      B("দয়া করে নাম, ফোন এবং সম্পূর্ণ ঠিকানা পূরণ করুন।", "error"),
      (H = document.getElementById("coName")) == null ||
        H.scrollIntoView({ behavior: "smooth", block: "center" }));
    return;
  }
  if (!E || !g) {
    (E || F(document.getElementById("coDistrictSelect")),
      g || F(document.getElementById("coThanaSelect")),
      l && ((l.disabled = !1), (l.innerHTML = "Confirm Order")),
      B("দয়া করে District এবং Thana নির্বাচন করুন।", "error"),
      (R = document.getElementById("coDistrictSelect")) == null ||
        R.scrollIntoView({ behavior: "smooth", block: "center" }));
    return;
  }
  if (y === "full" && (!m || m.length < 11)) {
    (F(document.getElementById("coSenderNumber")),
      l && ((l.disabled = !1), (l.innerHTML = "Confirm Order")),
      B("পেমেন্টের সেন্ডার নম্বর দিন।", "error"),
      (V = document.getElementById("co-details-full")) == null ||
        V.scrollIntoView({ behavior: "smooth", block: "center" }));
    return;
  }
  const I = { name: M, phone: h, address: D, city: E, thana: g };
  localStorage.setItem("kothbel_profile", JSON.stringify(I));
  const z = {
      customer_name: I.name,
      phone: I.phone,
      email:
        ((U = document.getElementById("coEmail")) == null ? void 0 : U.value) ||
        null,
      address: I.address,
      city: E,
      thana: g,
      notes:
        ((oe = document.getElementById("coNotes")) == null
          ? void 0
          : oe.value) || null,
      delivery_area: r,
      subtotal: n,
      delivery_fee: a,
      discount_amount: s,
      coupon_code: c,
      payment_method: y,
      payment_provider: w,
      sender_number: m,
      items: window.checkoutCart.map((v) => ({
        product_id: v.id,
        title: v.title,
        variantName: v.variant,
        quantity: v.quantity,
        price: v.price,
        sku: v.sku,
      })),
      source: "storefront",
    },
    C = document.getElementById("coLoading");
  C && C.classList.add("show");
  try {
    const v = await fetch(`${G}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(z),
      }),
      O = await v.json();
    v.ok
      ? (localStorage.setItem(
          "kothbel_latest_order",
          JSON.stringify({ order_id: O.data.order_id, ...z }),
        ),
        (window.checkoutCart = []),
        window.checkoutSource === "cart" && ((f = []), q(), $()),
        B("Order confirmed! Redirecting..."),
        setTimeout(() => {
          window.location.href = `/thank-you?order_id=${O.data.order_id}`;
        }, 500))
      : (C && C.classList.remove("show"),
        B(
          O.message || "অর্ডার দেওয়া সম্ভব হয়নি। আবার চেষ্টা করুন।",
          "error",
        ));
  } catch {
    (C && C.classList.remove("show"),
      B("নেটওয়ার্ক সমস্যা। একটু পর আবার চেষ্টা করুন।", "error"));
  } finally {
    l && ((l.disabled = !1), (l.innerHTML = "Confirm Order"));
  }
}
function B(e, t = "success") {
  const o = document.getElementById("toast");
  o &&
    (t === "error"
      ? ((o.innerHTML = `<i class="ph-bold ph-warning-circle" style="color:#EF4444"></i> <span id="toastText">${e}</span>`),
        (o.style.borderLeftColor = "#EF4444"))
      : ((o.innerHTML = `<i class="ph-bold ph-check-circle" style="color:#10B981"></i> <span id="toastText">${e}</span>`),
        (o.style.borderLeftColor = "#10B981")),
    o.classList.add("show"),
    setTimeout(() => o.classList.remove("show"), 3500));
}
function ye() {
  const e = document.getElementById("cartIconTrigger"),
    t = document.getElementById("closeCartDrawer"),
    o = document.getElementById("cartCheckoutBtn"),
    n = document.getElementById("coBackBtn"),
    r = document.getElementById("coCloseBtn"),
    a = document.getElementById("drawerOverlay"),
    s = document.getElementById("coForm"),
    c = document.getElementById("coDeliveryArea"),
    l = document.getElementById("mobileMenuBtn"),
    d = document.getElementById("mobileNavDrawer"),
    y = document.getElementById("closeMobileNav");
  (l &&
    d &&
    l.addEventListener("click", () => {
      var i;
      (d.classList.add("open"),
        (i = document.getElementById("drawerOverlay")) == null ||
          i.classList.add("show"),
        document.body.classList.add("drawer-open"));
    }),
    y &&
      d &&
      y.addEventListener("click", () => {
        var i;
        (d.classList.remove("open"),
          (i = document.getElementById("drawerOverlay")) == null ||
            i.classList.remove("show"),
          document.body.classList.remove("drawer-open"));
      }),
    e && e.addEventListener("click", X),
    t && t.addEventListener("click", J),
    o && o.addEventListener("click", () => W("cart")),
    n && n.addEventListener("click", window.goBackToCart),
    r && r.addEventListener("click", T),
    a &&
      a.addEventListener("click", () => {
        var i, u;
        (J(),
          T(),
          (i = document.querySelector(".mobile-nav-wrapper")) == null ||
            i.classList.remove("open"),
          (u = document.getElementById("mobileNavDrawer")) == null ||
            u.classList.remove("open"),
          (document.body.style.overflow = ""),
          document.body.classList.remove("drawer-open"));
      }),
    s && s.addEventListener("submit", ge),
    c && c.addEventListener("change", updateCheckoutTotals));
  const w = document.getElementById("currentYear");
  w && (w.textContent = new Date().getFullYear());
  const m = document.getElementById("searchInput"),
    E = document.getElementById("searchGoBtn"),
    g = document.getElementById("fullSearchInput"),
    M = document.getElementById("searchSuggestionsList");
  let h = null;
  if (m) {
    const i = m.closest(".search-bar");
    i &&
      ((h = document.createElement("div")),
      (h.className = "desktop-search-suggestions"),
      i.appendChild(h),
      document.addEventListener("click", (u) => {
        i.contains(u.target) || h.classList.remove("active");
      }));
  }
  function D(i) {
    i && (window.location.href = `/search?q=${encodeURIComponent(i)}`);
  }
  function A(i) {
    const u =
      i.images && i.images.length > 0
        ? i.images[0]
        : "https://placehold.co/100x100/E5E7EB/A1A1AA?text=No+Image";
    let k = `<div class="search-suggestion-price">৳${i.base_price}</div>`;
    i.original_price > i.base_price &&
      (k = `
                <div class="search-suggestion-price">৳${i.base_price}</div>
                <div class="search-suggestion-original">৳${i.original_price}</div>
            `);
    const x =
      i.stock > 0 || i.is_unlimited_stock
        ? `<span style="color:#16a34a;">In Stock (${i.is_unlimited_stock ? "∞" : i.stock})</span>`
        : '<span style="color:#dc2626;">Out of Stock</span>';
    return `
            <a href="/product/${i.slug}" class="search-suggestion-item">
                <img src="${u}" class="search-suggestion-img" alt="${i.title}">
                <div class="search-suggestion-details">
                    <div class="search-suggestion-title">${i.title}</div>
                    <div class="search-suggestion-meta">SKU: ${i.sku || "N/A"} • ${i.category || "Uncategorized"}</div>
                    <div class="search-suggestion-prices">${k}</div>
                </div>
                <div class="search-suggestion-stock">${x}</div>
            </a>
        `;
  }
  let I = null;
  async function z(i, u, k = !1) {
    if (u) {
      if (((i = i.trim()), !i)) {
        (u.classList.remove("active"), (u.innerHTML = ""));
        return;
      }
      (u.classList.add("active"),
        (u.innerHTML = k
          ? '<li style="padding:15px;text-align:center;color:#64748b;">Searching...</li>'
          : '<div class="search-loading-text">Searching...</div>'));
      try {
        const H = await (
          await fetch(
            `https://whitelevel-api.bayazidzaman.workers.dev/api/v1/products?q=${encodeURIComponent(i)}&limit=5`,
          )
        ).json();
        if (H.success && H.data.products.length > 0) {
          const R = H.data.products
            .map((V) => {
              const U = A(V);
              return k ? `<li style="margin:0;padding:0;">${U}</li>` : U;
            })
            .join("");
          k
            ? (u.innerHTML = R)
            : (u.innerHTML =
                R +
                `
                        <div style="text-align:center; padding: 10px; border-top: 1px solid #e2e8f0; background: #f8fafc; border-radius: 0 0 8px 8px;">
                            <a href="/search?q=${encodeURIComponent(i)}" style="color:var(--primary-color); font-weight:600; text-decoration:none; font-size:0.9rem;">View All Results</a>
                        </div>
                    `);
        } else
          u.innerHTML = k
            ? '<li style="padding:15px;text-align:center;color:#64748b;">No products found</li>'
            : '<div class="search-loading-text">No products found</div>';
      } catch (x) {
        (console.error("Live search error", x),
          (u.innerHTML = k
            ? '<li style="padding:15px;text-align:center;color:red;">Error fetching results</li>'
            : '<div class="search-loading-text" style="color:red">Error fetching results</div>'));
      }
    }
  }
  E &&
    m &&
    (E.addEventListener("click", () => D(m.value.trim())),
    m.addEventListener("input", (i) => {
      (clearTimeout(I), (I = setTimeout(() => z(i.target.value, h, !1), 350)));
    }),
    m.addEventListener("keypress", (i) => {
      i.key === "Enter" && D(m.value.trim());
    }),
    m.addEventListener("focus", (i) => {
      i.target.value.trim() &&
        h &&
        h.innerHTML.trim() !== "" &&
        h.classList.add("active");
    }));
  const C = document.getElementById("mobileSearchTrigger"),
    L = document.getElementById("searchOverlay"),
    j = document.getElementById("searchOverlayCloseBtn");
  (C &&
    L &&
    C.addEventListener("click", () => {
      (L.classList.add("open"), g && setTimeout(() => g.focus(), 100));
    }),
    j &&
      L &&
      j.addEventListener("click", () => {
        L.classList.remove("open");
      }),
    g &&
      (g.addEventListener("input", (i) => {
        (clearTimeout(I),
          (I = setTimeout(() => z(i.target.value, M, !0), 350)));
      }),
      g.addEventListener("keypress", (i) => {
        i.key === "Enter" && D(g.value.trim());
      })),
    window.location.pathname === "/checkout" &&
      setTimeout(() => {
        W("cart");
      }, 100));
}
document.addEventListener("DOMContentLoaded", le);
