import School from "../models/schoolModel.js";
import PlayerProfile from "../models/playerProfileModel.js";
import CoachProfile from "../models/coachProfileModel.js";
import Person from "../models/personModel.js";

// Get all schools
export const getAllSchools = async (req, res) => {
  try {
    const schools = await School.find({ type: "school" }).sort({ name: 1 });
    res.status(200).json(schools);
  } catch (error) {
    console.error("Get schools error:", error);
    res.status(500).json({ message: "Failed to fetch schools", error: error.message });
  }
};

// Get all communities
export const getAllCommunities = async (req, res) => {
  try {
    const communities = await School.find({ type: "community" }).sort({ name: 1 });
    res.status(200).json(communities);
  } catch (error) {
    console.error("Get communities error:", error);
    res.status(500).json({ message: "Failed to fetch communities", error: error.message });
  }
};

// Get all institutions (both schools and communities)
export const getAllInstitutions = async (req, res) => {
  try {
    const institutions = await School.find().sort({ type: 1, name: 1 });
    res.status(200).json(institutions);
  } catch (error) {
    console.error("Get institutions error:", error);
    res.status(500).json({ message: "Failed to fetch institutions", error: error.message });
  }
};

// Get institution by ID
export const getInstitutionById = async (req, res) => {
  try {
    const { id } = req.params;
    const institution = await School.findById(id);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }
    res.status(200).json(institution);
  } catch (error) {
    console.error("Get institution error:", error);
    res.status(500).json({ message: "Failed to fetch institution", error: error.message });
  }
};

// Create a new institution (school or community)
export const createInstitution = async (req, res) => {
  try {
    const { name, location, type, description, contactEmail, contactPhone } = req.body;

    if (!name || !location || !type) {
      return res.status(400).json({ message: "Name, location, and type are required" });
    }

    if (!["school", "community"].includes(type)) {
      return res.status(400).json({ message: "Type must be either 'school' or 'community'" });
    }

    const institution = new School({
      name,
      location,
      type,
      description,
      contactEmail,
      contactPhone,
    });

    await institution.save();
    res.status(201).json({ message: "Institution created successfully", institution });
  } catch (error) {
    console.error("Create institution error:", error);
    res.status(500).json({ message: "Failed to create institution", error: error.message });
  }
};

// Update institution
export const updateInstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const institution = await School.findByIdAndUpdate(id, updates, { new: true });
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    res.status(200).json({ message: "Institution updated successfully", institution });
  } catch (error) {
    console.error("Update institution error:", error);
    res.status(500).json({ message: "Failed to update institution", error: error.message });
  }
};

// Add coach to institution
export const addCoachToInstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const { coachId } = req.body;

    if (!coachId) {
      return res.status(400).json({ message: "Coach ID is required" });
    }

    const institution = await School.findById(id);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    // Check if coach exists and has coach role
    const coach = await Person.findById(coachId);
    if (!coach || !coach.roles.includes("coach")) {
      return res.status(400).json({ message: "Invalid coach ID" });
    }

    // Add coach if not already added
    if (!institution.coachIds.includes(coachId)) {
      institution.coachIds.push(coachId);
      await institution.save();
    }

    res.status(200).json({ message: "Coach added to institution", institution });
  } catch (error) {
    console.error("Add coach to institution error:", error);
    res.status(500).json({ message: "Failed to add coach", error: error.message });
  }
};

// Get coaches by institution (same affiliation)
export const getCoachesByInstitution = async (req, res) => {
  try {
    const { institutionId } = req.params;

    const institution = await School.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    // Get all coaches linked to this institution
    const coaches = await Person.find({
      _id: { $in: institution.coachIds },
      roles: "coach",
    })
      .select("firstName lastName email uniqueUserId")
      .populate({
        path: "_id",
        select: "firstName lastName email",
      });

    res.status(200).json(coaches);
  } catch (error) {
    console.error("Get coaches by institution error:", error);
    res.status(500).json({ message: "Failed to fetch coaches", error: error.message });
  }
};

// Get players by coach with affiliation info
export const getPlayersByCoachWithAffiliation = async (req, res) => {
  try {
    const { coachId } = req.params;

    const playerProfiles = await PlayerProfile.find({ assignedCoachId: coachId })
      .populate("personId", "firstName lastName email uniqueUserId")
      .populate("affiliation.id", "name location type");

    const players = playerProfiles.map((profile) => ({
      _id: profile.personId._id,
      firstName: profile.personId.firstName,
      lastName: profile.personId.lastName,
      name: `${profile.personId.firstName} ${profile.personId.lastName}`,
      email: profile.personId.email,
      uniqueUserId: profile.personId.uniqueUserId,
      affiliation: profile.affiliation || null,
    }));

    res.status(200).json(players);
  } catch (error) {
    console.error("Get players by coach error:", error);
    res.status(500).json({ message: "Failed to fetch players", error: error.message });
  }
};

