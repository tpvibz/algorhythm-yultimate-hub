import express from "express";
import { coachAssistant } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Basic protection; optionally enforce coach role
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

export default router;


