import Attendance from "../models/attendanceModel.js";
import Session from "../models/sessionModel.js";
import Person from "../models/personModel.js";
import { createNotificationsForUsers } from "./notificationController.js";

/* ✅ MARK ATTENDANCE FOR SESSION */
export const markAttendance = async (req, res) => {
  try {
    const { sessionId, attendanceData, recordedBy } = req.body;

    if (!sessionId || !attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({ message: "sessionId and attendanceData array are required" });
    }

    if (!recordedBy) {
      return res.status(400).json({ message: "recordedBy (coach ID) is required" });
    }

    // Verify session exists
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Verify coach exists
    const coach = await Person.findById(recordedBy);
    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }

    // Process attendance records
    const results = [];
    const errors = [];

    for (const record of attendanceData) {
      try {
        const { playerId, status, date } = record;

        if (!playerId || !status) {
          errors.push({ playerId, error: "playerId and status are required" });
          continue;
        }

        // Verify player exists
        const player = await Person.findById(playerId);
        if (!player) {
          errors.push({ playerId, error: "Player not found" });
          continue;
        }

        // Check if player is enrolled in session
        if (!session.enrolledPlayers.includes(playerId)) {
          errors.push({ playerId, error: "Player not enrolled in this session" });
          continue;
        }

        // Upsert attendance record (update if exists, create if not)
        // Use session date or provided date, default to session's scheduled start date
        let attendanceDate = session.scheduledStart;
        if (date) {
          attendanceDate = new Date(date);
        } else if (session.scheduledStart) {
          attendanceDate = new Date(session.scheduledStart);
        } else {
          attendanceDate = new Date(); // Fallback to current date
        }
        
        const attendanceRecord = await Attendance.findOneAndUpdate(
          {
            sessionId,
            personId: playerId,
          },
          {
            sessionId,
            personId: playerId,
            status,
            recordedBy,
            date: attendanceDate,
            recordedAt: new Date(),
          },
          {
            upsert: true,
            new: true,
          }
        );

        results.push({
          playerId,
          status,
          attendanceId: attendanceRecord._id,
        });
      } catch (error) {
        errors.push({ playerId: record.playerId, error: error.message });
      }
    }

    // Notify players about attendance being recorded
    try {
      const playerIds = results.map(r => r.playerId).filter(id => id);
      if (playerIds.length > 0 && session) {
        const sessionDate = new Date(session.scheduledStart || Date.now()).toLocaleDateString();
        await createNotificationsForUsers(
          playerIds,
          "attendance_recorded",
          "Attendance Recorded",
          `Your attendance has been recorded for session "${session.title}" on ${sessionDate}.`,
          { relatedEntityId: sessionId, relatedEntityType: "session" }
        );
      }
    } catch (notificationError) {
      console.error("Error creating notifications for attendance:", notificationError);
    }

    res.status(200).json({
      message: "Attendance marked successfully",
      success: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Mark attendance error:", error);
    res.status(500).json({ message: "Failed to mark attendance", error: error.message });
  }
};

/* 📋 GET ATTENDANCE FOR SESSIONS */
export const getAttendanceForSessions = async (req, res) => {
  try {
    const { sessionIds } = req.query;

    if (!sessionIds) {
      return res.status(400).json({ message: "sessionIds query parameter is required" });
    }

    const sessionIdArray = typeof sessionIds === "string" 
      ? sessionIds.split(",").filter(id => id.trim())
      : Array.isArray(sessionIds) 
        ? sessionIds 
        : [];

    if (sessionIdArray.length === 0) {
      return res.status(400).json({ message: "At least one session ID is required" });
    }

    const attendanceRecords = await Attendance.find({
      sessionId: { $in: sessionIdArray },
    })
      .populate("personId", "firstName lastName email uniqueUserId")
      .populate("sessionId", "title scheduledStart")
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json(attendanceRecords);
  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({ message: "Failed to fetch attendance", error: error.message });
  }
};

/* 📊 GET ATTENDANCE STATS FOR A PLAYER */
export const getPlayerAttendanceStats = async (req, res) => {
  try {
    const { playerId } = req.params;

    if (!playerId) {
      return res.status(400).json({ message: "playerId is required" });
    }

    const attendanceRecords = await Attendance.find({ personId: playerId })
      .populate("sessionId", "title scheduledStart type")
      .sort({ date: -1 });

    const stats = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter((r) => r.status === "present").length,
      absent: attendanceRecords.filter((r) => r.status === "absent").length,
      late: attendanceRecords.filter((r) => r.status === "late").length,
      attendanceRate: attendanceRecords.length > 0
        ? ((attendanceRecords.filter((r) => r.status === "present").length / attendanceRecords.length) * 100).toFixed(2)
        : 0,
      records: attendanceRecords,
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error("Get player attendance stats error:", error);
    res.status(500).json({ message: "Failed to fetch attendance stats", error: error.message });
  }
};

