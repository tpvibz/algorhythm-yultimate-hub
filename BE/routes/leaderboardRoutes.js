import express from "express";
import {
  getTournamentLeaderboard,
  getAllLeaderboards
} from "../controllers/leaderboardController.js";

const router = express.Router();

// Get leaderboard for a specific tournament
router.get("/tournaments/:tournamentId", getTournamentLeaderboard);

// Get leaderboards for all active/completed tournaments (overview)
router.get("/", getAllLeaderboards);

export default router;

