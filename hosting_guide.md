# Med-Verify Pro: Production & Deployment Guide

You are now ready to move Med-Verify Pro out of the local development environment and onto the public internet using Vercel!

Because Vercel is a Serverless environment, we must use a real cloud database (MongoDB) instead of local files. I have already fully prepared the codebase to support this. Here are the exact steps you need to follow to take the app live.

## 1. Set Up MongoDB Atlas (Database)
Since you are deploying to Vercel, you need a cloud-hosted MongoDB database to securely store user accounts, points, and search history.

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Build a new **Free Tier (M0)** cluster.
3. Under "Database Access", create a new database user and password. **Save this password!**
4. Under "Network Access", add IP Address `0.0.0.0/0` (Allow access from anywhere, since Vercel IPs change dynamically).
5. Click **Connect -> Drivers -> Node.js** and copy your Connection String. It will look like:
   `mongodb+srv://<username>:<password>@cluster0.mongodb.net/medverify?retryWrites=true&w=majority`

## 2. Prepare Google OAuth
The Sandbox modal has been removed from the code. You must now use real Google OAuth credentials.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project and navigate to **APIs & Services -> Credentials**.
3. Create an **OAuth Client ID** (Application type: Web application).
4. Add `http://localhost:5173` to the Authorized JavaScript origins (for local testing).
5. **CRITICAL:** Once you get your Vercel deployment URL (e.g., `https://med-verify-pro.vercel.app`), you MUST come back here and add it to the Authorized JavaScript origins!

## 3. Configure Vercel Environment Variables
You will deploy your application using the Vercel Dashboard or Vercel CLI. When setting up the project in Vercel, you MUST add the following Environment Variables in the project settings:

### Backend Variables
- `MONGO_URI`: The connection string you got from MongoDB Atlas (replace `<password>` with your actual password).
- `JWT_SECRET`: A long, random string (e.g., `super_secret_nbec_2026_key_12345`).
- `GOOGLE_API_KEY`: Your Gemini API Key.
- `SMTP_USER`: Your Gmail address (for sending welcome emails).
- `SMTP_PASS`: Your Gmail App Password (NOT your regular password).

### Frontend Variables
You must add this variable to the Vercel Environment Variables as well, so the React frontend can access it during the build process:
- `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.

## 4. Deploy to Vercel

### Option A: Deploy via GitHub (Recommended & Extremely Easy)
1. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New -> Project**.
2. Import your GitHub repository `Aditya-0x/MedTech`.
3. **CRITICAL Settings (Configure precisely):**
   - **Root Directory:** Keep it as the **Project Root `./`** (Do NOT change this to `./client`, otherwise Vercel will ignore the backend API folder!).
   - **Framework Preset:** Select **Vite** or **Other** (since our custom `vercel.json` fully handles build routes, Vite preset at `./` works beautifully).
   - *Note: Our repository contains a custom [vercel.json](vercel.json) in the root. Vercel automatically reads this file to build your client (`cd client && npm install && npm run build`), serve the output from `client/dist`, and mount `/api/*` routes onto the serverless Express engine in `api/index.js`!*
4. Expand the **Environment Variables** accordion and add all the variables listed in **Step 3**:
   - `GOOGLE_API_KEY`
   - `MISTRAL_API_KEY`
   - `MONGO_URI`
   - `JWT_SECRET`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `VITE_GOOGLE_CLIENT_ID`
5. Click **Deploy**. Vercel will build both the frontend and backend in seconds.

### Option B: Deploy via Vercel CLI
If you prefer deploying via terminal:
1. Open your terminal in the `MedTech` root folder.
2. Install Vercel CLI globally if you haven't: `npm install -g vercel`
3. Run `vercel` and log into your account.
4. Follow the prompts (use default options, root `./` as project root).
5. Go to the Vercel online dashboard to add your environment variables.
6. Run `vercel --prod` to deploy to production.

---
> [!NOTE] 
> Once deployed, you will have a fully functional, public URL where anyone can sign up securely, earn points, and fact-check medical claims! Let me know if you run into any issues during the deployment.
