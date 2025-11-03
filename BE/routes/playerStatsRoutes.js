import express from "express";
import { submitMatchPlayerStats, submitTeamMatchPlayerStats, getTeamMatchPlayerStats, getPlayerStats } from "../controllers/playerStatsController.js";

const router = express.Router();

// Volunteer submits stats for a completed match
router.post("/matches/:matchId/stats", submitMatchPlayerStats);

// Volunteer submits stats for a specific team in a completed match
router.post("/matches/:matchId/teams/:teamId/stats", submitTeamMatchPlayerStats);

// Coach views stats for their team for a match
router.get("/matches/:matchId/teams/:teamId/stats", getTeamMatchPlayerStats);

// Player views their stats (optionally by tournament)
router.get("/players/:playerId/stats", getPlayerStats);

export default router;


