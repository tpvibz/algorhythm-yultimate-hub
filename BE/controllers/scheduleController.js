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
  let matchNumber = 1;

  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < teamsToSchedule.length / 2; i++) {
      const teamA = teamsToSchedule[i];
      const teamB = teamsToSchedule[teamsToSchedule.length - 1 - i];
      
      if (teamA && teamB) {
        matches.push({
          teamAId: teamA._id,
          teamBId: teamB._id,
          round: round + 1,
          roundName: `Round ${round + 1}`,
          matchNumber: matchNumber++
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
  let matchNumber = 1;
  
  for (let pool = 0; pool < poolsPerGroup; pool++) {
    const poolTeams = teams.slice(pool * teamsPerPool, (pool + 1) * teamsPerPool);
    
    // Round robin within each pool
    for (let i = 0; i < poolTeams.length; i++) {
      for (let j = i + 1; j < poolTeams.length; j++) {
        matches.push({
          teamAId: poolTeams[i]._id,
          teamBId: poolTeams[j]._id,
          pool: pool + 1,
          round: 1,
          roundName: "Pool Play",
          matchNumber: matchNumber++
        });
      }
    }
  }

  return matches;
};

// Helper function to get round name based on round number and total rounds
const getRoundName = (roundNumber, totalRounds) => {
  const roundNames = {
    [totalRounds]: "Finals",
    [totalRounds - 1]: "Semifinals",
    [totalRounds - 2]: "Quarterfinals",
    [totalRounds - 3]: "Round of 16",
    [totalRounds - 4]: "Round of 32",
  };
  
  return roundNames[roundNumber] || `Round ${roundNumber}`;
};

// Helper function to generate Single Elimination bracket matches
// Only generates the first round - subsequent rounds are generated automatically when previous round completes
const generateSingleElimination = (teams) => {
  const matches = [];
  const n = teams.length;
  const numRounds = Math.ceil(Math.log2(n));
  
  // Shuffle teams for random seeding
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
  
  // Only generate first round matches - later rounds will be auto-generated
  const currentRound = 1;
  const roundName = getRoundName(currentRound, numRounds);
  let matchNumber = 1;
  let bracketPosition = 1;

  for (let i = 0; i < shuffledTeams.length; i += 2) {
    if (i + 1 < shuffledTeams.length) {
      matches.push({
        teamAId: shuffledTeams[i]._id,
        teamBId: shuffledTeams[i + 1]._id,
        round: currentRound,
        roundName: roundName,
        matchNumber: matchNumber++,
        bracketPosition: bracketPosition++
      });
    } else {
      // Bye for odd number - team will be handled in next round generation
      // For now, we skip single team byes in first round
    }
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
    let bracketInfo = null;
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
        fieldName: `Field ${Math.floor(Math.random() * 3) + 1}`, // Random field assignment
        round: match.round || 1,
        roundName: match.roundName || `Round ${match.round || 1}`,
        bracketPosition: match.bracketPosition,
        matchNumber: match.matchNumber,
        pool: match.pool
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
      .sort({ round: 1, bracketPosition: 1, startTime: 1 });

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
          winnerTeamId: match.winnerTeamId,
          round: match.round || 1,
          roundName: match.roundName || `Round ${match.round || 1}`,
          bracketPosition: match.bracketPosition,
          matchNumber: match.matchNumber,
          pool: match.pool,
          parentMatchAId: match.parentMatchAId || null,
          parentMatchBId: match.parentMatchBId || null
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

// Automatically generate next round matches for elimination tournaments
const generateNextRoundMatches = async (tournamentId, completedRound) => {
  try {
    // Get all completed matches from the current round
    const completedMatches = await Match.find({
      tournamentId,
      round: completedRound,
      status: 'completed'
    }).sort({ bracketPosition: 1 });

    if (completedMatches.length === 0) return null;

    // Get tournament format
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament || tournament.format !== 'single-elimination') {
      return null; // Only auto-generate for single elimination
    }

    // Get next round number
    const nextRound = completedRound + 1;
    
    // Get all matches for next round to see if they already exist
    const existingNextRound = await Match.find({
      tournamentId,
      round: nextRound
    });

    if (existingNextRound.length > 0) {
      // Next round already exists, just update team assignments if needed
      return existingNextRound;
    }

    // Get all winners from completed matches
    const winnersWithMatches = completedMatches
      .filter(m => m.winnerTeamId)
      .map(m => ({ winner: m.winnerTeamId, match: m }));
    
    // Check for any teams that had a bye (single team advancing)
    // In elimination, if previous round had odd number of teams, one would advance automatically
    const allMatchesInRound = await Match.find({
      tournamentId,
      round: completedRound
    });
    
    // If we had odd number of matches, one team might have advanced via bye
    // But for now, we'll just use winners from completed matches
    if (winnersWithMatches.length < 1) return null; // Need at least 1 winner
    
    // If only 1 winner, they advance to finals (next round with 1 match)
    if (winnersWithMatches.length === 1) {
      // This is a bye situation - but for finals, we need 2 teams
      // So this shouldn't happen unless tournament structure is off
      return null;
    }

    // Generate next round matches - pair winners sequentially
    const nextRoundMatches = [];
    const roundName = getRoundName(nextRound, Math.ceil(Math.log2(winnersWithMatches.length * 2)));
    let bracketPosition = 1;
    let matchNumber = 1;

    for (let i = 0; i < winnersWithMatches.length; i += 2) {
      if (i + 1 < winnersWithMatches.length) {
        const matchA = winnersWithMatches[i].match;
        const matchB = winnersWithMatches[i + 1].match;
        const winnerA = winnersWithMatches[i].winner;
        const winnerB = winnersWithMatches[i + 1].winner;
        
        nextRoundMatches.push({
          tournamentId,
          teamAId: winnerA,
          teamBId: winnerB,
          round: nextRound,
          roundName: roundName,
          bracketPosition: bracketPosition++,
          matchNumber: matchNumber++,
          parentMatchAId: matchA._id,
          parentMatchBId: matchB._id,
          status: 'scheduled',
          // Schedule time will be set later or can be auto-scheduled
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to next day
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Default 1 hour duration
          fieldName: `Field ${Math.floor(Math.random() * 3) + 1}`
        });
      }
    }

    if (nextRoundMatches.length > 0) {
      const saved = await Match.insertMany(nextRoundMatches);
      return saved;
    }

    return null;
  } catch (error) {
    console.error("Error generating next round matches:", error);
    return null;
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

    const wasCompleted = match.status === 'completed';
    const isCompleting = status === 'completed' && match.status !== 'completed';
    
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

    // If match was just completed and it's an elimination tournament, generate next round
    if (isCompleting && match.round && match.winnerTeamId) {
      // Check if all matches in this round are completed
      const allMatchesInRound = await Match.find({
        tournamentId: match.tournamentId,
        round: match.round
      });

      const allCompleted = allMatchesInRound.every(m => m.status === 'completed');
      
      if (allCompleted) {
        // Generate next round matches automatically
        const nextRoundMatches = await generateNextRoundMatches(match.tournamentId, match.round);
        if (nextRoundMatches && nextRoundMatches.length > 0) {
          console.log(`Auto-generated ${nextRoundMatches.length} matches for round ${match.round + 1}`);
        }
      }
    }

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

