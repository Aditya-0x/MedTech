const axios = require('axios');
const FormData = require('form-data');

/**
 * Secondary fallback: Use Google Gemini Multimodal Vision API to extract text from image
 */
async function extractTextViaGemini(base64Image, mimeType) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing Google/Gemini API key in environment variables.');
  }

  // We try gemini-3.5-flash and fallback models verified to be working
  const models = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-3.1-flash-lite'];
  let lastErr = null;

  for (const model of models) {
    try {
      console.log(`🤖 OCR Gemini Fallback: Trying ${model}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const body = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Image
                }
              },
              {
                text: 'Extract ALL text from this image exactly as it appears. This is a screenshot containing medical or health claims. Return only the raw extracted text, preserving line breaks. Do not add any commentary or summary.'
              }
            ]
          }
        ]
      };

      const response = await axios.post(url, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 25000
      });

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim()) {
        console.log(`✅ Gemini OCR Fallback succeeded using ${model}`);
        return text.trim();
      }
    } catch (err) {
      console.warn(`⚠️ Gemini model ${model} failed in OCR fallback:`, err.response?.data?.error?.message || err.message);
      lastErr = err;
    }
  }

  throw new Error(`All OCR options (Mistral and Gemini fallback) failed. Last error: ${lastErr?.message}`);
}

/**
 * Extracts text from an image buffer using Mistral OCR API (mistral-ocr-latest)
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} mimeType - e.g. 'image/jpeg'
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromImage(imageBuffer, mimeType = 'image/jpeg') {
  const base64Image = imageBuffer.toString('base64');
  const dataUri = `data:${mimeType};base64,${base64Image}`;
  let fileId = null;

  // 1. Try Mistral OCR primary flow
  try {
    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename: 'screenshot.png',
      contentType: mimeType
    });
    formData.append('purpose', 'ocr');

    console.log(`📤 Uploading screenshot to Mistral Storage...`);
    const uploadResponse = await axios.post(
      'https://api.mistral.ai/v1/files',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
          ...formData.getHeaders()
        },
        timeout: 30000
      }
    );

    fileId = uploadResponse.data?.id;
    if (!fileId) {
      throw new Error('Failed to obtain file ID from Mistral Files storage');
    }
    console.log(`✅ File uploaded to Mistral. ID: ${fileId}`);

    // Trigger OCR processing on the uploaded file
    console.log(`🔍 Processing OCR on file ID: ${fileId}...`);
    const response = await axios.post(
      'https://api.mistral.ai/v1/ocr',
      {
        model: 'mistral-ocr-latest',
        document: {
          type: 'file',
          file_id: fileId
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
    let ocrText = '';
    if (response.data && response.data.pages && response.data.pages.length > 0) {
      ocrText = response.data.pages.map(p => p.markdown || p.text || '').join('\n').trim();
    } else if (response.data && response.data.text) {
      ocrText = response.data.text.trim();
    }

    // Clean up temporary file from Mistral Storage asynchronously
    if (fileId) {
      cleanupMistralFile(fileId);
    }

    if (ocrText) {
      return ocrText;
    }
    
    console.log('⚠️ Mistral primary OCR returned empty text. Falling back to Pixtral chat...');

  } catch (err) {
    console.error('❌ Mistral OCR primary workflow error:', err.response?.data || err.message);
    
    // Clean up temporary file if upload succeeded but processing failed
    if (fileId) {
      cleanupMistralFile(fileId);
    }
  }

  // 2. Try Mistral Pixtral vision chat completions
  try {
    console.log('🔄 Trying Mistral Pixtral Vision chat completions fallback...');
    const pixtralText = await extractTextViaChat(dataUri);
    if (pixtralText && pixtralText.trim()) {
      return pixtralText.trim();
    }
  } catch (err) {
    console.error('❌ Mistral Pixtral Vision chat fallback error:', err.response?.data || err.message);
  }

  // 3. Try Google Gemini Vision API fallback
  try {
    console.log('🔄 Trying Google Gemini Vision API fallback...');
    const geminiText = await extractTextViaGemini(base64Image, mimeType);
    if (geminiText && geminiText.trim()) {
      return geminiText.trim();
    }
  } catch (err) {
    console.error('❌ Google Gemini Vision fallback error:', err.message);
    throw err;
  }

  throw new Error('All OCR methods failed to extract text from the image.');
}

/**
 * Clean up temporary files in Mistral storage
 */
async function cleanupMistralFile(fileId) {
  try {
    await axios.delete(
      `https://api.mistral.ai/v1/files/${fileId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
        },
        timeout: 15000
      }
    );
    console.log(`🗑️ Successfully deleted temporary Mistral file: ${fileId}`);
  } catch (deleteErr) {
    console.warn(`⚠️ Failed to clean up temporary file ${fileId} in Mistral storage:`, deleteErr.message);
  }
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

