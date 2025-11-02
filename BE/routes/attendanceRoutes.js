import express from "express";
import {
  markAttendance,
  getAttendanceForSessions,
  getPlayerAttendanceStats,
} from "../controllers/attendanceController.js";

const router = express.Router();

// Mark attendance for a session
router.post("/mark", markAttendance);

// Get attendance records for multiple sessions
router.get("/sessions", getAttendanceForSessions);

// Get attendance statistics for a specific player
router.get("/player/:playerId/stats", getPlayerAttendanceStats);

export default router;

