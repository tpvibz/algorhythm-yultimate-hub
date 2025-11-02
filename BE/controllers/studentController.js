import mongoose from "mongoose";
import Person from "../models/personModel.js";
import PlayerProfile from "../models/playerProfileModel.js";
import Attendance from "../models/attendanceModel.js";
import Assessment from "../models/assessmentModel.js";
import Session from "../models/sessionModel.js";
import HomeVisit from "../models/homeVisitModel.js";

// Get all students assigned to a coach
export const getStudentsByCoach = async (req, res) => {
  try {
    const { coachId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(coachId)) {
      return res.status(400).json({ message: "Invalid coach ID format" });
    }

    // Find all player profiles assigned to this coach
    const playerProfiles = await PlayerProfile.find({ assignedCoachId: coachId })
      .populate("personId", "firstName lastName email phone uniqueUserId")
      .populate("teamId", "name")
      .sort({ createdAt: -1 });

    const students = await Promise.all(
      playerProfiles.map(async (profile) => {
        const person = profile.personId;
        return {
          _id: person._id,
          profileId: profile._id,
          name: `${person.firstName} ${person.lastName}`,
          firstName: person.firstName,
          lastName: person.lastName,
          email: person.email,
          phone: person.phone,
          uniqueUserId: person.uniqueUserId,
          age: profile.age,
          gender: profile.gender,
          experience: profile.experience,
          team: profile.teamId ? { name: profile.teamId.name, _id: profile.teamId._id } : null,
          affiliation: profile.affiliation || null,
        };
      })
    );

    res.status(200).json(students);
  } catch (error) {
    console.error("Get students by coach error:", error);
    res.status(500).json({ message: "Failed to fetch students", error: error.message });
  }
};

