require('dotenv').config();
const axios = require('axios');

(async () => {
  try {
    const res = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}&pageSize=100`
    );
    const models = res.data.models || [];
    console.log(`\nFound ${models.length} models:\n`);
    models
      .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
      .forEach(m => console.log(' •', m.name));
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
})();
