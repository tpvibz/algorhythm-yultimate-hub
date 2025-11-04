import Team from "../models/teamModel.js";
import Person from "../models/personModel.js";
import PlayerProfile from "../models/playerProfileModel.js";
import Match from "../models/matchModel.js";
import TeamRoster from "../models/teamRosterModel.js";
import Tournament from "../models/tournamentModel.js";
import SpiritSubmission from "../models/spiritSubmissionModel.js";
import PlayerMatchFeedback from "../models/playerMatchFeedbackModel.js";
import MatchAttendance from "../models/matchAttendanceModel.js";
import { createNotification, createNotificationsForUsers } from "./notificationController.js";

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

    // Check if coach has incomplete feedback for any completed matches (not just tournaments)
    const teams = await Team.find({ coachId });
    if (teams.length > 0) {
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
        .sort({ startTime: -1 });

      // Check each completed match for incomplete feedback
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
          const tournamentName = match.tournamentId?.name || 'a match';
          return res.status(403).json({
            message: `You must submit feedback after each completed match. Please submit spirit score for the match in "${tournamentName}" before registering for a new tournament.`
          });
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
            const tournamentName = match.tournamentId?.name || 'a match';
            return res.status(403).json({
              message: `You must submit feedback after each completed match. Please submit player feedback for all players who participated in the match from "${tournamentName}" before registering for a new tournament.`
            });
          }
        }
      }
    }

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

    // Get tournament details
    const tournament = tournamentId ? await Tournament.findById(tournamentId).select('name') : null;

    // Notify coach about team creation
    try {
      await createNotification(
        coachId,
        "player_assigned",
        "Team Created",
        tournament 
          ? `Your team "${teamName}" has been registered for ${tournament.name}.`
          : `Your team "${teamName}" has been created.`,
        { relatedEntityId: team._id, relatedEntityType: "team" }
      );
    } catch (notificationError) {
      console.error("Error creating notification for team creation:", notificationError);
    }

    // Notify players about team assignment
    if (players && Array.isArray(players) && players.length > 0) {
      const playerIds = players.map(p => p.playerId || p._id).filter(id => id);
      if (playerIds.length > 0) {
        try {
          await createNotificationsForUsers(
            playerIds,
            "coach_assigned",
            "Team Assignment",
            tournament
              ? `You have been added to team "${teamName}" for ${tournament.name}.`
              : `You have been added to team "${teamName}".`,
            { relatedEntityId: team._id, relatedEntityType: "team" }
          );
        } catch (notificationError) {
          console.error("Error creating notifications for players:", notificationError);
        }
      }
    }

    // Notify admins about team registration if tournament is provided
    if (tournamentId && tournament) {
      try {
        const admins = await Person.find({ roles: { $in: ["admin"] } });
        const adminIds = admins.map(admin => admin._id);
        
        if (adminIds.length > 0) {
          await createNotificationsForUsers(
            adminIds,
            "tournament_registration",
            "Team Registered",
            `Coach ${coach.firstName} ${coach.lastName} has registered team "${teamName}" for ${tournament.name}.`,
            { relatedEntityId: tournamentId, relatedEntityType: "tournament" }
          );
        }
      } catch (notificationError) {
        console.error("Error creating notifications for admins:", notificationError);
      }
    }

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

// Get all teams with wins/losses and player names
export const getAllTeams = async (req, res) => {
  try {
    // Get all teams
    const teams = await Team.find().sort({ teamName: 1 });
    
    // Get all completed matches
    const completedMatches = await Match.find({
      status: 'completed'
    }).populate('teamAId', 'teamName').populate('teamBId', 'teamName');

    // Calculate wins and losses for each team
    const teamStats = {};
    
    // Initialize stats for all teams
    teams.forEach(team => {
      teamStats[team._id.toString()] = {
        wins: 0,
        losses: 0
      };
    });

    // Calculate wins/losses from matches
    completedMatches.forEach(match => {
      if (!match.teamAId || !match.teamBId) return;
      
      const teamAId = match.teamAId._id.toString();
      const teamBId = match.teamBId._id.toString();

      if (match.winnerTeamId) {
        const winnerId = match.winnerTeamId.toString();
        
        // Update team A stats
        if (teamStats[teamAId]) {
          if (teamAId === winnerId) {
            teamStats[teamAId].wins += 1;
          } else {
            teamStats[teamAId].losses += 1;
          }
        }
        
        // Update team B stats
        if (teamStats[teamBId]) {
          if (teamBId === winnerId) {
            teamStats[teamBId].wins += 1;
          } else {
            teamStats[teamBId].losses += 1;
          }
        }
      }
    });

    // Prepare response with team details
    const teamsWithStats = await Promise.all(teams.map(async (team) => {
      // Get player names from TeamRoster
      const rosterPlayers = await TeamRoster.find({ 
        teamId: team._id,
        status: 'active'
      }).populate('playerId', 'firstName lastName');

      // Get player names
      const playerNames = [];
      
      // Add players from TeamRoster
      rosterPlayers.forEach(roster => {
        if (roster.playerId) {
          playerNames.push(`${roster.playerId.firstName} ${roster.playerId.lastName}`);
        }
      });

      // Add legacy players from team.players array if they exist and not already included
      if (team.players && Array.isArray(team.players)) {
        team.players.forEach(player => {
          if (player.name && !playerNames.includes(player.name)) {
            playerNames.push(player.name);
          }
        });
      }

      const stats = teamStats[team._id.toString()] || { wins: 0, losses: 0 };

      return {
        teamName: team.teamName,
        players: playerNames,
        wins: stats.wins,
        losses: stats.losses
      };
    }));

    res.status(200).json({
      success: true,
      data: {
        teams: teamsWithStats,
        count: teamsWithStats.length
      }
    });
  } catch (error) {
    console.error("Get all teams error:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

export default { createTeam, getMyTeams, getAllTeams };
