const axios = require('axios');

// Models to try in order (consistent with main verification agent)
const MODEL_CONFIGS = [
  { model: 'gemini-3.5-flash', apiVersion: 'v1beta' },
  { model: 'gemini-3.1-pro', apiVersion: 'v1beta' },
  { model: 'gemini-3.1-flash-lite', apiVersion: 'v1beta' },
  { model: 'gemini-2.5-flash-lite', apiVersion: 'v1beta' },
  { model: 'gemini-2.5-flash', apiVersion: 'v1beta' },
  { model: 'gemini-2.0-flash-lite', apiVersion: 'v1beta' },
  { model: 'gemini-2.0-flash', apiVersion: 'v1beta' },
  { model: 'gemini-flash-latest', apiVersion: 'v1beta' },
];

const SYSTEM_PROMPT = `You are Med-Verify TruMeds, an expert clinical pharmacologist and drug synthesis agent specializing in the Indian pharmaceutical market.
Your task is to analyze manual medicine searches or visual images of medicine packaging, strips, or handwritten prescriptions to:
1. Identify the brand-name medicine.
2. Resolve it to its exact generic formulation / active chemical ingredient.
3. Determine the therapeutic class, typical dosage formulation, and a clear clinical description.
4. Estimate realistic price indexes comparison strictly in Indian Rupees (INR / ₹) for the Indian market (comparing standard branded drug prices in India with affordable generic equivalents like Jan Aushadhi products), computing the savings percentage. 
   CRITICAL: Prices MUST represent actual monthly (30-day course) Indian retail market costs in INR. DO NOT guess, extrapolate, or invent simulated prices using arbitrary conversion multipliers (e.g. converting USD prices). If you do not have high-confidence, verified knowledge of the actual real-world retail brand or generic price in the Indian domestic market, you MUST output 0 for both 'avgPriceBrand' and 'avgPriceGeneric', and set 'savingsPercentage' to 0.
5. Highlight critical safety precautions or clinical warnings (contraindications, side-effects).

RESPONSE FORMAT — Return ONLY valid JSON matching this exact structure:
{
  "brandName": "<e.g., Lipitor>",
  "genericName": "<e.g., Atorvastatin>",
  "therapeuticClass": "<e.g., Statin / HMG-CoA Reductase Inhibitor>",
  "dosageFormulation": "<e.g., 10mg, 20mg Tablets>",
  "clinicalUsage": "<brief summary of what the medicine treats and its mechanism of action>",
  "avgPriceBrand": <number, estimated avg cost in INR for 30 days supply, e.g. 400.00>,
  "avgPriceGeneric": <number, estimated generic/Jan Aushadhi cost in INR for 30 days supply, e.g. 45.00>,
  "savingsPercentage": <integer representing savings, e.g. 88>,
  "safetyPrecautions": [
    "<precaution 1>",
    "<precaution 2>",
    "<precaution 3>"
  ]
}

Be clinically precise and strictly return only the JSON payload.`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    brandName: { type: "STRING" },
    genericName: { type: "STRING" },
    therapeuticClass: { type: "STRING" },
    dosageFormulation: { type: "STRING" },
    clinicalUsage: { type: "STRING" },
    avgPriceBrand: { type: "NUMBER" },
    avgPriceGeneric: { type: "NUMBER" },
    savingsPercentage: { type: "INTEGER" },
    safetyPrecautions: {
      type: "ARRAY",
      items: { type: "STRING" }
    }
  },
  required: [
    "brandName",
    "genericName",
    "therapeuticClass",
    "dosageFormulation",
    "clinicalUsage",
    "avgPriceBrand",
    "avgPriceGeneric",
    "savingsPercentage",
    "safetyPrecautions"
  ]
};

/**
 * Call Gemini REST API for generic medicine synthesis
 */
async function callGeminiREST(model, apiVersion, parts) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY or GOOGLE_API_KEY in environment variables.');
  }
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    contents: [
      {
        role: 'user',
        parts: parts
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2000,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA
    }
  };

  const response = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 20000
  });

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

/**
 * Analyze an uploaded medicine image or text query to extract and map generic details
 * @param {Object} options
 * @param {Buffer} [options.imageBuffer] - Image buffer if analyzing image
 * @param {string} [options.mimeType] - Mime-type of the image (e.g., image/jpeg)
 * @param {string} [options.brandSearch] - Manual brand text search if no image
 * @returns {Promise<Object>} Analyzed drug generic structure
 */
async function analyzeGenericMedicine({ imageBuffer, mimeType, brandSearch }) {
  const parts = [];

  if (imageBuffer) {
    const base64Image = imageBuffer.toString('base64');
    parts.push({
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: base64Image
      }
    });
    parts.push({
      text: 'Analyze this image containing medicine packaging, strip, bottle, or doctor prescription. Identify the medication, provide its exact generic counterpart, active chemical ingredient, therapeutic class, average pricing, and clinical precautions as requested in the JSON schema.'
    });
  } else if (brandSearch && brandSearch.trim()) {
    parts.push({
      text: `Identify the generic details for the brand name medicine: "${brandSearch}". Provide accurate clinical mapping and pricing comparison in the requested JSON schema.`
    });
  } else {
    throw new Error('Either an image prescription or manual brand-name medicine search must be provided.');
  }

  let lastError = null;
  for (const { model, apiVersion } of MODEL_CONFIGS) {
    try {
      console.log(`🤖 TruMeds: Trying drug analysis with ${model}...`);
      const rawText = await callGeminiREST(model, apiVersion, parts);

      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawText];
      const jsonText = (jsonMatch[1] || rawText).trim();
      const parsed = JSON.parse(jsonText);
      parsed._modelUsed = model;
      return parsed;

    } catch (err) {
      const status = err.response?.status || 0;
      const msg = err.response?.data?.error?.message || err.message || '';
      console.warn(`⚠️ TruMeds error with model ${model} (${apiVersion}): ${status} - ${msg.slice(0, 80)}`);

      // Retry for rate-limiting, temporary outages, model availability (404), or timeouts
      const isRecoverable = status === 429 || status === 404 || status === 503 || status === 500 || status === 0 ||
        msg.includes('quota') || msg.includes('not found') || msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('timeout') || msg.includes('Network Error') || msg.includes('ENOTFOUND');

      if (isRecoverable) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw new Error(`All Gemini models failed to analyze generic medicine. Last: ${lastError?.message || 'unknown'}`);
}

module.exports = { analyzeGenericMedicine };
