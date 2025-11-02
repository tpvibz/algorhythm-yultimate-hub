import express from "express";
import {
  getMatchesNeedingFeedback,
  getTournamentsNeedingFeedback,
  getTournamentFeedbackDetails,
  submitSpiritScore,
  submitPlayerFeedback,
  getMatchPlayersForFeedback,
  checkFeedbackCompletionStatus
} from "../controllers/feedbackController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get matches needing feedback (after each match completion)
router.get("/matches/needing-feedback", getMatchesNeedingFeedback);

// Get tournaments needing feedback (backward compatibility)
router.get("/tournaments/needing-feedback", getTournamentsNeedingFeedback);

// Get details for a specific tournament's feedback
router.get("/tournaments/:tournamentId/details", getTournamentFeedbackDetails);

// Submit spirit score for a match
router.post("/matches/:matchId/spirit-score", submitSpiritScore);

// Submit player feedback for a match
router.post("/matches/:matchId/players/:playerId/feedback", submitPlayerFeedback);

// Get players for a match who need feedback
router.get("/matches/:matchId/players", getMatchPlayersForFeedback);

// Check if coach can register (feedback completion status)
router.get("/check-completion", checkFeedbackCompletionStatus);

export default router;

