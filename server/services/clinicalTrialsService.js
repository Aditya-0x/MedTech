const axios = require('axios');

/**
 * Searches ClinicalTrials.gov (v2 API) for matching active/completed clinical trials.
 * @param {string} claimText
 * @returns {Promise<Array>} List of related clinical trials
 */
async function searchClinicalTrials(claimText) {
  if (!claimText || claimText.trim().length < 5) {
    return [];
  }

  // Pick keywords
  const cleanedQuery = claimText
    .replace(/[^\w\s-]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(' ');

  try {
    console.log(`🔎 Querying ClinicalTrials.gov: "${cleanedQuery}"...`);
    const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(cleanedQuery)}&pageSize=3`;
    const response = await axios.get(url, { timeout: 10000 });
    const studies = response.data?.studies || [];

    const trials = studies.map(study => {
      const proto = study.protocolSection;
      if (!proto) return null;

      const nctId = proto.identificationModule?.nctId;
      if (!nctId) return null;

      const title = proto.identificationModule?.officialTitle 
        || proto.identificationModule?.briefTitle 
        || 'Clinical Study';
      
      const status = proto.statusModule?.overallStatus || 'Unknown';
      const phases = proto.designModule?.phases || [];
      const phaseStr = phases.length > 0 ? phases.join(', ') : 'Not Applicable';
      const conditions = proto.conditionsModule?.conditions || [];

      return {
        nctId,
        title: title.replace(/\.$/, ''),
        status: status.replace(/_/g, ' '),
        phase: phaseStr.replace(/_/g, ' '),
        conditions: conditions.slice(0, 3),
        url: `https://clinicaltrials.gov/study/${nctId}`
      };
    }).filter(t => t !== null);

    console.log(`✅ Loaded ${trials.length} ClinicalTrials studies.`);
    return trials;

  } catch (err) {
    console.error('❌ ClinicalTrials service error:', err.message);
    return [];
  }
}

module.exports = { searchClinicalTrials };
