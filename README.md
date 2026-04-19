# Med-Verify 🩺

A clinical fact-checking application built to verify medical claims and social media health advice using authoritative medical evidence.

## Features
- **Text & Image Input:** Type a medical claim directly, or upload screenshots of social media posts (e.g. Instagram or X / Twitter advice).
- **OCR Extraction:** Uses **Mistral OCR** to accurately extract text from your uploaded images.
- **Authoritative Fact-Checking:** Cross-references the claim with reliable, authoritative sources:
  - **WHO Global Health Observatory (GHO)** for global health metrics and data.
  - **ODPHP MyHealthfinder** for evidence-based clinical guidelines.
- **AI Synthesis:** Leverages **Google Gemini 2.0 Flash** to synthesize available evidence and deliver a structured, sourced fact-check verdict.

## Tech Stack
- **Frontend:** React (Vite), CSS Modules
- **Backend:** Node.js, Express, Multer
- **APIs:** Google Gemini API, Mistral API, WHO GHO, ODPHP Healthfinder

## Getting Started

### Prerequisites
- Node.js installed on your machine
- API keys for:
  - Google Gemini API (`GEMINI_API_KEY`)
  - Mistral API (`MISTRAL_API_KEY`)

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Aditya-0x/MedTech.git
   cd MedTech
   ```

2. **Install dependencies:**
   From the main directory, install for both client and server:
   ```bash
   cd server
   npm install
   cd ../client
   npm install
   ```

3. **Configure Environment Variables:**
   - Create a `.env` file in the `server` directory.
   - Add your API keys:
     ```env
     GEMINI_API_KEY="your_gemini_api_key"
     MISTRAL_API_KEY="your_mistral_api_key"
     ```

4. **Run the Application:**
   On Windows, simply run the start script located in the root directory:
   ```bash
   ./start.bat
   ```
   
   Alternatively, you can run them in separate terminals:
   - **Backend:** `cd server && npm run dev`
   - **Frontend:** `cd client && npm run dev`

## Disclaimer
Med-Verify is built for educational purposes and experimental fact-checking. It does **not** provide individual clinical diagnosis or medical advice. Always consult a licensed healthcare professional for actual medical guidance.
