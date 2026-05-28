const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const verifyRouter = require('./routes/verify');
const { router: authRouter } = require('./routes/auth');
const historyRouter = require('./routes/history');
const securityHeaders = require('./middleware/securityHeaders');

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(securityHeaders); // Strict HIPAA security and dynamic CSP nonces
app.use(cors()); // Allow all for Vercel production hosting
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api', verifyRouter);
app.use('/api', authRouter);
app.use('/api', historyRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Med-Verify API is running', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Only listen if executed directly (not when imported as a serverless module by Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🏥 Med-Verify API Server running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health\n`);
  });
}

// Export for Vercel serverless functions
module.exports = app;
