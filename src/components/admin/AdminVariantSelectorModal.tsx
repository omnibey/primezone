"use client";

import React, { useState, useMemo, useEffect } from "react";
import { formatPrice } from "@/lib/formatPrice";
import { X } from "lucide-react";

export default function AdminVariantSelectorModal({ product, variants, onClose, onAdd }) {
  // Parse options for all variants safely
  const parsedVariants = useMemo(() => {
    if (!variants) return [];
    return variants.map(v => {
      let opts = {};
      if (typeof v.options === 'string') {
        try { opts = JSON.parse(v.options); } catch (e) {}
      } else if (v.options) {
        opts = v.options;
      }
      return { ...v, parsedOptions: opts };
    });
  }, [variants]);

  const { mode, primaryKey, secondaryKey, primaryValues, secondaryValues, optionKeys, groupedOptions } = useMemo(() => {
    if (!parsedVariants || parsedVariants.length === 0) return { mode: 'none' };
    
    const opts = parsedVariants[0].parsedOptions;
    const keys = Object.keys(opts || {});

    if (product.is_variant_bulk_mode && keys.length >= 2) {
      // BULK MODE
      const pk = keys.find(s => ["color", "colour", "rong", "রঙ"].includes(s.toLowerCase())) || keys[0];
      const sk = keys.find(s => s !== pk) || keys[1];
      const pVals = Array.from(new Set(parsedVariants.map((v: any) => v.parsedOptions[pk]).filter(Boolean)));
      const sVals = Array.from(new Set(parsedVariants.map((v: any) => v.parsedOptions[sk]).filter(Boolean)));
      return { mode: 'variant_bulk_mode', primaryKey: pk, secondaryKey: sk, primaryValues: pVals, secondaryValues: sVals };
    } else if (!product.is_variant_bulk_mode && keys.length > 0) {
      // SEPARATED MODE
      const gOptions: Record<string, any[]> = {};
      keys.forEach(k => {
        gOptions[k] = Array.from(new Set(parsedVariants.map((v: any) => v.parsedOptions[k]).filter(Boolean)));
      });
      return { mode: 'variant', optionKeys: keys, groupedOptions: gOptions };
    } else {
      // BASIC MODE
      return { mode: 'non_variant' };
    }
  }, [parsedVariants, product.is_variant_bulk_mode]);

  // Basic & Separated Mode state
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({});
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");

  // Bulk Mode state
  const [variantBulkState, setVariantBulkState] = useState<Record<string, any>>({});

  // Handle Separated Mode Selection
  useEffect(() => {
    if (mode === 'variant' && Object.keys(selectedOptions).length > 0) {
      const match = parsedVariants.find(v => {
        return optionKeys.every(k => v.parsedOptions[k] === selectedOptions[k]);
      });
      setSelectedVariant(match || null);
    }
  }, [selectedOptions, mode, parsedVariants, optionKeys]);

  const displayPrice = selectedVariant ? selectedVariant.price : product.base_price;
  
  const handleBulkCheckboxChange = (pVal) => {
    setVariantBulkState(prev => {
      const newState = { ...prev };
      if (newState[pVal] && newState[pVal].active) {
        newState[pVal] = { ...newState[pVal], active: false, selectedSize: null };
      } else {
        newState[pVal] = { ...newState[pVal], active: true, quantity: newState[pVal]?.quantity || 1 };
      }
      return newState;
    });
  };

  const handleBulkSizeSelect = (pVal, sVal, price, sku, variantName, variantId, outOfStock) => {
    setVariantBulkState(prev => {
      const isAlreadySelected = prev[pVal]?.selectedSize === sVal;
      
      if (isAlreadySelected) {
        return {
          ...prev,
          [pVal]: {
            ...prev[pVal],
            selectedSize: null,
            active: false
          }
        };
      }
      
      return {
        ...prev,
        [pVal]: { 
          ...prev[pVal], 
          selectedSize: sVal, 
          price, 
          sku, 
          variantName, 
          variantId, 
          active: true, 
          quantity: prev[pVal]?.quantity || 1 
        }
      };
    });
  };

  const handleBulkQuantity = (pVal, delta) => {
    setVariantBulkState(prev => {
      const current = prev[pVal]?.quantity || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [pVal]: { ...prev[pVal], quantity: next } };
    });
  };

  const handleAdd = () => {
    setError("");
    if (mode === 'variant_bulk_mode') {
      const items = [];
      Object.keys(variantBulkState).forEach(pVal => {
        const row = variantBulkState[pVal];
        if (row.active && row.selectedSize) {
          const variant = parsedVariants.find(v => v.parsedOptions[primaryKey] === pVal && v.parsedOptions[secondaryKey] === row.selectedSize);
          items.push({
            product_id: product.id,
            title: product.title,
            price: row.price,
            image: variant?.image_url || (product.images && product.images.length > 0 ? product.images[0] : ''),
            quantity: row.quantity,
            variant_id: row.variantId,
            variant: row.variantName,
            sku: row.sku || product.sku,
          });
        }
      });
      if (items.length === 0) {
        setError("Please select at least one row and size.");
        return;
      }
      onAdd(items);
    } else {
      if (mode === 'variant' && (!selectedVariant || Object.keys(selectedOptions).length !== optionKeys.length)) {
        setError("Please select all options.");
        return;
      }
      if (mode === 'non_variant' && !selectedVariant) {
        setError("Please select a variant.");
        return;
      }
      onAdd([{
        product_id: product.id,
        title: product.title,
        price: displayPrice,
        image: (selectedVariant && selectedVariant.image_url) ? selectedVariant.image_url : (product.images && product.images.length > 0 ? product.images[0] : ''),
        quantity: quantity,
        variant_id: selectedVariant ? selectedVariant.id : null,
        variant: selectedVariant ? selectedVariant.name : null,
        sku: selectedVariant ? (selectedVariant.sku || product.sku) : product.sku,
      }]);
    }
  };

  return (
    <div className="admin-variant-selector-inline">
        <style>{`
          .admin-variant-selector-inline {
            margin-top: 16px;
            background-color: transparent;
            border: 1px solid #374151;
            border-radius: 8px;
            padding: 16px;
            color: inherit;
          }
          .admin-variant-selector-inline h3 {
            color: inherit !important;
          }
          .variant-chip-list, .mv-size-group {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          .variant-chip, .mv-size-btn {
            padding: 6px 12px;
            border: 1px solid #4b5563;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
            transition: all 0.2s;
            background: transparent;
            color: inherit;
            display: inline-block;
          }
          .variant-chip:hover, .mv-size-btn:hover {
            border-color: #FF6B35;
          }
          .variant-chip.active, .mv-size-btn.selected {
            background-color: #FF6B35 !important;
            color: #fff !important;
            border-color: #FF6B35 !important;
          }
          .mv-combo-row {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 12px 0;
            border-bottom: 1px solid #374151;
          }
          .mv-combo-row:last-child {
            border-bottom: none;
          }
          .mv-row-inactive {
            opacity: 0.6;
          }
          .mv-qty-ctrl {
            display: flex;
            align-items: center;
            border: 1px solid #4b5563;
            border-radius: 4px;
            overflow: hidden;
          }
          .mv-qty-hidden {
            visibility: hidden;
          }
          .mv-qty-ctrl button {
            background: transparent;
            color: inherit;
            border: none;
            padding: 4px 10px;
            cursor: pointer;
          }
          .mv-qty-ctrl input {
            width: 40px;
            text-align: center;
            background: transparent;
            color: inherit;
            border: none;
            border-left: 1px solid #4b5563;
            border-right: 1px solid #4b5563;
          }
          .bulk-summary-box {
            background: transparent !important;
            border: 1px solid #374151 !important;
            color: inherit !important;
          }
          .bulk-summary-box div {
            color: inherit !important;
          }
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'inherit' }}>Configure: {product.title}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={18} /></button>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          
          {error && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

          {/* BULK MATRIX MODE */}
          {mode === 'variant_bulk_mode' && (
            <>
              <div className="form-group" style={{marginTop:'0.5rem'}} id="variantsContainer">
                <label style={{fontWeight:600, marginBottom:'0.5rem', display:'block'}}>Select {primaryKey} &amp; {secondaryKey}</label>
                <div className="mv-combo-list" id="mvComboList">
                  {primaryValues.map((pVal: any) => {
                    const isActive = variantBulkState[pVal]?.active;
                    const rowSelectedSize = variantBulkState[pVal]?.selectedSize;
                  
                  return (
                    <div key={pVal} className={`mv-combo-row ${!isActive ? 'mv-row-inactive' : ''}`}>
                      <label className="mv-row-check-label">
                        <input 
                          type="checkbox" 
                          className="mv-custom-checkbox"
                          checked={!!isActive} 
                          onChange={() => handleBulkCheckboxChange(pVal)} 
                        />
                        <span className="mv-row-colour">{pVal}</span>
                      </label>
                      
                      <div className="mv-size-group">
                        {secondaryValues.map((sVal: any) => {
                          const variant = parsedVariants.find(v => v.parsedOptions[primaryKey] === pVal && v.parsedOptions[secondaryKey] === sVal);
                          const vPrice = variant ? variant.price : product.base_price;
                          const vStock = variant ? (variant.is_unlimited_stock ? 9999 : variant.stock) : 0;
                          const isOos = vStock <= 0;
                          const isSelected = rowSelectedSize === sVal;
                          
                          return (
                            <span 
                              key={sVal}
                              className={`mv-size-btn ${isOos ? 'mv-size-oos' : ''} ${isSelected ? 'selected' : ''}`}
                              style={isSelected ? {background: '#FF6B35', color: '#fff', borderColor: '#FF6B35'} : {}}
                              onClick={() => handleBulkSizeSelect(pVal, sVal, vPrice, variant?.sku, variant?.name, variant?.id, isOos)}
                            >
                              {sVal}
                            </span>
                          );
                        })}
                      </div>
                      
                      <div className={`mv-qty-ctrl ${!isActive ? 'mv-qty-hidden' : ''}`}>
                        <button type="button" className="mv-btn mv-decrease" onClick={() => handleBulkQuantity(pVal, -1)}>-</button>
                        <input type="number" className="mv-qty-input" value={variantBulkState[pVal]?.quantity || 1} readOnly />
                        <button type="button" className="mv-btn mv-increase" onClick={() => handleBulkQuantity(pVal, 1)}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="bulk-summary-box" style={{marginTop: '1rem', padding: '0.85rem 1rem', background: 'var(--bg-light)', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontWeight: 600, color: '#374151', fontSize: '0.95rem'}}>
                Total Selected: <span style={{color: 'var(--primary-color)'}}>{Object.values(variantBulkState).filter((s: any) => s.active && s.selectedSize).reduce((sum: number, s: any) => sum + (s.quantity || 1), 0)}</span> items
              </div>
              <div style={{fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary-color)'}}>
                ৳{formatPrice(Object.values(variantBulkState).filter((s: any) => s.active && s.selectedSize).reduce((sum: number, s: any) => sum + (s.price * (s.quantity || 1)), 0))}
              </div>
            </div>
            </>
          )}

          {/* SEPARATED MODE */}
          {mode === 'variant' && (
            <div className="form-group" style={{marginTop:'0.5rem'}} id="variantsContainer">
              {optionKeys.map((key: any) => (
                <div key={key} className="variant-option-group" style={{marginBottom:'1rem'}}>
                  <div style={{fontSize:'0.88rem', fontWeight:600, color:'#374151', marginBottom:'0.5rem'}}>
                    {key}: <span className="selected-option-label" style={{color:'#FF6B35', fontWeight:700}}>{selectedOptions[key]}</span>
                  </div>
                  <div className="variant-chip-list">
                    {groupedOptions[key].map((val: any) => {
                      const isSelected = selectedOptions[key] === val;
                      const variant = parsedVariants.find(v => v.parsedOptions[key] === val);
                      const isOos = variant && !variant.is_unlimited_stock && variant.stock <= 0;
                      
                      return (
                        <div 
                          key={val}
                          className={`variant-chip option-btn ${isOos ? 'oos' : ''} ${isSelected ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedOptions(prev => ({...prev, [key]: val}));
                          }}
                        >
                          {val}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BASIC VARIANTS */}
          {mode === 'non_variant' && parsedVariants.length > 0 && (
            <div className="form-group" style={{marginTop:'0.5rem'}} id="variantsContainer">
                <div style={{fontSize:'0.88rem', fontWeight:600, color:'var(--text-primary)', marginBottom:'0.5rem'}}>Select Option:</div>
                <div className="variant-chip-list" id="variantSelector">
                    {parsedVariants.map(variant => {
                      const available = variant.is_unlimited_stock || variant.stock > 0;
                      const active = selectedVariant?.id === variant.id;
                      return (
                        <div 
                          key={variant.id}
                          className={`variant-chip ${!available ? 'oos' : ''} ${active ? 'active' : ''}`} 
                          onClick={() => {
                            setSelectedVariant(variant);
                          }}
                        >
                          {variant.name}
                        </div>
                      );
                    })}
                </div>
            </div>
          )}

          {mode !== 'variant_bulk_mode' && selectedVariant && (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.1)', borderRadius: '6px', fontSize: '0.9rem', display: 'flex', flexWrap: 'wrap', gap: '20px', border: '1px solid #4b5563' }}>
              <div><span style={{ color: '#9ca3af' }}>SKU:</span> <span style={{ fontWeight: 600 }}>{selectedVariant.sku || product.sku}</span></div>
              <div>
                <span style={{ color: '#9ca3af' }}>Stock:</span>{' '}
                <span style={{ fontWeight: 600, color: selectedVariant.is_unlimited_stock || selectedVariant.stock > 0 ? '#10b981' : '#ef4444' }}>
                  {selectedVariant.is_unlimited_stock ? 'Unlimited' : selectedVariant.stock}
                </span>
              </div>
              <div><span style={{ color: '#9ca3af' }}>Price:</span> <span style={{ fontWeight: 600 }}>৳{formatPrice(selectedVariant.price)}</span></div>
            </div>
          )}

          {mode !== 'variant_bulk_mode' && (
            <div className="quantity-selector" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{fontWeight:600, fontSize:'0.9rem'}}>Quantity:</label>
              <div className="mv-qty-ctrl">
                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <input type="number" value={quantity} readOnly />
                <button type="button" onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>
          )}

        </div>
        <div style={{ paddingTop: '16px', borderTop: '1px solid #374151', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="admin-btn admin-btn-primary" onClick={handleAdd}>Add to Order</button>
        </div>
    </div>
  );
}
