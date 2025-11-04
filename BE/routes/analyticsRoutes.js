import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getTournamentSummary,
  getPlayerParticipationData,
  downloadTournamentReport,
  getAdminOverview,
  getCoachOverview,
  getVolunteerOverview
} from "../controllers/analyticsController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Tournament Summary Dashboard
// GET /api/analytics/tournament-summary - Get summary for all tournaments
// GET /api/analytics/tournament-summary/:tournamentId - Get summary for specific tournament
router.get("/tournament-summary", getTournamentSummary);
router.get("/tournament-summary/:tournamentId", getTournamentSummary);

// Player Participation Data
// GET /api/analytics/player-participation?tournamentId=xxx
router.get("/player-participation", getPlayerParticipationData);

// Downloadable Reports
// GET /api/analytics/report/:tournamentId/:reportType
// reportType: attendance, matches, scoring, full
router.get("/report/:tournamentId/:reportType", downloadTournamentReport);

// Admin Overview Dashboard
// GET /api/analytics/admin-overview
router.get("/admin-overview", getAdminOverview);

// Coach Overview Dashboard
// GET /api/analytics/coach-overview
router.get("/coach-overview", getCoachOverview);

// Volunteer Overview Dashboard
// GET /api/analytics/volunteer-overview
router.get("/volunteer-overview", getVolunteerOverview);

export default router;

