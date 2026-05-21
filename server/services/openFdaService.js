const axios = require('axios');

/**
 * Searches OpenFDA Drug Enforcement reports for active recalls or manufacturing alerts.
 * @param {string} claimText
 * @returns {Promise<Array>} List of recalls / safety alerts
 */
async function searchFdaAlerts(claimText) {
  if (!claimText || claimText.trim().length < 5) {
    return [];
  }

  // Pick the first few terms that are potential drug/compound names
  const keywords = claimText
    .replace(/[^\w\s-]/g, '')
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .slice(0, 3);

  if (keywords.length === 0) return [];

  // Build OR search for recall reasons
  const searchQuery = keywords.map(kw => `reason_for_recall:"${kw}"`).join('+OR+');

  try {
    console.log(`🔎 Querying OpenFDA for: "${keywords.join(', ')}"...`);
    const url = `https://api.fda.gov/drug/enforcement.json?search=${searchQuery}&limit=2`;
    const response = await axios.get(url, { timeout: 10000 });
    const results = response.data?.results || [];

    const alerts = results.map(rec => {
      return {
        recallNumber: rec.recall_number || 'N/A',
        productDescription: rec.product_description || 'Unknown Product',
        reasonForRecall: rec.reason_for_recall || 'No reason provided',
        classification: rec.classification || 'Class III',
        recallInitiationDate: rec.recall_initiation_date
          ? `${rec.recall_initiation_date.substring(0, 4)}-${rec.recall_initiation_date.substring(4, 6)}-${rec.recall_initiation_date.substring(6, 8)}`
          : 'N/A',
        recallingFirm: rec.recalling_firm || 'Unknown Firm',
        status: rec.status || 'Ongoing'
      };
    });

    console.log(`✅ Loaded ${alerts.length} OpenFDA drug alerts.`);
    return alerts;

  } catch (err) {
    // OpenFDA returns 404 if no recalls match the term, which is completely expected
    if (err.response?.status !== 404) {
      console.error('❌ OpenFDA service error:', err.message);
    } else {
      console.log('⚠️ No matching FDA recall warnings found.');
    }
    return [];
  }
}

module.exports = { searchFdaAlerts };
