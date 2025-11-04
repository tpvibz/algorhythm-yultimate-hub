import MatchScoreEvent from "../models/matchScoreEventModel.js";
import Match from "../models/matchModel.js";
import VolunteerTournamentAssignment from "../models/volunteerTournamentAssignmentModel.js";
import MatchAttendance from "../models/matchAttendanceModel.js";
import Team from "../models/teamModel.js";
import TeamRoster from "../models/teamRosterModel.js";

// Helper function to check if attendance is complete for a match
const checkAttendanceComplete = async (matchId) => {
  const match = await Match.findById(matchId);
  if (!match) return false;

  // Get all players from both teams
  const teamARoster = await TeamRoster.find({ teamId: match.teamAId });
  const teamBRoster = await TeamRoster.find({ teamId: match.teamBId });
  const teamA = await Team.findById(match.teamAId);
  const teamB = await Team.findById(match.teamBId);

  // Count total players
  let totalPlayers = teamARoster.filter(r => r.status === 'active').length + 
                     teamBRoster.filter(r => r.status === 'active').length;

  // Add legacy players if they exist
  if (teamA && teamA.players && Array.isArray(teamA.players)) {
    totalPlayers += teamA.players.filter(p => p.playerId).length;
  }
  if (teamB && teamB.players && Array.isArray(teamB.players)) {
    totalPlayers += teamB.players.filter(p => p.playerId).length;
  }

  if (totalPlayers === 0) return true; // No players to track

  // Get attendance records
  const attendanceRecords = await MatchAttendance.find({ matchId });
  const attendanceCount = attendanceRecords.length;

  return attendanceCount >= totalPlayers;
};

// Record a score event (point scored)
export const recordScoreEvent = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { teamId, playerId, points = 1 } = req.body;
    const volunteerId = req.user?.id || req.body.volunteerId; // Allow volunteerId in body for now

    // Verify match exists
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    // Verify volunteer is assigned to this tournament
    if (volunteerId) {
      const assignment = await VolunteerTournamentAssignment.findOne({
        volunteerId,
        tournamentId: match.tournamentId
      });
      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: "Volunteer not assigned to this tournament"
        });
      }
    }

    // Verify teamId matches one of the teams in the match
    if (teamId !== match.teamAId.toString() && teamId !== match.teamBId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Team ID does not match any team in this match"
      });
    }

    // Check if attendance is complete before allowing score updates
    const attendanceComplete = await checkAttendanceComplete(matchId);
    if (!attendanceComplete) {
      return res.status(400).json({
        success: false,
        message: "Attendance must be completed before recording scores. Please mark attendance for all players first.",
        requiresAttendance: true
      });
    }

    // Create score event
    const scoreEvent = await MatchScoreEvent.create({
      matchId,
      teamId,
      playerId: playerId || null,
      points,
      timestamp: new Date()
    });

    // Update match score in real-time
    if (teamId === match.teamAId.toString()) {
      match.score = {
        teamA: (match.score?.teamA || 0) + points,
        teamB: match.score?.teamB || 0
      };
    } else {
      match.score = {
        teamA: match.score?.teamA || 0,
        teamB: (match.score?.teamB || 0) + points
      };
    }

    // Set match status to ongoing if it's still scheduled
    if (match.status === 'scheduled') {
      match.status = 'ongoing';
    }

    await match.save();

    // Populate match data for response
    const updatedMatch = await Match.findById(matchId)
      .populate('teamAId', 'teamName')
      .populate('teamBId', 'teamName');

    res.status(201).json({
      success: true,
      message: "Score event recorded successfully",
      data: {
        scoreEvent: {
          _id: scoreEvent._id,
          matchId: scoreEvent.matchId,
          teamId: scoreEvent.teamId,
          playerId: scoreEvent.playerId,
          points: scoreEvent.points,
          timestamp: scoreEvent.timestamp
        },
        match: {
          _id: updatedMatch._id,
          teamA: {
            _id: updatedMatch.teamAId._id,
            teamName: updatedMatch.teamAId.teamName
          },
          teamB: {
            _id: updatedMatch.teamBId._id,
            teamName: updatedMatch.teamBId.teamName
          },
          score: updatedMatch.score,
          status: updatedMatch.status
        }
      }
    });
  } catch (error) {
    console.error("Record score event error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while recording score event",
      error: error.message
    });
  }
};

