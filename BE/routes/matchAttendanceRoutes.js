import express from "express";
import {
  getMatchPlayers,
  markMatchAttendance,
  checkMatchAttendanceStatus,
  getMatchAttendance
} from "../controllers/matchAttendanceController.js";

const router = express.Router();

// Get all players for a match (from both teams)
router.get("/matches/:matchId/players", getMatchPlayers);

// Check attendance status for a match
router.get("/matches/:matchId/status", checkMatchAttendanceStatus);

// Get attendance records for a match
router.get("/matches/:matchId/attendance", getMatchAttendance);

// Mark attendance for players in a match
router.post("/matches/:matchId/attendance", markMatchAttendance);

export default router;

