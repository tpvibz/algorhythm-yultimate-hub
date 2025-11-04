import TournamentFeedback from "../models/tournamentFeedbackModel.js";
import PlayerMatchFeedback from "../models/playerMatchFeedbackModel.js";
import SpiritSubmission from "../models/spiritSubmissionModel.js";
import Tournament from "../models/tournamentModel.js";
import Match from "../models/matchModel.js";
import Team from "../models/teamModel.js";
import MatchAttendance from "../models/matchAttendanceModel.js";
import PlayerProfile from "../models/playerProfileModel.js";
import Person from "../models/personModel.js";
import { createNotification } from "./notificationController.js";

// Get matches that need feedback (after each match completion)
export const getMatchesNeedingFeedback = async (req, res) => {
  try {
    const coachId = req.user ? req.user.id : req.query.coachId;
    if (!coachId) {
      return res.status(400).json({ 
        success: false,
        message: "Coach ID is required" 
      });
    }

    // Get all teams for this coach
    const teams = await Team.find({ coachId });
    if (teams.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          matches: [],
          count: 0
        }
      });
    }

    const teamIds = teams.map(t => t._id);

    // Get all completed matches for this coach's teams
    const completedMatches = await Match.find({
      $or: [
        { teamAId: { $in: teamIds } },
        { teamBId: { $in: teamIds } }
      ],
      status: 'completed'
    })
      .populate('tournamentId', 'name startDate endDate location')
      .populate('teamAId', 'teamName')
      .populate('teamBId', 'teamName')
      .sort({ startTime: -1 });

    const matchesNeedingFeedback = [];

    for (const match of completedMatches) {
      // Determine which team belongs to this coach
      // Handle both populated and non-populated team references
      const teamAIdStr = (match.teamAId?._id || match.teamAId)?.toString();
      const teamBIdStr = (match.teamBId?._id || match.teamBId)?.toString();
      
      const coachTeam = teams.find(t => 
        t._id.toString() === teamAIdStr || t._id.toString() === teamBIdStr
      );

      if (!coachTeam) continue;

      // Check spirit score submission
      const spiritScoreSubmitted = await SpiritSubmission.findOne({
        matchId: match._id,
        submittedByTeamId: coachTeam._id
      });

      // Get players who attended the match
      const playersAttended = await MatchAttendance.find({
        matchId: match._id,
        teamId: coachTeam._id,
        status: 'present'
      }).select('playerId');

      // Check player feedback completion
      let playerFeedbackComplete = true;
      let playersNeedingFeedback = 0;
      
      if (playersAttended.length > 0) {
        for (const attendance of playersAttended) {
          const feedbackExists = await PlayerMatchFeedback.findOne({
            matchId: match._id,
            playerId: attendance.playerId,
            coachId: coachId
          });
          if (!feedbackExists) {
            playerFeedbackComplete = false;
            playersNeedingFeedback++;
          }
        }
      }

      const needsSpiritScore = !spiritScoreSubmitted;
      const needsPlayerFeedback = !playerFeedbackComplete;

      // If either is missing, include this match
      if (needsSpiritScore || needsPlayerFeedback) {
        // Get opponent team (handle both populated and non-populated references)
        const teamAIdMatch = (match.teamAId?._id || match.teamAId)?.toString() === coachTeam._id.toString();
        const opponentTeam = teamAIdMatch ? match.teamBId : match.teamAId;

        matchesNeedingFeedback.push({
          matchId: match._id,
          matchNumber: match.matchNumber,
          roundName: match.roundName,
          startTime: match.startTime,
          fieldName: match.fieldName,
          tournament: match.tournamentId ? {
            _id: match.tournamentId._id,
            name: match.tournamentId.name,
            startDate: match.tournamentId.startDate,
            endDate: match.tournamentId.endDate,
            location: match.tournamentId.location
          } : null,
          team: {
            _id: coachTeam._id,
            teamName: coachTeam.teamName
          },
          opponentTeam: opponentTeam ? {
            _id: opponentTeam._id,
            teamName: opponentTeam.teamName
          } : null,
          spiritScoreSubmitted: !!spiritScoreSubmitted,
          playerFeedbackSubmitted: playerFeedbackComplete,
          playersNeedingFeedback: playersNeedingFeedback,
          totalPlayersAttended: playersAttended.length,
          score: match.score ? {
            teamA: match.score.teamA,
            teamB: match.score.teamB
          } : null
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        matches: matchesNeedingFeedback,
        count: matchesNeedingFeedback.length
      }
    });
  } catch (error) {
    console.error("Get matches needing feedback error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch matches needing feedback",
      error: error.message
    });
  }
};

