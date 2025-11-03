import axios from 'axios';

const API_BASE_URL = 'http://localhost:9000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token and language
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add language parameter from localStorage or URL
    const language = localStorage.getItem('app_language') || 
                     new URLSearchParams(window.location.search).get('lang') || 
                     'en';
    
    // Add language to query params if not already present
    if (!config.params) {
      config.params = {};
    }
    if (!config.params.lang) {
      config.params.lang = language;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Tournament interfaces
export interface Tournament {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  maxTeams: number;
  division: string;
  format: string;
  prizePool?: string;
  description?: string;
  rules: string;
  registrationDeadline: string;
  image?: string;
  status: 'draft' | 'open' | 'in-progress' | 'completed' | 'cancelled';
  registeredTeams: string[]; // Array of team IDs
  availableSpots: number;
  isFull: boolean;
  registrationOpen: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TournamentResponse {
  success: boolean;
  message?: string;
  data: {
    tournaments: Tournament[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface SingleTournamentResponse {
  success: boolean;
  message?: string;
  data: {
    tournament: Tournament;
  };
}

// Tournament API functions
export const tournamentAPI = {
  // Get all tournaments
  getAllTournaments: async (params?: {
    status?: string;
    format?: string;
    limit?: number;
    page?: number;
  }): Promise<TournamentResponse> => {
    const response = await api.get('/tournaments', { params });
    return response.data;
  },

  // Get tournament by ID
  getTournamentById: async (id: string): Promise<SingleTournamentResponse> => {
    const response = await api.get(`/tournaments/${id}`);
    return response.data;
  },

  // Create new tournament
  createTournament: async (formData: FormData): Promise<SingleTournamentResponse> => {
    const response = await api.post('/tournaments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update tournament
  updateTournament: async (id: string, formData: FormData): Promise<SingleTournamentResponse> => {
    const response = await api.put(`/tournaments/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete tournament
  deleteTournament: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/tournaments/${id}`);
    return response.data;
  },
};

// Team interfaces
export interface Team {
  _id: string;
  teamName: string;
  totalMembers: number;
  players: Array<{
    name: string;
    playerId: string;
    email?: string;
    age?: number;
    position?: string;
  }>;
  tournamentId: string;
  coachId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
}

export interface TeamsByTournamentResponse {
  success: boolean;
  message?: string;
  data: {
    tournament: {
      _id: string;
      name: string;
      format: string;
      startDate: string;
      endDate: string;
      location: string;
    };
    teams: Team[];
    teamCount: number;
  };
}

// Match interfaces
export interface Match {
  _id: string;
  tournamentId: string;
  fieldName?: string;
  teamA: {
    _id: string;
    teamName: string;
  };
  teamB: {
    _id: string;
    teamName: string;
  };
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'ongoing' | 'completed';
  score?: {
    teamA: number;
    teamB: number;
  };
  winnerTeamId?: string;
  round?: number;
  roundName?: string;
  bracketPosition?: number;
  matchNumber?: number;
  pool?: number;
  parentMatchAId?: string;
  parentMatchBId?: string;
}

export interface MatchesResponse {
  success: boolean;
  message?: string;
  data: {
    matches: Match[];
    matchCount: number;
  };
}

export interface GenerateScheduleResponse {
  success: boolean;
  message?: string;
  data: {
    tournamentId: string;
    tournamentName: string;
    format: string;
    matchCount: number;
    matches: Match[];
  };
}

// Schedule API functions
export const scheduleAPI = {
  // Get teams by tournament ID
  getTeamsByTournament: async (tournamentId: string): Promise<TeamsByTournamentResponse> => {
    const response = await api.get(`/schedule/tournaments/${tournamentId}/teams`);
    return response.data;
  },

  // Generate schedule for a tournament
  generateSchedule: async (
    tournamentId: string,
    options: {
      scheduleFormat?: string;
      poolsPerGroup?: number;
      matchDurationMinutes?: number;
    } = {}
  ): Promise<GenerateScheduleResponse> => {
    const response = await api.post(`/schedule/tournaments/${tournamentId}/generate`, options);
    return response.data;
  },

  // Get matches by tournament ID
  getMatchesByTournament: async (tournamentId: string): Promise<MatchesResponse> => {
    const response = await api.get(`/schedule/tournaments/${tournamentId}/matches`);
    return response.data;
  },

  // Update a single match
  updateMatch: async (
    matchId: string,
    updates: {
      fieldName?: string;
      startTime?: string;
      endTime?: string;
      status?: 'scheduled' | 'ongoing' | 'completed';
      score?: { teamA?: number; teamB?: number };
      winnerTeamId?: string | null;
    }
  ): Promise<{ success: boolean; message: string; data: { match: Match } }> => {
    const response = await api.put(`/schedule/matches/${matchId}`, updates);
    return response.data;
  },

  // Delete matches by tournament ID
  deleteMatchesByTournament: async (tournamentId: string): Promise<{ success: boolean; message: string; deletedCount: number }> => {
    const response = await api.delete(`/schedule/tournaments/${tournamentId}/matches`);
    return response.data;
  },
};

// Team API interfaces
export interface TeamWithStats {
  teamName: string;
  players: string[];
  wins: number;
  losses: number;
}

export interface AllTeamsResponse {
  success: boolean;
  message?: string;
  data: {
    teams: TeamWithStats[];
    count: number;
  };
}

// Team API functions
export const teamAPI = {
  // Get all teams with stats
  getAllTeams: async (): Promise<AllTeamsResponse> => {
    const response = await api.get('/teams');
    return response.data;
  },
};

// Volunteer interfaces
export interface Volunteer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  uniqueUserId?: string;
  roles: string[];
  accountStatus: string;
}

export interface VolunteerAssignment {
  _id: string;
  volunteer: Volunteer;
  tournament: Tournament;
  role: string;
  status: 'assigned' | 'confirmed' | 'declined' | 'completed';
  notes?: string;
  assignedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  assignedAt: string;
}

export interface VolunteersResponse {
  success: boolean;
  message?: string;
  data: {
    volunteers: Volunteer[];
    count: number;
  };
}

export interface TournamentVolunteersResponse {
  success: boolean;
  message?: string;
  data: {
    assignments: VolunteerAssignment[];
    count: number;
  };
}

export interface VolunteerTournamentsResponse {
  success: boolean;
  message?: string;
  data: {
    volunteer: Volunteer;
    tournaments: Array<{
      _id: string;
      tournament: Tournament;
      role: string;
      status: string;
      notes?: string;
      assignedBy?: {
        _id: string;
        firstName: string;
        lastName: string;
      };
      assignedAt: string;
    }>;
    count: number;
  };
}

// Volunteer API functions
export const volunteerAPI = {
  // Get all volunteers
  getAllVolunteers: async (): Promise<VolunteersResponse> => {
    const response = await api.get('/volunteers');
    return response.data;
  },

  // Get tournaments assigned to a volunteer
  getVolunteerTournaments: async (volunteerId: string): Promise<VolunteerTournamentsResponse> => {
    const response = await api.get(`/volunteers/${volunteerId}/tournaments`);
    return response.data;
  },

  // Assign volunteers to a tournament
  assignVolunteersToTournament: async (
    tournamentId: string,
    data: {
      volunteerIds: string[];
      role?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; message: string; data: { assignments: VolunteerAssignment[] } }> => {
    const response = await api.post(`/volunteers/tournaments/${tournamentId}/assign`, data);
    return response.data;
  },

  // Unassign volunteer from tournament
  unassignVolunteerFromTournament: async (
    tournamentId: string,
    volunteerId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/volunteers/tournaments/${tournamentId}/volunteers/${volunteerId}`);
    return response.data;
  },

  // Get volunteers assigned to a tournament
  getTournamentVolunteers: async (tournamentId: string): Promise<TournamentVolunteersResponse> => {
    const response = await api.get(`/volunteers/tournaments/${tournamentId}/volunteers`);
    return response.data;
  },

  // Update assignment
  updateAssignment: async (
    assignmentId: string,
    updates: {
      role?: string;
      status?: 'assigned' | 'confirmed' | 'declined' | 'completed';
      notes?: string;
    }
  ): Promise<{ success: boolean; message: string; data: { assignment: VolunteerAssignment } }> => {
    const response = await api.put(`/volunteers/assignments/${assignmentId}`, updates);
    return response.data;
  },
};

// Score Event interfaces
export interface ScoreEvent {
  _id: string;
  matchId: string;
  team: {
    _id: string;
    teamName: string;
  };
  player?: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
  points: number;
  timestamp: string;
}

export interface ScoreEventsResponse {
  success: boolean;
  message?: string;
  data: {
    scoreEvents: ScoreEvent[];
    count: number;
  };
}

// Score API functions
export const scoreAPI = {
  // Get matches for volunteer's assigned tournaments
  getVolunteerMatches: async (volunteerId: string): Promise<MatchesResponse> => {
    const response = await api.get(`/score/volunteers/${volunteerId}/matches`);
    return response.data;
  },

  // Record a score event (point scored)
  recordScoreEvent: async (
    matchId: string,
    data: {
      teamId: string;
      playerId?: string;
      points?: number;
      volunteerId?: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      scoreEvent: {
        _id: string;
        matchId: string;
        teamId: string;
        playerId?: string;
        points: number;
        timestamp: string;
      };
      match: Match;
    };
  }> => {
    const response = await api.post(`/score/matches/${matchId}/score`, data);
    return response.data;
  },

  // Get score events for a match
  getMatchScoreEvents: async (matchId: string): Promise<ScoreEventsResponse> => {
    const response = await api.get(`/score/matches/${matchId}/events`);
    return response.data;
  },

  // Update match score directly
  updateMatchScore: async (
    matchId: string,
    updates: {
      score?: { teamA?: number; teamB?: number };
      status?: 'scheduled' | 'ongoing' | 'completed';
      volunteerId?: string;
    }
  ): Promise<{ success: boolean; message: string; data: { match: Match } }> => {
    const response = await api.put(`/score/matches/${matchId}/score`, updates);
    return response.data;
  },
};

// Prediction interfaces
export interface Prediction {
  _id: string;
  matchId: string;
  userId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  predictedWinner: {
    _id: string;
    teamName: string;
  };
  predictedScore?: {
    teamA: number;
    teamB: number;
  };
  createdAt: string;
}

export interface PredictionStatistics {
  total: number;
  teamA: number;
  teamB: number;
  teamAPercentage: number;
  teamBPercentage: number;
}

export interface MatchPredictionsResponse {
  success: boolean;
  message?: string;
  data: {
    match: {
      teamA: {
        _id: string;
        teamName: string;
      };
      teamB: {
        _id: string;
        teamName: string;
      };
      status: string;
    };
    predictions: Prediction[];
    statistics: PredictionStatistics;
  };
}

// Prediction API functions
export const predictionAPI = {
  // Submit or update a prediction
  submitPrediction: async (
    matchId: string,
    data: {
      predictedWinnerId: string;
      predictedScore?: { teamA: number; teamB: number };
      userId?: string;
    }
  ): Promise<{ success: boolean; message: string; data: { prediction: Prediction } }> => {
    const response = await api.post(`/predictions/matches/${matchId}/predict`, data);
    return response.data;
  },

  // Get predictions for a match
  getMatchPredictions: async (matchId: string): Promise<MatchPredictionsResponse> => {
    const response = await api.get(`/predictions/matches/${matchId}/predictions`);
    return response.data;
  },

  // Get user's prediction for a match
  getUserPrediction: async (
    matchId: string,
    userId: string
  ): Promise<{ success: boolean; data: { prediction: Prediction | null } }> => {
    const response = await api.get(`/predictions/matches/${matchId}/users/${userId}/prediction`);
    return response.data;
  },

  // Delete a prediction
  deletePrediction: async (predictionId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/predictions/predictions/${predictionId}`);
    return response.data;
  },
};

// Leaderboard interfaces
export interface TeamStanding {
  teamId: string;
  teamName: string;
  rank: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  goalDifference: number;
  matchesPlayed: number;
  winPercentage: number;
  coach?: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface TournamentLeaderboard {
  tournament: {
    _id: string;
    name: string;
    startDate: string;
    endDate: string;
    location: string;
    division: string;
    format: string;
  };
  standings: TeamStanding[];
  totalTeams: number;
  completedMatches: number;
  totalMatches: number;
}

export interface LeaderboardResponse {
  success: boolean;
  data: TournamentLeaderboard;
}

export interface AllLeaderboardsResponse {
  success: boolean;
  data: {
    leaderboards: Array<{
      tournament: {
        _id: string;
        name: string;
        startDate: string;
        endDate: string;
        location: string;
        division: string;
        format: string;
        status: string;
      };
      standings: TeamStanding[];
      totalTeams: number;
    }>;
    count: number;
  };
}

// Leaderboard API functions
export const leaderboardAPI = {
  // Get leaderboard for a specific tournament
  getTournamentLeaderboard: async (tournamentId: string): Promise<LeaderboardResponse> => {
    const response = await api.get(`/leaderboard/tournaments/${tournamentId}`);
    return response.data;
  },

  // Get overview of all tournament leaderboards
  getAllLeaderboards: async (): Promise<AllLeaderboardsResponse> => {
    const response = await api.get(`/leaderboard`);
    return response.data;
  },
};

// Match Image interfaces
export interface MatchImage {
  _id: string;
  matchId: string | null;
  match?: {
    _id: string;
    teamA?: {
      _id: string;
      teamName: string;
    } | null;
    teamB?: {
      _id: string;
      teamName: string;
    } | null;
    fieldName?: string;
    startTime?: string;
    status?: string;
  } | null;
  tournamentId: string;
  tournament?: {
    _id: string;
    name: string;
    startDate: string;
    endDate: string;
    location: string;
    division: string;
  };
  tournamentName?: string;
  imageUrl: string;
  caption: string;
  uploadedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  uploadedAt: string;
  createdAt: string;
}

export interface MatchImagesResponse {
  success: boolean;
  data: {
    images: MatchImage[];
    count: number;
  };
}

// Match Image API functions
export const matchImageAPI = {
  // Upload image for a match
  uploadMatchImage: async (
    matchId: string,
    imageFile: File,
    data: { caption?: string; volunteerId?: string }
  ): Promise<{ success: boolean; message: string; data: { image: MatchImage } }> => {
    const formData = new FormData();
    formData.append("image", imageFile);
    if (data.caption) formData.append("caption", data.caption);
    if (data.volunteerId) formData.append("volunteerId", data.volunteerId);

    const response = await api.post(`/match-images/matches/${matchId}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Get all images for a match
  getMatchImages: async (matchId: string): Promise<MatchImagesResponse> => {
    const response = await api.get(`/match-images/matches/${matchId}/images`);
    return response.data;
  },

  // Get all images for a tournament
  getTournamentImages: async (tournamentId: string): Promise<MatchImagesResponse> => {
    const response = await api.get(`/match-images/tournaments/${tournamentId}/images`);
    return response.data;
  },

  // Get matches for volunteer's assigned tournaments
  getVolunteerMatchesForImages: async (volunteerId: string): Promise<MatchesResponse> => {
    const response = await api.get(`/match-images/volunteers/${volunteerId}/matches`);
    return response.data;
  },

  // Delete a match image
  deleteMatchImage: async (imageId: string, volunteerId?: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/match-images/images/${imageId}`, {
      data: { volunteerId },
    });
    return response.data;
  },

  // Get all match images (for gallery)
  getAllMatchImages: async (tournamentId?: string): Promise<MatchImagesResponse> => {
    const url = tournamentId 
      ? `/match-images?tournamentId=${tournamentId}`
      : `/match-images`;
    const response = await api.get(url);
    return response.data;
  },
};

// Match Attendance interfaces
export interface MatchPlayer {
  _id?: string;
  playerId?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  uniqueUserId?: string;
  jerseyNumber?: number;
  attendance?: {
    status: 'present' | 'absent' | 'late';
    recordedAt: string;
    recordedBy: string;
  } | null;
}

export interface MatchPlayersResponse {
  success: boolean;
  message?: string;
  data: {
    match: {
      _id: string;
      teamA: {
        _id: string;
        teamName: string;
      };
      teamB: {
        _id: string;
        teamName: string;
      };
      startTime: string;
      status: string;
    };
    teamAPlayers: MatchPlayer[];
    teamBPlayers: MatchPlayer[];
  };
}

export interface MatchAttendanceStatusResponse {
  success: boolean;
  message?: string;
  data: {
    match: {
      _id: string;
      teamA: {
        _id: string;
        teamName: string;
      };
      teamB: {
        _id: string;
        teamName: string;
      };
    };
    attendance: {
      isComplete: boolean;
      totalPlayers: number;
      attendanceCount: number;
      presentCount: number;
      absentCount: number;
      lateCount: number;
      percentage: number;
    };
  };
}

export interface MatchAttendanceRecord {
  _id: string;
  matchId: string;
  player: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    uniqueUserId: string;
  };
  team: {
    _id: string;
    teamName: string;
  };
  status: 'present' | 'absent' | 'late';
  recordedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  recordedAt: string;
  createdAt: string;
}

export interface MatchAttendanceResponse {
  success: boolean;
  message?: string;
  data: {
    attendance: MatchAttendanceRecord[];
    count: number;
  };
}

// Match Attendance API functions
export const matchAttendanceAPI = {
  // Get all players for a match (from both teams)
  getMatchPlayers: async (matchId: string): Promise<MatchPlayersResponse> => {
    const response = await api.get(`/match-attendance/matches/${matchId}/players`);
    return response.data;
  },

  // Check attendance status for a match
  checkAttendanceStatus: async (matchId: string): Promise<MatchAttendanceStatusResponse> => {
    const response = await api.get(`/match-attendance/matches/${matchId}/status`);
    return response.data;
  },

  // Get attendance records for a match
  getMatchAttendance: async (matchId: string): Promise<MatchAttendanceResponse> => {
    const response = await api.get(`/match-attendance/matches/${matchId}/attendance`);
    return response.data;
  },

  // Mark attendance for players in a match
  markMatchAttendance: async (
    matchId: string,
    data: {
      attendanceData: Array<{
        playerId: string;
        teamId: string;
        status: 'present' | 'absent' | 'late';
      }>;
      volunteerId: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      success: number;
      failed: number;
      results: Array<{
        playerId: string;
        playerName: string;
        status: string;
        attendanceId: string;
      }>;
      errors?: Array<{ playerId: string; error: string }>;
    };
  }> => {
    const response = await api.post(`/match-attendance/matches/${matchId}/attendance`, data);
    return response.data;
  },
};

// Authentication API functions
export const authAPI = {
  // Get pending account requests
  getPendingRequests: async () => {
    const response = await api.get('/auth/requests');
    return response.data;
  },

  // Approve player request
  approvePlayer: async (requestId: string, coachId?: string) => {
    const response = await api.post('/auth/approve/player', { requestId, coachId });
    return response.data;
  },

  // Get active coaches
  getActiveCoaches: async () => {
    const response = await api.get('/auth/coaches/active');
    return response.data;
  },

  // Reject player request
  rejectPlayer: async (requestId: string) => {
    const response = await api.post('/auth/reject/player', { requestId });
    return response.data;
  },
};

// Feedback interfaces
export interface MatchNeedingFeedback {
  matchId: string;
  matchNumber?: number;
  roundName?: string;
  startTime: string;
  fieldName?: string;
  tournament: {
    _id: string;
    name: string;
    startDate: string;
    endDate: string;
    location: string;
  } | null;
  team: {
    _id: string;
    teamName: string;
  };
  opponentTeam: {
    _id: string;
    teamName: string;
  } | null;
  spiritScoreSubmitted: boolean;
  playerFeedbackSubmitted: boolean;
  playersNeedingFeedback: number;
  totalPlayersAttended: number;
  score: {
    teamA: number;
    teamB: number;
  } | null;
}

export interface MatchesNeedingFeedbackResponse {
  success: boolean;
  data: {
    matches: MatchNeedingFeedback[];
    count: number;
  };
}

// Legacy interface for backward compatibility
export interface TournamentNeedingFeedback {
  tournament: {
    _id: string;
    name: string;
    startDate: string;
    endDate: string;
    location: string;
  };
  team: {
    _id: string;
    teamName: string;
  };
  matchesNeedingFeedback: Array<{
    matchId: string;
    opponentTeam: {
      _id: string;
      teamName: string;
    } | null;
    spiritScoreSubmitted: boolean;
    playerFeedbackSubmitted: boolean;
    matchNumber?: number;
    roundName?: string;
  }>;
  totalMatches: number;
  completedMatches: number;
}

export interface TournamentNeedingFeedbackResponse {
  success: boolean;
  data: {
    tournaments: TournamentNeedingFeedback[];
    count: number;
  };
}

export interface MatchFeedbackDetail {
  matchId: string;
  opponentTeam: {
    _id: string;
    teamName: string;
  } | null;
  matchNumber?: number;
  roundName?: string;
  startTime: string;
  spiritScore: {
    categories: {
      rulesKnowledge: number;
      foulsContact: number;
      fairMindedness: number;
      positiveAttitude: number;
      communication: number;
    };
    comments: string;
    submittedAt: string;
  } | null;
  players: Array<{
    playerId: string;
    playerName: string;
    feedback: {
      score: string;
      feedback: string;
      submittedAt: string;
    } | null;
  }>;
  spiritScoreSubmitted: boolean;
  allPlayerFeedbackSubmitted: boolean;
}

export interface TournamentFeedbackDetailsResponse {
  success: boolean;
  data: {
    tournament: {
      _id: string;
      name: string;
      startDate: string;
      endDate: string;
      location: string;
    };
    team: {
      _id: string;
      teamName: string;
    };
    matches: MatchFeedbackDetail[];
  };
}

export interface PlayerForFeedback {
  playerId: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  feedbackSubmitted: boolean;
  feedback: {
    score: string;
    feedback: string;
  } | null;
}

export interface MatchPlayersForFeedbackResponse {
  success: boolean;
  data: {
    match: {
      _id: string;
      matchNumber?: number;
      roundName?: string;
    };
    team: {
      _id: string;
      teamName: string;
    };
    players: PlayerForFeedback[];
  };
}

export interface FeedbackCompletionStatusResponse {
  success: boolean;
  data: {
    canRegister: boolean;
    incompleteMatches: Array<{
      matchId: string;
      tournamentName: string;
      matchDate: string;
      teamName: string;
      opponentTeam: string;
      missingType: 'spirit_score' | 'player_feedback';
    }>;
  };
}

// Feedback API functions
export const feedbackAPI = {
  // Get matches needing feedback (after each match completion)
  getMatchesNeedingFeedback: async (coachId: string): Promise<MatchesNeedingFeedbackResponse> => {
    const response = await api.get('/feedback/matches/needing-feedback', {
      params: { coachId }
    });
    return response.data;
  },

  // Get tournaments needing feedback (backward compatibility)
  getTournamentsNeedingFeedback: async (coachId: string): Promise<TournamentNeedingFeedbackResponse> => {
    const response = await api.get('/feedback/tournaments/needing-feedback', {
      params: { coachId }
    });
    return response.data;
  },

  // Get tournament feedback details
  getTournamentFeedbackDetails: async (
    tournamentId: string,
    coachId: string
  ): Promise<TournamentFeedbackDetailsResponse> => {
    const response = await api.get(`/feedback/tournaments/${tournamentId}/details`, {
      params: { coachId }
    });
    return response.data;
  },

  // Submit spirit score for a match
  submitSpiritScore: async (
    matchId: string,
    data: {
      categories: {
        rulesKnowledge: number;
        foulsContact: number;
        fairMindedness: number;
        positiveAttitude: number;
        communication: number;
      };
      comments?: string;
      coachId: string;
    }
  ): Promise<{ success: boolean; message: string; data: { spiritScore: any } }> => {
    const response = await api.post(`/feedback/matches/${matchId}/spirit-score`, data);
    return response.data;
  },

  // Submit player feedback for a match
  submitPlayerFeedback: async (
    matchId: string,
    playerId: string,
    data: {
      score: string;
      feedback: string;
      coachId: string;
    }
  ): Promise<{ success: boolean; message: string; data: { feedback: any } }> => {
    const response = await api.post(`/feedback/matches/${matchId}/players/${playerId}/feedback`, data);
    return response.data;
  },

  // Get players for a match who need feedback
  getMatchPlayersForFeedback: async (
    matchId: string,
    coachId: string
  ): Promise<MatchPlayersForFeedbackResponse> => {
    const response = await api.get(`/feedback/matches/${matchId}/players`, {
      params: { coachId }
    });
    return response.data;
  },

  // Check feedback completion status
  checkFeedbackCompletionStatus: async (coachId: string): Promise<FeedbackCompletionStatusResponse> => {
    const response = await api.get('/feedback/check-completion', {
      params: { coachId }
    });
    return response.data;
  },
};

// Analytics interfaces
export interface TournamentSummaryResponse {
  success: boolean;
  data: {
    tournament?: {
      _id: string;
      name: string;
      startDate: string;
      endDate: string;
      location: string;
      division: string;
      format: string;
      status: string;
    };
    summary?: {
      totalTeams: number;
      totalMatches: number;
      completedMatches: number;
      scheduledMatches: number;
      ongoingMatches: number;
      totalPointsScored: number;
      averagePointsPerMatch: number;
    };
    teams?: Array<{
      teamId: string;
      teamName: string;
      totalMembers: number;
      coach: any;
      matchesPlayed: number;
      wins: number;
      losses: number;
      draws: number;
      totalPointsFor: number;
      totalPointsAgainst: number;
    }>;
    spiritRankings?: Array<{
      teamId: string;
      teamName: string;
      averageScore: number;
      categoryAverages: {
        rulesKnowledge: number;
        foulsContact: number;
        fairMindedness: number;
        positiveAttitude: number;
        communication: number;
      };
      submissionCount: number;
    }>;
    matches?: Array<{
      _id: string;
      teamA: string;
      teamB: string;
      score: { teamA: number; teamB: number };
      status: string;
      startTime: string;
      winner: string;
    }>;
    summaries?: Array<{
      tournament: {
        _id: string;
        name: string;
        startDate: string;
        endDate: string;
        location: string;
        status: string;
      };
      totalTeams: number;
      totalMatches: number;
      completedMatches: number;
    }>;
    count?: number;
  };
}

export interface PlayerParticipationResponse {
  success: boolean;
  data: {
    genderDistribution: Record<string, number>;
    ageStats: {
      youngest: number;
      oldest: number;
      average: number;
      median: number;
    };
    participationStats: {
      totalPlayers: number;
      playersWithMatches: number;
      totalMatchesPlayed: number;
      averageMatchesPerPlayer: number;
      playersInTournaments: number;
    };
    attendanceStats?: {
      totalMatchAttendanceRecords: number;
      presentCount: number;
      absentCount: number;
      lateCount: number;
      attendanceRate: number;
    };
    playersByTeam: Record<string, number>;
    totalPlayers: number;
    playerProfiles: Array<{
      _id: string;
      name: string;
      age: number | null;
      gender: string | null;
      team: string | null;
      totalMatchesPlayed: number;
      tournamentsPlayed: number;
    }>;
  };
}

// Analytics API functions
export const analyticsAPI = {
  // Get tournament summary
  getTournamentSummary: async (tournamentId?: string): Promise<TournamentSummaryResponse> => {
    const url = tournamentId 
      ? `/analytics/tournament-summary/${tournamentId}`
      : '/analytics/tournament-summary';
    const response = await api.get(url);
    return response.data;
  },

  // Get player participation data
  getPlayerParticipationData: async (tournamentId?: string): Promise<PlayerParticipationResponse> => {
    const response = await api.get('/analytics/player-participation', {
      params: tournamentId ? { tournamentId } : {}
    });
    return response.data;
  },

  // Download tournament report
  downloadTournamentReport: async (tournamentId: string, reportType: 'attendance' | 'matches' | 'scoring' | 'full') => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/analytics/report/${tournamentId}/${reportType}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to download report');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tournament-${tournamentId}-${reportType}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

// Utility function to handle API errors
export const handleAPIError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.errors) {
    return error.response.data.errors.map((err: any) => err.msg).join(', ');
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export default api;