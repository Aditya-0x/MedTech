const axios = require('axios');

// Models to try in order (names verified via ListModels API)
const MODEL_CONFIGS = [
  { model: 'gemini-2.5-flash-lite',  apiVersion: 'v1beta' },
  { model: 'gemini-2.5-flash',       apiVersion: 'v1beta' },
  { model: 'gemini-2.0-flash-lite',  apiVersion: 'v1beta' },
  { model: 'gemini-2.0-flash',       apiVersion: 'v1beta' },
  { model: 'gemini-flash-latest',    apiVersion: 'v1beta' },
];

const SYSTEM_PROMPT = `You are Med-Verify, an expert medical fact-checker for students and healthcare researchers.

Your role is to analyze medical/health claims and determine their accuracy based on:
1. Official WHO Global Health Observatory data provided
2. Evidence-based recommendations from MyHealthfinder (ODPHP/HHS)
3. Your comprehensive medical knowledge

VERDICT OPTIONS (choose exactly one):
- "TRUE" — Well-supported by authoritative evidence
- "FALSE" — Directly contradicted by scientific evidence
- "MISLEADING" — Partially true but missing critical context or exaggerated
- "UNVERIFIED" — Insufficient evidence to confirm or deny; needs clinical research

RESPONSE FORMAT — Return ONLY valid JSON matching this exact structure:
{
  "verdict": "TRUE|FALSE|MISLEADING|UNVERIFIED",
  "confidence": <integer 0-100>,
  "headline": "<one sentence summary of the verdict>",
  "explanation": "<2-4 paragraph detailed explanation for a medical student audience>",
  "keyFacts": [
    "<specific fact 1 with data if available>",
    "<specific fact 2>",
    "<specific fact 3>"
  ],
  "warnings": ["<any critical safety warning if relevant, or empty array>"],
  "relatedTopics": ["<topic 1>", "<topic 2>", "<topic 3>"]
}

Be precise, cite the provided WHO/Healthfinder data where relevant, and never recommend specific treatments. Always advise consulting healthcare professionals for personal medical decisions.`;

/**
 * Call Gemini REST API directly with a specific model + API version
 */
async function callGeminiREST(model, apiVersion, prompt) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY in environment variables. Please configure it in your Vercel project settings.');
  }
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
    }
  };

  const response = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 45000
  });

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

/**
 * Fact-check a medical claim — tries multiple models/API-versions
 */
async function factCheckClaim(claim, whoData, healthfinderData) {
  // Build context from WHO data
  const whoContext = whoData.length > 0
    ? `\n## WHO Global Health Observatory Data:\n${whoData.map(d =>
        `- ${d.indicator}: ${d.value !== null && d.value !== undefined ? Number(d.value).toFixed(2) : 'N/A'} (${d.country}, ${d.year})`
      ).join('\n')}`
    : '\n## WHO Data: No directly relevant indicators found.';

  // Build context from Healthfinder
  const healthfinderContext = healthfinderData.length > 0
    ? `\n## MyHealthfinder (ODPHP/HHS) Evidence-Based Content:\n${healthfinderData.map(t =>
        `### ${t.title}\nCategory: ${t.category}\n${t.content}`
      ).join('\n\n')}`
    : '\n## MyHealthfinder: No directly matching topics found.';

  const userPrompt = `Please fact-check the following medical claim:

## CLAIM TO VERIFY:
"${claim}"

${whoContext}

${healthfinderContext}

Based on the data above and your medical knowledge, provide your fact-check analysis as JSON.`;

  let lastError = null;

  for (const { model, apiVersion } of MODEL_CONFIGS) {
    try {
      console.log(`🤖 Trying ${model} (${apiVersion})`);
      const rawText = await callGeminiREST(model, apiVersion, userPrompt);
      console.log(`✅ ${model} responded (${rawText.length} chars)`);

      // Parse JSON — handle markdown code fences
      try {
        const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawText];
        const jsonText = (jsonMatch[1] || rawText).trim();
        return JSON.parse(jsonText);
      } catch {
        console.error('JSON parse failed, trying next model or returning raw');
        return {
          verdict: 'UNVERIFIED',
          confidence: 0,
          headline: 'Analysis returned unexpected format.',
          explanation: rawText,
          keyFacts: [],
          warnings: [],
          relatedTopics: []
        };
      }

    } catch (err) {
      const status = err.response?.status || 0;
      const msg = err.response?.data?.error?.message || err.message || '';
      const isRecoverable = status === 429 || status === 404 || status === 503 ||
        msg.includes('quota') || msg.includes('not found') || msg.includes('RESOURCE_EXHAUSTED');

      console.warn(`⚠️  ${model} (${apiVersion}): ${status} — ${msg.slice(0, 80)}`);

      if (isRecoverable) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw new Error(`All Gemini models unavailable. Last: ${lastError?.response?.data?.error?.message?.slice(0, 200) || lastError?.message || 'unknown'}`);
}

module.exports = { factCheckClaim };
