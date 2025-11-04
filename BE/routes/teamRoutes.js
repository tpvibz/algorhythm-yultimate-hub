import express from "express";
import { createTeam, getMyTeams, getAllTeams } from "../controllers/teamController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a team (coachId accepted in body) - intentionally NOT protected so client can send coachId from localStorage
router.post("/", createTeam);

// Get teams for the current coach
router.get("/mine", protect, getMyTeams);

// Get all teams with stats
router.get("/", getAllTeams);

export default router;
