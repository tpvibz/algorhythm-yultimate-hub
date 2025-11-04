import MatchAttendance from "../models/matchAttendanceModel.js";
import Match from "../models/matchModel.js";
import Team from "../models/teamModel.js";
import TeamRoster from "../models/teamRosterModel.js";
import VolunteerTournamentAssignment from "../models/volunteerTournamentAssignmentModel.js";
import Person from "../models/personModel.js";

// Get all players for a match (from both teams)
export const getMatchPlayers = async (req, res) => {
  try {
    const { matchId } = req.params;

    // Verify match exists
    const match = await Match.findById(matchId)
      .populate('teamAId', 'teamName')
      .populate('teamBId', 'teamName');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    // Get all players from both teams via TeamRoster
    const teamARoster = await TeamRoster.find({ teamId: match.teamAId._id })
      .populate('playerId', 'firstName lastName email uniqueUserId');
    const teamBRoster = await TeamRoster.find({ teamId: match.teamBId._id })
      .populate('playerId', 'firstName lastName email uniqueUserId');

    // Also get players from team.players array (legacy support)
    const teamA = await Team.findById(match.teamAId._id);
    const teamB = await Team.findById(match.teamBId._id);

    // Combine roster players with team.players
    const teamAPlayers = [];
    const teamBPlayers = [];

    // Add players from TeamRoster
    teamARoster.forEach(roster => {
      if (roster.playerId && roster.status === 'active') {
        teamAPlayers.push({
          _id: roster.playerId._id,
          firstName: roster.playerId.firstName,
          lastName: roster.playerId.lastName,
          email: roster.playerId.email,
          uniqueUserId: roster.playerId.uniqueUserId,
          jerseyNumber: roster.jerseyNumber
        });
      }
    });

    teamBRoster.forEach(roster => {
      if (roster.playerId && roster.status === 'active') {
        teamBPlayers.push({
          _id: roster.playerId._id,
          firstName: roster.playerId.firstName,
          lastName: roster.playerId.lastName,
          email: roster.playerId.email,
          uniqueUserId: roster.playerId.uniqueUserId,
          jerseyNumber: roster.jerseyNumber
        });
      }
    });

    // Add legacy players from team.players array if they exist
    if (teamA && teamA.players && Array.isArray(teamA.players)) {
      teamA.players.forEach(player => {
        if (player.playerId) {
          // Check if player already exists in roster
          const exists = teamAPlayers.find(p => p._id?.toString() === player.playerId || p.uniqueUserId === player.playerId);
          if (!exists) {
            teamAPlayers.push({
              playerId: player.playerId,
              name: player.name,
              email: player.email,
              age: player.age,
              position: player.position
            });
          }
        }
      });
    }

    if (teamB && teamB.players && Array.isArray(teamB.players)) {
      teamB.players.forEach(player => {
        if (player.playerId) {
          const exists = teamBPlayers.find(p => p._id?.toString() === player.playerId || p.uniqueUserId === player.playerId);
          if (!exists) {
            teamBPlayers.push({
              playerId: player.playerId,
              name: player.name,
              email: player.email,
              age: player.age,
              position: player.position
            });
          }
        }
      });
    }

    // Get existing attendance records for this match
    const attendanceRecords = await MatchAttendance.find({ matchId })
      .populate('playerId', 'firstName lastName');

    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      attendanceMap[record.playerId._id.toString()] = {
        status: record.status,
        recordedAt: record.recordedAt,
        recordedBy: record.recordedBy
      };
    });

    res.status(200).json({
      success: true,
      data: {
        match: {
          _id: match._id,
          teamA: {
            _id: match.teamAId._id,
            teamName: match.teamAId.teamName
          },
          teamB: {
            _id: match.teamBId._id,
            teamName: match.teamBId.teamName
          },
          startTime: match.startTime,
          status: match.status
        },
        teamAPlayers: teamAPlayers.map(player => ({
          ...player,
          attendance: attendanceMap[player._id?.toString() || player.playerId] || null
        })),
        teamBPlayers: teamBPlayers.map(player => ({
          ...player,
          attendance: attendanceMap[player._id?.toString() || player.playerId] || null
        }))
      }
    });
  } catch (error) {
    console.error("Get match players error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching match players",
      error: error.message
    });
  }
};

