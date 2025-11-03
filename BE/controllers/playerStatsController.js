import PlayerMatchStats from "../models/playerMatchStatsModel.js";
import Match from "../models/matchModel.js";
import Team from "../models/teamModel.js";

// Volunteer: submit stats for players of a completed match
export const submitMatchPlayerStats = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { stats, volunteerId } = req.body;
    // stats: Array<{ playerId, teamId, ratings, points?, assists?, blocks?, remark? }>

    const match = await Match.findById(matchId).populate("tournamentId", "_id");
    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }
    if (match.status !== "completed") {
      return res.status(400).json({ success: false, message: "Stats can only be submitted for completed matches" });
    }

    if (!Array.isArray(stats) || stats.length === 0) {
      return res.status(400).json({ success: false, message: "No stats provided" });
    }

    const bulk = stats.map((entry) => ({
      updateOne: {
        filter: { matchId, playerId: entry.playerId },
        update: {
          $set: {
            matchId,
            tournamentId: match.tournamentId,
            teamId: entry.teamId,
            playerId: entry.playerId,
            ratings: {
              overall: entry?.ratings?.overall,
              offense: entry?.ratings?.offense ?? 5,
              defense: entry?.ratings?.defense ?? 5,
              spirit: entry?.ratings?.spirit ?? 5,
              throws: entry?.ratings?.throws ?? 5,
              cuts: entry?.ratings?.cuts ?? 5,
            },
            points: typeof entry.points === 'number' ? entry.points : 0,
            assists: typeof entry.assists === 'number' ? entry.assists : 0,
            blocks: typeof entry.blocks === 'number' ? entry.blocks : 0,
            remark: entry.remark || "",
            submittedBy: volunteerId,
          },
        },
        upsert: true,
      },
    }));

    await PlayerMatchStats.bulkWrite(bulk);

    return res.status(200).json({ success: true, message: "Player stats submitted" });
  } catch (error) {
    console.error("Submit player stats error:", error);
    return res.status(500).json({ success: false, message: "Server error while submitting stats", error: error.message });
  }
};

// Volunteer: submit stats for a specific team in a match
export const submitTeamMatchPlayerStats = async (req, res) => {
  try {
    const { matchId, teamId } = req.params;
    const { stats, volunteerId } = req.body;

    const match = await Match.findById(matchId).populate("tournamentId", "_id status");
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });
    if (match.status !== "completed") return res.status(400).json({ success: false, message: "Stats only for completed matches" });
    if (!Array.isArray(stats) || stats.length === 0) return res.status(400).json({ success: false, message: "No stats provided" });

    const bulk = stats.map((entry) => ({
      updateOne: {
        filter: { matchId, playerId: entry.playerId },
        update: {
          $set: {
            matchId,
            tournamentId: match.tournamentId,
            teamId,
            playerId: entry.playerId,
            ratings: {
              overall: entry?.ratings?.overall,
              offense: entry?.ratings?.offense ?? 5,
              defense: entry?.ratings?.defense ?? 5,
              spirit: entry?.ratings?.spirit ?? 5,
              throws: entry?.ratings?.throws ?? 5,
              cuts: entry?.ratings?.cuts ?? 5,
            },
            points: typeof entry.points === 'number' ? entry.points : 0,
            assists: typeof entry.assists === 'number' ? entry.assists : 0,
            blocks: typeof entry.blocks === 'number' ? entry.blocks : 0,
            remark: entry.remark || "",
            submittedBy: volunteerId,
          },
        },
        upsert: true,
      },
    }));

    await PlayerMatchStats.bulkWrite(bulk);
    return res.status(200).json({ success: true, message: "Team player stats submitted" });
  } catch (error) {
    console.error("Submit team player stats error:", error);
    return res.status(500).json({ success: false, message: "Server error while submitting team stats", error: error.message });
  }
};

// Coach: view player stats for a match (for their team only)
export const getTeamMatchPlayerStats = async (req, res) => {
  try {
    const { matchId, teamId } = req.params;
    const stats = await PlayerMatchStats.find({ matchId, teamId })
      .populate("playerId", "firstName lastName email")
      .sort({ createdAt: 1 });
    return res.status(200).json({ success: true, data: { stats } });
  } catch (error) {
    console.error("Get team match player stats error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Player: view all their stats (optionally by tournament)
export const getPlayerStats = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { tournamentId } = req.query;
    const filter = { playerId };
    if (tournamentId) filter.tournamentId = tournamentId;

    const stats = await PlayerMatchStats.find(filter)
      .populate("matchId", "startTime status fieldName teamAId teamBId")
      .populate("tournamentId", "name startDate endDate location")
      .populate("teamId", "teamName")
      .populate("playerId", "firstName lastName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: { stats } });
  } catch (error) {
    console.error("Get player stats error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


