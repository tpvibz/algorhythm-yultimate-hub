// seedSchools.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import School from "./models/schoolModel.js"; // adjust path if different
import connectDB from "./config/db.js";

dotenv.config();

const seedSchools = async () => {
  try {
    await connectDB();

    // Clear existing records (optional)
    await School.deleteMany();

    const schools = [
      {
        name: "Sunrise Public School",
        location: "Bangalore",
        type: "school",
        description: "Primary and middle school focusing on academics and sports.",
        contactEmail: "info@sunrise.edu.in",
        contactPhone: "9876543210",
      },
      {
        name: "Greenfield International School",
        location: "Delhi",
        type: "school",
        description: "International curriculum school supporting life skills programmes.",
        contactEmail: "contact@greenfield.edu.in",
        contactPhone: "9876501234",
      },
      {
        name: "Community A",
        location: "Bangalore",
        type: "community",
        description: "Local youth community for sports and development programmes.",
        contactEmail: "communityA@yultimate.org",
        contactPhone: "8888899999",
      },
      {
        name: "Community B",
        location: "Delhi",
        type: "community",
        description: "Urban community promoting sports-based life skills for children.",
        contactEmail: "communityB@yultimate.org",
        contactPhone: "9999988888",
      },
    ];

    await School.insertMany(schools);
    console.log("✅ Seed data for schools and communities inserted successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
};

seedSchools();
