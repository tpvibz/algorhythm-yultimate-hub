import express from "express";
import {
  playerSignup,
  approvePlayer,
  loginUser,
  getPendingRequests,
  rejectRequest,
  getActiveCoaches
} from "../controllers/authController.js";
import { getAssignedStudents } from "../controllers/coachController.js";

const router = express.Router();

// Player signup
router.post("/signup/player", playerSignup);

// Admin approves a player
router.post("/approve/player", approvePlayer);

// Login (admin, player, etc.)
router.post("/login", loginUser);

// 🆕 Match frontend call exactly
router.get("/requests", getPendingRequests);
router.post("/reject/player", rejectRequest);

// Get active coaches
router.get("/coaches/active", getActiveCoaches);

// Get assigned students for a coach
router.get("/coach/:coachId/students", getAssignedStudents);

export default router;
