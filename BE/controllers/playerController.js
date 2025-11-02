import mongoose from "mongoose";
import Person from "../models/personModel.js";
import PlayerProfile from "../models/playerProfileModel.js";
import Attendance from "../models/attendanceModel.js";
import HomeVisit from "../models/homeVisitModel.js";
import Match from "../models/matchModel.js";
import Team from "../models/teamModel.js";
import Tournament from "../models/tournamentModel.js";
import School from "../models/schoolModel.js";
import PlayerMatchFeedback from "../models/playerMatchFeedbackModel.js";

// Get player profile with all details
export const getPlayerProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid player ID format" });
    }

    const person = await Person.findById(id);
    if (!person) {
      return res.status(404).json({ message: "Player not found" });
    }

    const profile = await PlayerProfile.findOne({ personId: id })
      .populate("assignedCoachId", "firstName lastName email uniqueUserId")
      .populate("teamId", "name")
      .populate("affiliation.id", "name location type");

    if (!profile) {
      return res.status(404).json({ message: "Player profile not found" });
    }

    res.status(200).json({
      player: {
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
        affiliation: profile.affiliation || null,
        coach: profile.assignedCoachId
          ? {
              _id: profile.assignedCoachId._id,
              name: `${profile.assignedCoachId.firstName} ${profile.assignedCoachId.lastName}`,
              email: profile.assignedCoachId.email,
              uniqueUserId: profile.assignedCoachId.uniqueUserId,
            }
          : null,
        team: profile.teamId ? { _id: profile.teamId._id, name: profile.teamId.name } : null,
        transferRequest: profile.transferRequest || null,
        transferStatus: profile.transferRequest?.status || null,
      },
    });
  } catch (error) {
    console.error("Get player profile error:", error);
    res.status(500).json({ message: "Failed to fetch player profile", error: error.message });
  }
};

// Get player stats
export const getPlayerStats = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await PlayerProfile.findOne({ personId: id });

    if (!profile) {
      return res.status(404).json({ message: "Player profile not found" });
    }

    res.status(200).json({
      tournamentsPlayed: profile.tournamentsPlayed || profile.pastTournaments?.length || 0,
      spiritScoreAvg: profile.spiritAverage || 0,
      teamRank: profile.teamRank || 0,
      achievementsCount: profile.achievementsCount || 0,
      totalMatchesPlayed: profile.totalMatchesPlayed || 0,
      totalGoals: profile.totalGoals || 0,
      totalAssists: profile.totalAssists || 0,
      winRate: profile.winRate || 0,
    });
  } catch (error) {
    console.error("Get player stats error:", error);
    res.status(500).json({ message: "Failed to fetch player stats", error: error.message });
  }
};

// Get player attendance
export const getPlayerAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const attendanceRecords = await Attendance.find({ personId: id })
      .populate("sessionId", "title scheduledStart scheduledEnd")
      .sort({ date: -1 });

    const totalSessions = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((a) => a.status === "present").length;
    const lateCount = attendanceRecords.filter((a) => a.status === "late").length;
    const absentCount = totalSessions - presentCount - lateCount;
    const attendancePercentage = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

    // Group by week for chart
    const weeklyData = attendanceRecords.reduce((acc, record) => {
      const weekStart = new Date(record.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!acc[weekKey]) {
        acc[weekKey] = { week: weekKey, present: 0, absent: 0, late: 0 };
      }
      if (record.status === "present") acc[weekKey].present++;
      else if (record.status === "late") acc[weekKey].late++;
      else acc[weekKey].absent++;

      return acc;
    }, {});

    const weeklyChart = Object.values(weeklyData).sort((a, b) => a.week.localeCompare(b.week));

    res.status(200).json({
      percentage: Math.round(attendancePercentage * 10) / 10,
      totalSessions,
      presentCount,
      lateCount,
      absentCount,
      records: attendanceRecords.map((a) => ({
        _id: a._id,
        date: a.date,
        sessionTitle: a.sessionId?.title || "Unknown Session",
        sessionDate: a.sessionId?.scheduledStart,
        status: a.status,
        recordedAt: a.recordedAt,
      })),
      weeklyChart,
    });
  } catch (error) {
    console.error("Get player attendance error:", error);
    res.status(500).json({ message: "Failed to fetch attendance", error: error.message });
  }
};

