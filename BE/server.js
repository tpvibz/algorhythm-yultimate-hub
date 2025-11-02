// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import tournamentRoutes from "./routes/tournamentRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import volunteerRoutes from "./routes/volunteerRoutes.js";
import scoreRoutes from "./routes/scoreRoutes.js";
import predictionRoutes from "./routes/predictionRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import matchImageRoutes from "./routes/matchImageRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import matchAttendanceRoutes from "./routes/matchAttendanceRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import institutionRoutes from "./routes/institutionRoutes.js";
import playerRoutes from "./routes/playerRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";

// ✅ Fix for __dirname and __filename in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/score", scoreRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/match-images", matchImageRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/match-attendance", matchAttendanceRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/institutions", institutionRoutes);
app.use("/api/player", playerRoutes);
app.use("/api/feedback", feedbackRoutes);

// ✅ Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Root route (for testing)
app.get("/", (req, res) => {
  res.send("✅ TAMUI Backend API Running");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ message: "Server Error", error: err.message });
});

// Start server
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));