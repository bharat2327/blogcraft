const { app } = require('../backend/server');
const { connectDB } = require('../backend/config/database');

// Ensure database connection for serverless invocations
let isConnected = false;
app.use(async (req, res, next) => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (e) {
      console.error('Serverless DB connection error:', e.message);
    }
  }
  next();
});

module.exports = app;
