const express = require('express');
const router = express.Router();
const multer = require('multer');
const { analyzeGenericMedicine } = require('../services/genericDrugService');
const { locatePharmacies } = require('../services/pharmacyLocator');
const zdrScrubber = require('../utils/zdrScrubber');

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
      cb(new Error('Unsupported format. Please upload a JPG, JPEG, PNG, WEBP, or GIF prescription/medicine image.'), false);
    }
  }
});

const uploadSingle = upload.single('image');

// Graceful Multer error interceptor
const handleUpload = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Image exceeds size limit. Please upload an image smaller than 10MB.' });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

/**
 * POST /api/generic/analyze
 * Body: { brandSearch?: string, latitude?: string, longitude?: string }
 * File: image? (multipart prescription/medicine box)
 * Returns: Mapped generic drug synthesis report and sorted pharmacies list
 */
router.post('/generic/analyze', handleUpload, async (req, res) => {
  const startTime = Date.now();

  try {
    let brandSearch = req.body?.brandSearch?.trim() || '';
    const latitude = parseFloat(req.body?.latitude);
    const longitude = parseFloat(req.body?.longitude);

    // Apply HIPAA compliant ZDR pass if searching by manual string
    if (brandSearch) {
      brandSearch = zdrScrubber.scrub(brandSearch);
    }

    if (!req.file && !brandSearch) {
      return res.status(400).json({
        error: 'Please upload an image of a prescription/medicine or enter a brand name to search.'
      });
    }

    console.log(`🧪 TruMeds Analysis started... User Lat: ${latitude || 'N/A'}, Lng: ${longitude || 'N/A'}`);

    // Step 1: Call Gemini Vision OCR / Text Drug Analyzer
    let genericReport = null;
    try {
      genericReport = await analyzeGenericMedicine({
        imageBuffer: req.file ? req.file.buffer : null,
        mimeType: req.file ? req.file.mimetype : null,
        brandSearch: req.file ? null : brandSearch
      });
    } catch (apiErr) {
      console.error('❌ Generic Drug mapping service error:', apiErr.message);
      return res.status(500).json({
        error: `Failed to map generic drug: ${apiErr.message}`
      });
    }

    // Step 2: Fetch and sort nearby pharmacies using coordinates (or default to Bangalore fallbacks if not provided)
    let pharmacies = [];
    try {
      pharmacies = await locatePharmacies(latitude, longitude);
    } catch (locatorErr) {
      console.error('⚠️ Locator service fell back:', locatorErr.message);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ TruMeds analysis complete in ${duration}ms! Found ${pharmacies.length} shops.`);

    res.json({
      success: true,
      report: {
        brandName: genericReport.brandName,
        genericName: genericReport.genericName,
        therapeuticClass: genericReport.therapeuticClass,
        dosageFormulation: genericReport.dosageFormulation,
        clinicalUsage: genericReport.clinicalUsage,
        avgPriceBrand: genericReport.avgPriceBrand,
        avgPriceGeneric: genericReport.avgPriceGeneric,
        savingsPercentage: genericReport.savingsPercentage,
        safetyPrecautions: genericReport.safetyPrecautions,
        imageProvided: !!req.file,
        modelUsed: genericReport._modelUsed || 'Google Gemini Pro'
      },
      pharmacies: pharmacies,
      meta: {
        processingTimeMs: duration,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('❌ Generic route exception:', err.message);
    res.status(500).json({ error: `Analysis failed: ${err.message}` });
  }
});

module.exports = router;
