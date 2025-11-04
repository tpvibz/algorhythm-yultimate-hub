import { useState, useEffect } from 'react';
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import MatchDetail from './MatchDetail';
import { tournamentAPI, scheduleAPI, Match, Tournament, handleAPIError } from '@/services/api';

const Schedule = () => {
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (tournaments.length > 0) {
      if (selectedTournament) {
        fetchMatchesForTournament(selectedTournament);
      } else {
        // Fetch matches for all tournaments
        fetchAllMatches();
      }
    }
  }, [tournaments, selectedTournament]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await tournamentAPI.getAllTournaments();
      if (response.success) {
        setTournaments(response.data.tournaments);
      } else {
        toast.error(response.message || "Failed to load tournaments");
      }
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      toast.error(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMatches = async () => {
    try {
      setLoading(true);
      const allMatches: Match[] = [];
      
      // Fetch matches for each tournament
      for (const tournament of tournaments) {
        try {
          const response = await scheduleAPI.getMatchesByTournament(tournament._id);
          if (response.success && response.data.matches) {
            allMatches.push(...response.data.matches);
          }
        } catch (error) {
          // Continue if one tournament fails
          console.error(`Error fetching matches for tournament ${tournament._id}:`, error);
        }
      }
      
      // Sort matches by start time
      allMatches.sort((a, b) => {
        const dateA = new Date(a.startTime).getTime();
        const dateB = new Date(b.startTime).getTime();
        return dateB - dateA; // Most recent first
      });
      
      setMatches(allMatches);
    } catch (error) {
      console.error("Error fetching all matches:", error);
      toast.error(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchesForTournament = async (tournamentId: string) => {
    try {
      setLoading(true);
      const response = await scheduleAPI.getMatchesByTournament(tournamentId);
      if (response.success) {
        const sortedMatches = response.data.matches.sort((a: Match, b: Match) => {
          const dateA = new Date(a.startTime).getTime();
          const dateB = new Date(b.startTime).getTime();
          return dateB - dateA;
        });
        setMatches(sortedMatches);
      } else {
        toast.error(response.message || "Failed to load matches");
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Transform backend Match to MatchDetail format
  const transformMatchForDetail = (match: Match): any => {
    const tournament = tournaments.find(t => t._id === match.tournamentId);
    const dateStr = formatDate(match.startTime);
    const timeStr = formatTime(match.startTime);
    
    // Calculate duration if match has end time
    let duration = "TBD";
    if (match.endTime && match.startTime) {
      const start = new Date(match.startTime);
      const end = new Date(match.endTime);
      const diffMs = end.getTime() - start.getTime();
      const diffMins = Math.round(diffMs / 60000);
      duration = `${diffMins} mins`;
    }

    return {
      id: match._id,
      date: dateStr,
      time: timeStr,
      venue: match.fieldName || "TBD",
      status: match.status === 'completed' ? 'completed' : 
              match.status === 'ongoing' ? 'ongoing' : 'upcoming',
      teamA: {
        name: match.teamA.teamName,
        score: match.score?.teamA || 0
      },
      teamB: {
        name: match.teamB.teamName,
        score: match.score?.teamB || 0
      },
      youtubeId: "dQw4w9WgXcQ", // Placeholder - not in backend yet
      details: {
        duration: match.status === 'completed' ? duration : "TBD",
        attendance: match.status === 'completed' ? "N/A" : "Expected 500+",
        weather: match.status === 'completed' ? "N/A" : "Forecast: Clear"
      },
      // Placeholder player data - not in backend yet
      teamAPlayers: [],
      teamBPlayers: [],
      highlights: [],
      tournamentName: tournament?.name || "Tournament"
    };
  };

  // Filter matches by status
  const completedMatches = matches.filter(m => m.status === 'completed');
  const upcomingMatches = matches.filter(m => m.status === 'scheduled');
  const ongoingMatches = matches.filter(m => m.status === 'ongoing');

  if (selectedMatch) {
    const matchDetail = transformMatchForDetail(selectedMatch);
    return <MatchDetail match={matchDetail} onBack={() => setSelectedMatch(null)} />;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-32">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Schedule & Results</h1>
          <div className="flex items-center gap-4">
            {/* Tournament Filter */}
            {tournaments.length > 0 && (
              <select
                value={selectedTournament || ''}
                onChange={(e) => setSelectedTournament(e.target.value || null)}
                className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Tournaments</option>
                {tournaments.map((tournament) => (
                  <option key={tournament._id} value={tournament._id}>
                    {tournament.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => {
                if (selectedTournament) {
                  fetchMatchesForTournament(selectedTournament);
                } else {
                  fetchAllMatches();
                }
              }}
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading matches...</p>
            </div>
          </div>
        ) : matches.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No matches found</h3>
            <p className="text-muted-foreground">
              {selectedTournament 
                ? "There are no matches scheduled for this tournament yet."
                : "There are no matches scheduled yet."}
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Ongoing Matches */}
            {ongoingMatches.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-blue-400">Live Matches</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {ongoingMatches.map((match) => (
                    <MatchCard 
                      key={match._id} 
                      match={match} 
                      onClick={() => setSelectedMatch(match)}
                      formatDate={formatDate}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Matches */}
            {upcomingMatches.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Upcoming Matches</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingMatches.map((match) => (
                    <MatchCard 
                      key={match._id} 
                      match={match} 
                      onClick={() => setSelectedMatch(match)}
                      formatDate={formatDate}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Matches */}
            {completedMatches.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-green-400">Completed Matches</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {completedMatches.map((match) => (
                    <MatchCard 
                      key={match._id} 
                      match={match} 
                      onClick={() => setSelectedMatch(match)}
                      formatDate={formatDate}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

interface MatchCardProps {
  match: Match;
  onClick: () => void;
  formatDate: (dateString: string) => string;
  formatTime: (dateString: string) => string;
}

const MatchCard = ({ match, onClick, formatDate, formatTime }: MatchCardProps) => {
  const matchNumber = match._id.slice(-4); // Use last 4 chars of ID as match number
  
  return (
    <Card 
      className="glass-card glass-hover p-6 cursor-pointer transition-all hover:scale-105"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold">Match {matchNumber}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          match.status === 'completed' 
            ? 'bg-green-500/20 text-green-400' 
            : match.status === 'ongoing'
            ? 'bg-blue-500/20 text-blue-400'
            : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {match.status === 'completed' ? 'Final' : match.status === 'ongoing' ? 'Live' : 'Scheduled'}
        </span>
      </div>
      <p className="text-muted-foreground mb-2 flex items-center gap-2">
        <Calendar size={16} />
        {formatDate(match.startTime)} • {formatTime(match.startTime)}
      </p>
      <p className="text-muted-foreground mb-4 flex items-center gap-2">
        <MapPin size={16} />
        {match.fieldName || 'Field TBD'}
      </p>
      <div className="space-y-2">
        <div className="flex justify-between items-center p-2 bg-secondary/20 rounded">
          <span className="truncate">{match.teamA.teamName}</span>
          <span className="font-bold ml-2">{match.score?.teamA || 0}</span>
        </div>
        <div className="flex justify-between items-center p-2 bg-secondary/20 rounded">
          <span className="truncate">{match.teamB.teamName}</span>
          <span className="font-bold ml-2">{match.score?.teamB || 0}</span>
        </div>
      </div>
    </Card>
  );
};

export default Schedule;
