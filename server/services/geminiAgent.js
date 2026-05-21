const axios = require('axios');

// Models to try in order (names verified via ListModels API)
const MODEL_CONFIGS = [
  { model: 'gemini-3.5-flash',       apiVersion: 'v1beta' },
  { model: 'gemini-3.1-pro',         apiVersion: 'v1beta' },
  { model: 'gemini-3.1-flash-lite',  apiVersion: 'v1beta' },
  { model: 'gemini-2.5-flash-lite',  apiVersion: 'v1beta' },
  { model: 'gemini-2.5-flash',       apiVersion: 'v1beta' },
  { model: 'gemini-2.0-flash-lite',  apiVersion: 'v1beta' },
  { model: 'gemini-2.0-flash',       apiVersion: 'v1beta' },
  { model: 'gemini-flash-latest',    apiVersion: 'v1beta' },
];

const SYSTEM_PROMPT = `You are Med-Verify, an expert medical fact-checker for students, clinicians, and deep-science healthcare researchers.

Your role is to analyze medical/health claims and determine their accuracy based on:
1. Official WHO Global Health Observatory data provided
2. Evidence-based recommendations from MyHealthfinder (ODPHP/HHS)
3. Peer-reviewed research articles from PubMed (NCBI Entrez)
4. Active, recruiting, or completed Clinical Trials from ClinicalTrials.gov
5. Safety advisories, recall alerts, and FDA enforcement reports from OpenFDA
6. Your comprehensive medical and scientific knowledge

VERDICT OPTIONS (choose exactly one):
- "TRUE" — Well-supported by authoritative clinical evidence
- "FALSE" — Directly contradicted by clinical / scientific evidence
- "MISLEADING" — Partially true but missing critical context, exaggerated, or cherry-picked
- "UNVERIFIED" — Insufficient clinical evidence to confirm or deny; needs targeted research

RESPONSE FORMAT — Return ONLY valid JSON matching this exact structure:
{
  "verdict": "TRUE|FALSE|MISLEADING|UNVERIFIED",
  "confidence": <integer 0-100>,
  "headline": "<one sentence summary of the verdict>",
  "explanation": "<1-2 paragraph highly detailed explanation for a clinical/scientific audience>",
  "keyFacts": [
    "<specific fact 1 with data if available>",
    "<specific fact 2>",
    "<specific fact 3>"
  ],
  "warnings": ["<any critical safety warning if relevant, or empty array>"],
  "relatedTopics": ["<topic 1>", "<topic 2>", "<topic 3>"],
  "bibliography": {
    "pubmed": [
      {
        "title": "<matching study title>",
        "authors": "<authors list>",
        "journal": "<journal name>",
        "year": "<publish year>",
        "url": "<pubmed direct url>"
      }
    ],
    "clinicalTrials": [
      {
        "nctId": "<NCT number>",
        "title": "<clinical study title>",
        "status": "<study recruiting status>",
        "phase": "<phase details>",
        "url": "<clinical trials direct url>"
      }
    ],
    "fdaAlerts": [
      {
        "recallNumber": "<FDA recall number>",
        "productDescription": "<affected product details>",
        "reasonForRecall": "<manufacturing defect or reason>",
        "recallingFirm": "<company name>",
        "status": "<recall status>"
      }
    ]
  }
}

Be precise, cite the provided WHO/Healthfinder/scientific data where relevant, and never recommend specific treatments. Always advise consulting healthcare professionals for personal medical decisions.`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    verdict: {
      type: "STRING",
      enum: ["TRUE", "FALSE", "MISLEADING", "UNVERIFIED"]
    },
    confidence: {
      type: "INTEGER"
    },
    headline: {
      type: "STRING"
    },
    explanation: {
      type: "STRING"
    },
    keyFacts: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    warnings: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    relatedTopics: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    bibliography: {
      type: "OBJECT",
      properties: {
        pubmed: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              authors: { type: "STRING" },
              journal: { type: "STRING" },
              year: { type: "STRING" },
              url: { type: "STRING" }
            },
            required: ["title", "authors", "journal", "year", "url"]
          }
        },
        clinicalTrials: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              nctId: { type: "STRING" },
              title: { type: "STRING" },
              status: { type: "STRING" },
              phase: { type: "STRING" },
              url: { type: "STRING" }
            },
            required: ["nctId", "title", "status", "phase", "url"]
          }
        },
        fdaAlerts: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              recallNumber: { type: "STRING" },
              productDescription: { type: "STRING" },
              reasonForRecall: { type: "STRING" },
              recallingFirm: { type: "STRING" },
              status: { type: "STRING" }
            },
            required: ["recallNumber", "productDescription", "reasonForRecall", "recallingFirm", "status"]
          }
        }
      },
      required: ["pubmed", "clinicalTrials", "fdaAlerts"]
    }
  },
  required: ["verdict", "confidence", "headline", "explanation", "keyFacts", "warnings", "relatedTopics", "bibliography"]
};

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
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA
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
async function factCheckClaim(claim, whoData, healthfinderData, pubmedData = [], trialsData = [], fdaData = []) {
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

  // Build context from PubMed
  const pubmedContext = pubmedData.length > 0
    ? `\n## PubMed Peer-Reviewed Literature:\n${pubmedData.map((p, idx) =>
        `### Study [${idx + 1}]: ${p.title}\nAuthors: ${p.authors}\nJournal: ${p.journal} (${p.year})\nURL: ${p.url}`
      ).join('\n\n')}`
    : '\n## PubMed Literature: No directly matching papers found.';

  // Build context from ClinicalTrials.gov
  const trialsContext = trialsData.length > 0
    ? `\n## ClinicalTrials.gov Ongoing and Completed Studies:\n${trialsData.map((t, idx) =>
        `### Trial [${idx + 1}]: ${t.title}\nNCT ID: ${t.nctId} | Status: ${t.status} | Phase: ${t.phase}\nConditions: ${t.conditions.join(', ')}\nURL: ${t.url}`
      ).join('\n\n')}`
    : '\n## ClinicalTrials: No matching clinical studies found.';

  // Build context from OpenFDA recall database
  const fdaContext = fdaData.length > 0
    ? `\n## OpenFDA Safety Alerts and Drug Recall Reports:\n${fdaData.map((f, idx) =>
        `### Alert [${idx + 1}]: ${f.productDescription}\nRecall Number: ${f.recallNumber} | Status: ${f.status} | Classification: ${f.classification}\nReason for Recall: ${f.reasonForRecall}\nRecalling Firm: ${f.recallingFirm} | Date: ${f.recallInitiationDate}`
      ).join('\n\n')}`
    : '\n## OpenFDA recalls: No matching drug enforcement safety alerts found.';

  const userPrompt = `Please fact-check the following medical claim:

