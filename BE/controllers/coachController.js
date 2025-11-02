import mongoose from "mongoose";
import Person from "../models/personModel.js";
import PlayerProfile from "../models/playerProfileModel.js";

/* 👨‍🎓 GET ASSIGNED STUDENTS FOR A COACH */
export const getAssignedStudents = async (req, res) => {
  try {
    const { coachId } = req.params;

    if (!coachId) {
      return res.status(400).json({ message: "Coach ID is required" });
    }

    // Verify coach exists
    const coach = await Person.findById(coachId);
    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }

    // Convert coachId to ObjectId if it's a valid ObjectId string
    let coachObjectId = coachId;
    if (mongoose.Types.ObjectId.isValid(coachId)) {
      coachObjectId = new mongoose.Types.ObjectId(coachId);
    }

    // Find all PlayerProfiles assigned to this coach
    const playerProfiles = await PlayerProfile.find({
      assignedCoachId: coachObjectId
    }).populate({
      path: "personId",
      select: "firstName lastName email uniqueUserId"
    });

    // Format the response to include player info and profile details
    const students = playerProfiles
      .filter(profile => profile.personId) // Filter out any null references
      .map(profile => ({
        _id: profile.personId._id.toString(),
        firstName: profile.personId.firstName,
        lastName: profile.personId.lastName,
        email: profile.personId.email,
        uniqueUserId: profile.personId.uniqueUserId,
        age: profile.age,
        gender: profile.gender,
        experience: profile.experience,
      }));

    res.status(200).json(students);
  } catch (error) {
    console.error("Get assigned students error:", error);
    res.status(500).json({ message: "Failed to fetch assigned students", error: error.message });
  }
};

