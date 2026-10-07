const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

let mongoServerInstance = null;

/**
 * Connects to MongoDB database using Mongoose
 * Respects MONGODB_URI environment variable (Local or Atlas)
 * Falls back to an embedded persistent local MongoDB engine if standalone service is not yet running
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blog_application';
  
  try {
    // Attempt standard connection first with a short timeout
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`✅ MongoDB Connected Successfully: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return mongoose.connection;
  } catch (initialErr) {
    // If connection failed and URI is pointing to local machine, start our local embedded MongoDB
    const isLocalUri = uri.includes('localhost') || uri.includes('127.0.0.1');
    if (isLocalUri) {
      console.log(`ℹ️  Standalone MongoDB not detected on 127.0.0.1:27017. Initializing local persistent MongoDB instance...`);
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const dbPath = path.join(__dirname, '..', 'data', 'mongodb_data');
        if (!fs.existsSync(dbPath)) {
          fs.mkdirSync(dbPath, { recursive: true });
        }

        mongoServerInstance = await MongoMemoryServer.create({
          instance: {
            port: 27017,
            dbPath: dbPath,
            dbName: 'blog_application'
          }
        });

        const activeUri = mongoServerInstance.getUri();
        await mongoose.connect(activeUri);
        console.log(`✅ Local Persistent MongoDB Connected: ${activeUri}`);
        return mongoose.connection;
      } catch (embeddedErr) {
        console.error(`❌ Failed to initialize local MongoDB engine:`, embeddedErr.message);
        throw embeddedErr;
      }
    } else {
      console.error(`❌ MongoDB Connection Error (${uri}):`, initialErr.message);
      throw initialErr;
    }
  }
}

/**
 * Accurately check database connection health
 * @returns {boolean}
 */
function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Disconnect from database cleanly
 */
async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (mongoServerInstance) {
      await mongoServerInstance.stop();
    }
  } catch (err) {
    console.error('Error disconnecting MongoDB:', err);
  }
}

module.exports = {
  connectDB,
  isDbConnected,
  disconnectDB
};
