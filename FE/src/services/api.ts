import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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