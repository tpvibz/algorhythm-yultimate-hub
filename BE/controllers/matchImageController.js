import MatchImage from "../models/matchImageModel.js";
import Match from "../models/matchModel.js";
import VolunteerTournamentAssignment from "../models/volunteerTournamentAssignmentModel.js";
import Tournament from "../models/tournamentModel.js";

// Upload image for a match
export const uploadMatchImage = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { caption, volunteerId } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided"
      });
    }

    // Verify match exists
    const match = await Match.findById(matchId)
      .populate('tournamentId', '_id name');

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
        tournamentId: match.tournamentId._id
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this tournament"
        });
      }
    }

    // Create image path
    const imageUrl = `/uploads/matches/${req.file.filename}`;

    // Save image record to database
    const matchImage = await MatchImage.create({
      matchId,
      tournamentId: match.tournamentId._id,
      imageUrl,
      uploadedBy: volunteerId || null,
      caption: caption || ""
    });

    // Populate the uploaded by field
    await matchImage.populate('uploadedBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        image: {
          _id: matchImage._id,
          matchId: matchImage.matchId,
          tournamentId: matchImage.tournamentId,
          imageUrl: matchImage.imageUrl,
          caption: matchImage.caption,
          uploadedBy: matchImage.uploadedBy ? {
            _id: matchImage.uploadedBy._id,
            firstName: matchImage.uploadedBy.firstName,
            lastName: matchImage.uploadedBy.lastName,
            email: matchImage.uploadedBy.email
          } : null,
          uploadedAt: matchImage.uploadedAt,
          createdAt: matchImage.createdAt
        }
      }
    });
  } catch (error) {
    console.error("Upload match image error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while uploading image",
      error: error.message
    });
  }
};

// Get all images for a match
export const getMatchImages = async (req, res) => {
  try {
    const { matchId } = req.params;

    const images = await MatchImage.find({ matchId })
      .populate('uploadedBy', 'firstName lastName email')
      .populate('tournamentId', 'name')
      .sort({ uploadedAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        images: images.map(img => ({
          _id: img._id,
          matchId: img.matchId,
          tournamentId: img.tournamentId._id,
          tournamentName: img.tournamentId.name,
          imageUrl: img.imageUrl,
          caption: img.caption,
          uploadedBy: img.uploadedBy ? {
            _id: img.uploadedBy._id,
            firstName: img.uploadedBy.firstName,
            lastName: img.uploadedBy.lastName,
            email: img.uploadedBy.email
          } : null,
          uploadedAt: img.uploadedAt,
          createdAt: img.createdAt
        })),
        count: images.length
      }
    });
  } catch (error) {
    console.error("Get match images error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching images",
      error: error.message
    });
  }
};

// Get all images for a tournament (for volunteer's assigned tournaments)
export const getTournamentImages = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const images = await MatchImage.find({ tournamentId })
      .populate({
        path: 'matchId',
        select: 'teamAId teamBId fieldName startTime status',
        populate: [
          { path: 'teamAId', select: 'teamName' },
          { path: 'teamBId', select: 'teamName' }
        ]
      })
      .populate('uploadedBy', 'firstName lastName email')
      .populate('tournamentId', 'name')
      .sort({ uploadedAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        images: images.map(img => ({
          _id: img._id,
          matchId: img.matchId._id,
          match: {
            _id: img.matchId._id,
            fieldName: img.matchId.fieldName,
            startTime: img.matchId.startTime,
            status: img.matchId.status
          },
          tournamentId: img.tournamentId._id,
          tournamentName: img.tournamentId.name,
          imageUrl: img.imageUrl,
          caption: img.caption,
          uploadedBy: img.uploadedBy ? {
            _id: img.uploadedBy._id,
            firstName: img.uploadedBy.firstName,
            lastName: img.uploadedBy.lastName,
            email: img.uploadedBy.email
          } : null,
          uploadedAt: img.uploadedAt,
          createdAt: img.createdAt
        })),
        count: images.length
      }
    });
  } catch (error) {
    console.error("Get tournament images error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching tournament images",
      error: error.message
    });
  }
};

