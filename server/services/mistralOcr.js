const axios = require('axios');
const FormData = require('form-data');

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

  try {
    // Step 1: Upload the file to Mistral Files storage
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

    // Step 2: Trigger OCR processing on the uploaded file
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

    // Step 3: Clean up temporary file from Mistral Storage asynchronously
    if (fileId) {
      cleanupMistralFile(fileId);
    }

    if (ocrText) {
      return ocrText;
    }

    // Fallback: check if we need vision completion fallback if OCR succeeded but text is empty
    return await extractTextViaChat(dataUri, mimeType);

  } catch (err) {
    console.error('❌ Mistral OCR primary workflow error:', err.response?.data || err.message);
    
    // Clean up temporary file if upload succeeded but processing failed
    if (fileId) {
      cleanupMistralFile(fileId);
    }

    // Fallback to Pixtral vision completions using the base64 dataUri
    console.log('🔄 Falling back to Mistral Pixtral Vision chat completions...');
    return await extractTextViaChat(dataUri, mimeType);
  }
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