## CLAIM TO VERIFY:
"${claim}"

${whoContext}

${healthfinderContext}

${pubmedContext}

${trialsContext}

${fdaContext}

Based on the data above and your medical knowledge, provide your fact-check analysis as JSON. Specifically, map the provided pubmedData, trialsData, and fdaData into the 'bibliography' structure inside your JSON response, expanding or validating details based on your comprehensive clinical and scientific expertise. Keep the URL references exact.`;

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
        const parsed = JSON.parse(jsonText);
        parsed._modelUsed = model;
        return parsed;
      } catch (parseErr) {
        console.error('⚠️ JSON parse failed, attempting regex recovery...', parseErr.message);
        
        const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawText];
        const jsonText = (jsonMatch[1] || rawText).trim();

        // Attempt to extract fields using regex
        const verdictMatch = jsonText.match(/"verdict"\s*:\s*"([^"]+)"/);
        const confidenceMatch = jsonText.match(/"confidence"\s*:\s*(\d+)/);
        const headlineMatch = jsonText.match(/"headline"\s*:\s*"([^"]+)"/);
        
        // Match explanation (handle potential truncation)
        let explanation = '';
        const explanationMatch = jsonText.match(/"explanation"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"[a-zA-Z]+"\s*:|"\s*}\s*$|$)/);
        if (explanationMatch) {
          explanation = explanationMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
        }

        // Match arrays
        const keyFacts = [];
        const keyFactsMatch = jsonText.match(/"keyFacts"\s*:\s*\[([\s\S]*?)\]/);
        if (keyFactsMatch) {
          const itemsRaw = keyFactsMatch[1].split(',');
          for (let item of itemsRaw) {
            item = item.trim().replace(/^"|"$/g, '').trim();
            if (item && !item.startsWith('[')) keyFacts.push(item.replace(/\\"/g, '"'));
          }
        }

        const warnings = [];
        const warningsMatch = jsonText.match(/"warnings"\s*:\s*\[([\s\S]*?)\]/);
        if (warningsMatch) {
          const itemsRaw = warningsMatch[1].split(',');
          for (let item of itemsRaw) {
            item = item.trim().replace(/^"|"$/g, '').trim();
            if (item) warnings.push(item.replace(/\\"/g, '"'));
          }
        }

        const relatedTopics = [];
        const relatedTopicsMatch = jsonText.match(/"relatedTopics"\s*:\s*\[([\s\S]*?)\]/);
        if (relatedTopicsMatch) {
          const itemsRaw = relatedTopicsMatch[1].split(',');
          for (let item of itemsRaw) {
            item = item.trim().replace(/^"|"$/g, '').trim();
            if (item) relatedTopics.push(item.replace(/\\"/g, '"'));
          }
        }

        if (verdictMatch) {
          console.log(`✅ Regex recovery successful! Extracted verdict: ${verdictMatch[1]}`);
          return {
            verdict: verdictMatch[1].toUpperCase(),
            confidence: confidenceMatch ? parseInt(confidenceMatch[1], 10) : 70,
            headline: headlineMatch ? headlineMatch[1].replace(/\\"/g, '"') : 'Analysis Completed',
            explanation: explanation || 'Please see the key facts for details.',
            keyFacts,
            warnings,
            relatedTopics,
            bibliography: {
              pubmed: pubmedData,
              clinicalTrials: trialsData,
              fdaAlerts: fdaData
            },
            _modelUsed: model,
            _recovered: true
          };
        }

        console.error('❌ Regex recovery failed. Returning fallback object.');
        return {
          verdict: 'UNVERIFIED',
          confidence: 0,
          headline: 'Analysis returned unexpected format.',
          explanation: rawText,
          keyFacts: [],
          warnings: [],
          relatedTopics: [],
          bibliography: {
            pubmed: pubmedData,
            clinicalTrials: trialsData,
            fdaAlerts: fdaData
          },
          _modelUsed: model
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
