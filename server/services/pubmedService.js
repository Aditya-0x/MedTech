const axios = require('axios');

/**
 * Searches PubMed for peer-reviewed literature matching keywords.
 * @param {string} claimText
 * @returns {Promise<Array>} List of relevant research papers
 */
async function searchPubMed(claimText) {
  if (!claimText || claimText.trim().length < 5) {
    return [];
  }

  // Clean keywords for searching (remove punctuation)
  const cleanedQuery = claimText
    .replace(/[^\w\s-]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 5) // Use up to 5 keywords to avoid empty result sets
    .join(' AND ');

  try {
    console.log(`🔎 Querying PubMed: "${cleanedQuery}"...`);
    // Step 1: Search for PMIDs
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(cleanedQuery)}&retmode=json&retmax=3`;
    const searchResponse = await axios.get(searchUrl, { timeout: 10000 });
    const idList = searchResponse.data?.esearchresult?.idlist || [];

    if (idList.length === 0) {
      console.log('⚠️ No PubMed articles matched search terms.');
      return [];
    }

    // Step 2: Fetch document summaries for PMIDs
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idList.join(',')}&retmode=json`;
    const summaryResponse = await axios.get(summaryUrl, { timeout: 10000 });
    const results = summaryResponse.data?.result || {};

    const papers = idList.map(pmid => {
      const doc = results[pmid];
      if (!doc) return null;

      // Extract details
      const title = doc.title || 'Untitled Medical Study';
      const journal = doc.source || 'PubMed Article';
      const year = doc.pubdate ? doc.pubdate.split(' ')[0] : 'N/A';
      const authorsList = doc.authors || [];
      const authors = authorsList.length > 0 
        ? authorsList.slice(0, 3).map(a => a.name).join(', ') + (authorsList.length > 3 ? ' et al.' : '')
        : 'Unknown Authors';
      
      return {
        title: title.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\.$/, ''),
        authors,
        journal,
        year,
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        pmid
      };
    }).filter(p => p !== null);

    console.log(`✅ Loaded ${papers.length} PubMed articles.`);
    return papers;

  } catch (err) {
    console.error('❌ PubMed service error:', err.message);
    return [];
  }
}

module.exports = { searchPubMed };
