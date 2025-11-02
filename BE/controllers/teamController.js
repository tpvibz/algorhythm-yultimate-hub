import Team from "../models/teamModel.js";
import Person from "../models/personModel.js";
import PlayerProfile from "../models/playerProfileModel.js";

// Create a new team (coach registers on behalf of a team)
export const createTeam = async (req, res) => {
  try {
    const {
      teamName,
      totalMembers,
      players,
      tournamentId,
      contactPhone,
      contactEmail,
      notes,
    } = req.body;

    // Basic validation
    if (!teamName || !totalMembers || !players || !Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ message: "teamName, totalMembers and players are required" });
    }

    // coachId should be available on req.user from auth middleware
    const coachId = req.user ? req.user.id : req.body.coachId;
    if (!coachId) return res.status(400).json({ message: "coachId not provided" });

    // Optionally verify coach exists
    const coach = await Person.findById(coachId);
    if (!coach) return res.status(404).json({ message: "Coach not found" });

    // Validate that all players are assigned to this coach
    if (players && Array.isArray(players) && players.length > 0) {
      const playerIds = players.map(p => p.playerId || p._id).filter(id => id);
      if (playerIds.length > 0) {
        const assignedPlayers = await PlayerProfile.find({
          assignedCoachId: coachId,
          personId: { $in: playerIds }
        }).select("personId");

        const assignedPlayerIds = assignedPlayers.map(ap => ap.personId.toString());
        const invalidPlayers = playerIds.filter(id => !assignedPlayerIds.includes(id.toString()));
        
        if (invalidPlayers.length > 0) {
          return res.status(400).json({ 
            message: "Some selected players are not assigned to you. Please select only players assigned to your coach account." 
          });
        }
      }
    }

    const team = new Team({
      teamName,
      totalMembers,
      players,
      tournamentId,
      coachId,
      contactPhone,
      contactEmail,
      notes,
    });

    await team.save();
    res.status(201).json({ message: "Team created", team });
  } catch (error) {
    console.error("Create team error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get teams for the logged-in coach
export const getMyTeams = async (req, res) => {
  try {
    const coachId = req.user ? req.user.id : req.query.coachId;
    if (!coachId) return res.status(400).json({ message: "coachId not provided" });

    const teams = await Team.find({ coachId }).sort({ createdAt: -1 });
    res.status(200).json(teams);
  } catch (error) {
    console.error("Get teams error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default { createTeam, getMyTeams };
