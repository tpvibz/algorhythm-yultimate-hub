import Match from "../models/matchModel.js";
import Team from "../models/teamModel.js";
import Tournament from "../models/tournamentModel.js";

// Calculate team standings for a tournament
export const getTournamentLeaderboard = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    // Verify tournament exists
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found"
      });
    }

    // Get all teams registered for this tournament
    const teams = await Team.find({ tournamentId }).populate('coachId', 'firstName lastName');

    // Get all completed matches for this tournament
    const completedMatches = await Match.find({
      tournamentId,
      status: 'completed'
    }).populate('teamAId', 'teamName').populate('teamBId', 'teamName');

    // Initialize standings for all teams
    const standings = {};

    teams.forEach(team => {
      standings[team._id.toString()] = {
        teamId: team._id,
        teamName: team.teamName,
        wins: 0,
        losses: 0,
        draws: 0,
        pointsFor: 0, // Points scored
        pointsAgainst: 0, // Points conceded
        goalDifference: 0,
        matchesPlayed: 0,
        winPercentage: 0,
        coach: team.coachId ? {
          _id: team.coachId._id,
          firstName: team.coachId.firstName,
          lastName: team.coachId.lastName
        } : null
      };
    });

    // Calculate statistics from completed matches
    completedMatches.forEach(match => {
      const teamAId = match.teamAId._id.toString();
      const teamBId = match.teamBId._id.toString();
      const scoreA = match.score?.teamA || 0;
      const scoreB = match.score?.teamB || 0;

      // Update team A stats
      if (standings[teamAId]) {
        standings[teamAId].matchesPlayed += 1;
        standings[teamAId].pointsFor += scoreA;
        standings[teamAId].pointsAgainst += scoreB;
        standings[teamAId].goalDifference += (scoreA - scoreB);

        if (match.winnerTeamId) {
          if (match.winnerTeamId.toString() === teamAId) {
            standings[teamAId].wins += 1;
          } else {
            standings[teamAId].losses += 1;
          }
        } else if (scoreA === scoreB) {
          standings[teamAId].draws += 1;
        }
      }

      // Update team B stats
      if (standings[teamBId]) {
        standings[teamBId].matchesPlayed += 1;
        standings[teamBId].pointsFor += scoreB;
        standings[teamBId].pointsAgainst += scoreA;
        standings[teamBId].goalDifference += (scoreB - scoreA);

        if (match.winnerTeamId) {
          if (match.winnerTeamId.toString() === teamBId) {
            standings[teamBId].wins += 1;
          } else {
            standings[teamBId].losses += 1;
          }
        } else if (scoreA === scoreB) {
          standings[teamBId].draws += 1;
        }
      }
    });

    // Calculate win percentage and convert to array
    const standingsArray = Object.values(standings).map(standing => {
      if (standing.matchesPlayed > 0) {
        standing.winPercentage = Math.round((standing.wins / standing.matchesPlayed) * 100);
      }
      return standing;
    });

    // Sort standings by:
    // 1. Wins (descending)
    // 2. Goal difference (descending)
    // 3. Points for (descending)
    // 4. Team name (ascending)
    standingsArray.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
      return a.teamName.localeCompare(b.teamName);
    });

    // Add rank
    standingsArray.forEach((standing, index) => {
      standing.rank = index + 1;
    });

    res.status(200).json({
      success: true,
      data: {
        tournament: {
          _id: tournament._id,
          name: tournament.name,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          location: tournament.location,
          division: tournament.division,
          format: tournament.format
        },
        standings: standingsArray,
        totalTeams: teams.length,
        completedMatches: completedMatches.length,
        totalMatches: await Match.countDocuments({ tournamentId })
      }
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while calculating leaderboard",
      error: error.message
    });
  }
};

// Get leaderboards for all tournaments
export const getAllLeaderboards = async (req, res) => {
  try {
    const tournaments = await Tournament.find({
      status: { $in: ['live', 'completed'] }
    }).sort({ startDate: -1 });

    const leaderboards = [];

    for (const tournament of tournaments) {
      // Get all teams for this tournament
      const teams = await Team.find({ tournamentId: tournament._id.toString() });
      
      // Get completed matches
      const completedMatches = await Match.find({
        tournamentId: tournament._id,
        status: 'completed'
      }).populate('teamAId', 'teamName').populate('teamBId', 'teamName');

      if (teams.length === 0 || completedMatches.length === 0) {
        continue; // Skip tournaments with no teams or matches
      }

      const standings = {};
      teams.forEach(team => {
        standings[team._id.toString()] = {
          teamId: team._id,
          teamName: team.teamName,
          wins: 0,
          losses: 0,
          draws: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          goalDifference: 0,
          matchesPlayed: 0
        };
      });

      completedMatches.forEach(match => {
        const teamAId = match.teamAId._id.toString();
        const teamBId = match.teamBId._id.toString();
        const scoreA = match.score?.teamA || 0;
        const scoreB = match.score?.teamB || 0;

        if (standings[teamAId]) {
          standings[teamAId].matchesPlayed += 1;
          standings[teamAId].pointsFor += scoreA;
          standings[teamAId].pointsAgainst += scoreB;
          standings[teamAId].goalDifference += (scoreA - scoreB);
          if (match.winnerTeamId?.toString() === teamAId) {
            standings[teamAId].wins += 1;
          } else if (match.winnerTeamId?.toString() === teamBId) {
            standings[teamAId].losses += 1;
          } else if (scoreA === scoreB) {
            standings[teamAId].draws += 1;
          }
        }

        if (standings[teamBId]) {
          standings[teamBId].matchesPlayed += 1;
          standings[teamBId].pointsFor += scoreB;
          standings[teamBId].pointsAgainst += scoreA;
          standings[teamBId].goalDifference += (scoreB - scoreA);
          if (match.winnerTeamId?.toString() === teamBId) {
            standings[teamBId].wins += 1;
          } else if (match.winnerTeamId?.toString() === teamAId) {
            standings[teamBId].losses += 1;
          } else if (scoreA === scoreB) {
            standings[teamBId].draws += 1;
          }
        }
      });

      const standingsArray = Object.values(standings);
      standingsArray.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
        return a.teamName.localeCompare(b.teamName);
      });

      standingsArray.forEach((standing, index) => {
        standing.rank = index + 1;
        if (standing.matchesPlayed > 0) {
          standing.winPercentage = Math.round((standing.wins / standing.matchesPlayed) * 100);
        }
      });

      leaderboards.push({
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
        standings: standingsArray.slice(0, 5), // Top 5 teams
        totalTeams: teams.length
      });
    }

    res.status(200).json({
      success: true,
      data: {
        leaderboards,
        count: leaderboards.length
      }
    });
  } catch (error) {
    console.error("Get all leaderboards error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching leaderboards",
      error: error.message
    });
  }
};

