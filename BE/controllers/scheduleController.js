import Team from "../models/teamModel.js";
import Tournament from "../models/tournamentModel.js";
import Match from "../models/matchModel.js";

// Get teams registered for a tournament
export const getTeamsByTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId) {
      return res.status(400).json({
        success: false,
        message: "Tournament ID is required"
      });
    }

    // Verify tournament exists
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found"
      });
    }

    // Get all teams registered for this tournament
    const teams = await Team.find({ tournamentId }).populate('coachId', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: {
        tournament: {
          _id: tournament._id,
          name: tournament.name,
          format: tournament.format,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          location: tournament.location
        },
        teams: teams.map(team => ({
          _id: team._id,
          teamName: team.teamName,
          totalMembers: team.totalMembers,
          players: team.players,
          coachId: team.coachId,
          contactPhone: team.contactPhone,
          contactEmail: team.contactEmail,
          notes: team.notes
        })),
        teamCount: teams.length
      }
    });
  } catch (error) {
    console.error("Get teams by tournament error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching teams",
      error: error.message
    });
  }
};

// Helper function to generate Round Robin matches
const generateRoundRobin = (teams) => {
  const matches = [];
  const n = teams.length;
  
  // If odd number of teams, add a bye
  const isOdd = n % 2 !== 0;
  const teamsToSchedule = isOdd ? [...teams, null] : teams;
  const numRounds = teamsToSchedule.length - 1;

  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < teamsToSchedule.length / 2; i++) {
      const teamA = teamsToSchedule[i];
      const teamB = teamsToSchedule[teamsToSchedule.length - 1 - i];
      
      if (teamA && teamB) {
        matches.push({
          teamAId: teamA._id,
          teamBId: teamB._id,
          round: round + 1
        });
      }
    }
    
    // Rotate teams (keep first team fixed, rotate others)
    const last = teamsToSchedule.pop();
    teamsToSchedule.splice(1, 0, last);
  }

  return matches;
};

// Helper function to generate Pool matches
const generatePoolMatches = (teams, poolsPerGroup = 2) => {
  const matches = [];
  const teamCount = teams.length;
  const teamsPerPool = Math.ceil(teamCount / poolsPerGroup);
  
  for (let pool = 0; pool < poolsPerGroup; pool++) {
    const poolTeams = teams.slice(pool * teamsPerPool, (pool + 1) * teamsPerPool);
    
    // Round robin within each pool
    for (let i = 0; i < poolTeams.length; i++) {
      for (let j = i + 1; j < poolTeams.length; j++) {
        matches.push({
          teamAId: poolTeams[i]._id,
          teamBId: poolTeams[j]._id,
          pool: pool + 1,
          round: 1
        });
      }
    }
  }

  return matches;
};

// Helper function to generate Single Elimination bracket matches
const generateSingleElimination = (teams) => {
  const matches = [];
  const n = teams.length;
  const numRounds = Math.ceil(Math.log2(n));
  
  // Initialize first round
  let currentRound = 1;
  let teamsInRound = [...teams];
  let matchNumber = 1;

  while (teamsInRound.length > 1) {
    const nextRoundTeams = [];
    const roundMatches = [];

    for (let i = 0; i < teamsInRound.length; i += 2) {
      if (i + 1 < teamsInRound.length) {
        roundMatches.push({
          teamAId: teamsInRound[i]._id,
          teamBId: teamsInRound[i + 1]._id,
          round: currentRound,
          matchNumber: matchNumber++
        });
      } else {
        // Bye for odd number
        nextRoundTeams.push(teamsInRound[i]);
      }
    }

    matches.push(...roundMatches);
    teamsInRound = nextRoundTeams;
    currentRound++;
  }

  return matches;
};

// Helper function to distribute matches across tournament dates
const distributeMatchesAcrossDates = (matches, startDate, endDate, matchDurationMinutes = 60) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysAvailable = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  
  const matchesPerDay = Math.ceil(matches.length / daysAvailable);
  const scheduledMatches = [];
  let currentDate = new Date(start);
  let matchesToday = 0;

  matches.forEach((match, index) => {
    if (matchesToday >= matchesPerDay) {
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 1);
      matchesToday = 0;
    }

    const startTime = new Date(currentDate);
    startTime.setHours(9 + (matchesToday % 8)); // Starting at 9 AM, max 8 matches per day
    startTime.setMinutes(0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + matchDurationMinutes);

    scheduledMatches.push({
      ...match,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    });

    matchesToday++;
  });

  return scheduledMatches;
};

