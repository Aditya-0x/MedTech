# Med-Verify Pro 🩺

Med-Verify Pro is a premium, modern, AI-powered clinical fact-checking and evidence-synthesis SaaS platform built to fight medical misinformation. The application extracts clinical claims from text or screenshots, scrubs Personal Health Information (PHI) to guarantee HIPAA compliance, cross-references them against multiple authoritative scientific databases, and employs advanced reasoning through Gemini Frontier Models to provide comprehensive, sourced verdicts.

---

## 🚀 Key Features

*   **Dual Input Modes (Text & Image):**
    *   Type a medical claim directly.
    *   Upload social media screenshots. Built-in **Mistral OCR** automatically extracts claims from images with extreme precision.
*   **Parallel Deep-Science Synthesis:** Fact-checks claims in real time against 5 highly authoritative databases:
    1.  **WHO Global Health Observatory (GHO):** For global epidemiological metrics.
    2.  **MyHealthfinder (ODPHP):** For evidence-based clinical recommendations and guidelines.
    3.  **PubMed:** For peer-reviewed medical and scientific literature.
    4.  **ClinicalTrials.gov:** For ongoing and completed clinical research registries.
    5.  **OpenFDA:** For official pharmaceutical safety alerts, recalls, and warnings.
*   **Elite Multi-Page Navigation Architecture:**
    *   Features standalone SEO-optimized bundles for `/about.html` (**About Creator**) and `/contact.html` (**Support Portal**) dynamically compiled via Vite and Rollup.
    *   Cross-page sessions (`medverify_user`) and color theme choices (`medverify_theme`) are synchronized natively via fast `localStorage` listeners on page mounts.
*   **Unified Glassmorphic Header Menu:**
    *   Entire platform navigation fits inside a single, sticky liquid-glass topbar containing **Verify**, **History**, **About**, and **Support** tabs.
    *   Fully engineered with clamp-based paddings and `white-space: nowrap;` to prevent button height wrapping, maintaining mathematically perfect visual symmetry and zero layout overlaps on any viewport aspect ratio.
*   **ABDM & HIPAA Zero-Data Retention Compliance:**
    *   Scrubbing engine intercepts PHI before routing queries to external API endpoints.
    *   Fully maps diagnostic metrics to generate interoperable FHIR R4 bundles and SNOMED-CT dictionary entries under Ayushman Bharat Digital Mission (ABDM) standards.
*   **Gamification & SMTP Welcomes:**
    *   Users earn **✨ +15 Points** on their real-time points badge for each claim verified.
    *   Secure, passwordless OTP sign-ins with beautiful automated HTML welcoming letters dispatched via Nodemailer using secure SMTP relays.

---

## 🛠️ Tech Stack

*   **Frontend:** React, Vite, Rollup, Vanilla CSS Modules, Google OAuth SDK
*   **Backend:** Node.js, Express, Mongoose (MongoDB Atlas), Nodemailer, Multer
*   **AI & OCR Engine:** Google Gemini (Generative AI REST Fallback Agent), Mistral AI API
*   **Design Paradigm:** Premium Liquid Glass & Material Expressive theme styles

---

## ⚙️ Project Setup

### 📋 Prerequisites

*   Node.js (v18+ recommended)
*   A **MongoDB Atlas** database cluster (or local MongoDB server)
*   A Google Cloud project with **Google Sign-In OAuth client ID** enabled
*   API keys for **Google Gemini** and **Mistral AI**

---

### 📦 Setup Instructions

#### 1. Clone & Clean Setup
```bash
git clone https://github.com/Aditya-0x/MedTech.git
cd MedTech
```

#### 2. Install Dependencies
Install packages for both client and server:
```bash
# Install Server dependencies
cd server
npm install

# Install Client dependencies
cd ../client
npm install
```

#### 3. Configuration & Secrets

##### Server Environment Configuration
Create a `.env` file in the `server` directory (see [server/.env.example](server/.env.example) for template):
```env
PORT=5000
MONGO_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/medverify"
JWT_SECRET="your_secure_jwt_session_secret"

# SMTP Welcomes
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-google-app-password"

# API Keys
GOOGLE_API_KEY="your-gemini-google-api-key"
MISTRAL_API_KEY="your-mistral-api-key"
```

##### Client Environment Configuration
Create a `.env` file in the `client` directory (see [client/.env.example](client/.env.example) for template):
```env
VITE_GOOGLE_CLIENT_ID="your-google-oauth-client-id-here.apps.googleusercontent.com"
```

---

### 🚀 Running the Application

For native Windows platforms, simply execute the startup file at the root:
```bash
./start.bat
```

Alternatively, you can run the services manually in separate terminals:
*   **Start Backend:** `cd server && npm run dev`
*   **Start Frontend:** `cd client && npm run dev`

The web application will open on `http://localhost:5173`.

---

## 🛡️ Medical Disclaimer
Med-Verify Pro is designed for educational, experimental fact-checking, and clinical demonstration purposes under the NBEC 2026 guidelines. It does **not** provide clinical diagnosis, medical guidance, or patient advice. Always consult a licensed healthcare professional for any medical concerns.
