const axios = require('axios');

const WHO_BASE = 'https://ghoapi.azureedge.net/api';

// Curated keyword → WHO indicator code mapping for common health topics
const KEYWORD_INDICATOR_MAP = {
  // Diabetes & Blood Sugar
  'diabetes': ['NCD_GLUC_04', 'NCD_BMI_30A'],
  'insulin': ['NCD_GLUC_04'],
  'blood sugar': ['NCD_GLUC_04'],
  'glucose': ['NCD_GLUC_04'],

  // Obesity & Weight
  'obesity': ['NCD_BMI_30A', 'NCD_BMI_PLUS1A'],
  'overweight': ['NCD_BMI_PLUS1A'],
  'bmi': ['NCD_BMI_30A'],
  'weight': ['NCD_BMI_30A'],

  // Heart Disease & Cardiovascular
  'heart': ['CARDIOVASCULAR_DEATHS', 'BP_MED'],
  'cardiovascular': ['CARDIOVASCULAR_DEATHS', 'BP_MED'],
  'blood pressure': ['BP_MED', 'CARDIOVASCULAR_DEATHS'],
  'hypertension': ['BP_MED'],
  'cholesterol': ['CARDIOVASCULAR_DEATHS'],
  'stroke': ['CARDIOVASCULAR_DEATHS'],

  // Cancer
  'cancer': ['CANCERINCIDENCERATE100K'],
  'tumor': ['CANCERINCIDENCERATE100K'],

  // Smoking & Tobacco
  'smoking': ['SA_0000001462', 'TOBACCO_0000000192'],
  'tobacco': ['TOBACCO_0000000192'],
  'cigarette': ['SA_0000001462'],

  // Vaccines & Immunization
  'vaccine': ['WHS4_100'],
  'vaccination': ['WHS4_100'],
  'immunization': ['WHS4_100'],
  'measles': ['WHS4_543'],
  'polio': ['WHS4_544'],

  // Mental Health
  'depression': ['SDGSUICIDE'],
  'anxiety': ['SDGSUICIDE'],
  'mental': ['SDGSUICIDE'],
  'suicide': ['SDGSUICIDE'],

  // Alcohol
  'alcohol': ['SA_0000001400', 'SA_0000001402'],

  // Exercise & Physical Activity
  'exercise': ['NCD_PA_INACTIVITY_A'],
  'physical activity': ['NCD_PA_INACTIVITY_A'],
  'sedentary': ['NCD_PA_INACTIVITY_A'],

  // Malaria
  'malaria': ['MALARIA_EST_DEATHS'],

  // HIV / AIDS
  'hiv': ['HIV_0000000007'],
  'aids': ['HIV_0000000007'],

  // Mortality
  'mortality': ['WHOSIS_000001'],
  'death': ['WHOSIS_000001'],
  'life expectancy': ['WHOSIS_000002']
};

/**
 * Extract relevant WHO indicator codes from claim text
 */
function extractIndicators(claimText) {
  const lower = claimText.toLowerCase();
  const indicators = new Set();

  for (const [keyword, codes] of Object.entries(KEYWORD_INDICATOR_MAP)) {
    if (lower.includes(keyword)) {
      codes.forEach(code => indicators.add(code));
    }
  }

  // Default indicators if no match found
  if (indicators.size === 0) {
    indicators.add('WHOSIS_000001'); // All-cause mortality as baseline
    indicators.add('NCD_BMI_30A');   // Obesity
  }

  return [...indicators].slice(0, 4); // Max 4 indicators to keep responses fast
}

/**
 * Fetch WHO GHO data for a specific indicator (latest global values)
 */
async function fetchIndicatorData(indicatorCode) {
  try {
    const url = `${WHO_BASE}/${indicatorCode}?$filter=SpatialDim eq 'GLOBAL' or SpatialDim eq null&$top=5&$orderby=TimeDim desc`;
    const response = await axios.get(url, { timeout: 8000 });
    const data = response.data?.value || [];

    if (data.length === 0) {
      // Try without filter if no global data
      const fallback = await axios.get(`${WHO_BASE}/${indicatorCode}?$top=3&$orderby=TimeDim desc`, { timeout: 8000 });
      return fallback.data?.value || [];
    }
    return data;
  } catch {
    return [];
  }
}

/**
 * Get indicator metadata (name, description)
 */
async function getIndicatorInfo(indicatorCode) {
  try {
    const response = await axios.get(`${WHO_BASE}/Indicator?$filter=IndicatorCode eq '${indicatorCode}'`, { timeout: 6000 });
    const info = response.data?.value?.[0] || {};
    return {
      code: indicatorCode,
      name: info.IndicatorName || indicatorCode,
      language: info.Language || 'EN'
    };
  } catch {
    return { code: indicatorCode, name: indicatorCode };
  }
}

/**
 * Query WHO GHO for relevant statistics based on claim text
 * @param {string} claimText
 * @returns {Promise<Array>} - Array of data points with context
 */
async function queryWHOData(claimText) {
  const indicators = extractIndicators(claimText);
  const results = [];

  await Promise.all(
    indicators.map(async (code) => {
      const [info, data] = await Promise.all([
        getIndicatorInfo(code),
        fetchIndicatorData(code)
      ]);

      if (data.length > 0) {
        const relevant = data.slice(0, 2).map(d => ({
          indicator: info.name,
          code: code,
          value: d.NumericValue,
          year: d.TimeDim,
          country: d.SpatialDim || 'Global',
          source: 'WHO Global Health Observatory'
        }));
        results.push(...relevant);
      }
    })
  );

  return results;
}

module.exports = { queryWHOData };
