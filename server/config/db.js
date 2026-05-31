const mongoose = require('mongoose');

// Cache the connection promise to avoid redundant connection triggers in serverless cold starts
let cachedConnectionPromise = null;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.warn('⚠️ MONGO_URI is missing. Application will run in memory-mock mode for missing DB features.');
      return false;
    }

    if (mongoose.connection.readyState === 1) {
      return true;
    }

    if (!cachedConnectionPromise) {
      console.log('🔌 Connecting to MongoDB...');
      cachedConnectionPromise = mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 15000, // Increased to 15 seconds for flaky DNS
        family: 4 // Force IPv4 to prevent Node.js Windows SRV resolution bugs
      });
    }

    await cachedConnectionPromise;
    console.log(`🚀 MongoDB Connected: ${mongoose.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    cachedConnectionPromise = null; // Reset cache on failure
    return false;
  }
};

const ensureDbConnected = async () => {
  if (!process.env.MONGO_URI) {
    return false;
  }
  
  if (mongoose.connection.readyState === 1) {
    return true;
  }
  
  if (mongoose.connection.readyState === 2) {
    // Wait for active connecting state to resolve
    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (mongoose.connection.readyState === 1) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 50);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, 6000); // 6 seconds timeout max
    });
    return mongoose.connection.readyState === 1;
  }

  // ReadyState is 0 (disconnected) or 3 (disconnecting), try connecting again
  return await connectDB();
};

module.exports = {
  connectDB,
  ensureDbConnected
};
