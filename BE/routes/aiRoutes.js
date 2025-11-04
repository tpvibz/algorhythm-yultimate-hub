import express from "express";
import { coachAssistant, playerAssistant } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Coach AI Assistant - coaches and admins only
router.post("/coach-assistant", protect, async (req, res, next) => {
  try {
    // Accept both string or array roles
    const role = req.user?.role;
    const isAuthorized = Array.isArray(role)
      ? (role.includes("coach") || role.includes("admin"))
      : (role === "coach" || role === "admin");

    if (!isAuthorized) {
      return res.status(403).json({ message: "Forbidden: coaches or admins only" });
    }
    return coachAssistant(req, res);
  } catch (e) {
    next(e);
  }
});

// Player AI Assistant - players and admins
router.post("/player-assistant", protect, async (req, res, next) => {
  try {
    // Accept both string or array roles
    const role = req.user?.role;
    const isAuthorized = Array.isArray(role)
      ? (role.includes("player") || role.includes("admin"))
      : (role === "player" || role === "admin");

    if (!isAuthorized) {
      return res.status(403).json({ message: "Forbidden: players or admins only" });
    }
    return playerAssistant(req, res);
  } catch (e) {
    next(e);
  }
});

// Test AI Assistant (for development) - bypasses authentication
router.post("/test-assistant", async (req, res) => {
  console.log("Test AI assistant called with:", req.body);
  try {
    // Set a mock user for testing
    req.user = { id: "test-user", role: "player" };
    return playerAssistant(req, res);
  } catch (error) {
    console.error("Test assistant error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Test AI service failed",
      error: error.toString()
    });
  }
});

export default router;


