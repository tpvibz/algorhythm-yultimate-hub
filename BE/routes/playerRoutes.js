import express from "express";
import {
  getPlayerProfile,
  getPlayerStats,
  getPlayerAttendance,
  getPlayerMatches,
  getPlayerAchievements,
  getPlayerHomeVisits,
  requestTransfer,
  getTransferHistory,
} from "../controllers/playerController.js";

const router = express.Router();

// Get player profile
router.get("/:id", getPlayerProfile);

// Get player stats
router.get("/:id/stats", getPlayerStats);

// Get player attendance
router.get("/:id/attendance", getPlayerAttendance);

// Get player matches
router.get("/:id/matches", getPlayerMatches);

// Get player achievements
router.get("/:id/achievements", getPlayerAchievements);

// Get player home visits
router.get("/:id/home-visits", getPlayerHomeVisits);

// Get transfer history
router.get("/:id/transfer-history", getTransferHistory);

// Request transfer
router.post("/:id/transfer-request", requestTransfer);

export default router;

