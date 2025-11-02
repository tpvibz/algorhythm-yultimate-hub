import express from "express";
import {
  recordScoreEvent,
  getMatchScoreEvents,
  updateMatchScore,
  getVolunteerMatches
} from "../controllers/scoreController.js";

const router = express.Router();

// Get matches for a volunteer's assigned tournaments
router.get("/volunteers/:volunteerId/matches", getVolunteerMatches);

// Record a score event (point scored)
router.post("/matches/:matchId/score", recordScoreEvent);

// Get score events for a match
router.get("/matches/:matchId/events", getMatchScoreEvents);

// Update match score directly
router.put("/matches/:matchId/score", updateMatchScore);

export default router;

