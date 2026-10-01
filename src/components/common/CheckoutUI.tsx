"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import useStore from "@/store/useStore";
import { placeOrder } from "@/lib/api";
import { BD_DISTRICTS } from "@/lib/districts";
import { useRouter, usePathname } from "next/navigation";
import { formatPrice } from "@/lib/formatPrice";
import { pushBeginCheckout, pushAddShippingInfo, pushAddPaymentInfo } from "@/lib/dataLayer";

// --- Custom Select Component ---
const CustomSelect = ({ options, value, onChange, placeholder, disabled, searchPlaceholder = "Search..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={`co-custom-select ${isOpen ? 'open' : ''}`} ref={dropdownRef}>
      <div 
        className={`co-select-trigger ${disabled ? 'disabled' : ''}`} 
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`co-select-value ${!value ? 'placeholder' : ''}`}>
          {value || placeholder}
        </span>
      </div>
      {isOpen && !disabled && (
        <div className="co-select-dropdown">
          <div className="co-select-search">
            <input 
              type="text" 
              placeholder={searchPlaceholder} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="co-select-options">
            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
              <div 
                key={opt}
                className={`co-select-option ${value === opt ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                  setSearch("");
                }}
              >
                {opt}
              </div>
            )) : (
              <div className="co-select-option" style={{color: '#9CA3AF', cursor: 'default'}}>No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function CheckoutUI({ initialSettings, mode = "drawer" }) {
  const router = useRouter();
  const pathname = usePathname();
  const isCheckoutOpen = useStore((state) => state.isCheckoutOpen);
  const checkoutSource = useStore((state) => state.checkoutSource);
  const checkoutItems = useStore((state) => state.checkoutItems); 
  const cartItems = useStore((state) => state.cartItems);
  const setCheckoutOpen = useStore((state) => state.setCheckoutOpen);
  const setCartOpen = useStore((state) => state.setCartOpen);
  const clearCart = useStore((state) => state.clearCart);
  const updateCheckoutItem = useStore((state) => state.updateCheckoutItem);
  const removeCheckoutItem = useStore((state) => state.removeCheckoutItem);
  const addToast = useStore((state) => state.addToast);
  const storeSettings = useStore((state) => state.settings);
  const settings = storeSettings?.layout ? storeSettings : initialSettings;
  const setSettings = useStore((state) => state.setSettings);
  
  const paymentSettings = settings?.payments || {};
  const isCodEnabled = paymentSettings.cod_enabled !== false;
  const isManualEnabled = paymentSettings.manual_enabled === true;
  const isSslcommerzEnabled = paymentSettings.sslcommerz?.enabled === true;
  const isAamarpayEnabled = paymentSettings.aamarpay?.enabled === true;
  const isSurjopayEnabled = paymentSettings.surjopay?.enabled === true;
  const isBkashApiEnabled = paymentSettings.bkash_api?.enabled === true;
  const isNagadApiEnabled = paymentSettings.nagad_api?.enabled === true;
  const isEpsEnabled = paymentSettings.eps?.enabled === true;
  const isStripeEnabled = paymentSettings.stripe?.enabled === true;
  const isPaypalEnabled = paymentSettings.paypal?.enabled === true;
  const usdRate = parseFloat(paymentSettings.usd_exchange_rate) || 120;

  const defaultMethod = isCodEnabled ? "cod" : (isManualEnabled ? "manual" : "sslcommerz");

  const [deliveryArea, setDeliveryArea] = useState("outside");
  const [paymentMethod, setPaymentMethod] = useState(defaultMethod);
  const [paymentProvider, setPaymentProvider] = useState("");
  
  const [showEmail, setShowEmail] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");
  const [notes, setNotes] = useState("");
  const [senderNumber, setSenderNumber] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasManuallySelectedArea = useRef(false);

  // Load saved profile
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("store_profile");
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        if (p.name) setName(p.name);
        if (p.phone) setPhone(p.phone);
        if (p.address) setAddress(p.address);
        if (p.city) {
          setDistrict(p.city);
          if (p.city.toLowerCase() === "dhaka") setDeliveryArea("inside");
        }
        if (p.thana) setThana(p.thana);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (pathname && pathname.startsWith('/thank-you')) {
      setCheckoutOpen(false);
      setIsSubmitting(false);
    }
  }, [pathname, setCheckoutOpen]);

  const handleClose = () => {
    setCheckoutOpen(false);
    if (checkoutSource === 'cart') setCartOpen(true);
  };

  const handleBackBtn = () => {
    setCheckoutOpen(false);
    if (checkoutSource === 'cart') setCartOpen(true);
  };

  const handleCloseBtn = () => {
    setCheckoutOpen(false);
    setCartOpen(false);
  };

  // Bangla Address Phonetic Autocomplete
  const handleAddressBlur = () => {
    if (hasManuallySelectedArea.current) return;
    
    let n = address.trim().toLowerCase();
    if (!n || n.length < 3) return;

    const h = {
      ক: "k", খ: "kh", গ: "g", ঘ: "gh", ঙ: "ng",
      চ: "c", ছ: "ch", জ: "j", ঝ: "jh", ঞ: "n",
      ট: "t", ঠ: "th", ড: "d", ড়: "r", ঢ: "dh", ঢ়: "rh", ণ: "n",
      ত: "t", থ: "th", দ: "d", ধ: "dh", ন: "n",
      প: "p", ফ: "f", ব: "b", ভ: "v", ম: "m",
      য: "j", য়: "y", র: "r", ল: "l",
      শ: "sh", ষ: "sh", স: "s", হ: "h",
      "া": "a", "ি": "i", "ী": "i", "ু": "u", "ূ": "u",
      "ৃ": "ri", "ে": "e", "ৈ": "oi", "ো": "o", "ৌ": "ou",
      "ং": "ng", "ঃ": "h", "ঁ": "n",
      অ: "o", আ: "a", ই: "i", ঈ: "i", উ: "u", ঊ: "u",
      এ: "e", ঐ: "oi", ও: "o", ঔ: "ou"
    };

    let iStr = "";
    for (let a = 0; a < n.length; a++) {
      const eChar = n[a];
      if (h[eChar]) iStr += h[eChar];
      else if (eChar !== "্") iStr += eChar;
    }
    n = iStr;

    const p = (aStr) => {
      return aStr.toLowerCase()
        .replace(/ph/g, "f").replace(/v/g, "b").replace(/z/g, "j").replace(/sh/g, "s").replace(/ch/g, "c")
        .replace(/ou/g, "o").replace(/au/g, "o").replace(/oo/g, "u").replace(/ee/g, "i").replace(/e/g, "a")
        .replace(/y/g, "i").replace(/h/g, "").replace(/(.)\1+/g, "$1");
    };

    let tDist = null, oThana = null;
    const l = [];
    for (const dist in BD_DISTRICTS) {
      l.push({ type: "district", dist: dist, name: dist });
      BD_DISTRICTS[dist].forEach(th => {
        l.push({ type: "thana", dist: dist, name: th });
      });
    }
    
    l.sort((a, b) => a.type !== b.type ? (a.type === "thana" ? -1 : 1) : b.name.length - a.name.length);

    for (const aItem of l) {
      try {
        const escaped = aItem.name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
        if (new RegExp("\\b" + escaped + "\\b", "i").test(n)) {
          if (aItem.type === "thana") {
            oThana = aItem.name;
            tDist = aItem.dist;
            break;
          } else if (aItem.type === "district" && !tDist) {
            tDist = aItem.dist;
          }
        }
      } catch {}
    }

    if (!oThana) {
      const normN = p(n).replace(/[^a-z0-9]/g, " ");
      for (const eItem of l) {
        const normItem = p(eItem.name).replace(/[^a-z0-9]/g, " ").trim();
        if (normItem.length >= 3 && new RegExp("\\b" + normItem + "\\b", "i").test(normN)) {
          if (eItem.type === "thana") {
            oThana = eItem.name;
            tDist = eItem.dist;
            break;
          } else if (eItem.type === "district" && !tDist) {
            tDist = eItem.dist;
          }
        }
      }
    }

    if (tDist) {
      setDistrict(tDist);
      setDeliveryArea(tDist.toLowerCase() === "dhaka" ? "inside" : "outside");
    }
    if (oThana) {
      setThana(oThana);
    }
  };

  const items = (checkoutSource === 'buy_now' || checkoutSource === 'selected_cart') && checkoutItems?.length > 0
    ? checkoutItems
    : cartItems;

  const totalItemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [items]);

  useEffect(() => {
    if (isCheckoutOpen && (!initialSettings || Object.keys(initialSettings).length === 0)) {
      fetch('/api/v1/settings')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data.settings) {
             setSettings(data.data.settings);
          }
        })
        .catch(err => console.error("Failed to load settings:", err));
    }
  }, [isCheckoutOpen, setSettings]);

  const deliveryFees = settings?.delivery || initialSettings?.delivery || { insideFee: 70, outsideFee: 120 };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price || item.base_price) * item.quantity, 0);
  }, [items]);

  const needsShipping = useMemo(() => {
    return items.some(item => item.requires_shipping !== 0);
  }, [items]);
  const isDigitalOnly = !needsShipping && items.length > 0;

  const deliveryFee = needsShipping ? (deliveryArea === 'inside' ? deliveryFees.insideFee : deliveryFees.outsideFee) : 0;
  const total = subtotal + deliveryFee - discountAmount;

  useEffect(() => {
    if (isCheckoutOpen && items.length > 0) {
      pushBeginCheckout(items, subtotal, checkoutSource);
    }
  }, [isCheckoutOpen]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponMsg("");
    
    try {
      const res = await fetch(`/api/v1/coupons/validate?code=${encodeURIComponent(couponCode.trim())}&amount=${subtotal}`);
      const data = await res.json();
      
      if (data.success && data.data.valid) {
        setDiscountAmount(data.data.coupon.discount_amount);
        setCouponMsg(`Coupon applied! ৳${formatPrice(data.data.coupon.discount_amount)} off.`);
      } else {
        setDiscountAmount(0);
        setCouponMsg(data.message || "Invalid coupon");
      }
    } catch (error) {
      setDiscountAmount(0);
      setCouponMsg("Error checking coupon");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      addToast("Cart is empty!", "error");
      return;
    }
    let firstErrorElement = null;
    const triggerError = (id) => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.remove('co-field-error');
        void el.offsetWidth;
        el.classList.add('co-field-error');
        setTimeout(() => {
          if (el) el.classList.remove('co-field-error');
        }, 1500);
        if (!firstErrorElement) firstErrorElement = el;
      }
    };

    if (!name) triggerError('coName');
    if (!phone || !/^(?:\+88|88)?(?:01[3-9]\d{8}|096\d{8})$/.test(phone)) triggerError('coPhone');
    if (showEmail && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) triggerError('coEmail');
    if (!address) triggerError('coAddress');
    if (!district) triggerError('coDistrictGroup');
    if (!thana) triggerError('coThanaGroup');

    if (paymentMethod === "manual") {
      if (!paymentProvider) triggerError('coPaymentProviderGroup');
      if (!senderNumber || senderNumber.length < 11) triggerError('coSenderNumber');
    }

    if (firstErrorElement) {
      firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      addToast("Please fill all required fields correctly.", "error");
      return;
    }

    setIsSubmitting(true);

    const orderData = {
      customer_name: name,
      phone: phone,
      email: showEmail ? email : null,
      address: address,
      city: district,
      thana: thana,
      notes: showNotes ? notes : null,
      delivery_area: deliveryArea,
      subtotal: subtotal,
      delivery_fee: deliveryFee,
      discount_amount: discountAmount,
      coupon_code: discountAmount > 0 ? couponCode.trim() : null,
      payment_method: paymentMethod,
      payment_provider: paymentMethod === 'manual' ? paymentProvider : null,
      sender_number: paymentMethod === 'manual' ? senderNumber : null,
      items: items.map((v) => ({
        product_id: v.id,
        title: v.title,
        variantName: v.variantName || v.variant || null,
        quantity: v.quantity,
        price: v.price || v.base_price,
        sku: v.sku,
      })),
      source: "storefront",
    };

    try {
      const result = await placeOrder(orderData);
      if (result && result.success) {
        const generatedOrderId = (result as any).data?.order_id || (result as any).order_id;
        const paymentUrl = (result as any).data?.payment_url;
        
        localStorage.setItem("store_profile", JSON.stringify({ name, phone, address, city: district, thana }));
        localStorage.setItem("store_latest_order", JSON.stringify({ ...orderData, order_id: generatedOrderId }));
        if (checkoutSource === 'cart') {
          clearCart();
        }
        
        if (paymentUrl) {
          window.location.href = paymentUrl;
        } else {
          document.body.style.overflow = "";
          document.body.classList.remove("drawer-open");
          router.push(`/thank-you?order_id=${generatedOrderId}`);
        }
      } else {
        addToast(result?.message || "Order failed. Please try again.", "error");
        setIsSubmitting(false);
      }
    } catch (error) {
      addToast("Network error. Please try again later.", "error");
      setIsSubmitting(false);
    }
  };

  const copyNumber = (num) => {
    navigator.clipboard.writeText(num);
    addToast("Number copied to clipboard!");
  };

  if (mode === "drawer" && pathname && pathname.startsWith('/thank-you')) {
    return null;
  }

  const containerClass = mode === "page" 
    ? "checkout-page-container" 
    : `checkout-drawer ${isCheckoutOpen ? 'open' : ''}`;
    
  return (
    <>
      {mode === "drawer" && (
        <div 
          className={`drawer-overlay backdrop-blur-md ${isCheckoutOpen ? 'show' : ''}`} 
          onClick={handleCloseBtn}
          style={{ zIndex: 1000 }}
        ></div>
      )}

      <div className={containerClass} id={mode === "drawer" ? 'checkoutDrawer' : 'checkoutPage'} style={mode === "drawer" ? { zIndex: 1001 } : {}}>
        {mode === "drawer" && (
          <div className='co-drawer-header'>
            <button className='co-back-btn' type='button' aria-label='Back to Cart' onClick={handleBackBtn}>
              <i className='ph-bold ph-arrow-left'></i>
            </button>
            <h2>Secure Checkout</h2>
            <button className='co-close-btn' type='button' aria-label='Close' onClick={handleCloseBtn}>
              <i className='ph-bold ph-x'></i>
            </button>
          </div>
        )}

        <div className='co-drawer-body' style={mode === "page" ? { padding: 0 } : {}}>
          <form id='coForm' onSubmit={handleSubmit} noValidate>
            <div className='co-card'>
              <h3 className='co-card-title'><i className='ph-fill ph-package'></i> Shipping Info</h3>
              <div className='co-form-group co-required'>
                <label htmlFor='coName'>Full Name</label>
                <input type='text' id='coName' name='name' autoComplete='name' value={name} onChange={e => setName(e.target.value)} placeholder='Your full name' required />
              </div>
              <div className='co-form-group co-required'>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label htmlFor='coPhone'>Phone Number</label>
                  <span onClick={() => setShowEmail(!showEmail)} style={{ fontSize: '0.85rem', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600 }}>
                    {showEmail ? "- Hide Email" : "+ Add Email"}
                  </span>
                </div>
                <input type='tel' id='coPhone' name='phone' autoComplete='tel' value={phone} onChange={e => setPhone(e.target.value)} placeholder='01XXXXXXXXX' required />
                <div className={`co-slide-panel ${showEmail || isDigitalOnly ? 'open' : ''}`}>
                  <div style={{ marginTop: '10px', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>
                    Email Address {isDigitalOnly ? '(Required for downloads)' : '(Optional)'}
                  </div>
                  <input type='email' id='coEmail' name='email' autoComplete='email' value={email} onChange={e => setEmail(e.target.value)} placeholder='Email for tracking' required={isDigitalOnly} />
                </div>
              </div>
              {needsShipping && (
                <>
                  <div className='co-form-group co-required'>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label htmlFor='coAddress'>Full Delivery Address</label>
                      <span onClick={() => setShowNotes(!showNotes)} style={{ fontSize: '0.85rem', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600 }}>
                        {showNotes ? "- Hide Notes" : "+ Order Notes"}
                      </span>
                    </div>
                    <textarea id='coAddress' name='address' autoComplete='street-address' value={address} onChange={e => setAddress(e.target.value)} onBlur={handleAddressBlur} rows={3} placeholder='House, Road, Area...' required={needsShipping}></textarea>
                    <div className={`co-slide-panel ${showNotes ? 'open' : ''}`}>
                      <div style={{ marginTop: '10px', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>Order Notes (Optional)</div>
                      <textarea id='coNotes' value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder='Special instructions...'></textarea>
                    </div>
                  </div>
                  <div className='co-form-row' style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <div id='coDistrictGroup' className='co-form-group co-required' style={{ flex: 1, marginBottom: 0 }}>
                      <label>District</label>
                      <CustomSelect options={Object.keys(BD_DISTRICTS).sort()} value={district} placeholder="Select District" disabled={false} onChange={(val) => { hasManuallySelectedArea.current = true; setDistrict(val); setThana(""); setDeliveryArea(val.toLowerCase() === "dhaka" ? "inside" : "outside"); }} />
                    </div>
                    <div id='coThanaGroup' className='co-form-group' style={{ flex: 1, marginBottom: 0 }}>
                      <label>Thana</label>
                      <CustomSelect options={district && BD_DISTRICTS[district] ? BD_DISTRICTS[district].sort() : []} value={thana} placeholder="Select Thana" disabled={!district} onChange={(val) => { hasManuallySelectedArea.current = true; setThana(val); }} />
                    </div>
                  </div>
                  <div className='co-form-group'>
                    <label>Delivery Fee</label>
                    <div className='co-delivery-toggle'>
                      <label className={`co-dtv-btn ${deliveryArea === 'outside' ? 'selected' : ''}`}>
                        <input type='radio' name='deliveryArea' value='outside' checked={deliveryArea === 'outside'} onChange={() => { setDeliveryArea('outside'); setDistrict(''); setThana(''); pushAddShippingInfo(items, 'outside', deliveryFees.outsideFee, subtotal + deliveryFees.outsideFee - discountAmount); }} />
                        <span className='co-dtv-title'>Outside Dhaka</span>
                        <span className='co-dtv-price'>৳{formatPrice(deliveryFees.outsideFee)}</span>
                      </label>
                      <label className={`co-dtv-btn ${deliveryArea === 'inside' ? 'selected' : ''}`}>
                        <input type='radio' name='deliveryArea' value='inside' checked={deliveryArea === 'inside'} onChange={() => { setDeliveryArea('inside'); setDistrict('Dhaka'); setThana(''); pushAddShippingInfo(items, 'inside', deliveryFees.insideFee, subtotal + deliveryFees.insideFee - discountAmount); }} />
                        <span className='co-dtv-title'>Inside Dhaka</span>
                        <span className='co-dtv-price'>৳{formatPrice(deliveryFees.insideFee)}</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className='co-card'>
              <h3 className='co-card-title'><i className='ph-fill ph-credit-card'></i> Payment</h3>
              <div className='co-payment-grid'>
                {isCodEnabled && (
                  <label className={`co-pay-btn ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                    <input type='radio' name='paymentMethod' value='cod' checked={paymentMethod === 'cod'} onChange={() => { setPaymentMethod('cod'); pushAddPaymentInfo(items, 'cod', total); }} /> Cash on Delivery
                  </label>
                )}
                {isManualEnabled && (
                  <label className={`co-pay-btn ${paymentMethod === 'manual' ? 'selected' : ''}`}>
                    <input type='radio' name='paymentMethod' value='manual' checked={paymentMethod === 'manual'} onChange={() => { setPaymentMethod('manual'); pushAddPaymentInfo(items, 'manual', total); }} /> Send Money (Manual)
                  </label>
                )}
                {isSslcommerzEnabled && (
                  <label className={`co-pay-btn ${paymentMethod === 'sslcommerz' ? 'selected' : ''}`}>
                    <input type='radio' name='paymentMethod' value='sslcommerz' checked={paymentMethod === 'sslcommerz'} onChange={() => { setPaymentMethod('sslcommerz'); pushAddPaymentInfo(items, 'sslcommerz', total); }} /> SSLCOMMERZ
                  </label>
                )}
                {isAamarpayEnabled && (
                  <label className={`co-pay-btn ${paymentMethod === 'aamarpay' ? 'selected' : ''}`}>
                    <input type='radio' name='paymentMethod' value='aamarpay' checked={paymentMethod === 'aamarpay'} onChange={() => { setPaymentMethod('aamarpay'); pushAddPaymentInfo(items, 'aamarpay', total); }} /> aamarPay
                  </label>
                )}
                {isSurjopayEnabled && (
                  <label className={`co-pay-btn ${paymentMethod === 'surjopay' ? 'selected' : ''}`}>
                    <input type='radio' name='paymentMethod' value='surjopay' checked={paymentMethod === 'surjopay'} onChange={() => { setPaymentMethod('surjopay'); pushAddPaymentInfo(items, 'surjopay', total); }} /> SurjoPay
                  </label>
                )}
                {isBkashApiEnabled && (
                  <label className={`co-pay-btn ${paymentMethod === 'bkash_api' ? 'selected' : ''}`}>
                    <input type='radio' name='paymentMethod' value='bkash_api' checked={paymentMethod === 'bkash_api'} onChange={() => { setPaymentMethod('bkash_api'); pushAddPaymentInfo(items, 'bkash_api', total); }} /> bKash Secure
                  </label>
                )}
                {isNagadApiEnabled && (
                  <label className={`co-pay-btn ${paymentMethod === 'nagad_api' ? 'selected' : ''}`}>
                    <input type='radio' name='paymentMethod' value='nagad_api' checked={paymentMethod === 'nagad_api'} onChange={() => { setPaymentMethod('nagad_api'); pushAddPaymentInfo(items, 'nagad_api', total); }} /> Nagad Secure
                  </label>
                )}
                {isEpsEnabled && (
                  <label className={`co-pay-btn ${paymentMethod === 'eps' ? 'selected' : ''}`}>
                    <input type='radio' name='paymentMethod' value='eps' checked={paymentMethod === 'eps'} onChange={() => { setPaymentMethod('eps'); pushAddPaymentInfo(items, 'eps', total); }} /> EPS (Easy Payment)
                  </label>
                )}
                {isStripeEnabled && (
                  <label className={`co-pay-btn ${paymentMethod === 'stripe' ? 'selected' : ''}`}>
                    <input type='radio' name='paymentMethod' value='stripe' checked={paymentMethod === 'stripe'} onChange={() => { setPaymentMethod('stripe'); pushAddPaymentInfo(items, 'stripe', total); }} /> Stripe
                  </label>
                )}
                {isPaypalEnabled && (
                  <label className={`co-pay-btn ${paymentMethod === 'paypal' ? 'selected' : ''}`}>
                    <input type='radio' name='paymentMethod' value='paypal' checked={paymentMethod === 'paypal'} onChange={() => { setPaymentMethod('paypal'); pushAddPaymentInfo(items, 'paypal', total); }} /> PayPal
                  </label>
                )}
              </div>

              <div className={`co-pay-detail ${paymentMethod === 'cod' ? 'show' : ''}`} id='co-details-cod'>
                <div className='co-cod-msg'>✅ {paymentSettings.cod_instructions || 'ক্যাশ অন ডেলিভারির মাধ্যমে নিরাপদে পেমেন্ট করুন।'}</div>
              </div>

              {isManualEnabled && (
                <div className={`co-pay-detail ${paymentMethod === 'manual' ? 'show' : ''}`} id='co-details-manual'>
                  <div className='co-manual-pay-instructions' style={{ marginBottom:'12px', fontSize:'14px', color:'#4B5563', background:'#F0F9FF', padding:'12px', borderRadius:'8px', border:'1px solid #BAE6FD' }}>
                    <div style={{ marginBottom:'8px' }}>Amount to send: <strong style={{ fontSize:'16px', color:'#0369A1' }}>৳{formatPrice(total)}</strong></div>
                    <div>{paymentSettings.manual_instructions || 'Please send the exact amount and provide your sender number below.'}</div>
                  </div>

                  <div id='coPaymentProviderGroup' className='co-provider-select' style={{ display:'flex', flexWrap:'wrap', gap:'10px', marginBottom:'15px' }}>
                    {[
                      paymentSettings.manual_bkash ? {name: 'bKash', num: paymentSettings.manual_bkash, img: '/gateways/bkash.png'} : null, 
                      paymentSettings.manual_nagad ? {name: 'Nagad', num: paymentSettings.manual_nagad, img: '/gateways/nagad.svg'} : null, 
                      paymentSettings.manual_rocket ? {name: 'Rocket', num: paymentSettings.manual_rocket, img: '/gateways/rocket.png'} : null, 
                      paymentSettings.manual_upay ? {name: 'Upay', num: paymentSettings.manual_upay, img: '/gateways/upay.svg'} : null
                    ].filter(Boolean).map(provider => (
                      <div key={provider.name} style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                        <label style={{ display:'flex', alignItems:'center', gap:'5px', cursor:'pointer' }}>
                          <input type='radio' name='provider_manual' className='co-custom-radio' value={provider.name} checked={paymentProvider === provider.name} onChange={() => setPaymentProvider(provider.name)} /> 
                          <img src={provider.img} alt={provider.name} style={{height: '24px'}} />
                        </label>
                        {paymentProvider === provider.name && (
                           <div style={{ fontSize:'13px', background:'var(--bg-light)', padding:'4px 8px', borderRadius:'4px', display:'flex', alignItems:'center', gap:'8px', border:'1px solid #e2e8f0' }}>
                             <span style={{ fontWeight: 600 }}>{provider.num}</span>
                             <button type="button" onClick={() => copyNumber(provider.num)} style={{background:'none', border:'none', color:'#0ea5e9', cursor:'pointer', padding:0}}><i className="ph ph-copy"></i></button>
                           </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {paymentProvider && (
                    <div className='co-form-group'>
                      <input type='tel' id='coSenderNumber' value={senderNumber} onChange={e => setSenderNumber(e.target.value)} placeholder={`যে নাম্বার থেকে ${paymentProvider} করেছেন 01XXXXXXXXX`} style={{width:'100%', border:'1px solid #e5e7eb', padding:'10px', borderRadius:'6px', fontSize:'15px'}} />
                    </div>
                  )}
                </div>
              )}
              
              <div className={`co-pay-detail ${['sslcommerz', 'aamarpay', 'surjopay', 'bkash_api', 'nagad_api', 'eps'].includes(paymentMethod) ? 'show' : ''}`}>
                <div className='co-cod-msg'>✅ You will be securely redirected to the payment gateway to complete your purchase.</div>
              </div>
              
              <div className={`co-pay-detail ${['stripe', 'paypal'].includes(paymentMethod) ? 'show' : ''}`}>
                <div className='co-cod-msg'>
                  ✅ You will be securely redirected to {paymentMethod === 'stripe' ? 'Stripe' : 'PayPal'} to complete your purchase.<br/><br/>
                  <span style={{ fontSize: '15px', color: '#0369A1', background: '#F0F9FF', padding: '6px 10px', borderRadius: '4px', border: '1px solid #BAE6FD', display: 'inline-block' }}>
                    Total to charge: <strong>${(total / usdRate).toFixed(2)} USD</strong> (Conversion rate: 1 USD = ৳{usdRate})
                  </span>
                </div>
              </div>

            </div>

            <div className='co-card'>
              <div className='co-summary-header'>
                <h3>
                  <span>Your Order</span>
                  {totalItemCount > 0 && (
                    <span className="co-order-count-badge">
                      ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})
                    </span>
                  )}
                </h3>
              </div>
              <div id='coPackageList' className='co-summary-scroll'>
                {items.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#EF4444' }}>Cart is empty! <button type="button" onClick={() => mode === "page" ? router.push('/') : setCheckoutOpen(false)} style={{ background: 'none', border: 'none', color: '#3B82F6', textDecoration: 'underline', cursor: 'pointer' }}>Go Shop</button></div>
                ) : (
                  items.map((item, idx) => (
                    <div key={idx} className="co-pkg-item">
                        <img src={item.image || "https://placehold.co/60?text=N/A"} loading="lazy" decoding="async" className="co-pkg-img" alt={item.title} />
                        <div className="co-pkg-details">
                            <div className="co-pkg-title">{item.title}</div>
                            {item.variantName && <div className="co-pkg-variant">{item.variantName}</div>}
                            {item.sku && <div className="co-pkg-variant" style={{color: '#64748b', fontSize: '0.75rem', marginTop: '2px'}}>SKU: {item.sku}</div>}
                            <div className="co-pkg-price-row">
                                <div className="co-pkg-calc">৳{formatPrice(item.price || item.base_price)} x {item.quantity}</div>
                                <div className="co-pkg-total">৳{formatPrice((item.price || item.base_price) * item.quantity)}</div>
                            </div>
                            <div className="co-pkg-actions">
                                <div className="co-pkg-qty">
                                    <button type="button" className="co-pkg-qty-btn" onClick={() => updateCheckoutItem(idx, -1)} disabled={item.quantity <= 1}>-</button>
                                    <div className="co-pkg-qty-val">{item.quantity}</div>
                                    <button type="button" className="co-pkg-qty-btn" onClick={() => updateCheckoutItem(idx, 1)}>+</button>
                                </div>
                                <button type="button" className="co-pkg-remove" onClick={() => removeCheckoutItem(idx)}><i className="ph-bold ph-x"></i> Remove</button>
                            </div>
                        </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className='co-totals'>
                <div className='co-total-row'><span>Subtotal:</span><span>৳{formatPrice(subtotal)}</span></div>
                <div className='co-total-row'><span>Delivery:</span><span>৳{formatPrice(deliveryFee)}</span></div>
                
                <div className='co-coupon-section' style={{ margin: '15px 0', borderTop: '1px dashed #e5e7eb', borderBottom: '1px dashed #e5e7eb', padding: '12px 0' }}>
                  <p className='co-coupon-toggle' onClick={() => setShowCoupon(!showCoupon)} style={{ margin: 0, color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                    {showCoupon ? "Hide coupon" : <><i className='ph-bold ph-ticket'></i> Have a coupon?</>}
                  </p>
                  <div className={`co-coupon-group ${showCoupon ? 'open' : ''}`} style={{ display: showCoupon ? 'flex' : 'none' }}>
                    <input type='text' placeholder='Promo Code' value={couponCode} onChange={e => setCouponCode(e.target.value)} style={{ flex: 1, padding: '0.8rem', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '1rem', textTransform: 'uppercase' }} />
                    <button type='button' className='co-btn-secondary' onClick={handleApplyCoupon} disabled={isApplyingCoupon} style={{ padding: '0.8rem 1.5rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                      {isApplyingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponMsg && <p className='co-coupon-msg' style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.85rem', fontWeight: 500, color: discountAmount > 0 ? '#10B981' : '#EF4444' }}>{couponMsg}</p>}
                </div>

                {discountAmount > 0 && (
                  <div className='co-total-row' style={{ color: '#10B981' }}>
                    <span>Discount:</span><span>-৳{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className='co-total-row co-total-final'><span>Total to Pay:</span><span>৳{formatPrice(total)}</span></div>
              </div>

              <button type='submit' className='co-confirm-btn' disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : <><i className='ph-bold ph-check-circle'></i> Confirm Order</>}
              </button>
              <p className='co-terms' style={{ textAlign: 'center', fontSize: '0.8rem', color: '#6B7280', marginTop: '1rem' }}>By confirming you agree to our <a href='#' target='_blank'>Terms & Conditions</a>.</p>
            </div>
          </form>
        </div>

        {/* LOADING OVERLAY */}
        <div className={`co-loading ${isSubmitting ? 'show' : ''}`} id='coLoading'>
          <div className='co-spinner'></div>
          <p>Processing your order...</p>
          <p style={{fontSize:'0.8rem', color:'#999'}}>Please do not close.</p>
        </div>
      </div>
    </>
  );
}
