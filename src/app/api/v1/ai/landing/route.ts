export const runtime = 'edge';

import { siteConfig } from '@/config/site';

const API_URL = siteConfig.apiUrl;

// Fetch AI settings from DB via admin API
async function getAiSettings(req: Request): Promise<{ provider: string; key: string; model: string } | null> {
  try {
    // Forward the admin auth cookie from the incoming request
    const cookie = req.headers.get('cookie') || '';
    const res = await fetch(`${API_URL}/admin/settings/all`, {
      headers: { cookie },
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    const ai = data?.data?.settings?.ai;
    if (!ai) return null;

    const provider = ai.provider || 'gemini';
    const key = provider === 'openrouter' ? ai.openrouter_key : ai.gemini_key;
    const model = ai.model || (provider === 'openrouter' ? 'google/gemini-flash-1.5' : 'gemini-2.0-flash');

    if (!key) return null;
    return { provider, key, model };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { prompt?: string };
    const { prompt } = body;

    if (!prompt) {
      return Response.json({ success: false, message: 'Prompt is required' }, { status: 400 });
    }

    // Try DB settings first, fallback to env var
    const aiSettings = await getAiSettings(req);
    const provider = aiSettings?.provider || 'gemini';
    const apiKey = aiSettings?.key || process.env.GEMINI_API_KEY || '';
    const model = aiSettings?.model || 'gemini-2.0-flash';

    if (!apiKey) {
      return Response.json({
        success: false,
        message: 'AI not configured. Go to Admin → Settings → AI Config to add your API key.',
      }, { status: 500 });
    }

    const fullPrompt = prompt + '\n\nIMPORTANT: Respond with ONLY the raw HTML code. No markdown, no code fences (no ```html), no explanation. Just pure HTML that goes inside <body>.';

    let html = '';

    if (provider === 'openrouter') {
      // ── OpenRouter (OpenAI-compatible) ──────────────────────
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: fullPrompt }],
          max_tokens: 8192,
          temperature: 0.8,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error('OpenRouter error:', err);
        return Response.json({ success: false, message: 'OpenRouter generation failed. Check your API key.' }, { status: 500 });
      }
      const data = await res.json() as any;
      html = data?.choices?.[0]?.message?.content || '';

    } else {
      // ── Google Gemini ────────────────────────────────────────
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
          }),
        }
      );
      if (!res.ok) {
        const err = await res.text();
        console.error('Gemini error:', err);
        return Response.json({ success: false, message: 'Gemini generation failed. Check your API key.' }, { status: 500 });
      }
      const data = await res.json() as any;
      html = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    // Strip markdown code fences if AI still adds them
    html = html.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    return Response.json({ success: true, html, provider, model });
  } catch (err: any) {
    console.error('AI landing route error:', err);
    return Response.json({ success: false, message: err.message || 'Unknown error' }, { status: 500 });
  }
}
