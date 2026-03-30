// backend/config/db.js
// MongoDB connection using Mongoose

const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MongoDB: set MONGODB_URI or MONGO_URI in .env");
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () =>
  console.warn("⚠️  MongoDB disconnected")
);
mongoose.connection.on("reconnected", () =>
  console.log("🔄 MongoDB reconnected")
);

module.exports = connectDB;
