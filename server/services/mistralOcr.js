const axios = require('axios');

/**
 * Extracts text from an image buffer using Mistral OCR API (mistral-ocr-latest)
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} mimeType - e.g. 'image/jpeg'
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromImage(imageBuffer, mimeType = 'image/jpeg') {
  const base64Image = imageBuffer.toString('base64');
  const dataUri = `data:${mimeType};base64,${base64Image}`;

  const response = await axios.post(
    'https://api.mistral.ai/v1/ocr',
    {
      model: 'mistral-ocr-latest',
      document: {
        type: 'image_url',
        imageUrl: dataUri
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  // Extract text from OCR pages response
  if (response.data && response.data.pages && response.data.pages.length > 0) {
    return response.data.pages.map(p => p.markdown || p.text || '').join('\n').trim();
  }

  // Fallback: check for direct text/content
  if (response.data && response.data.text) {
    return response.data.text.trim();
  }

  // Fallback to vision chat completions if OCR endpoint fails
  return await extractTextViaChat(dataUri, mimeType);
}

/**
 * Fallback: Use Mistral vision chat to extract text from image
 */
async function extractTextViaChat(dataUri) {
  const response = await axios.post(
    'https://api.mistral.ai/v1/chat/completions',
    {
      model: 'pixtral-12b-2409',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: dataUri }
            },
            {
              type: 'text',
              text: 'Extract ALL text from this image exactly as it appears. This is likely a screenshot of a social media post with health/medical claims. Return only the raw extracted text, preserving line breaks. Do not add commentary.'
            }
          ]
        }
      ],
      max_tokens: 2000
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  return response.data.choices[0].message.content.trim();
}

module.exports = { extractTextFromImage };
