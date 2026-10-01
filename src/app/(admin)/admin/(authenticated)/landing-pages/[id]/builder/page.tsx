"use client";
export const runtime = 'edge';

import React, { useState, useEffect, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/utils/adminApi';
import { Save, Code2, Eye, Sparkles, X, Copy, Loader2, Wand2, Settings, Monitor, Smartphone, ArrowLeft, CheckCircle2, AlertCircle, ExternalLink, Zap } from 'lucide-react';
import { useToast } from '../../../layout';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    body { font-family: 'Hind Siliguri', sans-serif; }
    .store-buy-now { cursor: pointer; }
    @keyframes pulse-ring { 0%,100%{transform:scale(1);opacity:.8} 50%{transform:scale(1.04);opacity:1} }
    .cta-pulse { animation: pulse-ring 2s ease-in-out infinite; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    .fade-up { animation: fadeUp 0.5s ease forwards; }
  <\/style>
<\/head>
<body class="bg-white">
<div class="bg-gradient-to-r from-red-600 to-red-500 text-white text-center py-2 px-4 text-sm font-semibold tracking-wide sticky top-0 z-50">
  🔥 সীমিত সময়ের অফার — আজই অর্ডার করুন, বিনামূল্যে ডেলিভারি পান!
<\/div>
<section class="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-white pt-14 pb-20 px-4">
  <div class="max-w-5xl mx-auto">
    <div class="flex flex-col md:flex-row items-center gap-10 md:gap-16">
      <div class="flex-1 text-center md:text-left fade-up">
        <div class="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest mb-5">
          <span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"><\/span> Best Seller
        <\/div>
        <h1 class="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-4">{{product.title}}<\/h1>
        <p class="text-slate-300 text-base sm:text-lg mb-6 leading-relaxed max-w-lg mx-auto md:mx-0">প্রিমিয়াম মানের পণ্য, সারাদেশে দ্রুত ডেলিভারি। হাজারো সন্তুষ্ট গ্রাহকের বিশ্বাসের ব্র্যান্ড।<\/p>
        <div class="flex items-center gap-3 mb-7 justify-center md:justify-start">
          <span class="text-4xl font-black text-red-400">৳{{product.price}}<\/span>
          <div class="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">FREE DELIVERY<\/div>
        <\/div>
        <button class="store-buy-now cta-pulse w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-4 px-10 rounded-full text-lg shadow-2xl">🛒 এখনই অর্ডার করুন<\/button>
        <div class="flex flex-wrap items-center gap-3 mt-5 text-xs text-slate-400 justify-center md:justify-start">
          <span>✅ সারাদেশে ডেলিভারি<\/span><span>✅ ক্যাশ অন ডেলিভারি<\/span><span>✅ ১০০% অরিজিনাল<\/span>
        <\/div>
      <\/div>
      <div class="flex-shrink-0 relative">
        <div class="absolute -inset-3 bg-red-500/20 rounded-3xl blur-xl"><\/div>
        <img src="{{product.image}}" alt="{{product.title}}" class="relative w-64 h-64 sm:w-72 sm:h-72 object-cover rounded-2xl shadow-2xl border border-white/10" onerror="this.src='https://placehold.co/300x300/1e293b/94a3b8?text=Product'" />
        <div class="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap shadow-lg">⚡ মাত্র কয়েকটি বাকি!<\/div>
      <\/div>
    <\/div>
  <\/div>
<\/section>
<div class="bg-slate-800 text-white py-4 px-4">
  <div class="max-w-5xl mx-auto flex flex-wrap justify-center md:justify-between items-center gap-4 text-sm font-medium">
    <div>★★★★★ ৫,০০০+ সন্তুষ্ট গ্রাহক<\/div>
    <div>🚚 ৩-৫ দিনে ডেলিভারি<\/div>
    <div>🔒 নিরাপদ পেমেন্ট<\/div>
    <div>↩️ ৭ দিনের রিটার্ন পলিসি<\/div>
  <\/div>
<\/div>
<section class="py-16 px-4 bg-gray-50">
  <div class="max-w-5xl mx-auto">
    <h2 class="text-2xl sm:text-3xl font-extrabold text-center text-gray-900 mb-10">কেন এই পণ্যটি বেছে নেবেন?<\/h2>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
        <div class="text-4xl mb-3">⚡<\/div><h3 class="font-bold text-gray-900 mb-2">দ্রুত ডেলিভারি<\/h3>
        <p class="text-gray-500 text-sm">৩-৫ কার্যদিবসের মধ্যে সারাদেশে।<\/p>
      <\/div>
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
        <div class="text-4xl mb-3">💯<\/div><h3 class="font-bold text-gray-900 mb-2">১০০% অরিজিনাল<\/h3>
        <p class="text-gray-500 text-sm">নকল হলে সম্পূর্ণ অর্থ ফেরত।<\/p>
      <\/div>
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
        <div class="text-4xl mb-3">🔒<\/div><h3 class="font-bold text-gray-900 mb-2">ক্যাশ অন ডেলিভারি<\/h3>
        <p class="text-gray-500 text-sm">পণ্য পেয়ে টাকা দিন।<\/p>
      <\/div>
    <\/div>
  <\/div>
<\/section>
<section class="py-16 px-4 bg-white">
  <div class="max-w-3xl mx-auto">
    <h2 class="text-2xl font-extrabold text-center text-gray-900 mb-8">পণ্যের বিস্তারিত<\/h2>
    <div class="space-y-3">
      <details class="border border-gray-200 rounded-xl overflow-hidden"><summary class="flex justify-between p-4 cursor-pointer font-semibold text-gray-800 bg-gray-50">📦 পণ্যের বিবরণ<\/summary><div class="p-4 text-gray-600 text-sm">এখানে বিস্তারিত তথ্য যোগ করুন।<\/div><\/details>
      <details class="border border-gray-200 rounded-xl overflow-hidden"><summary class="flex justify-between p-4 cursor-pointer font-semibold text-gray-800 bg-gray-50">🚚 ডেলিভারি তথ্য<\/summary><div class="p-4 text-gray-600 text-sm">ঢাকার ভেতরে ১-২ দিন, বাইরে ৩-৫ দিন।<\/div><\/details>
      <details class="border border-gray-200 rounded-xl overflow-hidden"><summary class="flex justify-between p-4 cursor-pointer font-semibold text-gray-800 bg-gray-50">↩️ রিটার্ন পলিসি<\/summary><div class="p-4 text-gray-600 text-sm">৭ দিনের মধ্যে ফেরত দিতে পারবেন।<\/div><\/details>
    <\/div>
  <\/div>
<\/section>
<section class="py-16 px-4 bg-gray-50">
  <div class="max-w-4xl mx-auto">
    <h2 class="text-2xl font-extrabold text-center text-gray-900 mb-10">গ্রাহকদের মতামত<\/h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div class="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
        <div class="text-yellow-400 mb-3">★★★★★<\/div>
        <p class="text-gray-700 text-sm mb-4">"অসাধারণ পণ্য! মান দেখে অবাক হয়ে গেছি।"<\/p>
        <div style="display:flex;align-items:center;gap:10px"><div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#f87171,#dc2626);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px">র<\/div><div><div style="font-weight:600;font-size:13px">রাহেলা বেগম<\/div><div style="color:#9ca3af;font-size:11px">ঢাকা · যাচাইকৃত ক্রেতা<\/div><\/div><\/div>
      <\/div>
      <div class="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
        <div class="text-yellow-400 mb-3">★★★★★<\/div>
        <p class="text-gray-700 text-sm mb-4">"দামের তুলনায় পণ্যের মান অনেক ভালো।"<\/p>
        <div style="display:flex;align-items:center;gap:10px"><div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#60a5fa,#2563eb);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px">ক<\/div><div><div style="font-weight:600;font-size:13px">করিম উদ্দিন<\/div><div style="color:#9ca3af;font-size:11px">চট্টগ্রাম · যাচাইকৃত ক্রেতা<\/div><\/div><\/div>
      <\/div>
    <\/div>
  <\/div>
<\/section>
<section class="py-16 px-4 bg-gradient-to-br from-red-600 to-red-700 text-white text-center">
  <div class="max-w-xl mx-auto">
    <h2 class="text-2xl sm:text-3xl font-extrabold mb-3">আর দেরি না করে এখনই অর্ডার করুন!<\/h2>
    <p class="text-red-100 mb-7">স্টক সীমিত। বিনামূল্যে হোম ডেলিভারি পান।<\/p>
    <button class="store-buy-now cta-pulse bg-white text-red-600 font-extrabold py-4 px-12 rounded-full text-lg shadow-2xl">🛒 এখনই অর্ডার করুন — ৳{{product.price}}<\/button>
    <p class="text-red-200 text-xs mt-4">ক্যাশ অন ডেলিভারি · কোনো অগ্রিম পেমেন্ট নেই<\/p>
  <\/div>
<\/section>
<div id="store-landing-checkout" class="relative w-full max-w-5xl mx-auto z-10 px-4 py-10"><\/div>
<footer class="bg-gray-900 text-gray-400 text-center text-xs py-6 px-4">
  <p>© 2025 {{store.name}} · সকল অধিকার সংরক্ষিত · ১০০% অরিজিনাল পণ্য<\/p>
<\/footer>
<\/body><\/html>`;

const CHECKOUT_PREVIEW_HTML = `<style>.copw{font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;background-color: var(--bg-color);border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.1);overflow:hidden}.coph{background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;padding:16px 20px}.coph h3{margin:0 0 2px;font-size:15px;font-weight:700}.coph p{margin:0;font-size:12px;opacity:.85}.copb{padding:20px}.corow{display:flex;gap:10px;margin-bottom:12px}.cof{flex:1}.colb{font-size:11px;font-weight:600;color:#6b7280;margin-bottom:4px}.coin{width:100%;border:1.5px solid #e5e7eb;border-radius:8px;padding:9px 12px;font-size:14px;color:#374151;box-sizing:border-box;background:#f9fafb}.cosel{width:100%;border:1.5px solid #e5e7eb;border-radius:8px;padding:9px 12px;font-size:14px;color:#374151;background:#f9fafb}.codl{display:flex;gap:8px;margin-bottom:12px}.codl label{flex:1;border:1.5px solid #e5e7eb;border-radius:8px;padding:9px 12px;cursor:pointer;font-size:13px;text-align:center}.codl label.act{border-color:#ea580c;background:#fff7ed;color:#c2410c;font-weight:700}.cobtn{width:100%;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;border:none;border-radius:10px;padding:14px;font-size:16px;font-weight:800;cursor:pointer;margin-top:4px}.cotr{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-top:12px}.cobdg{font-size:11px;font-weight:600;color:#374151;padding:3px 8px;background-color: var(--bg-light);border-radius:20px;border:1px solid #e5e7eb}<\/style>
<div class="copw"><div class="coph"><h3>🛒 অর্ডার ফর্ম<\/h3><p>নিচের তথ্য পূরণ করুন<\/p><\/div>
<div class="copb">
  <div style="display:flex;align-items:center;gap:10px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:10px 12px;margin-bottom:12px">
    <div style="width:48px;height:48px;background:#fed7aa;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px">📦<\/div>
    <div><div style="font-weight:700;color:#1f2937;font-size:13px">পণ্যের নাম (প্রকৃত পণ্য এখানে আসবে)<\/div><div style="color:#ea580c;font-weight:800;font-size:15px">৳ মূল্য<\/div><\/div>
  <\/div>
  <div class="corow"><div class="cof"><div class="colb">নাম *<\/div><input class="coin" placeholder="আপনার পুরো নাম"\/><\/div><\/div>
  <div class="corow"><div class="cof"><div class="colb">মোবাইল নম্বর *<\/div><input class="coin" placeholder="01XXXXXXXXX" type="tel"\/><\/div><\/div>
  <div class="corow"><div class="cof"><div class="colb">ঠিকানা *<\/div><input class="coin" placeholder="বাড়ি/রোড নম্বর, এলাকা"\/><\/div><\/div>
  <div class="codl"><label class="act">🏙️ ঢাকার ভেতরে<\/label><label>📦 ঢাকার বাইরে<\/label><\/div>
  <div class="corow"><div class="cof"><div class="colb">পেমেন্ট পদ্ধতি<\/div><select class="cosel"><option>💵 ক্যাশ অন ডেলিভারি<\/option><option>📱 bKash<\/option><\/select><\/div><\/div>
  <button class="cobtn">✅ অর্ডার কনফার্ম করুন<\/button>
  <div class="cotr"><span class="cobdg">🔒 নিরাপদ<\/span><span class="cobdg">💵 ক্যাশ অন ডেলিভারি<\/span><span class="cobdg">🚚 দ্রুত ডেলিভারি<\/span><span class="cobdg">✅ অরিজিনাল<\/span><\/div>
<\/div><\/div>`;

function injectCheckoutPreview(rawHtml: string): string {
  const injection = `<div id="store-landing-checkout" style="padding:20px 0">
    <div style="text-align:center;margin-bottom:12px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;padding:8px;background:#0f172a;border-radius:8px 8px 0 0;">
      ⚙️ Checkout Preview — Real form loads on published page
    <\/div>` + CHECKOUT_PREVIEW_HTML;
  let result = rawHtml;
  result = result.replace(/<div id="store-landing-checkout"[^>]*>/g, injection);
  result = result.replace(/<div id="kothbel-landing-checkout"[^>]*>/g, injection);
  return result;
}

export default function LandingEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const showToast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [pageData, setPageData] = useState<any>(null);
  const [storeSettings, setStoreSettings] = useState<any>({});
  const [activePanel, setActivePanel] = useState<'code' | 'preview'>('code');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isMounted, setIsMounted] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [hasAiKey, setHasAiKey] = useState<boolean | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsMounted(true);
    adminFetch('/settings/all').then((data: any) => {
      const s = data?.settings || data?.data?.settings || {};
      setStoreSettings(s);
      setHasAiKey(!!(s?.ai?.gemini_key || s?.ai?.openrouter_key));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const d = await adminFetch(`/landing/${id}`);
        if (d) {
          const h = String(d.sections || DEFAULT_HTML);
          setHtmlContent(h);
          setPreviewHtml(injectCheckoutPreview(h));
          setIsActive(d.is_active || false);
          setPageData(d);
        }
      } catch (err: any) { showToast(err.message || 'Failed to load', 'error'); }
      finally { setLoading(false); }
    })();
  }, [id, showToast]);

  const handleCodeChange = useCallback((val: string) => {
    setHtmlContent(val || '');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPreviewHtml(injectCheckoutPreview(val || '')), 800);
  }, []);

  const handlePanelSwitch = (panel: 'code' | 'preview') => {
    if (panel === 'preview') setPreviewHtml(injectCheckoutPreview(htmlContent));
    setActivePanel(panel);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminFetch(`/landing/${id}`, { method: 'PUT', body: JSON.stringify({ sections: htmlContent, is_active: isActive }) });
      showToast('Landing page saved!', 'success');
    } catch (err: any) { showToast(err.message || 'Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const getAiPrompt = (): string => {
    if (!pageData) return '';
    const images = Array.isArray(pageData.images) ? pageData.images : [];
    const hasVariants = pageData.variants?.length > 0;
    const variantsList = (pageData.variants || []).map((v: any) => `- ${v.name} (${v.price} BDT)`).join('\n');
    let variantNote = hasVariants ? `\n# Variants\n${variantsList}\nDo NOT build a variant selector — the checkout system handles it.\n` : '';
    const hasBangla = /[\u0980-\u09FF]/.test(pageData.title || '');
    const lang = hasBangla ? 'Write ALL copywriting in persuasive Bengali. Use emojis.' : 'Write in English.';
    const desc = (pageData.description || '').replace(/<[^>]+>/g, '').trim();
    const sName = storeSettings?.store_name || storeSettings?.layout?.store_name || 'Our Store';
    return `You are a world-class Landing Page Developer & Copywriter for the Bangladeshi e-commerce market.
${lang}

# Store: ${sName}

# Product
- Title: ${pageData.title}
- Price: ${pageData.base_price} BDT${pageData.original_price ? `\n- Original Price: ${pageData.original_price} BDT` : ''}
${desc ? `- Description: ${desc}` : ''}${variantNote}
${images.length > 0 ? `# Images\n- Main: ${images[0]}${images.slice(1, 3).map((img: string) => `\n- Extra: ${img}`).join('')}` : ''}

# Requirements
1. Output ONLY full HTML (<!DOCTYPE html> ... </html>). Include Tailwind CDN in <head>.
2. Mobile-first, fully responsive.
3. Include Google Fonts (Hind Siliguri for Bengali).
4. No <script> tags except Tailwind CDN.
5. Use {{product.title}}, {{product.price}}, {{product.image}} as shortcodes.
6. ALL CTA / Buy / Order buttons MUST have class="store-buy-now" (no href, no onclick).
7. CRITICAL — include EXACTLY this div near the bottom (do not change id):
   <div id="store-landing-checkout" class="relative w-full max-w-5xl mx-auto z-10 px-4 py-10"></div>

# Design
- Announcement Bar → Hero (image right on desktop) → Social Proof Strip → Features (3 cards) → FAQ Accordion → Testimonials → Final CTA → Checkout Mount → Footer
- Pulsing CTA animation, trust badges, premium gradients`;
  };

  const handleAiGenerate = async () => {
    const prompt = getAiPrompt();
    if (!prompt) { showToast('Product data not loaded.', 'error'); return; }
    setIsGenerating(true); setAiError('');
    try {
      const res = await fetch('/api/v1/ai/landing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
      const data = await res.json();
      if (data.success && data.html) {
        setHtmlContent(data.html); setPreviewHtml(injectCheckoutPreview(data.html));
        setShowAiModal(false); setActivePanel('preview');
        showToast(`Generated with ${data.provider || 'AI'}! Review & save.`, 'success');
      } else { setAiError(data.message || 'Generation failed.'); }
    } catch (err: any) { setAiError(err.message || 'Network error.'); }
    finally { setIsGenerating(false); }
  };

  const TB = ({ style, ...p }: any) => (
    <button {...p} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', ...style }} />
  );

  if (loading) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1117', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 36, height: 36, border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      <p style={{ color: '#6e7681', fontSize: 13 }}>Loading builder...</p>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const S = {
    wrap: { position: 'fixed' as const, inset: 0, zIndex: 40, display: 'flex', flexDirection: 'column' as const, background: '#0d1117', fontFamily: 'system-ui,sans-serif' },
    bar: { height: 48, background: '#161b22', borderBottom: '1px solid #30363d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', flexShrink: 0 },
    toggle: (active: boolean) => ({ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500 as const, border: 'none', cursor: 'pointer' as const, background: active ? '#2563eb' : 'transparent', color: active ? '#fff' : '#6e7681', transition: 'all .15s' }),
    btn: (bg: string) => ({ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: bg, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600 as const, cursor: 'pointer' as const }),
    iconBtn: { padding: '5px 7px', background: 'transparent', color: '#6e7681', border: '1px solid #30363d', borderRadius: 8, cursor: 'pointer' as const, display: 'flex', alignItems: 'center' as const },
    devBtn: (active: boolean) => ({ padding: '4px 7px', border: 'none', borderRadius: 5, cursor: 'pointer' as const, background: active ? '#21262d' : 'transparent', color: active ? '#f0f6fc' : '#6e7681', display: 'flex' as const, alignItems: 'center' as const }),
    panelHdr: { height: 28, background: '#21262d', borderBottom: '1px solid #30363d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0 },
    overlay: { position: 'fixed' as const, inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', padding: 16 },
    modal: { background: '#161b22', border: '1px solid #30363d', borderRadius: 20, boxShadow: '0 8px 64px rgba(0,0,0,.5)', width: '100%', maxWidth: 440 },
    mhdr: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #30363d' },
  };

  return (
    <div style={S.wrap}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* TOOLBAR */}
      <div style={S.bar}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <TB onClick={() => router.back()} style={{ gap: 4, color: '#8b949e', fontSize: 12, padding: '4px 8px', borderRadius: 6 }}>
            <ArrowLeft size={13} /> <span style={{ display: 'none' }}>Back</span>
          </TB>
          <div style={{ width: 1, height: 16, background: '#30363d' }} />
          <Code2 size={14} style={{ color: '#58a6ff', flexShrink: 0 }} />
          <span style={{ color: '#f0f6fc', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{pageData?.title || 'Landing Page Builder'}</span>
          {isActive && <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#3fb950', fontSize: 11 }}><CheckCircle2 size={10} /> Live</span>}
        </div>

        {/* Center toggle */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#0d1117', border: '1px solid #30363d', borderRadius: 10, padding: 3, gap: 2 }}>
          <button style={S.toggle(activePanel === 'code')} onClick={() => handlePanelSwitch('code')}><Code2 size={12} /> Code</button>
          <button style={S.toggle(activePanel === 'preview')} onClick={() => handlePanelSwitch('preview')}><Eye size={12} /> Preview</button>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 4 }}>
            <span style={{ color: '#6e7681', fontSize: 11 }}>Live</span>
            <div onClick={() => setIsActive(v => !v)} style={{ width: 30, height: 17, borderRadius: 9, background: isActive ? '#238636' : '#21262d', border: '1px solid #30363d', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--bg-color)', position: 'absolute', top: 2, left: isActive ? 15 : 2, transition: 'left .2s' }} />
            </div>
          </div>
          {activePanel === 'preview' && (
            <div style={{ display: 'flex', background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: 3, gap: 2 }}>
              <button style={S.devBtn(previewMode === 'desktop')} onClick={() => setPreviewMode('desktop')} title="Desktop"><Monitor size={12} /></button>
              <button style={S.devBtn(previewMode === 'mobile')} onClick={() => setPreviewMode('mobile')} title="Mobile 390px"><Smartphone size={12} /></button>
            </div>
          )}
          <button style={S.btn('#7c3aed')} onClick={() => setShowAiModal(true)}><Wand2 size={13} /> <span>Generate</span></button>
          <button style={S.iconBtn} onClick={() => setShowPromptModal(true)} title="Copy AI Prompt"><Sparkles size={13} /></button>
          <button style={{ ...S.btn(saving ? '#1d4ed8' : '#2563eb'), opacity: saving ? 0.8 : 1, cursor: saving ? 'not-allowed' : 'pointer' }} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}<span>Save</span>
          </button>
        </div>
      </div>

      {/* WORKSPACE */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* CODE */}
        <div style={{ display: activePanel === 'code' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
          <div style={S.panelHdr}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#ff5f57','#febc2e','#28c840'].map(c => <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'block' }} />)}
              </div>
              <span style={{ color: '#6e7681', fontSize: 11 }}>index.html</span>
            </div>
            <span style={{ color: '#484f58', fontSize: 11 }}>Auto-preview · 800ms debounce</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {isMounted && (
              <CodeMirror value={htmlContent} height="100%" extensions={[html()]} theme={vscodeDark} onChange={handleCodeChange}
                style={{ height: '100%', fontSize: 13 }} basicSetup={{ lineNumbers: true, foldGutter: true, autocompletion: true }} />
            )}
          </div>
        </div>

        {/* PREVIEW */}
        <div style={{ display: activePanel === 'preview' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
          <div style={S.panelHdr}>
            <span style={{ color: '#6e7681', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Eye size={11} /> Live Preview {previewMode === 'mobile' && <span style={{ color: '#484f58' }}>· 390px</span>}
            </span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', background: '#161b22', padding: 16 }}>
            <div style={{
              background: 'var(--bg-color)', width: previewMode === 'mobile' ? 390 : '100%', minHeight: '100%',
              borderRadius: previewMode === 'mobile' ? 32 : 8, border: previewMode === 'mobile' ? '8px solid #21262d' : 'none',
              boxShadow: '0 4px 32px rgba(0,0,0,.4)', overflow: 'hidden', transition: 'width .3s ease',
            }}>
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </div>
        </div>
      </div>

      {/* AI MODAL */}
      {showAiModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.mhdr}>
              <h3 style={{ color: '#f0f6fc', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}><Wand2 size={17} style={{ color: '#a78bfa' }} /> Generate with AI</h3>
              <TB onClick={() => { setShowAiModal(false); setAiError(''); }} style={{ color: '#6e7681', padding: 4, borderRadius: 6 }}><X size={15} /></TB>
            </div>
            <div style={{ padding: 20 }}>
              {hasAiKey === false && (
                <div style={{ background: 'rgba(234,179,8,.08)', border: '1px solid rgba(234,179,8,.25)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <p style={{ color: '#fde047', fontSize: 13, fontWeight: 600, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}><AlertCircle size={13} /> API Key সেট করা নেই</p>
                  <p style={{ color: 'rgba(253,224,71,.6)', fontSize: 12, margin: '0 0 10px' }}>Generate করতে Gemini বা OpenRouter API key লাগবে।</p>
                  <a href="/admin/settings?tab=developer" target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#fde047', textDecoration: 'none' }}>
                    <Settings size={11} /> Settings → AI Config <ExternalLink size={10} />
                  </a>
                </div>
              )}
              {hasAiKey !== false && (
                <div style={{ background: 'rgba(124,58,237,.08)', border: '1px solid rgba(124,58,237,.2)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <p style={{ color: '#c4b5fd', fontSize: 13, fontWeight: 600, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 5 }}><Zap size={13} /> One-click Generation</p>
                  <p style={{ color: '#6e7681', fontSize: 12, margin: '0 0 4px', lineHeight: 1.6 }}>AI আপনার পণ্যের তথ্য ব্যবহার করে সম্পূর্ণ landing page তৈরি করবে। <strong style={{ color: '#8b949e' }}>বর্তমান content replace হবে।</strong></p>
                  {pageData && <p style={{ color: '#484f58', fontSize: 11, margin: 0 }}>Product: <span style={{ color: '#8b949e' }}>{pageData.title}</span></p>}
                </div>
              )}
              {aiError && (
                <div style={{ background: 'rgba(248,81,73,.08)', border: '1px solid rgba(248,81,73,.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <AlertCircle size={13} style={{ color: '#f85149', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <p style={{ color: '#f85149', fontSize: 13, margin: '0 0 4px' }}>{aiError}</p>
                    {(aiError.toLowerCase().includes('key') || aiError.toLowerCase().includes('api')) && (
                      <a href="/admin/settings?tab=developer" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#f85149', textDecoration: 'none', opacity: .8 }}>
                        <Settings size={10} /> Settings → AI Config <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setShowAiModal(false); setAiError(''); }} disabled={isGenerating} style={{ flex: 1, padding: '10px 16px', fontSize: 13, fontWeight: 500, color: '#8b949e', background: '#21262d', border: '1px solid #30363d', borderRadius: 10, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleAiGenerate} disabled={isGenerating} style={{ flex: 1, padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#fff', background: '#7c3aed', border: 'none', borderRadius: 10, cursor: isGenerating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: isGenerating ? .8 : 1 }}>
                  {isGenerating ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : <><Wand2 size={13} /> Generate Now</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROMPT MODAL */}
      {showPromptModal && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, maxWidth: 640, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={S.mhdr}>
              <h3 style={{ color: '#f0f6fc', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}><Sparkles size={15} style={{ color: '#818cf8' }} /> AI Prompt (ChatGPT / Claude / Gemini)</h3>
              <TB onClick={() => setShowPromptModal(false)} style={{ color: '#6e7681', padding: 4, borderRadius: 6 }}><X size={15} /></TB>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
              <pre style={{ color: '#8b949e', fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.7, margin: 0 }}>{getAiPrompt()}</pre>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #30363d', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
              <button onClick={() => setShowPromptModal(false)} style={{ padding: '8px 16px', fontSize: 13, color: '#6e7681', background: 'transparent', border: '1px solid #30363d', borderRadius: 10, cursor: 'pointer' }}>Close</button>
              <button onClick={() => { navigator.clipboard.writeText(getAiPrompt()); showToast('Prompt copied!', 'success'); }} style={{ padding: '8px 20px', fontSize: 13, fontWeight: 600, color: '#fff', background: '#4f46e5', border: 'none', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Copy size={13} /> Copy Prompt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}