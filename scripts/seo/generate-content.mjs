import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SERVICES } from './services.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const CONTENT_DIR = join(ROOT, 'content/cancel');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable required.');
  console.error('Usage: GEMINI_API_KEY=your-key node scripts/seo/generate-content.mjs');
  process.exit(1);
}

const args = process.argv.slice(2);
const force = args.includes('--force');
const singleService = args.find(a => a.startsWith('--service='))?.split('=')[1];

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function generateForService(service) {
  const outPath = join(CONTENT_DIR, `${service.id}.json`);

  if (!force && existsSync(outPath)) {
    console.log(`  skip: ${service.id} (already exists)`);
    return false;
  }

  const prompt = `Generate a comprehensive, accurate cancellation guide for ${service.name}.
URL to their cancel/account page: ${service.cancelUrl}
Monthly price: ${service.price}
Difficulty: ${service.difficulty}

Output ONLY a valid JSON object (no markdown fences) with these fields:
{
  "title": "How to Cancel ${service.name} — Step-by-Step Guide (2026)",
  "metaDescription": "150-160 character meta description targeting the keyword 'how to cancel ${service.name.toLowerCase()}'",
  "intro": "1-2 sentence overview of the cancellation process",
  "steps": [
    { "title": "Short step title", "text": "Detailed instruction for this step", "tip": "Optional pro tip or null" }
  ],
  "warnings": ["Important thing to watch out for"],
  "faqs": [
    { "q": "Common question about canceling ${service.name}?", "a": "Helpful answer" }
  ],
  "refund": { "eligible": true/false, "details": "Explanation of refund policy" },
  "retentionTactics": ["Tactic the company uses to prevent cancellation"],
  "timeEstimate": "X-Y minutes",
  "lastVerified": "${new Date().toISOString().split('T')[0]}"
}

Requirements:
- Include 4-7 specific, actionable steps (not generic)
- Steps must describe the ACTUAL UI flow for ${service.name} (buttons to click, menus to navigate)
- Include 3-5 unique FAQs relevant to ${service.name}
- Warnings should be specific (e.g., early termination fees, data loss, billing cycle details)
- Be honest about refund eligibility
- timeEstimate should be realistic`;

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`  ERROR: ${service.id} — API ${res.status}: ${errText.slice(0, 200)}`);
      return false;
    }

    const data = await res.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error(`  ERROR: ${service.id} — empty response`);
      return false;
    }

    // Strip markdown fences if present
    text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    const content = JSON.parse(text);

    // Validate required fields
    if (!content.title || !content.steps || content.steps.length < 3) {
      console.error(`  ERROR: ${service.id} — invalid content structure`);
      return false;
    }

    writeFileSync(outPath, JSON.stringify(content, null, 2));
    console.log(`  ✓ ${service.id}`);
    return true;
  } catch (err) {
    console.error(`  ERROR: ${service.id} — ${err.message}`);
    return false;
  }
}

async function main() {
  const services = singleService
    ? SERVICES.filter(s => s.id === singleService)
    : SERVICES;

  if (singleService && services.length === 0) {
    console.error(`Service "${singleService}" not found in registry.`);
    process.exit(1);
  }

  console.log(`Generating content for ${services.length} services${force ? ' (force mode)' : ''}...\n`);

  let generated = 0;
  for (const service of services) {
    const result = await generateForService(service);
    if (result) generated++;
    // Rate limit: 2 second delay between API calls
    if (result !== false || force) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\n✓ Done. Generated ${generated}/${services.length} content files.`);
  console.log(`Content saved to: content/cancel/`);
  console.log(`\nNext: run "npm run seo:build" to generate HTML pages.`);
}

main();
