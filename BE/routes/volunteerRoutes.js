import express from "express";
import {
  getAllVolunteers,
  assignVolunteersToTournament,
  unassignVolunteerFromTournament,
  getTournamentVolunteers,
  getVolunteerTournaments,
  updateAssignment
} from "../controllers/volunteerController.js";

const router = express.Router();

// Get all volunteers
router.get("/", getAllVolunteers);

// Get volunteers assigned to a tournament (MUST come before /:volunteerId/tournaments)
router.get("/tournaments/:tournamentId/volunteers", getTournamentVolunteers);

// Assign volunteers to a tournament
router.post("/tournaments/:tournamentId/assign", assignVolunteersToTournament);

// Unassign volunteer from tournament
router.delete("/tournaments/:tournamentId/volunteers/:volunteerId", unassignVolunteerFromTournament);

// Get tournaments assigned to a volunteer (MUST come after more specific routes)
router.get("/:volunteerId/tournaments", getVolunteerTournaments);

// Update assignment
router.put("/assignments/:assignmentId", updateAssignment);

export default router;