// Get student details with attendance and performance data
export const getStudentDetails = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    // Get person details
    const person = await Person.findById(studentId);
    if (!person) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Get player profile
    const profile = await PlayerProfile.findOne({ personId: studentId })
      .populate("assignedCoachId", "firstName lastName email")
      .populate("teamId", "name");

    if (!profile) {
      return res.status(404).json({ message: "Player profile not found" });
    }

    // Get attendance data
    const attendanceRecords = await Attendance.find({ personId: studentId })
      .populate("sessionId", "title scheduledStart")
      .sort({ date: -1 });

    const totalSessions = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(a => a.status === "present").length;
    const attendancePercentage = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

    // Get performance/assessment data
    const assessments = await Assessment.find({ personId: studentId })
      .populate("assessorId", "firstName lastName")
      .sort({ assessmentDate: -1 });

    // Get sessions enrolled
    const enrolledSessions = await Session.find({ enrolledPlayers: studentId })
      .select("title scheduledStart scheduledEnd type")
      .sort({ scheduledStart: -1 });

    // Get home visits
    const homeVisits = await HomeVisit.find({ personId: studentId })
      .populate("visitedBy", "firstName lastName")
      .sort({ visitDate: -1 });

    res.status(200).json({
      student: {
        _id: person._id,
        firstName: person.firstName,
        lastName: person.lastName,
        name: `${person.firstName} ${person.lastName}`,
        email: person.email,
        phone: person.phone,
        uniqueUserId: person.uniqueUserId,
        age: profile.age,
        gender: profile.gender,
        experience: profile.experience,
        team: profile.teamId ? { name: profile.teamId.name, _id: profile.teamId._id } : null,
        coach: profile.assignedCoachId
          ? {
              _id: profile.assignedCoachId._id,
              name: `${profile.assignedCoachId.firstName} ${profile.assignedCoachId.lastName}`,
            }
          : null,
        stats: {
          totalMatchesPlayed: profile.totalMatchesPlayed || 0,
          totalGoals: profile.totalGoals || 0,
          totalAssists: profile.totalAssists || 0,
          winRate: profile.winRate || 0,
          spiritAverage: profile.spiritAverage || 0,
        },
      },
      attendance: {
        percentage: Math.round(attendancePercentage),
        totalSessions,
        presentCount,
        absentCount: totalSessions - presentCount,
        records: attendanceRecords.map((a) => ({
          _id: a._id,
          sessionTitle: a.sessionId?.title || "Unknown Session",
          sessionDate: a.sessionId?.scheduledStart,
          status: a.status,
          date: a.date,
          recordedAt: a.recordedAt,
        })),
      },
      performance: {
        assessments: assessments.map((a) => ({
          _id: a._id,
          type: a.assessmentType,
          date: a.assessmentDate,
          score: a.score,
          assessor: a.assessorId
            ? `${a.assessorId.firstName} ${a.assessorId.lastName}`
            : "Unknown",
        })),
      },
      enrolledSessions: enrolledSessions.map((s) => ({
        _id: s._id,
        title: s.title,
        startDate: s.scheduledStart,
        endDate: s.scheduledEnd,
        type: s.type,
      })),
      homeVisits: homeVisits.map((v) => ({
        _id: v._id,
        visitDate: v.visitDate,
        notes: v.notes,
        remarks: v.remarks,
        durationMinutes: v.durationMinutes,
        visitedBy: v.visitedBy
          ? `${v.visitedBy.firstName} ${v.visitedBy.lastName}`
          : "Unknown",
        createdAt: v.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get student details error:", error);
    res.status(500).json({ message: "Failed to fetch student details", error: error.message });
  }
};

// Get attendance data for a student
export const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;

    const attendanceRecords = await Attendance.find({ personId: studentId })
      .populate("sessionId", "title scheduledStart")
      .sort({ date: -1 });

    const totalSessions = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(a => a.status === "present").length;
    const lateCount = attendanceRecords.filter(a => a.status === "late").length;
    const absentCount = totalSessions - presentCount - lateCount;
    const attendancePercentage = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

    res.status(200).json({
      percentage: Math.round(attendancePercentage),
      totalSessions,
      presentCount,
      lateCount,
      absentCount,
      records: attendanceRecords,
    });
  } catch (error) {
    console.error("Get student attendance error:", error);
    res.status(500).json({ message: "Failed to fetch attendance", error: error.message });
  }
};

// Get performance/assessment data for a student
export const getStudentPerformance = async (req, res) => {
  try {
    const { studentId } = req.params;

    const assessments = await Assessment.find({ personId: studentId })
      .populate("assessorId", "firstName lastName")
      .sort({ assessmentDate: -1 });

    // Calculate average scores by type
    const baselineAssessments = assessments.filter(a => a.assessmentType === "baseline");
    const endlineAssessments = assessments.filter(a => a.assessmentType === "endline");
    const followupAssessments = assessments.filter(a => a.assessmentType === "followup");

    const avgBaseline = baselineAssessments.length > 0
      ? baselineAssessments.reduce((sum, a) => sum + (a.score || 0), 0) / baselineAssessments.length
      : 0;
    const avgEndline = endlineAssessments.length > 0
      ? endlineAssessments.reduce((sum, a) => sum + (a.score || 0), 0) / endlineAssessments.length
      : 0;
    const avgFollowup = followupAssessments.length > 0
      ? followupAssessments.reduce((sum, a) => sum + (a.score || 0), 0) / followupAssessments.length
      : 0;

    res.status(200).json({
      assessments,
      averages: {
        baseline: Math.round(avgBaseline * 10) / 10,
        endline: Math.round(avgEndline * 10) / 10,
        followup: Math.round(avgFollowup * 10) / 10,
      },
    });
  } catch (error) {
    console.error("Get student performance error:", error);
    res.status(500).json({ message: "Failed to fetch performance data", error: error.message });
  }
};

// Get home visits for a student
export const getHomeVisits = async (req, res) => {
  try {
    const { studentId } = req.params;

    const homeVisits = await HomeVisit.find({ personId: studentId })
      .populate("visitedBy", "firstName lastName email")
      .sort({ visitDate: -1 });

    res.status(200).json(homeVisits);
  } catch (error) {
    console.error("Get home visits error:", error);
    res.status(500).json({ message: "Failed to fetch home visits", error: error.message });
  }
};

// Create a home visit
export const createHomeVisit = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { visitDate, notes, remarks, durationMinutes, coachId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    if (!visitDate) {
      return res.status(400).json({ message: "Visit date is required" });
    }

    if (!coachId) {
      return res.status(400).json({ message: "Coach ID is required" });
    }

    // Validate student exists
    const student = await Person.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Validate coach exists
    const coach = await Person.findById(coachId);
    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }

    // Create home visit
    const homeVisit = new HomeVisit({
      personId: studentId,
      visitedBy: coachId,
      visitDate: new Date(visitDate),
      notes: notes || "",
      remarks: remarks || "",
      durationMinutes: durationMinutes || null,
    });

    await homeVisit.save();

    const populatedVisit = await HomeVisit.findById(homeVisit._id)
      .populate("personId", "firstName lastName")
      .populate("visitedBy", "firstName lastName");

    res.status(201).json({
      message: "Home visit recorded successfully",
      visit: populatedVisit,
    });
  } catch (error) {
    console.error("Create home visit error:", error);
    res.status(500).json({ message: "Failed to create home visit", error: error.message });
  }
};

