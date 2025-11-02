import express from "express";
import {
  getTeamsByTournament,
  generateSchedule,
  getMatchesByTournament,
  updateMatch,
  deleteMatchesByTournament
} from "../controllers/scheduleController.js";

const router = express.Router();

// Get teams registered for a tournament
router.get("/tournaments/:tournamentId/teams", getTeamsByTournament);

// Generate matches for a tournament
router.post("/tournaments/:tournamentId/generate", generateSchedule);

// Get all matches for a tournament
router.get("/tournaments/:tournamentId/matches", getMatchesByTournament);

// Update a single match
router.put("/matches/:matchId", updateMatch);

// Delete all matches for a tournament
router.delete("/tournaments/:tournamentId/matches", deleteMatchesByTournament);

export default router;

