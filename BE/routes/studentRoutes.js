import express from "express";
import {
  getStudentsByCoach,
  getStudentDetails,
  getStudentAttendance,
  getStudentPerformance,
  getHomeVisits,
  createHomeVisit,
} from "../controllers/studentController.js";

const router = express.Router();

// Get all students assigned to a coach
router.get("/coach/:coachId", getStudentsByCoach);

// Get student details (with attendance and performance)
router.get("/:studentId/details", getStudentDetails);

// Get student attendance
router.get("/:studentId/attendance", getStudentAttendance);

// Get student performance
router.get("/:studentId/performance", getStudentPerformance);

// Get home visits for a student
router.get("/:studentId/home-visits", getHomeVisits);

// Create a home visit
router.post("/:studentId/home-visits", createHomeVisit);

export default router;