// Generate and save matches for a tournament
export const generateSchedule = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { scheduleFormat, poolsPerGroup, matchDurationMinutes } = req.body;

    if (!tournamentId) {
      return res.status(400).json({
        success: false,
        message: "Tournament ID is required"
      });
    }

    // Get tournament
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found"
      });
    }

    // Get teams for this tournament
    const teams = await Team.find({ tournamentId });
    
    if (teams.length < 2) {
      return res.status(400).json({
        success: false,
        message: "At least 2 teams are required to generate a schedule"
      });
    }

    // Check if matches already exist
    const existingMatches = await Match.find({ tournamentId });
    if (existingMatches.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Matches already exist for this tournament. Please delete existing matches first.",
        existingMatchCount: existingMatches.length
      });
    }

    // Determine schedule format
    const format = scheduleFormat || tournament.format || 'round-robin';

    let matches = [];

    // Generate matches based on format
    switch (format) {
      case 'round-robin':
        matches = generateRoundRobin(teams);
        break;
      
      case 'pool-play-bracket':
      case 'pools':
        matches = generatePoolMatches(teams, poolsPerGroup || 2);
        break;
      
      case 'single-elimination':
        matches = generateSingleElimination(teams);
        break;
      
      default:
        // Default to round robin
        matches = generateRoundRobin(teams);
    }

    // Distribute matches across tournament dates
    const scheduledMatches = distributeMatchesAcrossDates(
      matches,
      tournament.startDate,
      tournament.endDate,
      matchDurationMinutes || 60
    );

    // Save matches to database
    const savedMatches = await Match.insertMany(
      scheduledMatches.map(match => ({
        tournamentId: tournament._id,
        teamAId: match.teamAId,
        teamBId: match.teamBId,
        startTime: match.startTime,
        endTime: match.endTime,
        status: 'scheduled',
        fieldName: `Field ${Math.floor(Math.random() * 3) + 1}` // Random field assignment
      }))
    );

    res.status(201).json({
      success: true,
      message: `Successfully generated ${savedMatches.length} matches`,
      data: {
        tournamentId: tournament._id,
        tournamentName: tournament.name,
        format: format,
        matchCount: savedMatches.length,
        matches: savedMatches.map(m => ({
          _id: m._id,
          teamAId: m.teamAId,
          teamBId: m.teamBId,
          startTime: m.startTime,
          endTime: m.endTime,
          fieldName: m.fieldName,
          status: m.status
        }))
      }
    });
  } catch (error) {
    console.error("Generate schedule error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while generating schedule",
      error: error.message
    });
  }
};

// Get all matches for a tournament
export const getMatchesByTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const matches = await Match.find({ tournamentId })
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
        matchCount: matches.length
      }
    });
  } catch (error) {
    console.error("Get matches error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching matches",
      error: error.message
    });
  }
};

// Update a single match
export const updateMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { fieldName, startTime, endTime, status, score, winnerTeamId } = req.body;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    // Update fields if provided
    if (fieldName !== undefined) match.fieldName = fieldName;
    if (startTime) match.startTime = new Date(startTime);
    if (endTime) match.endTime = new Date(endTime);
    if (status) {
      if (!["scheduled", "ongoing", "completed"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be 'scheduled', 'ongoing', or 'completed'"
        });
      }
      match.status = status;
    }

    // Update score
    if (score) {
      match.score = {
        teamA: score.teamA !== undefined ? score.teamA : match.score?.teamA || 0,
        teamB: score.teamB !== undefined ? score.teamB : match.score?.teamB || 0
      };
    }

    // Auto-determine winner if score is set and match is completed
    if (status === 'completed' && match.score) {
      if (match.score.teamA > match.score.teamB) {
        match.winnerTeamId = match.teamAId;
      } else if (match.score.teamB > match.score.teamA) {
        match.winnerTeamId = match.teamBId;
      } else {
        match.winnerTeamId = null; // Tie
      }
    } else if (winnerTeamId !== undefined) {
      // Allow manual winner assignment
      match.winnerTeamId = winnerTeamId || null;
    }

    await match.save();

    const updatedMatch = await Match.findById(matchId)
      .populate('teamAId', 'teamName')
      .populate('teamBId', 'teamName');

    res.status(200).json({
      success: true,
      message: "Match updated successfully",
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
    console.error("Update match error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating match",
      error: error.message
    });
  }
};

// Delete all matches for a tournament
export const deleteMatchesByTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const result = await Match.deleteMany({ tournamentId });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} matches`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Delete matches error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting matches",
      error: error.message
    });
  }
};

