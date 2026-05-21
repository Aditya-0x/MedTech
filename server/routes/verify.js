const express = require('express');
const router = express.Router();
const multer = require('multer');
const { extractTextFromImage } = require('../services/mistralOcr');
const { queryWHOData } = require('../services/whoApi');
const { getHealthRecommendations } = require('../services/healthfinderApi');
const { factCheckClaim } = require('../services/geminiAgent');
const { searchPubMed } = require('../services/pubmedService');
const { searchClinicalTrials } = require('../services/clinicalTrialsService');
const { searchFdaAlerts } = require('../services/openFdaService');

// Multer in-memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload a JPG, JPEG, PNG, WEBP, or GIF screenshot.'), false);
    }
  }
});

const uploadSingle = upload.single('image');

// Custom middleware to intercept Multer errors gracefully
const handleUpload = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Screenshot exceeds size limit. Please upload an image smaller than 10MB.' });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

/**
 * POST /api/verify
 * Body: { claim: string } OR multipart with image file + optional claim
 * Returns: Structured fact-check result
 */
router.post('/verify', handleUpload, async (req, res) => {
  const startTime = Date.now();

  try {
    let claimText = req.body?.claim?.trim() || '';
    let ocrText = null;
    let imageProvided = false;

    // Step 1: If image uploaded, run OCR
    if (req.file) {
      imageProvided = true;
      console.log(`🔍 Running OCR on image: ${req.file.originalname} (${req.file.size} bytes)`);

      try {
        ocrText = await extractTextFromImage(req.file.buffer, req.file.mimetype);
      } catch (ocrErr) {
        console.error('❌ OCR API call failed:', ocrErr.message);
        return res.status(422).json({
          error: 'Failed to extract text from the image. Please ensure it is not corrupted and try again.'
        });
      }

      console.log(`✅ OCR extracted ${ocrText ? ocrText.length : 0} chars`);

      // Empty / Unreadable OCR check
      if (imageProvided && (!ocrText || ocrText.trim().length < 10) && !req.body?.claim?.trim()) {
        return res.status(400).json({
          error: 'The uploaded screenshot does not seem to contain readable text. Please try another image or type your claim manually.'
        });
      }

      // Combine OCR text with any manually typed claim
      if (ocrText && ocrText.trim()) {
        claimText = claimText
          ? `${ocrText}\n\nAdditional context: ${claimText}`
          : ocrText;
      }
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

    // Step 2: Parallel data fetch from all 5 databases
    const [whoData, healthfinderData, pubmedData, trialsData, fdaData] = await Promise.all([
      queryWHOData(claimText).catch(() => []),
      getHealthRecommendations(claimText).catch(() => []),
      searchPubMed(claimText).catch(() => []),
      searchClinicalTrials(claimText).catch(() => []),
      searchFdaAlerts(claimText).catch(() => [])
    ]);

    console.log(`📊 WHO: ${whoData.length} | Healthfinder: ${healthfinderData.length} | PubMed: ${pubmedData.length} | ClinicalTrials: ${trialsData.length} | OpenFDA: ${fdaData.length}`);

    // Step 3: Run Gemini fact-check with the deep-science evidence base
    const factCheckResult = await factCheckClaim(claimText, whoData, healthfinderData, pubmedData, trialsData, fdaData);

    // Step 4: Assemble full response
    const processingTime = Date.now() - startTime;

    const modelFriendlyName = factCheckResult._modelUsed
      ? `Google ${factCheckResult._modelUsed}`
      : 'Google Gemini AI';

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
        })),
        pubmed: pubmedData,
        clinicalTrials: trialsData,
        fdaAlerts: fdaData
      },
      meta: {
        processingTimeMs: processingTime,
        dataSourcesQueried: [
          'WHO Global Health Observatory',
          'MyHealthfinder (ODPHP)',
          'PubMed Peer-Reviewed Literature',
          'ClinicalTrials.gov Registries',
          'OpenFDA Safety Recalls',
          modelFriendlyName
        ],
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('❌ Verify route error:', err.message);
    const message = err.response?.data?.error?.message 
      || err.response?.data?.message 
      || err.message 
      || 'Unknown error';
    res.status(500).json({ error: `Verification failed: ${message}` });
  }
});

module.exports = router;
