import express from "express";
import {
  getAllSchools,
  getAllCommunities,
  getAllInstitutions,
  getInstitutionById,
  createInstitution,
  updateInstitution,
  addCoachToInstitution,
  getCoachesByInstitution,
  getPlayersByCoachWithAffiliation,
} from "../controllers/institutionController.js";

const router = express.Router();

// Get all institutions (schools + communities)
router.get("/", getAllInstitutions);

// Get all schools
router.get("/schools", getAllSchools);

// Get all communities
router.get("/communities", getAllCommunities);

// Get coaches by institution
router.get("/:institutionId/coaches", getCoachesByInstitution);

// Get players by coach with affiliation
router.get("/coaches/:coachId/players", getPlayersByCoachWithAffiliation);

// Get institution by ID
router.get("/:id", getInstitutionById);

// Create institution
router.post("/", createInstitution);

// Update institution
router.put("/:id", updateInstitution);

// Add coach to institution
router.post("/:id/coaches", addCoachToInstitution);

export default router;

