const axios = require('axios');

const HEALTHFINDER_BASE = 'https://odphp.health.gov/myhealthfinder/api/v4';

/**
 * Extract search keywords from claim text
 */
function extractKeywords(claimText) {
  const text = claimText.toLowerCase();

  // Medical topic keywords to search for
  const topics = [
    'diabetes', 'heart disease', 'cancer', 'obesity', 'exercise',
    'smoking', 'alcohol', 'mental health', 'depression', 'anxiety',
    'vaccine', 'blood pressure', 'cholesterol', 'stroke', 'nutrition',
    'diet', 'sleep', 'stress', 'pregnancy', 'vitamins', 'supplements',
    'flu', 'covid', 'virus', 'infection', 'allergy', 'asthma',
    'kidney', 'liver', 'bone', 'joint', 'pain', 'headache', 'migraine'
  ];

  const matched = topics.filter(topic => text.includes(topic));

  // Return top 3 keywords or generic health topics
  return matched.length > 0 ? matched.slice(0, 3) : ['healthy lifestyle', 'preventive care'];
}

/**
 * Search MyHealthfinder by keyword and return topic content
 */
async function searchTopics(keyword) {
  try {
    const response = await axios.get(`${HEALTHFINDER_BASE}/topicsearch.json`, {
      params: {
        keyword: keyword,
        lang: 'en'
      },
      timeout: 8000
    });

    const result = response.data?.Result;
    if (!result) return [];

    const topics = result.Resources?.Resource || [];
    return topics.slice(0, 2).map(topic => ({
      title: topic.Title,
      category: topic.Categories || 'General Health',
      content: extractSummary(topic),
      url: topic.AccessibleVersion || topic.MainContent?.Content?.[0]?.CallToAction?.[0]?.Url,
      source: 'MyHealthfinder (ODPHP / HHS)'
    }));
  } catch {
    return [];
  }
}

/**
 * Extract a readable summary from a topic resource
 */
function extractSummary(topic) {
  try {
    const sections = topic.MainContent?.Content || [];
    if (sections.length === 0) return topic.Title || '';

    // Get text from first section
    const firstSection = sections[0];
    const items = firstSection.Items?.Item || [];
    if (items.length > 0) {
      const text = items[0].Description || items[0].Title || '';
      // Strip HTML tags
      return text.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ').trim().slice(0, 400);
    }

    return topic.Title || '';
  } catch {
    return topic.Title || '';
  }
}

/**
 * Get evidence-based recommendations from MyHealthfinder relevant to a claim
 * @param {string} claimText
 * @returns {Promise<Array>}
 */
async function getHealthRecommendations(claimText) {
  const keywords = extractKeywords(claimText);
  const allResults = [];

  // Search for each keyword (parallel)
  const searches = await Promise.all(keywords.map(kw => searchTopics(kw)));
  searches.forEach(results => allResults.push(...results));

  // Deduplicate by title
  const seen = new Set();
  return allResults.filter(item => {
    if (!item.title || seen.has(item.title)) return false;
    seen.add(item.title);
    return true;
  }).slice(0, 5);
}

module.exports = { getHealthRecommendations };
