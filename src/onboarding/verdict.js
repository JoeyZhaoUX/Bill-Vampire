import { callAi, RateLimitError } from '../aiClient';
export { RateLimitError };

const CURRENCIES = {
  USD: { rate: 1 }, CNY: { rate: 0.14 }, EUR: { rate: 1.08 },
  GBP: { rate: 1.26 }, JPY: { rate: 0.0067 }, HKD: { rate: 0.128 },
};

const CATEGORY_VALUES = ['Entertainment', 'Productivity', 'Lifestyle', 'Other'];

export function monthlyUsd(sub) {
  const price = parseFloat(sub.price) || 0;
  const rate = CURRENCIES[sub.currency || 'USD']?.rate ?? 1;
  const usd = price * rate;
  return sub.cycle === 'yearly' ? usd / 12 : usd;
}

export function totalMonthlyUsd(subs) {
  return subs.reduce((acc, s) => acc + monthlyUsd(s), 0);
}

export function tenYearTotalUsd(subs) {
  return totalMonthlyUsd(subs) * 12 * 10;
}

export function rankByLifetimeWaste(subs) {
  return [...subs]
    .map(s => ({ ...s, _monthlyUsd: monthlyUsd(s), _tenYearUsd: monthlyUsd(s) * 120 }))
    .sort((a, b) => b._tenYearUsd - a._tenYearUsd);
}

const EXTRACT_SYSTEM_PROMPT = 'You are a bill extraction expert. Extract all subscription / recurring billing line-items from the user\'s text, image, or PDF. Return a JSON array where each element has: name (string), price (numeric amount), currency (one of USD/CNY/EUR/GBP/JPY/HKD), cycle ("monthly" or "yearly"), category (one of Entertainment/Productivity/Lifestyle/Other), next_charge_at (ISO 8601 date string for the next billing date, or null if not inferable). Use reasonable defaults for uncertain fields. Return ONLY the JSON array, no prose.';

export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function extractBills({ text, file }) {
  const parts = [];
  if (text && text.trim()) parts.push({ text: text.trim() });
  if (file) {
    const base64 = await fileToBase64(file);
    parts.push({ inline_data: { mime_type: file.type, data: base64 } });
  }
  if (!parts.length) return [];
  if (parts.every(p => !p.text)) {
    parts.unshift({ text: 'Extract subscription / billing information from this image or document.' });
  }
  const data = await callAi({
    contents: [{ parts }],
    systemInstruction: { parts: [{ text: EXTRACT_SYSTEM_PROMPT }] },
    generationConfig: { responseMimeType: 'application/json' },
  });
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  const parsed = JSON.parse(raw);
  const bills = (Array.isArray(parsed) ? parsed : [parsed])
    .map(b => {
      const nextCharge = b.next_charge_at ? Date.parse(b.next_charge_at) : NaN;
      return {
        name: b.name || 'Unknown',
        price: String(parseFloat(b.price) || 0),
        currency: CURRENCIES[b.currency] ? b.currency : 'USD',
        cycle: b.cycle === 'yearly' ? 'yearly' : 'monthly',
        category: CATEGORY_VALUES.includes(b.category) ? b.category : 'Other',
        nextChargeAt: Number.isFinite(nextCharge) ? nextCharge : null,
        id: Date.now() + Math.random(),
      };
    })
    .filter(b => b.name !== 'Unknown' || parseFloat(b.price) > 0);
  return bills;
}

const VERDICT_SYSTEM_PROMPT = `You are the Bill Vampire's verdict engine — a brutally funny, slightly cruel financial judge. The user just uploaded their subscriptions. Deliver a verdict as a JSON object with this exact shape:

{
  "headline": "one dramatic sentence, max 14 words, about their decade of waste",
  "roasts": ["roast 1", "roast 2", "roast 3", "roast 4", "roast 5"]
}

Each roast is one sharp, specific line about a single subscription in their list (reference the name and the 10-year dollar figure). Use dry, screenshot-worthy humor — not cruel, not preachy. No emojis. No bullet markers. No trailing period on the headline. Return ONLY the JSON object.`;

export async function generateVerdict(subs) {
  if (!subs.length) return { headline: 'Nothing to judge. Suspicious.', roasts: [] };
  const ranked = rankByLifetimeWaste(subs).slice(0, 8);
  const lines = ranked.map(s => `${s.name}: $${s._monthlyUsd.toFixed(2)}/mo → $${s._tenYearUsd.toFixed(0)} over 10 years`).join('\n');
  const total10 = tenYearTotalUsd(subs);
  const userPrompt = `My subscriptions and their 10-year lifetime cost:\n${lines}\n\nTotal 10-year waste: $${total10.toFixed(0)}. Deliver the verdict.`;
  const data = await callAi({
    contents: [{ parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: VERDICT_SYSTEM_PROMPT }] },
    generationConfig: { responseMimeType: 'application/json' },
  });
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const parsed = JSON.parse(raw);
  return {
    headline: typeof parsed.headline === 'string' ? parsed.headline : 'Your wallet has filed a missing-persons report',
    roasts: Array.isArray(parsed.roasts) ? parsed.roasts.filter(r => typeof r === 'string').slice(0, 6) : [],
  };
}

export async function reportVerdictToStats(tenYearUsd) {
  try {
    await fetch('/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usd: Math.round(tenYearUsd) }),
    });
  } catch { /* non-fatal */ }
}
