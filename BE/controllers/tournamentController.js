import Tournament from "../models/tournamentModel.js";
import cloudinary from "../config/cloudinary.js";
import Person from "../models/personModel.js";
import { validationResult } from "express-validator";

// Create a new tournament
export const createTournament = async (req, res) => {
  try {
    console.log('Received tournament creation request');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    // Check for validation errors (already handled by middleware, but double-check)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    // Validate required fields
    if (!req.body.name || !req.body.startDate || !req.body.endDate || !req.body.location || 
        !req.body.maxTeams || !req.body.division || !req.body.format || !req.body.description || 
        !req.body.rules || !req.body.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    const { 
      name, 
      startDate, 
      endDate, 
      location, 
      maxTeams, 
      division, 
      format, 
      prizePool, 
      description, 
      rules, 
      registrationDeadline 
    } = req.body;
    
    // For now, using a dummy admin ID. In real app, get from JWT token
    // We'll make this optional until authentication is fully implemented
    let createdBy = null;
    
    // Try to find the first person with admin role, or create a temporary one
    const adminUser = await Person.findOne({ roles: { $in: ['admin'] } });
    if (adminUser) {
      createdBy = adminUser._id;
    }

    // Handle image (upload to Cloudinary if provided)
    let imageUrl = null;
    if (req.file) {
      const folder = "algorhythm/tournaments";
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: "image" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
      imageUrl = uploadResult.secure_url || uploadResult.url;
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const deadline = new Date(registrationDeadline);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || isNaN(deadline.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format provided"
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date"
      });
    }

    if (deadline >= start) {
      return res.status(400).json({
        success: false,
        message: "Registration deadline must be before start date"
      });
    }

    // Create tournament
    const tournament = await Tournament.create({
      name: name.trim(),
      startDate: start,
      endDate: end,
      location: location.trim(),
      maxTeams: parseInt(maxTeams),
      division: division.trim(),
      format: format.trim(),
      prizePool: prizePool ? prizePool.trim() : undefined,
      description: description.trim(),
      rules: rules.trim(),
      registrationDeadline: deadline,
      image: imageUrl || null,
      imageData: undefined,
      imageContentType: undefined,
      createdBy
    });

    const tournamentResponse = {
      _id: tournament._id,
      name: tournament.name,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      location: tournament.location,
      maxTeams: tournament.maxTeams,
      division: tournament.division,
      format: tournament.format,
      prizePool: tournament.prizePool,
      description: tournament.description,
      rules: tournament.rules,
      registrationDeadline: tournament.registrationDeadline,
      image: tournament.image || null,
      status: tournament.status,
      registeredTeams: tournament.registeredTeams || [],
      availableSpots: tournament.availableSpots,
      isFull: tournament.isFull,
      registrationOpen: tournament.registrationOpen,
      createdAt: tournament.createdAt
    };

    res.status(201).json({
      success: true,
      message: "Tournament created successfully",
      data: {
        tournament: tournamentResponse
      }
    });

  } catch (error) {
    console.error("Tournament creation error:", error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A tournament with this name already exists"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Server error during tournament creation",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all tournaments
export const getAllTournaments = async (req, res) => {
  try {
    const { status, format, limit = 10, page = 1 } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (format) filter.format = format;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tournaments = await Tournament.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Tournament.countDocuments(filter);

    const tournamentData = tournaments.map(tournament => ({
      _id: tournament._id,
      name: tournament.name,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      location: tournament.location,
      maxTeams: tournament.maxTeams,
      division: tournament.division,
      format: tournament.format,
      prizePool: tournament.prizePool,
      description: tournament.description,
      rules: tournament.rules,
      registrationDeadline: tournament.registrationDeadline,
      image: tournament.image || null,
      status: tournament.status,
      registeredTeams: tournament.registeredTeams || [], // Ensure it's always an array
      availableSpots: tournament.availableSpots,
      isFull: tournament.isFull,
      registrationOpen: tournament.registrationOpen,
      createdBy: tournament.createdBy,
      createdAt: tournament.createdAt
    }));

    res.status(200).json({
      success: true,
      data: {
        tournaments: tournamentData,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error("Get tournaments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching tournaments",
      error: error.message
    });
  }
};

// Get tournament by ID
export const getTournamentById = async (req, res) => {
  try {
    const { id } = req.params;

    const tournament = await Tournament.findById(id)
      .populate('createdBy', 'firstName lastName email');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found"
      });
    }

    const tournamentResponse = {
      _id: tournament._id,
      name: tournament.name,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      location: tournament.location,
      maxTeams: tournament.maxTeams,
      division: tournament.division,
      format: tournament.format,
      prizePool: tournament.prizePool,
      description: tournament.description,
      rules: tournament.rules,
      registrationDeadline: tournament.registrationDeadline,
      image: tournament.image || null,
      status: tournament.status,
      registeredTeams: tournament.registeredTeams,
      availableSpots: tournament.availableSpots,
      isFull: tournament.isFull,
      registrationOpen: tournament.registrationOpen,
      createdBy: tournament.createdBy,
      createdAt: tournament.createdAt,
      updatedAt: tournament.updatedAt
    };

    res.status(200).json({
      success: true,
      data: {
        tournament: tournamentResponse
      }
    });

  } catch (error) {
    console.error("Get tournament error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching tournament",
      error: error.message
    });
  }
};

// Update tournament
export const updateTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.createdBy;
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;

    // If new image uploaded, replace imageData and contentType
    if (req.file) {
      updates.imageData = req.file.buffer;
      updates.imageContentType = req.file.mimetype;
      // normalize path-based image field
      updates.image = null;
    }

    const tournament = await Tournament.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found"
      });
    }

    const tournamentResponse = {
      _id: tournament._id,
      name: tournament.name,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      location: tournament.location,
      maxTeams: tournament.maxTeams,
      division: tournament.division,
      format: tournament.format,
      prizePool: tournament.prizePool,
      description: tournament.description,
      rules: tournament.rules,
      registrationDeadline: tournament.registrationDeadline,
      image: tournament.imageData ? `/api/tournaments/${tournament._id}/image` : null,
      status: tournament.status,
      registeredTeams: tournament.registeredTeams,
      availableSpots: tournament.availableSpots,
      isFull: tournament.isFull,
      registrationOpen: tournament.registrationOpen,
      createdBy: tournament.createdBy,
      createdAt: tournament.createdAt,
      updatedAt: tournament.updatedAt
    };

    res.status(200).json({
      success: true,
      message: "Tournament updated successfully",
      data: {
        tournament: tournamentResponse
      }
    });

  } catch (error) {
    console.error("Update tournament error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating tournament",
      error: error.message
    });
  }
};

// Delete tournament
export const deleteTournament = async (req, res) => {
  try {
    const { id } = req.params;

    const tournament = await Tournament.findByIdAndDelete(id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Tournament deleted successfully"
    });

  } catch (error) {
    console.error("Delete tournament error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting tournament",
      error: error.message
    });
  }
};

// Serve tournament image binary from MongoDB
export const getTournamentImage = async (req, res) => {
  try {
    const { id } = req.params;
    const tournament = await Tournament.findById(id).select('imageData imageContentType');
    if (!tournament || !tournament.imageData) {
      return res.status(404).send('Image not found');
    }
    res.set('Content-Type', tournament.imageContentType || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(tournament.imageData);
  } catch (error) {
    console.error('Get tournament image error:', error);
    return res.status(500).send('Server error');
  }
};