// Get player matches
export const getPlayerMatches = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await PlayerProfile.findOne({ personId: id }).populate("teamId");

    if (!profile || !profile.teamId) {
      return res.status(200).json({ upcoming: [], past: [] });
    }

    // Get matches where player's team is involved
    const teamMatches = await Match.find({
      $or: [{ teamAId: profile.teamId._id }, { teamBId: profile.teamId._id }],
    })
      .populate("teamAId", "name")
      .populate("teamBId", "name")
      .populate("tournamentId", "name")
      .sort({ startTime: 1 });

    const now = new Date();
    const upcoming = teamMatches
      .filter((m) => new Date(m.startTime) >= now)
      .map((m) => ({
        _id: m._id,
        opponent:
          m.teamAId._id.toString() === profile.teamId._id.toString()
            ? m.teamBId?.name || "TBD"
            : m.teamAId?.name || "TBD",
        date: m.startTime,
        venue: m.fieldName || "TBD",
        type: m.tournamentId ? m.tournamentId.name : "Friendly",
        status: m.status || "scheduled",
      }));

    const past = teamMatches
      .filter((m) => new Date(m.startTime) < now)
      .map((m) => ({
        _id: m._id,
        opponent:
          m.teamAId._id.toString() === profile.teamId._id.toString()
            ? m.teamBId?.name || "TBD"
            : m.teamAId?.name || "TBD",
        date: m.startTime,
        venue: m.fieldName || "TBD",
        type: m.tournamentId ? m.tournamentId.name : "Friendly",
        status: m.status,
        score: m.score?.teamA !== undefined && m.score?.teamB !== undefined
          ? `${m.score.teamA} - ${m.score.teamB}`
          : null,
      }));

    res.status(200).json({ upcoming, past });
  } catch (error) {
    console.error("Get player matches error:", error);
    res.status(500).json({ message: "Failed to fetch matches", error: error.message });
  }
};

// Get player achievements
export const getPlayerAchievements = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await PlayerProfile.findOne({ personId: id });

    // Mock achievements - in production, this would come from an achievements collection
    const achievements = [
      {
        _id: "1",
        title: "MVP Award",
        event: "Spring Tournament 2025",
        date: new Date("2025-04-15"),
        icon: "trophy",
      },
      {
        _id: "2",
        title: "Perfect Spirit Score",
        event: "League Match #12",
        date: new Date("2025-03-20"),
        icon: "star",
      },
      {
        _id: "3",
        title: "Most Improved Player",
        event: "Q1 Season Review",
        date: new Date("2025-03-01"),
        icon: "trending-up",
      },
    ];

    res.status(200).json(achievements);
  } catch (error) {
    console.error("Get player achievements error:", error);
    res.status(500).json({ message: "Failed to fetch achievements", error: error.message });
  }
};

// Get player home visits
export const getPlayerHomeVisits = async (req, res) => {
  try {
    const { id } = req.params;

    const homeVisits = await HomeVisit.find({ personId: id })
      .populate("visitedBy", "firstName lastName email")
      .sort({ visitDate: -1 });

    res.status(200).json(
      homeVisits.map((v) => ({
        _id: v._id,
        visitDate: v.visitDate,
        notes: v.notes,
        remarks: v.remarks,
        durationMinutes: v.durationMinutes,
        visitedBy: v.visitedBy
          ? {
              _id: v.visitedBy._id,
              name: `${v.visitedBy.firstName} ${v.visitedBy.lastName}`,
              email: v.visitedBy.email,
            }
          : null,
        createdAt: v.createdAt,
      }))
    );
  } catch (error) {
    console.error("Get player home visits error:", error);
    res.status(500).json({ message: "Failed to fetch home visits", error: error.message });
  }
};

