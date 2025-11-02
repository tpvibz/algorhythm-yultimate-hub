import MatchPrediction from "../models/matchPredictionModel.js";
import Match from "../models/matchModel.js";
import Person from "../models/personModel.js";

// Submit or update a prediction
export const submitPrediction = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { predictedWinnerId, predictedScore, userId } = req.body;

    // Verify match exists
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    // Check if match has completed (allow predictions for scheduled and ongoing matches)
    if (match.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: "Cannot submit prediction for completed match"
      });
    }

    // Verify user exists (optional check - allow anonymous predictions if no userId)
    if (userId) {
      const user = await Person.findById(userId);
      if (!user) {
        // Allow anonymous predictions if user not found
        // userId will be null in this case
      }
    }

    // Verify predicted winner is one of the teams
    if (predictedWinnerId !== match.teamAId.toString() && predictedWinnerId !== match.teamBId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Predicted winner must be one of the teams in the match"
      });
    }

    // For logged-in users: find and update existing prediction
    // For anonymous users: create new prediction (allow multiple anonymous votes)
    let prediction;
    
    if (userId) {
      // Logged-in user: try to update existing, or create new
      prediction = await MatchPrediction.findOneAndUpdate(
        { matchId, userId },
        {
          matchId,
          userId,
          predictedWinnerId,
          predictedScore: predictedScore || null
        },
        { upsert: true, new: true }
      )
        .populate('predictedWinnerId', 'teamName')
        .populate('userId', 'firstName lastName');
    } else {
      // Anonymous user: always create new prediction (allow multiple votes per match)
      prediction = await MatchPrediction.create({
        matchId,
        userId: undefined,
        predictedWinnerId,
        predictedScore: predictedScore || null
      });
      
      await prediction.populate('predictedWinnerId', 'teamName');
    }

    res.status(200).json({
      success: true,
      message: "Prediction submitted successfully",
      data: {
        prediction: {
          _id: prediction._id,
          matchId: prediction.matchId,
          userId: prediction.userId,
          predictedWinner: {
            _id: prediction.predictedWinnerId._id,
            teamName: prediction.predictedWinnerId.teamName
          },
          predictedScore: prediction.predictedScore
        }
      }
    });
  } catch (error) {
    console.error("Submit prediction error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while submitting prediction",
      error: error.message
    });
  }
};

// Get predictions for a match
export const getMatchPredictions = async (req, res) => {
  try {
    const { matchId } = req.params;

    const predictions = await MatchPrediction.find({ matchId })
      .populate('predictedWinnerId', 'teamName')
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const match = await Match.findById(matchId)
      .populate('teamAId', 'teamName')
      .populate('teamBId', 'teamName');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    const teamACount = predictions.filter(p => 
      p.predictedWinnerId._id.toString() === match.teamAId._id.toString()
    ).length;

    const teamBCount = predictions.filter(p => 
      p.predictedWinnerId._id.toString() === match.teamBId._id.toString()
    ).length;

    const totalPredictions = predictions.length;

    res.status(200).json({
      success: true,
      data: {
        match: {
          teamA: {
            _id: match.teamAId._id,
            teamName: match.teamAId.teamName
          },
          teamB: {
            _id: match.teamBId._id,
            teamName: match.teamBId.teamName
          },
          status: match.status
        },
        predictions: predictions.map(p => ({
          _id: p._id,
          userId: p.userId ? {
            _id: p.userId._id,
            firstName: p.userId.firstName,
            lastName: p.userId.lastName,
            email: p.userId.email
          } : null,
          predictedWinner: {
            _id: p.predictedWinnerId._id,
            teamName: p.predictedWinnerId.teamName
          },
          predictedScore: p.predictedScore,
          createdAt: p.createdAt
        })),
        statistics: {
          total: totalPredictions,
          teamA: teamACount,
          teamB: teamBCount,
          teamAPercentage: totalPredictions > 0 ? Math.round((teamACount / totalPredictions) * 100) : 0,
          teamBPercentage: totalPredictions > 0 ? Math.round((teamBCount / totalPredictions) * 100) : 0
        }
      }
    });
  } catch (error) {
    console.error("Get predictions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching predictions",
      error: error.message
    });
  }
};

// Get user's prediction for a match
export const getUserPrediction = async (req, res) => {
  try {
    const { matchId, userId } = req.params;

    const prediction = await MatchPrediction.findOne({ matchId, userId })
      .populate('predictedWinnerId', 'teamName');

    if (!prediction) {
      return res.status(200).json({
        success: true,
        data: {
          prediction: null
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        prediction: {
          _id: prediction._id,
          matchId: prediction.matchId,
          predictedWinner: {
            _id: prediction.predictedWinnerId._id,
            teamName: prediction.predictedWinnerId.teamName
          },
          predictedScore: prediction.predictedScore,
          createdAt: prediction.createdAt
        }
      }
    });
  } catch (error) {
    console.error("Get user prediction error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user prediction",
      error: error.message
    });
  }
};

// Delete a prediction
export const deletePrediction = async (req, res) => {
  try {
    const { predictionId } = req.params;

    const prediction = await MatchPrediction.findByIdAndDelete(predictionId);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: "Prediction not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Prediction deleted successfully"
    });
  } catch (error) {
    console.error("Delete prediction error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting prediction",
      error: error.message
    });
  }
};

