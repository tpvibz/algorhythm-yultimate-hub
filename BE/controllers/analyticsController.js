import Tournament from "../models/tournamentModel.js";
import Team from "../models/teamModel.js";
import Match from "../models/matchModel.js";
import PlayerProfile from "../models/playerProfileModel.js";
import SpiritSubmission from "../models/spiritSubmissionModel.js";
import MatchAttendance from "../models/matchAttendanceModel.js";
import MatchScoreEvent from "../models/matchScoreEventModel.js";
import Person from "../models/personModel.js";
import Session from "../models/sessionModel.js";
import Attendance from "../models/attendanceModel.js";
import RoleRequest from "../models/roleRequestModel.js";
import VolunteerTournamentAssignment from "../models/volunteerTournamentAssignmentModel.js";
import PlayerMatchFeedback from "../models/playerMatchFeedbackModel.js";
import MatchImage from "../models/matchImageModel.js";

/**
 * Tournament Summary Dashboard
 * Shows overview of teams, matches, scores, and spirit rankings
 * For admin: all tournaments
 * For coach: only their teams' tournaments
 */
export const getTournamentSummary = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const userRole = req.user?.role || [];
    const userId = req.user?.id;
    const isAdmin = Array.isArray(userRole) ? userRole.includes("admin") : userRole === "admin";
    const isCoach = Array.isArray(userRole) ? userRole.includes("coach") : userRole === "coach";

    // If tournamentId is provided, get specific tournament summary
    if (tournamentId) {
      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: "Tournament not found"
        });
      }

      // For coaches, check if they have teams in this tournament
      let teamsQuery = { tournamentId: tournamentId.toString() };
      if (isCoach && !isAdmin) {
        const coachTeams = await Team.find({ coachId: userId });
        const coachTeamIds = coachTeams.map(t => t._id.toString());
        teamsQuery = {
          tournamentId: tournamentId.toString(),
          _id: { $in: coachTeamIds }
        };
      }

      const teams = await Team.find(teamsQuery)
        .populate('coachId', 'firstName lastName email');

      const allTournamentTeams = await Team.find({ tournamentId: tournamentId.toString() });
      const allTeamIds = allTournamentTeams.map(t => t._id);

      // Get matches for this tournament
      const matches = await Match.find({
        tournamentId,
        $or: [
          { teamAId: { $in: allTeamIds } },
          { teamBId: { $in: allTeamIds } }
        ]
      })
        .populate('teamAId', 'teamName')
        .populate('teamBId', 'teamName')
        .populate('winnerTeamId', 'teamName');

      // Calculate match statistics
      const totalMatches = matches.length;
      const completedMatches = matches.filter(m => m.status === 'completed').length;
      const scheduledMatches = matches.filter(m => m.status === 'scheduled').length;
      const ongoingMatches = matches.filter(m => m.status === 'ongoing').length;

      // Calculate scores
      const totalPointsScored = matches.reduce((sum, match) => {
        return sum + (match.score?.teamA || 0) + (match.score?.teamB || 0);
      }, 0);

      // Get spirit rankings
      const spiritSubmissions = await SpiritSubmission.find({
        matchId: { $in: matches.map(m => m._id) }
      });

      // Calculate spirit scores per team
      const spiritScores = {};
      spiritSubmissions.forEach(submission => {
        const opponentTeamId = submission.forOpponentTeamId.toString();
        if (!spiritScores[opponentTeamId]) {
          spiritScores[opponentTeamId] = {
            teamId: opponentTeamId,
            totalScore: 0,
            count: 0,
            categories: {
              rulesKnowledge: [],
              foulsContact: [],
              fairMindedness: [],
              positiveAttitude: [],
              communication: []
            }
          };
        }
        const categories = submission.categories;
        const totalForMatch = (
          categories.rulesKnowledge +
          categories.foulsContact +
          categories.fairMindedness +
          categories.positiveAttitude +
          categories.communication
        ); // 0–20 scale per match
        spiritScores[opponentTeamId].totalScore += totalForMatch;
        spiritScores[opponentTeamId].count += 1;
        spiritScores[opponentTeamId].categories.rulesKnowledge.push(categories.rulesKnowledge);
        spiritScores[opponentTeamId].categories.foulsContact.push(categories.foulsContact);
        spiritScores[opponentTeamId].categories.fairMindedness.push(categories.fairMindedness);
        spiritScores[opponentTeamId].categories.positiveAttitude.push(categories.positiveAttitude);
        spiritScores[opponentTeamId].categories.communication.push(categories.communication);
      });

      // Calculate average spirit scores
      const spiritRankings = Object.values(spiritScores).map(score => {
        const avgScore = score.count > 0 ? score.totalScore / score.count : 0; // average total per game (0–20)
        const categoryAverages = {
          rulesKnowledge: score.categories.rulesKnowledge.length > 0
            ? score.categories.rulesKnowledge.reduce((a, b) => a + b, 0) / score.categories.rulesKnowledge.length
            : 0,
          foulsContact: score.categories.foulsContact.length > 0
            ? score.categories.foulsContact.reduce((a, b) => a + b, 0) / score.categories.foulsContact.length
            : 0,
          fairMindedness: score.categories.fairMindedness.length > 0
            ? score.categories.fairMindedness.reduce((a, b) => a + b, 0) / score.categories.fairMindedness.length
            : 0,
          positiveAttitude: score.categories.positiveAttitude.length > 0
            ? score.categories.positiveAttitude.reduce((a, b) => a + b, 0) / score.categories.positiveAttitude.length
            : 0,
          communication: score.categories.communication.length > 0
            ? score.categories.communication.reduce((a, b) => a + b, 0) / score.categories.communication.length
            : 0
        };

        const team = allTournamentTeams.find(t => t._id.toString() === score.teamId);
        return {
          teamId: score.teamId,
          teamName: team ? team.teamName : 'Unknown',
          averageScore: Math.round(avgScore * 100) / 100,
          categoryAverages,
          submissionCount: score.count
        };
      });

      // Sort by average score (descending)
      spiritRankings.sort((a, b) => b.averageScore - a.averageScore);

      // Team statistics
      const teamStats = teams.map(team => {
        const teamMatches = matches.filter(m =>
          m.teamAId?._id?.toString() === team._id.toString() ||
          m.teamBId?._id?.toString() === team._id.toString()
        );
        const wins = teamMatches.filter(m =>
          m.winnerTeamId && m.winnerTeamId._id.toString() === team._id.toString()
        ).length;
        const losses = teamMatches.filter(m =>
          m.winnerTeamId && m.winnerTeamId._id.toString() !== team._id.toString() && m.status === 'completed'
        ).length;
        const draws = teamMatches.filter(m =>
          !m.winnerTeamId && m.status === 'completed' && m.score?.teamA === m.score?.teamB
        ).length;

        return {
          teamId: team._id,
          teamName: team.teamName,
          totalMembers: team.totalMembers,
          coach: team.coachId,
          matchesPlayed: teamMatches.filter(m => m.status === 'completed').length,
          wins,
          losses,
          draws,
          totalPointsFor: teamMatches.reduce((sum, m) => {
            if (m.teamAId?._id?.toString() === team._id.toString()) return sum + (m.score?.teamA || 0);
            if (m.teamBId?._id?.toString() === team._id.toString()) return sum + (m.score?.teamB || 0);
            return sum;
          }, 0),
          totalPointsAgainst: teamMatches.reduce((sum, m) => {
            if (m.teamAId?._id?.toString() === team._id.toString()) return sum + (m.score?.teamB || 0);
            if (m.teamBId?._id?.toString() === team._id.toString()) return sum + (m.score?.teamA || 0);
            return sum;
          }, 0)
        };
      });

      return res.status(200).json({
        success: true,
        data: {
          tournament: {
            _id: tournament._id,
            name: tournament.name,
            startDate: tournament.startDate,
            endDate: tournament.endDate,
            location: tournament.location,
            division: tournament.division,
            format: tournament.format,
            status: tournament.status
          },
          summary: {
            totalTeams: teams.length,
            totalMatches,
            completedMatches,
            scheduledMatches,
            ongoingMatches,
            totalPointsScored,
            averagePointsPerMatch: completedMatches > 0 ? Math.round((totalPointsScored / completedMatches) * 100) / 100 : 0
          },
          teams: teamStats,
          spiritRankings,
          matches: matches.slice(0, 10).map(m => ({
            _id: m._id,
            teamA: m.teamAId?.teamName,
            teamB: m.teamBId?.teamName,
            score: m.score,
            status: m.status,
            startTime: m.startTime,
            winner: m.winnerTeamId?.teamName
          }))
        }
      });
    }

    // Get summary for all tournaments (or coach's tournaments)
    let tournamentsQuery = {};
    let teamIds = [];

    if (isCoach && !isAdmin) {
      // Get coach's teams
      const coachTeams = await Team.find({ coachId: userId });
      teamIds = coachTeams.map(t => t._id);
      
      // Get tournaments where coach has teams
      const teamTournamentIds = coachTeams
        .map(t => t.tournamentId)
        .filter(id => id);
      
      tournamentsQuery = { _id: { $in: teamTournamentIds } };
    }

    const tournaments = await Tournament.find(tournamentsQuery).sort({ startDate: -1 });

    const summaries = await Promise.all(
      tournaments.map(async (tournament) => {
        const tournamentTeams = await Team.find({ tournamentId: tournament._id.toString() });
        const tournamentTeamIds = tournamentTeams.map(t => t._id);
        
        // Filter to coach's teams if coach
        const relevantTeamIds = isCoach && !isAdmin
          ? tournamentTeamIds.filter(id => teamIds.some(tid => tid.toString() === id.toString()))
          : tournamentTeamIds;

        const matches = await Match.find({
          tournamentId: tournament._id,
          $or: [
            { teamAId: { $in: relevantTeamIds } },
            { teamBId: { $in: relevantTeamIds } }
          ]
        });

        const completedMatches = matches.filter(m => m.status === 'completed').length;

        return {
          tournament: {
            _id: tournament._id,
            name: tournament.name,
            startDate: tournament.startDate,
            endDate: tournament.endDate,
            location: tournament.location,
            status: tournament.status
          },
          totalTeams: isCoach && !isAdmin
            ? tournamentTeams.filter(t => teamIds.some(tid => tid.toString() === t._id.toString())).length
            : tournamentTeams.length,
          totalMatches: matches.length,
          completedMatches
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        summaries,
        count: summaries.length
      }
    });
  } catch (error) {
    console.error("Get tournament summary error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching tournament summary",
      error: error.message
    });
  }
};

