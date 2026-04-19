require('dotenv').config();
const axios = require('axios');

const TESTS = [
  { model: 'gemini-2.5-flash-lite', apiVersion: 'v1beta' },
  { model: 'gemini-2.5-flash',      apiVersion: 'v1beta' },
  { model: 'gemini-2.0-flash-lite', apiVersion: 'v1beta' },
  { model: 'gemini-2.0-flash',      apiVersion: 'v1beta' },
  { model: 'gemini-flash-latest',   apiVersion: 'v1beta' },
];

async function test(model, apiVersion) {
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`;
  try {
    const res = await axios.post(url, {
      contents: [{ role: 'user', parts: [{ text: 'Reply with just: WORKING' }] }]
    }, { timeout: 15000 });
    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '(no text)';
    console.log(`✅ ${model} (${apiVersion}): ${text.trim().slice(0, 30)}`);
    return true;
  } catch (err) {
    const status = err.response?.status;
    const msg = err.response?.data?.error?.message || err.message;
    console.log(`❌ ${model} (${apiVersion}): [${status}] ${msg.slice(0, 100)}`);
    return false;
  }
}

(async () => {
  console.log('\n🔑 Key:', process.env.GOOGLE_API_KEY?.slice(0, 12) + '...\n');
  for (const { model, apiVersion } of TESTS) {
    await test(model, apiVersion);
  }
  console.log('\nDone.');
})();
