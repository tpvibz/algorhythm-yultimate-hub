import Tournament from "../models/tournamentModel.js";
import Team from "../models/teamModel.js";
import Match from "../models/matchModel.js";
import PlayerProfile from "../models/playerProfileModel.js";
import SpiritSubmission from "../models/spiritSubmissionModel.js";
import MatchAttendance from "../models/matchAttendanceModel.js";
import MatchScoreEvent from "../models/matchScoreEventModel.js";
import Person from "../models/personModel.js";

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

    // Participation counts
    const participationStats = {
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
    }

    return res.status(200).json({
      success: true,
      data: {
        genderDistribution,
        ageStats,
        participationStats,
        attendanceStats,
        playersByTeam,
        totalPlayers,
        playerProfiles: playerProfiles.map(p => ({
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

