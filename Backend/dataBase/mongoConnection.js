const mongoose = require("mongoose");

const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MongoDB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✓ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

// Graceful shutdown
const closeMongoDB = async () => {
  try {
    await mongoose.connection.close();
    console.log("✓ MongoDB connection closed");
  } catch (err) {
    console.error("❌ Error closing MongoDB:", err);
  }
};

module.exports = { connectMongoDB, closeMongoDB };