// Keep old function name for backward compatibility
export const getTournamentsNeedingFeedback = getMatchesNeedingFeedback;

// Get details for a specific tournament's feedback
export const getTournamentFeedbackDetails = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const coachId = req.user ? req.user.id : req.query.coachId;
    
    if (!coachId) {
      return res.status(400).json({
        success: false,
        message: "Coach ID is required"
      });
    }

    // Get coach's team for this tournament
    const team = await Team.findOne({
      coachId: coachId,
      tournamentId: tournamentId
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found for this tournament"
      });
    }

    // Get all completed matches for this team in this tournament
    const matches = await Match.find({
      tournamentId: tournamentId,
      $or: [
        { teamAId: team._id },
        { teamBId: team._id }
      ],
      status: 'completed'
    }).sort({ startTime: 1 });

    const matchDetails = await Promise.all(matches.map(async (match) => {
      const opponentTeamId = match.teamAId.toString() === team._id.toString() 
        ? match.teamBId 
        : match.teamAId;
      
      const opponentTeam = await Team.findById(opponentTeamId).select('teamName');
      
      // Check spirit score submission
      const spiritScore = await SpiritSubmission.findOne({
        matchId: match._id,
        submittedByTeamId: team._id
      });

      // Get players who attended
      const playersAttended = await MatchAttendance.find({
        matchId: match._id,
        teamId: team._id,
        status: 'present'
      }).populate('playerId', 'firstName lastName');

      // Get feedback for each player
      const playerFeedbackList = await Promise.all(playersAttended.map(async (attendance) => {
        const feedback = await PlayerMatchFeedback.findOne({
          matchId: match._id,
          playerId: attendance.playerId._id,
          coachId: coachId
        });

        return {
          playerId: attendance.playerId._id,
          playerName: `${attendance.playerId.firstName} ${attendance.playerId.lastName}`,
          feedback: feedback ? {
            score: feedback.score,
            feedback: feedback.feedback,
            submittedAt: feedback.submittedAt
          } : null
        };
      }));

      return {
        matchId: match._id,
        opponentTeam: opponentTeam ? {
          _id: opponentTeam._id,
          teamName: opponentTeam.teamName
        } : null,
        matchNumber: match.matchNumber,
        roundName: match.roundName,
        startTime: match.startTime,
        spiritScore: spiritScore ? {
          categories: spiritScore.categories,
          comments: spiritScore.comments,
          submittedAt: spiritScore.submittedAt
        } : null,
        players: playerFeedbackList,
        spiritScoreSubmitted: !!spiritScore,
        allPlayerFeedbackSubmitted: playerFeedbackList.every(p => p.feedback !== null)
      };
    }));

    res.status(200).json({
      success: true,
      data: {
        tournament: await Tournament.findById(tournamentId).select('name startDate endDate location'),
        team: {
          _id: team._id,
          teamName: team.teamName
        },
        matches: matchDetails
      }
    });
  } catch (error) {
    console.error("Get tournament feedback details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tournament feedback details",
      error: error.message
    });
  }
};

