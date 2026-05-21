const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // We expect MONGO_URI to be provided via environment variables in Vercel
    // For local fallback testing without a DB, we can just log a warning and return.
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.warn('⚠️ MONGO_URI is missing. Application will run in memory-mock mode for missing DB features.');
      return false;
    }

    const conn = await mongoose.connect(mongoUri);

    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    // In production, we don't strictly crash the app if DB fails, 
    // we handle it gracefully, but usually you'd process.exit(1).
    return false;
  }
};

module.exports = connectDB;