// Get matches for a volunteer's assigned tournaments (for image upload)
export const getVolunteerMatchesForImages = async (req, res) => {
  try {
    const { volunteerId } = req.params;

    // Get all tournaments the volunteer is assigned to
    const assignments = await VolunteerTournamentAssignment.find({ volunteerId });
    const tournamentIds = assignments.map(assignment => assignment.tournamentId);

    if (tournamentIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          matches: [],
          count: 0
        }
      });
    }

    // Get all matches within those tournaments
    const matches = await Match.find({ tournamentId: { $in: tournamentIds } })
      .populate('tournamentId', 'name startDate endDate')
      .populate('teamAId', 'teamName')
      .populate('teamBId', 'teamName')
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      data: {
        matches: matches.map(match => ({
          _id: match._id,
          tournamentId: match.tournamentId._id,
          tournamentName: match.tournamentId.name,
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
    console.error("Get volunteer matches for images error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching volunteer matches",
      error: error.message
    });
  }
};

// Get all match images (for gallery)
export const getAllMatchImages = async (req, res) => {
  try {
    const { limit = 100, tournamentId } = req.query;

    let query = {};
    if (tournamentId) {
      query.tournamentId = tournamentId;
    }

    const images = await MatchImage.find(query)
      .populate({
        path: 'matchId',
        select: 'teamAId teamBId fieldName startTime status',
        populate: [
          { path: 'teamAId', select: 'teamName' },
          { path: 'teamBId', select: 'teamName' }
        ]
      })
      .populate('uploadedBy', 'firstName lastName email')
      .populate('tournamentId', 'name startDate endDate location division')
      .sort({ uploadedAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        images: images.map(img => ({
          _id: img._id,
          matchId: img.matchId?._id || null,
          match: img.matchId ? {
            _id: img.matchId._id,
            teamA: img.matchId.teamAId ? {
              _id: img.matchId.teamAId._id,
              teamName: img.matchId.teamAId.teamName
            } : null,
            teamB: img.matchId.teamBId ? {
              _id: img.matchId.teamBId._id,
              teamName: img.matchId.teamBId.teamName
            } : null,
            fieldName: img.matchId.fieldName,
            startTime: img.matchId.startTime,
            status: img.matchId.status
          } : null,
          tournamentId: img.tournamentId._id,
          tournament: {
            _id: img.tournamentId._id,
            name: img.tournamentId.name,
            startDate: img.tournamentId.startDate,
            endDate: img.tournamentId.endDate,
            location: img.tournamentId.location,
            division: img.tournamentId.division
          },
          imageUrl: img.imageUrl,
          caption: img.caption,
          uploadedBy: img.uploadedBy ? {
            _id: img.uploadedBy._id,
            firstName: img.uploadedBy.firstName,
            lastName: img.uploadedBy.lastName,
            email: img.uploadedBy.email
          } : null,
          uploadedAt: img.uploadedAt,
          createdAt: img.createdAt
        })),
        count: images.length
      }
    });
  } catch (error) {
    console.error("Get all match images error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching images",
      error: error.message
    });
  }
};

// Delete a match image
export const deleteMatchImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { volunteerId } = req.body;

    const image = await MatchImage.findById(imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found"
      });
    }

    // Verify volunteer uploaded this image or is assigned to the tournament
    if (volunteerId && image.uploadedBy?.toString() !== volunteerId) {
      const assignment = await VolunteerTournamentAssignment.findOne({
        volunteerId,
        tournamentId: image.tournamentId
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to delete this image"
        });
      }
    }

    // Delete file from filesystem (optional - you may want to keep files)
    // For now, we'll just delete from database

    await MatchImage.findByIdAndDelete(imageId);

    res.status(200).json({
      success: true,
      message: "Image deleted successfully"
    });
  } catch (error) {
    console.error("Delete match image error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting image",
      error: error.message
    });
  }
};