// Get score events for a match
export const getMatchScoreEvents = async (req, res) => {
  try {
    const { matchId } = req.params;

    const scoreEvents = await MatchScoreEvent.find({ matchId })
      .populate('teamId', 'teamName')
      .populate('playerId', 'firstName lastName')
      .sort({ timestamp: 1 });

    res.status(200).json({
      success: true,
      data: {
        scoreEvents: scoreEvents.map(event => ({
          _id: event._id,
          matchId: event.matchId,
          team: {
            _id: event.teamId._id,
            teamName: event.teamId.teamName
          },
          player: event.playerId ? {
            _id: event.playerId._id,
            firstName: event.playerId.firstName,
            lastName: event.playerId.lastName
          } : null,
          points: event.points,
          timestamp: event.timestamp
        })),
        count: scoreEvents.length
      }
    });
  } catch (error) {
    console.error("Get score events error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching score events",
      error: error.message
    });
  }
};

// Update match score directly (for corrections)
export const updateMatchScore = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { score, status } = req.body;
    const volunteerId = req.user?.id || req.body.volunteerId;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    // Verify volunteer is assigned to this tournament
    if (volunteerId) {
      const assignment = await VolunteerTournamentAssignment.findOne({
        volunteerId,
        tournamentId: match.tournamentId
      });
      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: "Volunteer not assigned to this tournament"
        });
      }
    }

    // If starting the match (status changing from scheduled to ongoing) or updating score,
    // check if attendance is complete
    const isStartingMatch = status === 'ongoing' && match.status === 'scheduled';
    if ((isStartingMatch || score) && match.status === 'scheduled') {
      const attendanceComplete = await checkAttendanceComplete(matchId);
      if (!attendanceComplete) {
        return res.status(400).json({
          success: false,
          message: "Attendance must be completed before starting the match or updating scores. Please mark attendance for all players first.",
          requiresAttendance: true
        });
      }
    }

    // Update score
    if (score) {
      match.score = {
        teamA: score.teamA !== undefined ? score.teamA : match.score?.teamA || 0,
        teamB: score.teamB !== undefined ? score.teamB : match.score?.teamB || 0
      };
    }

    // Update status
    if (status) {
      if (!["scheduled", "ongoing", "completed"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status"
        });
      }
      match.status = status;

      // Auto-determine winner if match is completed
      if (status === 'completed' && match.score) {
        if (match.score.teamA > match.score.teamB) {
          match.winnerTeamId = match.teamAId;
        } else if (match.score.teamB > match.score.teamA) {
          match.winnerTeamId = match.teamBId;
        } else {
          match.winnerTeamId = null; // Tie
        }
      }
    }

    await match.save();

    const updatedMatch = await Match.findById(matchId)
      .populate('teamAId', 'teamName')
      .populate('teamBId', 'teamName');

    res.status(200).json({
      success: true,
      message: "Match score updated successfully",
      data: {
        match: {
          _id: updatedMatch._id,
          tournamentId: updatedMatch.tournamentId,
          fieldName: updatedMatch.fieldName,
          teamA: {
            _id: updatedMatch.teamAId._id,
            teamName: updatedMatch.teamAId.teamName
          },
          teamB: {
            _id: updatedMatch.teamBId._id,
            teamName: updatedMatch.teamBId.teamName
          },
          startTime: updatedMatch.startTime,
          endTime: updatedMatch.endTime,
          status: updatedMatch.status,
          score: updatedMatch.score,
          winnerTeamId: updatedMatch.winnerTeamId
        }
      }
    });
  } catch (error) {
    console.error("Update match score error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating match score",
      error: error.message
    });
  }
};

// Get matches for a volunteer's assigned tournaments
export const getVolunteerMatches = async (req, res) => {
  try {
    const { volunteerId } = req.params;

    // Get all tournaments assigned to this volunteer
    const assignments = await VolunteerTournamentAssignment.find({ volunteerId });
    const tournamentIds = assignments.map(a => a.tournamentId);

    if (tournamentIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          matches: [],
          count: 0
        }
      });
    }

    // Get all matches for these tournaments
    const matches = await Match.find({ tournamentId: { $in: tournamentIds } })
      .populate('teamAId', 'teamName')
      .populate('teamBId', 'teamName')
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      data: {
        matches: matches.map(match => ({
          _id: match._id,
          tournamentId: match.tournamentId,
          fieldName: match.fieldName,
          teamA: {
            _id: match.teamAId._id,
            teamName: match.teamAId.teamName
          },
          teamB: {
            _id: match.teamBId._id,
            teamName: match.teamBId.teamName
          },
          startTime: match.startTime,
          endTime: match.endTime,
          status: match.status,
          score: match.score,
          winnerTeamId: match.winnerTeamId
        })),
        count: matches.length
      }
    });
  } catch (error) {
    console.error("Get volunteer matches error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching volunteer matches",
      error: error.message
    });
  }
};

