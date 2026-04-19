const express = require('express');
const router = express.Router();
const { extractTextFromImage } = require('../services/mistralOcr');
const { queryWHOData } = require('../services/whoApi');
const { getHealthRecommendations } = require('../services/healthfinderApi');
const { factCheckClaim } = require('../services/geminiAgent');

/**
 * POST /api/verify
 * Body: { claim: string } OR multipart with image file + optional claim
 * Returns: Structured fact-check result
 */
router.post('/verify', async (req, res) => {
  const startTime = Date.now();

  try {
    let claimText = req.body?.claim?.trim() || '';
    let ocrText = null;
    let imageProvided = false;

    // Step 1: If image uploaded, run OCR
    if (req.file) {
      imageProvided = true;
      console.log(`🔍 Running OCR on image: ${req.file.originalname} (${req.file.size} bytes)`);

      ocrText = await extractTextFromImage(req.file.buffer, req.file.mimetype);
      console.log(`✅ OCR extracted ${ocrText.length} chars`);

      // Combine OCR text with any manually typed claim
      claimText = claimText
        ? `${ocrText}\n\nAdditional context: ${claimText}`
        : ocrText;
    }

    // Validate we have something to check
    if (!claimText) {
      return res.status(400).json({
        error: 'Please provide a claim text or upload an image containing medical claims.'
      });
    }

    if (claimText.length < 10) {
      return res.status(400).json({
        error: 'Claim is too short. Please provide a more detailed medical claim.'
      });
    }

    console.log(`🧪 Fact-checking claim (${claimText.length} chars)...`);

    // Step 2: Parallel data fetch from WHO + MyHealthfinder
    const [whoData, healthfinderData] = await Promise.all([
      queryWHOData(claimText),
      getHealthRecommendations(claimText)
    ]);

    console.log(`📊 WHO data: ${whoData.length} data points | Healthfinder: ${healthfinderData.length} topics`);

    // Step 3: Run Gemini fact-check
    const factCheckResult = await factCheckClaim(claimText, whoData, healthfinderData);

    // Step 4: Assemble full response
    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      claim: claimText.slice(0, 500), // Truncate for security
      ocrExtracted: imageProvided ? ocrText : null,
      imageProvided,
      verdict: factCheckResult,
      sources: {
        who: whoData.map(d => ({
          name: d.indicator,
          value: d.value,
          year: d.year,
          country: d.country,
          type: 'WHO GHO'
        })),
        healthfinder: healthfinderData.map(t => ({
          title: t.title,
          category: t.category,
          content: t.content?.slice(0, 200),
          url: t.url,
          type: 'MyHealthfinder'
        }))
      },
      meta: {
        processingTimeMs: processingTime,
        dataSourcesQueried: ['WHO Global Health Observatory', 'MyHealthfinder (ODPHP)', 'Gemini 2.0 Flash'],
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('❌ Verify route error:', err.message);
    const message = err.response?.data?.message || err.message || 'Unknown error';
    res.status(500).json({ error: `Verification failed: ${message}` });
  }
});

module.exports = router;
