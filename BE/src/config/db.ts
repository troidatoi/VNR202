import mongoose from "mongoose";

const connectDB = async () => {
  console.log("📡 [db.ts] Connecting to MongoDB..."); // debug dòng này

  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ MongoDB connected successfully.");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