// Submit spirit score for a match
export const submitSpiritScore = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { categories, comments, coachId } = req.body;
    
    const submittingCoachId = req.user ? req.user.id : coachId;
    if (!submittingCoachId) {
      return res.status(400).json({
        success: false,
        message: "Coach ID is required"
      });
    }

    // Get match and verify coach's team is in it
    const match = await Match.findById(matchId).populate('tournamentId');
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    // Find coach's team
    const team = await Team.findOne({
      coachId: submittingCoachId,
      $or: [
        { _id: match.teamAId },
        { _id: match.teamBId }
      ]
    });

    if (!team) {
      return res.status(403).json({
        success: false,
        message: "You can only submit spirit scores for your team's matches"
      });
    }

    // Get opponent team
    const opponentTeamId = match.teamAId.toString() === team._id.toString()
      ? match.teamBId
      : match.teamAId;

    // Validate categories (require all, allow 0 values)
    const requiredCategories = ['rulesKnowledge', 'foulsContact', 'fairMindedness', 'positiveAttitude', 'communication'];
    const missingCategories = requiredCategories.filter(cat => !(categories && Object.prototype.hasOwnProperty.call(categories, cat)));
    
    if (missingCategories.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required categories: ${missingCategories.join(', ')}`
      });
    }

    // Validate category scores (0–4 inclusive)
    for (const [key, value] of Object.entries(categories)) {
      if (typeof value !== 'number' || Number.isNaN(value) || value < 0 || value > 4) {
        return res.status(400).json({
          success: false,
          message: `Category ${key} must be a number between 0 and 4`
        });
      }
    }

    // Check if already submitted
    const existingSubmission = await SpiritSubmission.findOne({
      matchId: matchId,
      submittedByTeamId: team._id
    });

    if (existingSubmission) {
      // Update existing submission
      existingSubmission.categories = categories;
      existingSubmission.comments = comments || existingSubmission.comments;
      existingSubmission.submittedAt = new Date();
      await existingSubmission.save();

      return res.status(200).json({
        success: true,
        message: "Spirit score updated successfully",
        data: { spiritScore: existingSubmission }
      });
    }

    // Create new submission
    const spiritSubmission = new SpiritSubmission({
      matchId: matchId,
      submittedByTeamId: team._id,
      forOpponentTeamId: opponentTeamId,
      categories: categories,
      comments: comments || '',
      submittedAt: new Date()
    });

    await spiritSubmission.save();

    // Notify opposing coach about spirit score received
    try {
      const opponentTeam = await Team.findById(opponentTeamId);
      if (opponentTeam && opponentTeam.coachId) {
        await createNotification(
          opponentTeam.coachId,
          "spirit_score_received",
          "Spirit Score Received",
          `Your team received a spirit score from ${team.teamName} for the match.`,
          { relatedEntityId: matchId, relatedEntityType: "match" }
        );
      }
    } catch (notificationError) {
      console.error("Error creating notification for spirit score:", notificationError);
    }

    // Update tournament feedback tracking
    await updateTournamentFeedbackTracking(match.tournamentId, submittingCoachId, team._id, matchId, 'spirit');

    res.status(201).json({
      success: true,
      message: "Spirit score submitted successfully",
      data: { spiritScore: spiritSubmission }
    });
  } catch (error) {
    console.error("Submit spirit score error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit spirit score",
      error: error.message
    });
  }
};

// Submit player feedback for a match
export const submitPlayerFeedback = async (req, res) => {
  try {
    const { matchId, playerId } = req.params;
    const { score, feedback, coachId } = req.body;
    
    const submittingCoachId = req.user ? req.user.id : coachId;
    if (!submittingCoachId) {
      return res.status(400).json({
        success: false,
        message: "Coach ID is required"
      });
    }

    if (!score || !feedback) {
      return res.status(400).json({
        success: false,
        message: "Score and feedback are required"
      });
    }

    // Validate score format
    if (!/^\d+\/\d+$/.test(score)) {
      return res.status(400).json({
        success: false,
        message: 'Score must be in format "number/number" (e.g., "3/7")'
      });
    }

    // Validate feedback length
    if (feedback.length < 20 || feedback.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Feedback must be between 20 and 500 characters"
      });
    }

    // Get match
    const match = await Match.findById(matchId).populate('tournamentId');
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    // Find coach's team
    const team = await Team.findOne({
      coachId: submittingCoachId,
      $or: [
        { _id: match.teamAId },
        { _id: match.teamBId }
      ]
    });

    if (!team) {
      return res.status(403).json({
        success: false,
        message: "You can only submit feedback for players in your team's matches"
      });
    }

    // Verify player is in the team and attended the match
    const attendance = await MatchAttendance.findOne({
      matchId: matchId,
      playerId: playerId,
      teamId: team._id,
      status: 'present'
    });

    if (!attendance) {
      return res.status(403).json({
        success: false,
        message: "Player did not attend this match or is not part of your team"
      });
    }

    // Check if feedback already exists
    const existingFeedback = await PlayerMatchFeedback.findOne({
      matchId: matchId,
      playerId: playerId,
      coachId: submittingCoachId
    });

    if (existingFeedback) {
      // Update existing feedback
      existingFeedback.score = score;
      existingFeedback.feedback = feedback;
      await existingFeedback.save();

      // Update player profile feedback
      await updatePlayerProfileFeedback(playerId, submittingCoachId, matchId, score, feedback);

      return res.status(200).json({
        success: true,
        message: "Player feedback updated successfully",
        data: { feedback: existingFeedback }
      });
    }

    // Create new feedback
    const playerFeedback = new PlayerMatchFeedback({
      matchId: matchId,
      tournamentId: match.tournamentId._id,
      playerId: playerId,
      coachId: submittingCoachId,
      teamId: team._id,
      score: score,
      feedback: feedback
    });

    await playerFeedback.save();

    // Notify player about feedback received
    try {
      await createNotification(
        playerId,
        "spirit_score_received",
        "Feedback Received",
        `Your coach has submitted feedback for your performance in the match. Score: ${score}`,
        { relatedEntityId: matchId, relatedEntityType: "match" }
      );
    } catch (notificationError) {
      console.error("Error creating notification for player feedback:", notificationError);
    }

    // Update player profile feedback
    await updatePlayerProfileFeedback(playerId, submittingCoachId, matchId, score, feedback);

    // Update tournament feedback tracking
    await updateTournamentFeedbackTracking(match.tournamentId._id, submittingCoachId, team._id, matchId, 'player');

    res.status(201).json({
      success: true,
      message: "Player feedback submitted successfully",
      data: { feedback: playerFeedback }
    });
  } catch (error) {
    console.error("Submit player feedback error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit player feedback",
      error: error.message
    });
  }
};

// Get players for a match (who attended)
export const getMatchPlayersForFeedback = async (req, res) => {
  try {
    const { matchId } = req.params;
    const coachId = req.user ? req.user.id : req.query.coachId;
    
    if (!coachId) {
      return res.status(400).json({
        success: false,
        message: "Coach ID is required"
      });
    }

    // Get match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    // Find coach's team
    const team = await Team.findOne({
      coachId: coachId,
      $or: [
        { _id: match.teamAId },
        { _id: match.teamBId }
      ]
    });

    if (!team) {
      return res.status(403).json({
        success: false,
        message: "You can only view players for your team's matches"
      });
    }

    // Get players who attended
    const playersAttended = await MatchAttendance.find({
      matchId: matchId,
      teamId: team._id,
      status: 'present'
    }).populate('playerId', 'firstName lastName email');

    // Get feedback status for each player
    const playersWithFeedback = await Promise.all(playersAttended.map(async (attendance) => {
      const feedback = await PlayerMatchFeedback.findOne({
        matchId: matchId,
        playerId: attendance.playerId._id,
        coachId: coachId
      });

      return {
        playerId: attendance.playerId._id,
        firstName: attendance.playerId.firstName,
        lastName: attendance.playerId.lastName,
        name: `${attendance.playerId.firstName} ${attendance.playerId.lastName}`,
        email: attendance.playerId.email,
        feedbackSubmitted: !!feedback,
        feedback: feedback ? {
          score: feedback.score,
          feedback: feedback.feedback
        } : null
      };
    }));

    res.status(200).json({
      success: true,
      data: {
        match: {
          _id: match._id,
          matchNumber: match.matchNumber,
          roundName: match.roundName
        },
        team: {
          _id: team._id,
          teamName: team.teamName
        },
        players: playersWithFeedback
      }
    });
  } catch (error) {
    console.error("Get match players for feedback error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch match players",
      error: error.message
    });
  }
};

// Check if coach can register for new tournament (has completed feedback for all completed matches)
export const checkFeedbackCompletionStatus = async (req, res) => {
  try {
    const coachId = req.user ? req.user.id : req.query.coachId;
    if (!coachId) {
      return res.status(400).json({
        success: false,
        message: "Coach ID is required"
      });
    }

    // Get all teams for this coach
    const teams = await Team.find({ coachId });
    if (teams.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          canRegister: true,
          incompleteMatches: []
        }
      });
    }

    const teamIds = teams.map(t => t._id);

    // Get all completed matches for this coach's teams (regardless of tournament status)
    const completedMatches = await Match.find({
      $or: [
        { teamAId: { $in: teamIds } },
        { teamBId: { $in: teamIds } }
      ],
      status: 'completed'
    })
      .populate('tournamentId', 'name')
      .populate('teamAId', 'teamName')
      .populate('teamBId', 'teamName')
      .sort({ startTime: -1 });

    const incompleteMatches = [];

    for (const match of completedMatches) {
      // Determine which team belongs to this coach
      // Handle both populated and non-populated team references
      const teamAIdStr = (match.teamAId?._id || match.teamAId)?.toString();
      const teamBIdStr = (match.teamBId?._id || match.teamBId)?.toString();
      
      const coachTeam = teams.find(t => 
        t._id.toString() === teamAIdStr || t._id.toString() === teamBIdStr
      );

      if (!coachTeam) continue;

      // Check spirit score
      const spiritScore = await SpiritSubmission.findOne({
        matchId: match._id,
        submittedByTeamId: coachTeam._id
      });

      if (!spiritScore) {
        const teamAIdMatch = (match.teamAId?._id || match.teamAId)?.toString() === coachTeam._id.toString();
        const opponentTeam = teamAIdMatch ? match.teamBId : match.teamAId;

        incompleteMatches.push({
          matchId: match._id,
          tournamentName: match.tournamentId?.name || 'Friendly Match',
          matchDate: match.startTime,
          teamName: coachTeam.teamName,
          opponentTeam: opponentTeam?.teamName || 'Unknown',
          missingType: 'spirit_score'
        });
        continue;
      }

      // Check player feedback
      const playersAttended = await MatchAttendance.find({
        matchId: match._id,
        teamId: coachTeam._id,
        status: 'present'
      });

      for (const attendance of playersAttended) {
        const feedback = await PlayerMatchFeedback.findOne({
          matchId: match._id,
          playerId: attendance.playerId,
          coachId: coachId
        });

        if (!feedback) {
          const teamAIdMatch = (match.teamAId?._id || match.teamAId)?.toString() === coachTeam._id.toString();
          const opponentTeam = teamAIdMatch ? match.teamBId : match.teamAId;

          incompleteMatches.push({
            matchId: match._id,
            tournamentName: match.tournamentId?.name || 'Friendly Match',
            matchDate: match.startTime,
            teamName: coachTeam.teamName,
            opponentTeam: opponentTeam?.teamName || 'Unknown',
            missingType: 'player_feedback'
          });
          break; // Only add match once
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        canRegister: incompleteMatches.length === 0,
        incompleteMatches: incompleteMatches
      }
    });
  } catch (error) {
    console.error("Check feedback completion status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check feedback completion status",
      error: error.message
    });
  }
};

// Get spirit scores given and received for a coach's teams
export const getCoachSpiritScores = async (req, res) => {
  try {
    const coachId = req.user ? req.user.id : req.query.coachId;
    const { tournamentId, matchId } = req.query;

    if (!coachId) {
      return res.status(400).json({
        success: false,
        message: "Coach ID is required"
      });
    }

    // Get teams for coach (optionally within a tournament)
    const teamFilter = tournamentId ? { coachId, tournamentId } : { coachId };
    const teams = await Team.find(teamFilter).select('_id teamName');
    const teamIds = teams.map(t => t._id);

    if (teamIds.length === 0) {
      return res.status(200).json({ success: true, data: { scores: [], count: 0 } });
    }

    // Build submission filters
    const baseFilter = {};
    if (matchId) baseFilter.matchId = matchId;

    // Find submissions GIVEN by coach teams
    const givenSubmissions = await SpiritSubmission.find({
      ...baseFilter,
      submittedByTeamId: { $in: teamIds }
    })
      .populate('matchId', 'startTime roundName matchNumber tournamentId teamAId teamBId status')
      .populate('forOpponentTeamId', 'teamName')
      .lean();

    // Find submissions RECEIVED for coach teams
    const receivedSubmissions = await SpiritSubmission.find({
      ...baseFilter,
      forOpponentTeamId: { $in: teamIds }
    })
      .populate('matchId', 'startTime roundName matchNumber tournamentId teamAId teamBId status')
      .populate('submittedByTeamId', 'teamName')
      .lean();

    // Normalize output
    const scores = [
      ...givenSubmissions.map(s => ({
        type: 'given',
        matchId: s.matchId?._id || s.matchId,
        match: s.matchId || null,
        opponentTeam: s.forOpponentTeamId || null,
        categories: s.categories,
        total: (s.categories?.rulesKnowledge || 0)
          + (s.categories?.foulsContact || 0)
          + (s.categories?.fairMindedness || 0)
          + (s.categories?.positiveAttitude || 0)
          + (s.categories?.communication || 0),
        comments: s.comments || '',
        submittedAt: s.submittedAt
      })),
      ...receivedSubmissions.map(s => ({
        type: 'received',
        matchId: s.matchId?._id || s.matchId,
        match: s.matchId || null,
        opponentTeam: s.submittedByTeamId || null,
        categories: s.categories,
        total: (s.categories?.rulesKnowledge || 0)
          + (s.categories?.foulsContact || 0)
          + (s.categories?.fairMindedness || 0)
          + (s.categories?.positiveAttitude || 0)
          + (s.categories?.communication || 0),
        comments: s.comments || '',
        submittedAt: s.submittedAt
      }))
    ]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    return res.status(200).json({
      success: true,
      data: { scores, count: scores.length }
    });
  } catch (error) {
    console.error("Get coach spirit scores error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch spirit scores",
      error: error.message
    });
  }
};

// Get tournament spirit leaderboard (separate from performance scores)
export const getTournamentSpiritLeaderboard = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    if (!tournamentId) {
      return res.status(400).json({ success: false, message: 'Tournament ID is required' });
    }

    const teams = await Team.find({ tournamentId: tournamentId.toString() });
    const teamIds = teams.map(t => t._id);

    const matches = await Match.find({
      tournamentId,
      $or: [
        { teamAId: { $in: teamIds } },
        { teamBId: { $in: teamIds } }
      ]
    });

    const spiritSubmissions = await SpiritSubmission.find({
      matchId: { $in: matches.map(m => m._id) }
    });

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
      const c = submission.categories || {};
      const total = (c.rulesKnowledge || 0) + (c.foulsContact || 0) + (c.fairMindedness || 0) + (c.positiveAttitude || 0) + (c.communication || 0);
      spiritScores[opponentTeamId].totalScore += total;
      spiritScores[opponentTeamId].count += 1;
      spiritScores[opponentTeamId].categories.rulesKnowledge.push(c.rulesKnowledge || 0);
      spiritScores[opponentTeamId].categories.foulsContact.push(c.foulsContact || 0);
      spiritScores[opponentTeamId].categories.fairMindedness.push(c.fairMindedness || 0);
      spiritScores[opponentTeamId].categories.positiveAttitude.push(c.positiveAttitude || 0);
      spiritScores[opponentTeamId].categories.communication.push(c.communication || 0);
    });

    const leaderboard = Object.values(spiritScores).map(score => {
      const categoryAverages = {
        rulesKnowledge: score.categories.rulesKnowledge.length ? score.categories.rulesKnowledge.reduce((a,b)=>a+b,0)/score.categories.rulesKnowledge.length : 0,
        foulsContact: score.categories.foulsContact.length ? score.categories.foulsContact.reduce((a,b)=>a+b,0)/score.categories.foulsContact.length : 0,
        fairMindedness: score.categories.fairMindedness.length ? score.categories.fairMindedness.reduce((a,b)=>a+b,0)/score.categories.fairMindedness.length : 0,
        positiveAttitude: score.categories.positiveAttitude.length ? score.categories.positiveAttitude.reduce((a,b)=>a+b,0)/score.categories.positiveAttitude.length : 0,
        communication: score.categories.communication.length ? score.categories.communication.reduce((a,b)=>a+b,0)/score.categories.communication.length : 0,
      };
      const team = teams.find(t => t._id.toString() === score.teamId);
      return {
        teamId: score.teamId,
        teamName: team ? team.teamName : 'Unknown',
        averageTotal: score.count ? Math.round((score.totalScore / score.count) * 100) / 100 : 0, // 0–20
        categoryAverages,
        submissionCount: score.count
      };
    }).sort((a, b) => b.averageTotal - a.averageTotal);

    return res.status(200).json({
      success: true,
      data: { leaderboard, count: leaderboard.length }
    });
  } catch (error) {
    console.error('Get tournament spirit leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch spirit leaderboard',
      error: error.message
    });
  }
};

// Helper function to update tournament feedback tracking
async function updateTournamentFeedbackTracking(tournamentId, coachId, teamId, matchId, type) {
  let feedbackTracking = await TournamentFeedback.findOne({
    tournamentId: tournamentId,
    coachId: coachId,
    teamId: teamId
  });

  if (!feedbackTracking) {
    feedbackTracking = new TournamentFeedback({
      tournamentId: tournamentId,
      coachId: coachId,
      teamId: teamId,
      matchesCompleted: []
    });
  }

  let matchEntry = feedbackTracking.matchesCompleted.find(
    m => m.matchId.toString() === matchId.toString()
  );

  if (!matchEntry) {
    matchEntry = {
      matchId: matchId,
      spiritScoreSubmitted: false,
      playerFeedbackSubmitted: false
    };
    feedbackTracking.matchesCompleted.push(matchEntry);
  }

  if (type === 'spirit') {
    matchEntry.spiritScoreSubmitted = true;
  } else if (type === 'player') {
    matchEntry.playerFeedbackSubmitted = true;
  }

  // Check if all matches are complete
  const allMatches = await Match.find({
    tournamentId: tournamentId,
    $or: [
      { teamAId: teamId },
      { teamBId: teamId }
    ],
    status: 'completed'
  });

  let allComplete = true;
  for (const match of allMatches) {
    const spiritScore = await SpiritSubmission.findOne({
      matchId: match._id,
      submittedByTeamId: teamId
    });

    const playersAttended = await MatchAttendance.find({
      matchId: match._id,
      teamId: teamId,
      status: 'present'
    });

    let playerFeedbackComplete = true;
    for (const attendance of playersAttended) {
      const feedback = await PlayerMatchFeedback.findOne({
        matchId: match._id,
        playerId: attendance.playerId,
        coachId: coachId
      });
      if (!feedback) {
        playerFeedbackComplete = false;
        break;
      }
    }

    if (!spiritScore || !playerFeedbackComplete) {
      allComplete = false;
      break;
    }
  }

  feedbackTracking.allFeedbackComplete = allComplete;
  if (allComplete) {
    feedbackTracking.completedAt = new Date();
  }

  await feedbackTracking.save();
}

// Helper function to update player profile feedback
async function updatePlayerProfileFeedback(playerId, coachId, matchId, score, feedback) {
  const playerProfile = await PlayerProfile.findOne({ personId: playerId });
  if (!playerProfile) return;

  // Check if feedback already exists for this match
  const existingFeedbackIndex = playerProfile.feedback.findIndex(
    f => f.coachId.toString() === coachId.toString() && f.date
  );

  // Add or update feedback
  const feedbackEntry = {
    coachId: coachId,
    rating: parseFloat(score.split('/')[0]) / parseFloat(score.split('/')[1]) * 10, // Convert to 0-10 scale
    comments: feedback,
    date: new Date(),
    matchId: matchId
  };

  if (existingFeedbackIndex >= 0) {
    playerProfile.feedback[existingFeedbackIndex] = feedbackEntry;
  } else {
    playerProfile.feedback.push(feedbackEntry);
  }

  await playerProfile.save();
}

