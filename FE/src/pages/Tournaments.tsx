import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Trophy, Clock, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { tournamentAPI, Tournament, handleAPIError, API_BASE_URL } from "@/services/api";
import api from "@/services/api";
import { toast } from "sonner";

// Format date range for display
const formatDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endDay = end.getDate();
  const year = start.getFullYear();
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }
};

// Get tournament status based on dates
const getTournamentStatus = (startDate: string, endDate: string, registrationDeadline: string) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const regDeadline = new Date(registrationDeadline);
  
  if (now >= start && now <= end) {
    return 'live';
  } else if (now < start) {
    return 'upcoming';
  } else {
    return 'completed';
  }
};

// Check if registration is open
const isRegistrationOpen = (startDate: string, registrationDeadline: string) => {
  const now = new Date();
  const regDeadline = new Date(registrationDeadline);
  const start = new Date(startDate);
  
  return now < regDeadline && now < start;
};

const TournamentCard = ({ tournament }: { tournament: Tournament }) => {
  const status = getTournamentStatus(tournament.startDate, tournament.endDate, tournament.registrationDeadline);
  const isLive = status === 'live';
  const registrationOpen = isRegistrationOpen(tournament.startDate, tournament.registrationDeadline);
  
  return (
    <Card className="glass-card glass-hover p-6 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold pr-2">{tournament.name}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
          isLive
            ? 'bg-red-500/20 text-red-400 animate-pulse' 
            : status === 'upcoming'
            ? 'bg-blue-500/20 text-blue-400'
            : 'bg-gray-500/20 text-gray-400'
        }`}>
          {isLive ? 'LIVE' : status === 'upcoming' ? 'Upcoming' : 'Completed'}
        </span>
      </div>

      {tournament.image && (
        <div className="mb-4 rounded-lg overflow-hidden">
          <img 
            src={tournament.image.startsWith("http") ? tournament.image : `${fileBaseUrl}${tournament.image}`} 
            alt={tournament.name}
            className="w-full h-32 object-cover"
          />
        </div>
      )}

      {tournament.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {tournament.description}
        </p>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDateRange(tournament.startDate, tournament.endDate)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{tournament.location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{tournament.registeredTeams.length}/{tournament.maxTeams} Teams</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Trophy className="h-4 w-4 text-muted-foreground" />
          <span>{tournament.division} • {tournament.format}</span>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-border space-y-3">
        {tournament.prizePool && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Prize Pool</span>
            <span className="font-semibold text-primary">{tournament.prizePool}</span>
          </div>
        )}
        
        {!isLive && status !== 'completed' && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Registration</span>
            <span className={`font-semibold ${
              registrationOpen ? 'text-green-400' : 'text-red-400'
            }`}>
              {registrationOpen ? 'Open' : 'Closed'}
            </span>
          </div>
        )}

        {status !== 'completed' && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Deadline</span>
            <span className="text-xs">
              {new Date(tournament.registrationDeadline).toLocaleDateString()}
            </span>
          </div>
        )}

        <Button 
          className="w-full rounded-full group"
          variant={isLive ? "default" : "outline"}
        >
          {isLive ? 'View Live Scores' : status === 'completed' ? 'View Results' : 'View Details'}
          <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </Card>
  );
};

const Tournaments = () => {
  const [filter, setFilter] = useState("all");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Build absolute URLs for files returned as relative paths (e.g., /uploads/..)
  const fileBaseUrl = useMemo(() => {
    try {
      const base = (api as any)?.defaults?.baseURL as string | undefined;
      if (!base) return "";
      const url = new URL(base);
      // api base is http://host:port/api → strip trailing /api
      return `${url.origin}`;
    } catch {
      return "";
    }
  }, []);

  // Fetch tournaments on component mount
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await tournamentAPI.getAllTournaments();
        if (response.success) {
          setTournaments(response.data.tournaments);
        } else {
          setError(response.message || 'Failed to fetch tournaments');
        }
      } catch (err) {
        const errorMessage = handleAPIError(err);
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  // Filter tournaments based on status
  const getFilteredTournaments = () => {
    if (filter === "all") return tournaments;
    
    return tournaments.filter(tournament => {
      const status = getTournamentStatus(tournament.startDate, tournament.endDate, tournament.registrationDeadline);
      return status === filter;
    });
  };

  const filteredTournaments = getFilteredTournaments();

  // Calculate counts for filter buttons
  const liveCount = tournaments.filter(t => 
    getTournamentStatus(t.startDate, t.endDate, t.registrationDeadline) === 'live'
  ).length;
  
  const upcomingCount = tournaments.filter(t => 
    getTournamentStatus(t.startDate, t.endDate, t.registrationDeadline) === 'upcoming'
  ).length;

  const completedCount = tournaments.filter(t => 
    getTournamentStatus(t.startDate, t.endDate, t.registrationDeadline) === 'completed'
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-32">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading tournaments...</p>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-32">
          <div className="flex items-center justify-center h-64">
            <Card className="glass-card p-8 text-center max-w-md">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Tournaments</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </Card>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-32">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">Tournaments</h1>
          <p className="text-muted-foreground">
            Discover and follow ultimate frisbee tournaments across India
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className="rounded-full"
          >
            All Tournaments
            <span className="ml-2 px-2 py-0.5 bg-background/20 rounded-full text-xs">
              {tournaments.length}
            </span>
          </Button>
          <Button
            variant={filter === "live" ? "default" : "outline"}
            onClick={() => setFilter("live")}
            className="rounded-full"
          >
            Live Now
            <span className="ml-2 px-2 py-0.5 bg-background/20 rounded-full text-xs">
              {liveCount}
            </span>
          </Button>
          <Button
            variant={filter === "upcoming" ? "default" : "outline"}
            onClick={() => setFilter("upcoming")}
            className="rounded-full"
          >
            Upcoming
            <span className="ml-2 px-2 py-0.5 bg-background/20 rounded-full text-xs">
              {upcomingCount}
            </span>
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            onClick={() => setFilter("completed")}
            className="rounded-full"
          >
            Completed
            <span className="ml-2 px-2 py-0.5 bg-background/20 rounded-full text-xs">
              {completedCount}
            </span>
          </Button>
        </div>

        {filteredTournaments.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tournaments found</h3>
            <p className="text-muted-foreground">
              {filter === "all" 
                ? "No tournaments are currently available. Check back later!"
                : `No ${filter} tournaments found. Try a different filter.`
              }
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTournaments.map((tournament) => (
              <TournamentCard key={tournament._id} tournament={tournament} />
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Tournaments;