// Mark attendance for players in a match
export const markMatchAttendance = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { attendanceData, volunteerId } = req.body;

    if (!attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({
        success: false,
        message: "attendanceData array is required"
      });
    }

    if (!volunteerId) {
      return res.status(400).json({
        success: false,
        message: "volunteerId is required"
      });
    }

    // Verify match exists
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    // Verify volunteer is assigned to this tournament
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

    // Verify volunteer exists
    const volunteer = await Person.findById(volunteerId);
    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer not found"
      });
    }

    // Process attendance records
    const results = [];
    const errors = [];

    for (const record of attendanceData) {
      try {
        const { playerId, teamId, status } = record;

        if (!playerId || !teamId || !status) {
          errors.push({ playerId, error: "playerId, teamId, and status are required" });
          continue;
        }

        if (!["present", "absent", "late"].includes(status)) {
          errors.push({ playerId, error: "Status must be 'present', 'absent', or 'late'" });
          continue;
        }

        // Verify player exists
        const player = await Person.findById(playerId);
        if (!player) {
          errors.push({ playerId, error: "Player not found" });
          continue;
        }

        // Verify team exists and is part of the match
        const team = await Team.findById(teamId);
        if (!team) {
          errors.push({ playerId, error: "Team not found" });
          continue;
        }

        if (teamId !== match.teamAId.toString() && teamId !== match.teamBId.toString()) {
          errors.push({ playerId, error: "Team is not part of this match" });
          continue;
        }

        // Upsert attendance record
        const attendanceRecord = await MatchAttendance.findOneAndUpdate(
          {
            matchId,
            playerId
          },
          {
            matchId,
            playerId,
            teamId,
            status,
            recordedBy: volunteerId,
            recordedAt: new Date()
          },
          {
            upsert: true,
            new: true
          }
        ).populate('playerId', 'firstName lastName');

        results.push({
          playerId,
          playerName: `${attendanceRecord.playerId.firstName} ${attendanceRecord.playerId.lastName}`,
          status,
          attendanceId: attendanceRecord._id
        });
      } catch (error) {
        errors.push({ playerId: record.playerId, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Attendance marked for ${results.length} player(s)`,
      data: {
        success: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error("Mark match attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while marking attendance",
      error: error.message
    });
  }
};

// Check if attendance is complete for a match
export const checkMatchAttendanceStatus = async (req, res) => {
  try {
    const { matchId } = req.params;

    // Verify match exists
    const match = await Match.findById(matchId)
      .populate('teamAId', 'teamName')
      .populate('teamBId', 'teamName');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    // Get all players from both teams
    const teamARoster = await TeamRoster.find({ teamId: match.teamAId._id });
    const teamBRoster = await TeamRoster.find({ teamId: match.teamBId._id });
    const teamA = await Team.findById(match.teamAId._id);
    const teamB = await Team.findById(match.teamBId._id);

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

    // Get attendance records
    const attendanceRecords = await MatchAttendance.find({ matchId });
    const attendanceCount = attendanceRecords.length;

    // Get attendance summary
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'late').length;

    const isComplete = attendanceCount >= totalPlayers && totalPlayers > 0;

    res.status(200).json({
      success: true,
      data: {
        match: {
          _id: match._id,
          teamA: {
            _id: match.teamAId._id,
            teamName: match.teamAId.teamName
          },
          teamB: {
            _id: match.teamBId._id,
            teamName: match.teamBId.teamName
          }
        },
        attendance: {
          isComplete,
          totalPlayers,
          attendanceCount,
          presentCount,
          absentCount,
          lateCount,
          percentage: totalPlayers > 0 ? Math.round((attendanceCount / totalPlayers) * 100) : 0
        }
      }
    });
  } catch (error) {
    console.error("Check match attendance status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while checking attendance status",
      error: error.message
    });
  }
};

// Get attendance records for a match
export const getMatchAttendance = async (req, res) => {
  try {
    const { matchId } = req.params;

    const attendanceRecords = await MatchAttendance.find({ matchId })
      .populate('playerId', 'firstName lastName email uniqueUserId')
      .populate('teamId', 'teamName')
      .populate('recordedBy', 'firstName lastName')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: {
        attendance: attendanceRecords.map(record => ({
          _id: record._id,
          matchId: record.matchId,
          player: {
            _id: record.playerId._id,
            firstName: record.playerId.firstName,
            lastName: record.playerId.lastName,
            email: record.playerId.email,
            uniqueUserId: record.playerId.uniqueUserId
          },
          team: {
            _id: record.teamId._id,
            teamName: record.teamId.teamName
          },
          status: record.status,
          recordedBy: {
            _id: record.recordedBy._id,
            firstName: record.recordedBy.firstName,
            lastName: record.recordedBy.lastName
          },
          recordedAt: record.recordedAt,
          createdAt: record.createdAt
        })),
        count: attendanceRecords.length
      }
    });
  } catch (error) {
    console.error("Get match attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching match attendance",
      error: error.message
    });
  }
};

