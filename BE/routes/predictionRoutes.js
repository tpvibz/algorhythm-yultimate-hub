import express from "express";
import {
  submitPrediction,
  getMatchPredictions,
  getUserPrediction,
  deletePrediction
} from "../controllers/predictionController.js";

const router = express.Router();

// Submit or update a prediction
router.post("/matches/:matchId/predict", submitPrediction);

// Get predictions for a match
router.get("/matches/:matchId/predictions", getMatchPredictions);

// Get user's prediction for a match
router.get("/matches/:matchId/users/:userId/prediction", getUserPrediction);

// Delete a prediction
router.delete("/predictions/:predictionId", deletePrediction);

export default router;