// Request transfer
export const requestTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { toInstitutionId } = req.body;

    if (!toInstitutionId) {
      return res.status(400).json({ message: "Target institution is required" });
    }

    const profile = await PlayerProfile.findOne({ personId: id }).populate("affiliation.id");

    if (!profile) {
      return res.status(404).json({ message: "Player profile not found" });
    }

    if (!profile.affiliation) {
      return res.status(400).json({ message: "Player has no current affiliation" });
    }

    // Check if there's already a pending request
    if (profile.transferRequest?.status === "pending") {
      return res.status(400).json({ message: "You already have a pending transfer request" });
    }

    // Get target institution
    const targetInstitution = await School.findById(toInstitutionId);
    if (!targetInstitution) {
      return res.status(404).json({ message: "Target institution not found" });
    }

    // Update transfer request
    profile.transferRequest = {
      from: {
        affiliationType: profile.affiliation.type,
        name: profile.affiliation.name,
        location: profile.affiliation.location,
      },
      to: {
        affiliationType: targetInstitution.type,
        id: targetInstitution._id,
        name: targetInstitution.name,
        location: targetInstitution.location,
      },
      status: "pending",
      requestedOn: new Date(),
    };

    await profile.save();

    res.status(200).json({
      message: "Transfer request submitted successfully",
      transferRequest: profile.transferRequest,
    });
  } catch (error) {
    console.error("Request transfer error:", error);
    res.status(500).json({ message: "Failed to submit transfer request", error: error.message });
  }
};

// Get transfer history
export const getTransferHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await PlayerProfile.findOne({ personId: id });

    if (!profile) {
      return res.status(404).json({ message: "Player profile not found" });
    }

    res.status(200).json({
      transferRequest: profile.transferRequest || null,
      transferHistory: profile.transferHistory || [],
    });
  } catch (error) {
    console.error("Get transfer history error:", error);
    res.status(500).json({ message: "Failed to fetch transfer history", error: error.message });
  }
};

// Get player feedback from coaches
export const getPlayerFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const playerProfile = await PlayerProfile.findOne({ personId: id });
    if (!playerProfile) {
      return res.status(404).json({ message: "Player profile not found" });
    }

    // Get all match feedback for this player
    const matchFeedback = await PlayerMatchFeedback.find({ playerId: id })
      .populate("matchId", "startTime roundName matchNumber")
      .populate("tournamentId", "name location startDate endDate")
      .populate("coachId", "firstName lastName")
      .populate("teamId", "teamName")
      .sort({ submittedAt: -1 });

    // Also get feedback from player profile (legacy feedback)
    const profileFeedback = playerProfile.feedback || [];
    const legacyFeedback = await Promise.all(
      profileFeedback.map(async (fb) => {
        const coach = await Person.findById(fb.coachId).select("firstName lastName");
        return {
          _id: fb._id || new mongoose.Types.ObjectId(),
          coach: coach
            ? {
                _id: coach._id,
                name: `${coach.firstName} ${coach.lastName}`,
              }
            : null,
          score: fb.rating ? `${Math.round((fb.rating / 10) * 7)}/7` : null,
          feedback: fb.comments,
          date: fb.date,
          matchId: fb.matchId || null,
          source: "profile",
        };
      })
    );

    // Format match feedback
    const formattedMatchFeedback = matchFeedback.map((fb) => ({
      _id: fb._id,
      coach: fb.coachId
        ? {
            _id: fb.coachId._id,
            name: `${fb.coachId.firstName} ${fb.coachId.lastName}`,
          }
        : null,
      score: fb.score,
      feedback: fb.feedback,
      date: fb.submittedAt,
      match: fb.matchId
        ? {
            _id: fb.matchId._id,
            roundName: fb.matchId.roundName,
            matchNumber: fb.matchId.matchNumber,
            startTime: fb.matchId.startTime,
          }
        : null,
      tournament: fb.tournamentId
        ? {
            _id: fb.tournamentId._id,
            name: fb.tournamentId.name,
            location: fb.tournamentId.location,
            startDate: fb.tournamentId.startDate,
            endDate: fb.tournamentId.endDate,
          }
        : null,
      team: fb.teamId
        ? {
            _id: fb.teamId._id,
            teamName: fb.teamId.teamName,
          }
        : null,
      source: "match",
    }));

    // Combine and sort by date
    const allFeedback = [...formattedMatchFeedback, ...legacyFeedback].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    res.status(200).json({
      feedback: allFeedback,
      count: allFeedback.length,
    });
  } catch (error) {
    console.error("Get player feedback error:", error);
    res.status(500).json({ message: "Failed to fetch player feedback", error: error.message });
  }
};