/**
 * Player Participation Data
 * Stats on gender distribution, youngest/oldest players, participation counts
 * For admin: all players
 * For coach: players in their teams
 */
export const getPlayerParticipationData = async (req, res) => {
  try {
    const { tournamentId } = req.query;
    const userRole = req.user?.role || [];
    const userId = req.user?.id;
    const isAdmin = Array.isArray(userRole) ? userRole.includes("admin") : userRole === "admin";
    const isCoach = Array.isArray(userRole) ? userRole.includes("coach") : userRole === "coach";

    let playerProfilesQuery = {};
    let teamIds = [];

    // Filter by tournament if provided
    if (tournamentId) {
      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: "Tournament not found"
        });
      }

      const tournamentTeams = await Team.find({ tournamentId: tournamentId.toString() });
      teamIds = tournamentTeams.map(t => t._id);

      // For coaches, filter to only their teams
      if (isCoach && !isAdmin) {
        const coachTeams = await Team.find({ coachId: userId, tournamentId: tournamentId.toString() });
        teamIds = coachTeams.map(t => t._id);
      }

      playerProfilesQuery = { teamId: { $in: teamIds } };
    } else {
      // If no tournament specified, get all players or coach's players
      if (isCoach && !isAdmin) {
        const coachTeams = await Team.find({ coachId: userId });
        teamIds = coachTeams.map(t => t._id);
        if (teamIds.length > 0) {
          playerProfilesQuery = { teamId: { $in: teamIds } };
        } else {
          playerProfilesQuery = { teamId: null }; // No teams, so no players
        }
      }
      // For admin, if no tournament specified, get all player profiles (empty query)
    }

    const playerProfiles = await PlayerProfile.find(playerProfilesQuery)
      .populate('personId', 'firstName lastName email')
      .populate('teamId', 'teamName');

    // Gender distribution
    const genderDistribution = {};
    let totalPlayers = 0;
    const ages = [];
    const playersByTeam = {};

    playerProfiles.forEach(profile => {
      totalPlayers++;
      
      // Gender stats
      const gender = profile.gender || 'Unknown';
      genderDistribution[gender] = (genderDistribution[gender] || 0) + 1;

      // Age stats
      if (profile.age) {
        ages.push(profile.age);
      }

      // Players by team
      if (profile.teamId) {
        const teamName = profile.teamId.teamName || 'Unknown';
        if (!playersByTeam[teamName]) {
          playersByTeam[teamName] = 0;
        }
        playersByTeam[teamName]++;
      }
    });

    // Calculate age statistics
    const ageStats = ages.length > 0 ? {
      youngest: Math.min(...ages),
      oldest: Math.max(...ages),
      average: Math.round((ages.reduce((a, b) => a + b, 0) / ages.length) * 100) / 100,
      median: ages.sort((a, b) => a - b)[Math.floor(ages.length / 2)] || 0
    } : {
      youngest: 0,
      oldest: 0,
      average: 0,
      median: 0
    };

    // Participation counts (base from player profiles)
    let participationStats = {
      totalPlayers,
      playersWithMatches: playerProfiles.filter(p => (p.totalMatchesPlayed || 0) > 0).length,
      totalMatchesPlayed: playerProfiles.reduce((sum, p) => sum + (p.totalMatchesPlayed || 0), 0),
      averageMatchesPerPlayer: totalPlayers > 0
        ? Math.round((playerProfiles.reduce((sum, p) => sum + (p.totalMatchesPlayed || 0), 0) / totalPlayers) * 100) / 100
        : 0,
      playersInTournaments: playerProfiles.filter(p => (p.tournamentsPlayed || 0) > 0).length
    };

    // Get match attendance data if tournament is specified
    let attendanceStats = null;
    let derivedPlayerProfiles = null;
    if (tournamentId && teamIds.length > 0) {
      const matches = await Match.find({
        tournamentId,
        $or: [
          { teamAId: { $in: teamIds } },
          { teamBId: { $in: teamIds } }
        ]
      });

      const matchIds = matches.map(m => m._id);
      const attendanceRecords = await MatchAttendance.find({
        matchId: { $in: matchIds }
      });

      attendanceStats = {
        totalMatchAttendanceRecords: attendanceRecords.length,
        presentCount: attendanceRecords.filter(a => a.status === 'present').length,
        absentCount: attendanceRecords.filter(a => a.status === 'absent').length,
        lateCount: attendanceRecords.filter(a => a.status === 'late').length,
        attendanceRate: attendanceRecords.length > 0
          ? Math.round((attendanceRecords.filter(a => a.status === 'present').length / attendanceRecords.length) * 100 * 100) / 100
          : 0
      };

      // If profiles are sparse or not linked, derive participation from attendance
      if (attendanceRecords.length > 0) {
        const perPlayerPresentCounts = attendanceRecords.reduce((acc, rec) => {
          const key = rec.playerId?.toString();
          if (!key) return acc;
          if (!acc[key]) acc[key] = { total: 0, present: 0 };
          acc[key].total += 1;
          if (rec.status === 'present') acc[key].present += 1;
          return acc;
        }, {});

        const attendanceTotalPlayers = Object.keys(perPlayerPresentCounts).length;
        const attendancePlayersWithMatches = Object.values(perPlayerPresentCounts).filter((v) => v.present > 0).length;
        const attendanceTotalMatchesPlayed = Object.values(perPlayerPresentCounts).reduce((sum, v) => sum + v.present, 0);
        const attendanceAvgMatches = attendanceTotalPlayers > 0
          ? Math.round((attendanceTotalMatchesPlayed / attendanceTotalPlayers) * 100) / 100
          : 0;

        // Prefer attendance-derived stats when available for a specific tournament
        participationStats = {
          totalPlayers: attendanceTotalPlayers,
          playersWithMatches: attendancePlayersWithMatches,
          totalMatchesPlayed: attendanceTotalMatchesPlayed,
          averageMatchesPerPlayer: attendanceAvgMatches,
          playersInTournaments: attendanceTotalPlayers
        };

        // Build derived playerProfiles from attendance (fetch names)
        const personIds = Object.keys(perPlayerPresentCounts);
        const persons = await Person.find({ _id: { $in: personIds } }).select('firstName lastName');
        const personMap = persons.reduce((acc, p) => {
          acc[p._id.toString()] = p;
          return acc;
        }, {});

        derivedPlayerProfiles = personIds.map(pid => {
          const person = personMap[pid];
          const counts = perPlayerPresentCounts[pid];
          return {
            _id: pid,
            name: person ? `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown' : 'Unknown',
            age: null,
            gender: null,
            team: null,
            totalMatchesPlayed: counts.present,
            tournamentsPlayed: 1,
          };
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        genderDistribution,
        ageStats,
        participationStats,
        attendanceStats,
        playersByTeam,
        totalPlayers: participationStats.totalPlayers,
        playerProfiles: (derivedPlayerProfiles && derivedPlayerProfiles.length > 0)
          ? derivedPlayerProfiles
          : playerProfiles.map(p => ({
              _id: p._id,
              name: p.personId ? `${p.personId.firstName} ${p.personId.lastName}` : 'Unknown',
              age: p.age || null,
              gender: p.gender || null,
              team: p.teamId?.teamName || null,
              totalMatchesPlayed: p.totalMatchesPlayed || 0,
              tournamentsPlayed: p.tournamentsPlayed || 0
            }))
      }
    });
  } catch (error) {
    console.error("Get player participation data error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching player participation data",
      error: error.message
    });
  }
};

/**
 * Downloadable Reports
 * Export tournament data (attendance, matches, scoring) in CSV format
 */
export const downloadTournamentReport = async (req, res) => {
  try {
    const { tournamentId, reportType } = req.params;
    const userRole = req.user?.role || [];
    const userId = req.user?.id;
    const isAdmin = Array.isArray(userRole) ? userRole.includes("admin") : userRole === "admin";
    const isCoach = Array.isArray(userRole) ? userRole.includes("coach") : userRole === "coach";

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found"
      });
    }

    let teamIds = [];
    const tournamentTeams = await Team.find({ tournamentId: tournamentId.toString() });

    if (isCoach && !isAdmin) {
      const coachTeams = await Team.find({ coachId: userId, tournamentId: tournamentId.toString() });
      teamIds = coachTeams.map(t => t._id);
    } else {
      teamIds = tournamentTeams.map(t => t._id);
    }

    let csvData = '';
    let filename = '';

    if (reportType === 'attendance') {
      // Attendance report
      const matches = await Match.find({
        tournamentId,
        $or: [
          { teamAId: { $in: teamIds } },
          { teamBId: { $in: teamIds } }
        ]
      });

      const matchIds = matches.map(m => m._id);
      const attendanceRecords = await MatchAttendance.find({
        matchId: { $in: matchIds }
      })
        .populate('playerId', 'firstName lastName email')
        .populate('teamId', 'teamName')
        .populate('matchId', 'startTime');

      // CSV headers
      csvData = 'Match Date,Team Name,Player Name,Player Email,Status,Recorded At,Recorded By\n';

      // CSV rows
      attendanceRecords.forEach(record => {
        const matchDate = record.matchId?.startTime
          ? new Date(record.matchId.startTime).toLocaleDateString()
          : 'N/A';
        const playerName = record.playerId
          ? `${record.playerId.firstName || ''} ${record.playerId.lastName || ''}`.trim()
          : 'Unknown';
        const playerEmail = record.playerId?.email || 'N/A';
        const teamName = record.teamId?.teamName || 'Unknown';
        const status = record.status || 'N/A';
        const recordedAt = record.recordedAt
          ? new Date(record.recordedAt).toLocaleString()
          : 'N/A';

        csvData += `"${matchDate}","${teamName}","${playerName}","${playerEmail}","${status}","${recordedAt}","N/A"\n`;
      });

      filename = `tournament-${tournamentId}-attendance-${Date.now()}.csv`;

    } else if (reportType === 'matches') {
      // Matches report
      const matches = await Match.find({
        tournamentId,
        $or: [
          { teamAId: { $in: teamIds } },
          { teamBId: { $in: teamIds } }
        ]
      })
        .populate('teamAId', 'teamName')
        .populate('teamBId', 'teamName')
        .populate('winnerTeamId', 'teamName')
        .sort({ startTime: 1 });

      csvData = 'Match Date,Start Time,End Time,Team A,Team B,Score A,Score B,Winner,Status,Field,Round\n';

      matches.forEach(match => {
        const matchDate = match.startTime ? new Date(match.startTime).toLocaleDateString() : 'N/A';
        const startTime = match.startTime ? new Date(match.startTime).toLocaleTimeString() : 'N/A';
        const endTime = match.endTime ? new Date(match.endTime).toLocaleTimeString() : 'N/A';
        const teamA = match.teamAId?.teamName || 'Unknown';
        const teamB = match.teamBId?.teamName || 'Unknown';
        const scoreA = match.score?.teamA || 0;
        const scoreB = match.score?.teamB || 0;
        const winner = match.winnerTeamId?.teamName || 'Draw';
        const status = match.status || 'N/A';
        const field = match.fieldName || 'N/A';
        const round = match.roundName || match.round || 'N/A';

        csvData += `"${matchDate}","${startTime}","${endTime}","${teamA}","${teamB}",${scoreA},${scoreB},"${winner}","${status}","${field}","${round}"\n`;
      });

      filename = `tournament-${tournamentId}-matches-${Date.now()}.csv`;

    } else if (reportType === 'scoring') {
      // Scoring report
      const matches = await Match.find({
        tournamentId,
        $or: [
          { teamAId: { $in: teamIds } },
          { teamBId: { $in: teamIds } }
        ]
      });

      const matchIds = matches.map(m => m._id);
      const scoreEvents = await MatchScoreEvent.find({
        matchId: { $in: matchIds }
      })
        .populate('matchId')
        .populate('teamId', 'teamName')
        .populate('playerId', 'firstName lastName')
        .sort({ timestamp: 1 });

      csvData = 'Match Date,Match Time,Team,Player,Points,Timestamp\n';

      scoreEvents.forEach(event => {
        const matchDate = event.matchId?.startTime
          ? new Date(event.matchId.startTime).toLocaleDateString()
          : 'N/A';
        const matchTime = event.timestamp
          ? new Date(event.timestamp).toLocaleTimeString()
          : 'N/A';
        const team = event.teamId?.teamName || 'Unknown';
        const player = event.playerId
          ? `${event.playerId.firstName || ''} ${event.playerId.lastName || ''}`.trim()
          : 'Unknown';
        const points = event.points || 0;
        const timestamp = event.timestamp
          ? new Date(event.timestamp).toLocaleString()
          : 'N/A';

        csvData += `"${matchDate}","${matchTime}","${team}","${player}",${points},"${timestamp}"\n`;
      });

      filename = `tournament-${tournamentId}-scoring-${Date.now()}.csv`;

    } else if (reportType === 'full') {
      // Full tournament report (combination of all data)
      csvData = 'Report Type,Date,Team/Player,Details,Score/Status\n';

      // Add matches
      const matches = await Match.find({
        tournamentId,
        $or: [
          { teamAId: { $in: teamIds } },
          { teamBId: { $in: teamIds } }
        ]
      })
        .populate('teamAId', 'teamName')
        .populate('teamBId', 'teamName')
        .sort({ startTime: 1 });

      matches.forEach(match => {
        const matchDate = match.startTime ? new Date(match.startTime).toLocaleDateString() : 'N/A';
        const details = `${match.teamAId?.teamName || 'Unknown'} vs ${match.teamBId?.teamName || 'Unknown'}`;
        const score = `${match.score?.teamA || 0} - ${match.score?.teamB || 0}`;
        csvData += `"Match","${matchDate}","${details}","${match.status || 'N/A'}","${score}"\n`;
      });

      filename = `tournament-${tournamentId}-full-report-${Date.now()}.csv`;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid report type. Use: attendance, matches, scoring, or full"
      });
    }

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvData);

  } catch (error) {
    console.error("Download tournament report error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while generating report",
      error: error.message
    });
  }
};

/**
 * Admin Overview Dashboard
 * Returns comprehensive statistics for admin dashboard
 */
export const getAdminOverview = async (req, res) => {
  try {
    // Get total players
    const totalPlayers = await PlayerProfile.countDocuments();

    // Get active tournaments (in progress)
    const now = new Date();
    const activeTournaments = await Tournament.countDocuments({
      startDate: { $lte: now },
      endDate: { $gte: now },
      status: { $in: ['upcoming', 'live'] }
    });

    // Get total registered teams across all tournaments
    const allTournaments = await Tournament.find().select('registeredTeams');
    const totalRegisteredTeams = allTournaments.reduce((sum, t) => {
      return sum + (t.registeredTeams?.length || 0);
    }, 0);

    // Calculate average spirit score
    const spiritSubmissions = await SpiritSubmission.find();
    let totalSpiritScore = 0;
    let spiritScoreCount = 0;
    
    spiritSubmissions.forEach(submission => {
      if (submission.categories) {
        const categories = submission.categories;
        const matchTotal = (categories.rulesKnowledge || 0) +
                          (categories.foulsContact || 0) +
                          (categories.fairMindedness || 0) +
                          (categories.positiveAttitude || 0) +
                          (categories.communication || 0);
        totalSpiritScore += matchTotal;
        spiritScoreCount++;
      }
    });
    
    const avgSpiritScore = spiritScoreCount > 0 
      ? Math.round((totalSpiritScore / spiritScoreCount) * 100) / 100 
      : 0;

    // Get sessions this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const sessionsThisMonth = await Session.countDocuments({
      scheduledStart: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Calculate attendance rate (from both Attendance and MatchAttendance)
    const sessionAttendanceRecords = await Attendance.find();
    const matchAttendanceRecords = await MatchAttendance.find();
    
    const totalAttendanceRecords = sessionAttendanceRecords.length + matchAttendanceRecords.length;
    const presentCount = sessionAttendanceRecords.filter(a => a.status === 'present').length +
                        matchAttendanceRecords.filter(a => a.status === 'present').length;
    
    const attendanceRate = totalAttendanceRecords > 0
      ? Math.round((presentCount / totalAttendanceRecords) * 100)
      : 0;

    // Get pending account requests
    const accountRequestsCount = await RoleRequest.countDocuments({ status: 'pending' });

    // Get volunteer applications (assignments with status 'assigned')
    const volunteerApplicationsCount = await VolunteerTournamentAssignment.countDocuments({
      status: 'assigned'
    });

    // Get tournaments needing approval (status 'upcoming' that haven't started)
    const tournamentsNeedingApproval = await Tournament.countDocuments({
      status: 'upcoming',
      startDate: { $gte: now }
    });

    // Get active users
    const activeUsersCount = await Person.countDocuments({ accountStatus: 'active' });

    // Get sessions with enrolled players (booked sessions)
    const sessionsWithPlayers = await Session.countDocuments({
      enrolledPlayers: { $exists: true, $ne: [] }
    });

    // Get total sessions
    const totalSessions = await Session.countDocuments();

    // Calculate tournament capacity
    const tournamentsWithCapacity = await Tournament.find().select('maxTeams registeredTeams');
    let totalMaxTeams = 0;
    let totalRegisteredTeamsCount = 0;
    
    tournamentsWithCapacity.forEach(t => {
      totalMaxTeams += t.maxTeams || 0;
      totalRegisteredTeamsCount += (t.registeredTeams?.length || 0);
    });

    // Calculate previous period stats for comparison (last month)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const previousMonthSessions = await Session.countDocuments({
      scheduledStart: { $gte: previousMonthStart, $lte: previousMonthEnd }
    });

    // Calculate percentage changes
    const sessionsChange = previousMonthSessions > 0
      ? `+${Math.round(((sessionsThisMonth - previousMonthSessions) / previousMonthSessions) * 100)}%`
      : sessionsThisMonth > 0 ? "+100%" : "0%";

    // Get previous month active tournaments for comparison
    const previousMonthActiveTournaments = await Tournament.countDocuments({
      startDate: { $gte: previousMonthStart, $lte: previousMonthEnd },
      status: { $in: ['upcoming', 'live'] }
    });

    const tournamentsChange = previousMonthActiveTournaments > 0
      ? `+${Math.round(((activeTournaments - previousMonthActiveTournaments) / previousMonthActiveTournaments) * 100)}%`
      : activeTournaments > 0 ? "+100%" : "0";

    // Get previous month teams for comparison
    const previousMonthTournaments = await Tournament.find({
      createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd }
    }).select('registeredTeams');
    
    const previousMonthTeams = previousMonthTournaments.reduce((sum, t) => {
      return sum + (t.registeredTeams?.length || 0);
    }, 0);

    const teamsChange = previousMonthTeams > 0
      ? `+${Math.round(((totalRegisteredTeams - previousMonthTeams) / previousMonthTeams) * 100)}%`
      : totalRegisteredTeams > 0 ? "+100%" : "+0%";

    // Get previous month spirit scores for comparison
    const previousMonthSpiritSubmissions = await SpiritSubmission.find({
      createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd }
    });
    
    let previousMonthTotalSpiritScore = 0;
    let previousMonthSpiritScoreCount = 0;
    
    previousMonthSpiritSubmissions.forEach(submission => {
      if (submission.categories) {
        const categories = submission.categories;
        const matchTotal = (categories.rulesKnowledge || 0) +
                          (categories.foulsContact || 0) +
                          (categories.fairMindedness || 0) +
                          (categories.positiveAttitude || 0) +
                          (categories.communication || 0);
        previousMonthTotalSpiritScore += matchTotal;
        previousMonthSpiritScoreCount++;
      }
    });
    
    const previousMonthAvgSpiritScore = previousMonthSpiritScoreCount > 0
      ? previousMonthTotalSpiritScore / previousMonthSpiritScoreCount
      : 0;

    const spiritScoreChange = previousMonthAvgSpiritScore > 0
      ? `+${Math.round((avgSpiritScore - previousMonthAvgSpiritScore) * 100) / 100}`
      : avgSpiritScore > 0 ? `+${avgSpiritScore}` : "0";

    // Get previous month attendance for comparison
    const previousMonthSessionAttendance = await Attendance.find({
      date: { $gte: previousMonthStart, $lte: previousMonthEnd }
    });
    const previousMonthMatchAttendance = await MatchAttendance.find({
      createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd }
    });
    
    const previousMonthTotalRecords = previousMonthSessionAttendance.length + previousMonthMatchAttendance.length;
    const previousMonthPresent = previousMonthSessionAttendance.filter(a => a.status === 'present').length +
                                previousMonthMatchAttendance.filter(a => a.status === 'present').length;
    
    const previousMonthAttendanceRate = previousMonthTotalRecords > 0
      ? Math.round((previousMonthPresent / previousMonthTotalRecords) * 100)
      : 0;

    const attendanceChange = previousMonthAttendanceRate > 0
      ? `+${attendanceRate - previousMonthAttendanceRate}%`
      : attendanceRate > 0 ? `+${attendanceRate}%` : "+0%";

    // Get previous month players for comparison
    const previousMonthPlayers = await PlayerProfile.countDocuments({
      createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd }
    });

    const playersChange = previousMonthPlayers > 0
      ? `+${Math.round(((totalPlayers - previousMonthPlayers) / previousMonthPlayers) * 100)}%`
      : totalPlayers > 0 ? "+100%" : "+0%";

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalPlayers: {
            value: totalPlayers.toLocaleString(),
            change: playersChange
          },
          activeTournaments: {
            value: activeTournaments.toString(),
            change: tournamentsChange
          },
          teamsRegistered: {
            value: totalRegisteredTeams.toString(),
            change: teamsChange
          },
          avgSpiritScore: {
            value: avgSpiritScore.toFixed(1),
            change: spiritScoreChange
          },
          sessionsThisMonth: {
            value: sessionsThisMonth.toString(),
            change: sessionsChange
          },
          attendanceRate: {
            value: `${attendanceRate}%`,
            change: attendanceChange
          }
        },
        pendingActions: {
          accountRequests: accountRequestsCount,
          volunteerApplications: volunteerApplicationsCount,
          tournamentApprovals: tournamentsNeedingApproval
        },
        quickStats: {
          activeUsers: activeUsersCount,
          sessionsBooked: `${sessionsWithPlayers}/${totalSessions}`,
          sessionsBookedPercentage: totalSessions > 0 
            ? Math.round((sessionsWithPlayers / totalSessions) * 100)
            : 0,
          tournamentCapacity: `${totalRegisteredTeamsCount}/${totalMaxTeams}`,
          tournamentCapacityPercentage: totalMaxTeams > 0
            ? Math.round((totalRegisteredTeamsCount / totalMaxTeams) * 100)
            : 0
        }
      }
    });
  } catch (error) {
    console.error("Get admin overview error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching admin overview",
      error: error.message
    });
  }
};

/**
 * Coach Overview Dashboard
 * Returns coach-specific statistics for coach dashboard
 */
export const getCoachOverview = async (req, res) => {
  try {
    const coachId = req.user?.id;
    if (!coachId) {
      return res.status(401).json({
        success: false,
        message: "Coach ID is required"
      });
    }

    const now = new Date();

    // Get active students (players assigned to this coach)
    const activeStudents = await PlayerProfile.countDocuments({
      assignedCoachId: coachId
    });

    // Get sessions this week (sessions assigned to this coach)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);

    const sessionsThisWeek = await Session.countDocuments({
      assignedCoaches: coachId,
      scheduledStart: { $gte: startOfWeek, $lte: endOfWeek }
    });

    // Get upcoming sessions count
    const upcomingSessionsCount = await Session.countDocuments({
      assignedCoaches: coachId,
      status: "scheduled",
      scheduledStart: { $gte: now }
    });

    // Calculate attendance rate for coach's students
    // Get all player profiles assigned to this coach
    const playerProfiles = await PlayerProfile.find({ assignedCoachId: coachId }).select('personId');
    const playerIds = playerProfiles.map(p => p.personId);

    // Get attendance records for these players
    const sessionAttendanceRecords = await Attendance.find({
      personId: { $in: playerIds }
    });

    const matchAttendanceRecords = await MatchAttendance.find({
      playerId: { $in: playerIds }
    });

    const totalAttendanceRecords = sessionAttendanceRecords.length + matchAttendanceRecords.length;
    const presentCount = sessionAttendanceRecords.filter(a => a.status === 'present').length +
                        matchAttendanceRecords.filter(a => a.status === 'present').length;

    const attendanceRate = totalAttendanceRecords > 0
      ? Math.round((presentCount / totalAttendanceRecords) * 100)
      : 0;

    // Calculate average progress score (from player feedback/ratings)
    const playerFeedback = await PlayerMatchFeedback.find({
      coachId: coachId
    }).select('score');

    let totalProgressScore = 0;
    let progressScoreCount = 0;

    playerFeedback.forEach(feedback => {
      if (feedback.score) {
        // Score is in format "X/Y" (e.g., "3/7")
        const [numerator, denominator] = feedback.score.split('/').map(Number);
        if (denominator && denominator > 0) {
          // Convert to 0-10 scale for consistency
          const normalizedScore = (numerator / denominator) * 10;
          totalProgressScore += normalizedScore;
          progressScoreCount++;
        }
      }
    });

    // Also check player profile feedback for legacy data
    const playerProfilesWithFeedback = await PlayerProfile.find({
      assignedCoachId: coachId,
      'feedback.coachId': coachId
    }).select('feedback');

    playerProfilesWithFeedback.forEach(profile => {
      profile.feedback?.forEach(fb => {
        if (fb.coachId?.toString() === coachId.toString() && fb.rating) {
          totalProgressScore += fb.rating; // Already on 0-10 scale
          progressScoreCount++;
        }
      });
    });

    const avgProgressScore = progressScoreCount > 0
      ? Math.round((totalProgressScore / progressScoreCount) * 100) / 100
      : 0;

    // Calculate previous period stats for comparison (last week)
    const previousWeekStart = new Date(startOfWeek);
    previousWeekStart.setDate(startOfWeek.getDate() - 7);
    
    const previousWeekEnd = new Date(endOfWeek);
    previousWeekEnd.setDate(endOfWeek.getDate() - 7);

    const previousWeekSessions = await Session.countDocuments({
      assignedCoaches: coachId,
      scheduledStart: { $gte: previousWeekStart, $lte: previousWeekEnd }
    });

    // Get previous week active students (new students added)
    const previousWeekStudents = await PlayerProfile.countDocuments({
      assignedCoachId: coachId,
      createdAt: { $gte: previousWeekStart, $lte: previousWeekEnd }
    });

    // Calculate changes
    const studentsChange = previousWeekStudents > 0
      ? `+${activeStudents - previousWeekStudents}`
      : activeStudents > 0 ? `+${activeStudents}` : "0";

    const sessionsChange = previousWeekSessions > 0
      ? `${upcomingSessionsCount} upcoming`
      : sessionsThisWeek > 0 ? `${sessionsThisWeek} scheduled` : "0 upcoming";

    // Get previous week attendance
    const previousWeekSessionAttendance = await Attendance.find({
      personId: { $in: playerIds },
      date: { $gte: previousWeekStart, $lte: previousWeekEnd }
    });
    const previousWeekMatchAttendance = await MatchAttendance.find({
      playerId: { $in: playerIds },
      createdAt: { $gte: previousWeekStart, $lte: previousWeekEnd }
    });

    const previousWeekTotalRecords = previousWeekSessionAttendance.length + previousWeekMatchAttendance.length;
    const previousWeekPresent = previousWeekSessionAttendance.filter(a => a.status === 'present').length +
                               previousWeekMatchAttendance.filter(a => a.status === 'present').length;

    const previousWeekAttendanceRate = previousWeekTotalRecords > 0
      ? Math.round((previousWeekPresent / previousWeekTotalRecords) * 100)
      : 0;

    const attendanceChange = previousWeekAttendanceRate > 0
      ? `${attendanceRate - previousWeekAttendanceRate >= 0 ? '+' : ''}${attendanceRate - previousWeekAttendanceRate}%`
      : attendanceRate > 0 ? `+${attendanceRate}%` : "0%";

    // Get previous week progress scores
    const previousWeekFeedback = await PlayerMatchFeedback.find({
      coachId: coachId,
      submittedAt: { $gte: previousWeekStart, $lte: previousWeekEnd }
    }).select('score');

    let previousWeekTotalProgressScore = 0;
    let previousWeekProgressScoreCount = 0;

    previousWeekFeedback.forEach(feedback => {
      if (feedback.score) {
        const [numerator, denominator] = feedback.score.split('/').map(Number);
        if (denominator && denominator > 0) {
          const normalizedScore = (numerator / denominator) * 10;
          previousWeekTotalProgressScore += normalizedScore;
          previousWeekProgressScoreCount++;
        }
      }
    });

    const previousWeekAvgProgressScore = previousWeekProgressScoreCount > 0
      ? previousWeekTotalProgressScore / previousWeekProgressScoreCount
      : 0;

    const progressScoreChange = previousWeekAvgProgressScore > 0
      ? `${avgProgressScore - previousWeekAvgProgressScore >= 0 ? '+' : ''}${Math.round((avgProgressScore - previousWeekAvgProgressScore) * 100) / 100}`
      : avgProgressScore > 0 ? `+${avgProgressScore}` : "0";

    res.status(200).json({
      success: true,
      data: {
        stats: {
          activeStudents: {
            value: activeStudents.toString(),
            change: studentsChange
          },
          sessionsThisWeek: {
            value: sessionsThisWeek.toString(),
            change: sessionsChange
          },
          attendanceRate: {
            value: `${attendanceRate}%`,
            change: attendanceChange
          },
          avgProgressScore: {
            value: avgProgressScore.toFixed(1),
            change: progressScoreChange
          }
        }
      }
    });
  } catch (error) {
    console.error("Get coach overview error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching coach overview",
      error: error.message
    });
  }
};

/**
 * Volunteer Overview Dashboard
 * Returns volunteer-specific statistics for volunteer dashboard
 */
export const getVolunteerOverview = async (req, res) => {
  try {
    const volunteerId = req.user?.id;
    if (!volunteerId) {
      return res.status(401).json({
        success: false,
        message: "Volunteer ID is required"
      });
    }

    const now = new Date();

    // Get upcoming events (tournaments assigned to volunteer that haven't started)
    const assignments = await VolunteerTournamentAssignment.find({
      volunteerId: volunteerId,
      status: { $in: ['assigned', 'confirmed'] }
    }).populate('tournamentId', 'name startDate endDate location');

    const upcomingEvents = assignments.filter(assignment => {
      if (!assignment.tournamentId) return false;
      const tournament = assignment.tournamentId;
      const startDate = new Date(tournament.startDate);
      return startDate >= now;
    });

    // Get events this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const eventsThisMonth = assignments.filter(assignment => {
      if (!assignment.tournamentId) return false;
      const tournament = assignment.tournamentId;
      const startDate = new Date(tournament.startDate);
      return startDate >= startOfMonth && startDate <= endOfMonth;
    }).length;

    // Calculate hours contributed
    // Get all tournaments assigned to volunteer
    const allAssignments = await VolunteerTournamentAssignment.find({
      volunteerId: volunteerId
    }).populate('tournamentId', 'startDate endDate');

    const tournamentIds = allAssignments
      .filter(a => a.tournamentId)
      .map(a => a.tournamentId._id);

    // Get matches from tournaments volunteer is assigned to
    const tournamentMatches = await Match.find({
      tournamentId: { $in: tournamentIds }
    }).distinct('_id');

    // Get matches where volunteer was directly involved (attendance, images)
    const matchesWithImages = await MatchImage.find({
      uploadedBy: volunteerId
    }).distinct('matchId');

    const matchesWithAttendance = await MatchAttendance.find({
      recordedBy: volunteerId
    }).distinct('matchId');

    // Combine all unique matches (tournament matches + direct involvement)
    const allMatchIds = [...new Set([
      ...tournamentMatches.map(id => id.toString()),
      ...matchesWithImages.map(id => id.toString()),
      ...matchesWithAttendance.map(id => id.toString())
    ])];

    // Estimate hours: assume average 2 hours per match
    const estimatedHours = Math.round(allMatchIds.length * 2);

    // Get hours from completed assignments (estimate based on tournament duration)
    const completedAssignments = await VolunteerTournamentAssignment.find({
      volunteerId: volunteerId,
      status: 'completed'
    }).populate('tournamentId', 'startDate endDate');

    let totalHoursFromAssignments = 0;
    completedAssignments.forEach(assignment => {
      if (assignment.tournamentId) {
        const startDate = new Date(assignment.tournamentId.startDate);
        const endDate = new Date(assignment.tournamentId.endDate);
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        // Estimate 4 hours per day for tournament
        totalHoursFromAssignments += daysDiff * 4;
      }
    });

    const totalHours = estimatedHours + totalHoursFromAssignments;

    // Get hours this week
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const matchesThisWeek = await Match.find({
      _id: { $in: allMatchIds },
      startTime: { $gte: startOfWeek, $lte: endOfWeek }
    });

    const hoursThisWeek = matchesThisWeek.length * 2;

    // Get students impacted (unique players from matches)
    const matchAttendanceRecords = await MatchAttendance.find({
      matchId: { $in: allMatchIds }
    }).distinct('playerId');

    const studentsImpacted = matchAttendanceRecords.length;

    // Get events supported (total tournaments assigned to)
    const eventsSupported = await VolunteerTournamentAssignment.countDocuments({
      volunteerId: volunteerId
    });

    // Get events this year
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const eventsThisYear = await VolunteerTournamentAssignment.countDocuments({
      volunteerId: volunteerId,
      createdAt: { $gte: startOfYear }
    });

    // Calculate previous period stats for comparison
    const previousWeekStart = new Date(startOfWeek);
    previousWeekStart.setDate(startOfWeek.getDate() - 7);
    const previousWeekEnd = new Date(endOfWeek);
    previousWeekEnd.setDate(endOfWeek.getDate() - 7);

    const previousWeekMatches = await Match.find({
      _id: { $in: allMatchIds },
      startTime: { $gte: previousWeekStart, $lte: previousWeekEnd }
    });

    const previousWeekHours = previousWeekMatches.length * 2;

    // Calculate changes
    const upcomingEventsChange = eventsThisMonth > 0
      ? "This month"
      : upcomingEvents.length > 0
        ? `${upcomingEvents.length} upcoming`
        : "No upcoming";

    const hoursChange = previousWeekHours > 0
      ? `+${hoursThisWeek - previousWeekHours} this week`
      : hoursThisWeek > 0
        ? `+${hoursThisWeek} this week`
        : "0 this week";

    const studentsChange = studentsImpacted > 0
      ? "Across programs"
      : "No students yet";

    const eventsChange = eventsThisYear > 0
      ? "This year"
      : eventsSupported > 0
        ? `${eventsSupported} total`
        : "No events";

    res.status(200).json({
      success: true,
      data: {
        stats: {
          upcomingEvents: {
            value: upcomingEvents.length.toString(),
            change: upcomingEventsChange
          },
          hoursContributed: {
            value: totalHours.toString(),
            change: hoursChange
          },
          studentsImpacted: {
            value: studentsImpacted.toString(),
            change: studentsChange
          },
          eventsSupported: {
            value: eventsSupported.toString(),
            change: eventsChange
          }
        }
      }
    });
  } catch (error) {
    console.error("Get volunteer overview error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching volunteer overview",
      error: error.message
    });
  }
};

