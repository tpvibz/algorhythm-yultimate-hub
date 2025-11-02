import VolunteerTournamentAssignment from "../models/volunteerTournamentAssignmentModel.js";
import Person from "../models/personModel.js";
import Tournament from "../models/tournamentModel.js";

// Get all volunteers (people with volunteer role)
export const getAllVolunteers = async (req, res) => {
  try {
    const volunteers = await Person.find({ roles: { $in: ["volunteer"] } })
      .select("firstName lastName email phone uniqueUserId roles accountStatus")
      .sort({ firstName: 1, lastName: 1 });

    res.status(200).json({
      success: true,
      data: {
        volunteers: volunteers.map(v => ({
          _id: v._id,
          firstName: v.firstName,
          lastName: v.lastName,
          email: v.email,
          phone: v.phone,
          uniqueUserId: v.uniqueUserId,
          roles: v.roles,
          accountStatus: v.accountStatus
        })),
        count: volunteers.length
      }
    });
  } catch (error) {
    console.error("Get all volunteers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching volunteers",
      error: error.message
    });
  }
};

// Assign volunteers to a tournament
export const assignVolunteersToTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { volunteerIds, role, notes } = req.body;

    if (!tournamentId) {
      return res.status(400).json({
        success: false,
        message: "Tournament ID is required"
      });
    }

    if (!volunteerIds || !Array.isArray(volunteerIds) || volunteerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one volunteer ID is required"
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

    // Verify all volunteers exist and have volunteer role
    const volunteers = await Person.find({
      _id: { $in: volunteerIds },
      roles: { $in: ["volunteer"] }
    });

    if (volunteers.length !== volunteerIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more volunteers not found or don't have volunteer role"
      });
    }

    // Create assignments (will skip duplicates due to unique index)
    const assignments = [];
    const errors = [];

    for (const volunteerId of volunteerIds) {
      try {
        const assignment = await VolunteerTournamentAssignment.findOneAndUpdate(
          { volunteerId, tournamentId },
          {
            volunteerId,
            tournamentId,
            role: role || "General Support",
            notes: notes || "",
            status: "assigned",
            assignedBy: req.user?.id || null
          },
          { upsert: true, new: true }
        ).populate("volunteerId", "firstName lastName email uniqueUserId");

        assignments.push(assignment);
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate assignment - already exists
          const existing = await VolunteerTournamentAssignment.findOne({ volunteerId, tournamentId })
            .populate("volunteerId", "firstName lastName email uniqueUserId");
          assignments.push(existing);
        } else {
          errors.push({ volunteerId, error: error.message });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully assigned ${assignments.length} volunteer(s) to tournament`,
      data: {
        assignments: assignments.map(a => ({
          _id: a._id,
          volunteer: {
            _id: a.volunteerId._id,
            firstName: a.volunteerId.firstName,
            lastName: a.volunteerId.lastName,
            email: a.volunteerId.email,
            uniqueUserId: a.volunteerId.uniqueUserId
          },
          tournamentId: a.tournamentId,
          role: a.role,
          status: a.status,
          notes: a.notes
        })),
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error("Assign volunteers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while assigning volunteers",
      error: error.message
    });
  }
};

// Unassign volunteer from tournament
export const unassignVolunteerFromTournament = async (req, res) => {
  try {
    const { tournamentId, volunteerId } = req.params;

    const assignment = await VolunteerTournamentAssignment.findOneAndDelete({
      volunteerId,
      tournamentId
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Volunteer unassigned successfully"
    });
  } catch (error) {
    console.error("Unassign volunteer error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while unassigning volunteer",
      error: error.message
    });
  }
};

// Get volunteers assigned to a tournament
export const getTournamentVolunteers = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const assignments = await VolunteerTournamentAssignment.find({ tournamentId })
      .populate("volunteerId", "firstName lastName email phone uniqueUserId")
      .populate("assignedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        assignments: assignments.map(a => ({
          _id: a._id,
          volunteer: {
            _id: a.volunteerId._id,
            firstName: a.volunteerId.firstName,
            lastName: a.volunteerId.lastName,
            email: a.volunteerId.email,
            phone: a.volunteerId.phone,
            uniqueUserId: a.volunteerId.uniqueUserId
          },
          role: a.role,
          status: a.status,
          notes: a.notes,
          assignedBy: a.assignedBy ? {
            _id: a.assignedBy._id,
            firstName: a.assignedBy.firstName,
            lastName: a.assignedBy.lastName
          } : null,
          assignedAt: a.createdAt
        })),
        count: assignments.length
      }
    });
  } catch (error) {
    console.error("Get tournament volunteers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching tournament volunteers",
      error: error.message
    });
  }
};

// Get tournaments assigned to a volunteer
export const getVolunteerTournaments = async (req, res) => {
  try {
    const { volunteerId } = req.params;

    // Verify volunteer exists
    const volunteer = await Person.findById(volunteerId);
    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer not found"
      });
    }

    const assignments = await VolunteerTournamentAssignment.find({ volunteerId })
      .populate("tournamentId")
      .populate("assignedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        volunteer: {
          _id: volunteer._id,
          firstName: volunteer.firstName,
          lastName: volunteer.lastName,
          email: volunteer.email,
          uniqueUserId: volunteer.uniqueUserId
        },
        tournaments: assignments.map(a => ({
          _id: a._id,
          tournament: {
            _id: a.tournamentId._id,
            name: a.tournamentId.name,
            startDate: a.tournamentId.startDate,
            endDate: a.tournamentId.endDate,
            location: a.tournamentId.location,
            format: a.tournamentId.format,
            division: a.tournamentId.division,
            status: a.tournamentId.status
          },
          role: a.role,
          status: a.status,
          notes: a.notes,
          assignedBy: a.assignedBy ? {
            _id: a.assignedBy._id,
            firstName: a.assignedBy.firstName,
            lastName: a.assignedBy.lastName
          } : null,
          assignedAt: a.createdAt
        })),
        count: assignments.length
      }
    });
  } catch (error) {
    console.error("Get volunteer tournaments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching volunteer tournaments",
      error: error.message
    });
  }
};

// Update assignment (role, status, notes)
export const updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { role, status, notes } = req.body;

    const assignment = await VolunteerTournamentAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    if (role) assignment.role = role;
    if (status) {
      if (!["assigned", "confirmed", "declined", "completed"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status"
        });
      }
      assignment.status = status;
    }
    if (notes !== undefined) assignment.notes = notes;

    await assignment.save();

    const updated = await VolunteerTournamentAssignment.findById(assignmentId)
      .populate("volunteerId", "firstName lastName email uniqueUserId")
      .populate("tournamentId", "name");

    res.status(200).json({
      success: true,
      message: "Assignment updated successfully",
      data: {
        assignment: {
          _id: updated._id,
          volunteer: {
            _id: updated.volunteerId._id,
            firstName: updated.volunteerId.firstName,
            lastName: updated.volunteerId.lastName,
            email: updated.volunteerId.email,
            uniqueUserId: updated.volunteerId.uniqueUserId
          },
          tournament: {
            _id: updated.tournamentId._id,
            name: updated.tournamentId.name
          },
          role: updated.role,
          status: updated.status,
          notes: updated.notes
        }
      }
    });
  } catch (error) {
    console.error("Update assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating assignment",
      error: error.message
    });
  }
};

