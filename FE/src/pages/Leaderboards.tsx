import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, RefreshCw, TrendingUp, Calendar, MapPin } from "lucide-react";
import { tournamentAPI, leaderboardAPI, TournamentLeaderboard, TeamStanding, handleAPIError, Tournament } from "@/services/api";
import { toast } from "sonner";

const Leaderboards = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<TournamentLeaderboard | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournamentId) {
      fetchLeaderboard();
      // Poll for updates every 5 seconds
      const interval = setInterval(() => {
        fetchLeaderboard();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [selectedTournamentId]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await tournamentAPI.getAllTournaments();
      if (response.success) {
        setTournaments(response.data.tournaments);
        // Auto-select first tournament if available
        if (response.data.tournaments.length > 0 && !selectedTournamentId) {
          setSelectedTournamentId(response.data.tournaments[0]._id);
        }
      } else {
        toast.error(response.message || "Failed to load tournaments");
      }
    } catch (error) {
      toast.error(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    if (!selectedTournamentId) return;

    try {
      const response = await leaderboardAPI.getTournamentLeaderboard(selectedTournamentId);
      if (response.success) {
        setLeaderboard(response.data);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setLeaderboard(null);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-orange-600" />;
    return <span className="text-muted-foreground font-bold">#{rank}</span>;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/20 text-yellow-600 border-yellow-500";
    if (rank === 2) return "bg-gray-400/20 text-gray-600 border-gray-400";
    if (rank === 3) return "bg-orange-600/20 text-orange-600 border-orange-600";
    return "bg-muted";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-32">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Leaderboards</h1>
          <p className="text-muted-foreground mb-4">
            Auto-generated team standings based on wins, losses, and points
          </p>
          <div className="flex gap-4 items-center flex-wrap">
            <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a tournament" />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map((tournament) => (
                  <SelectItem key={tournament._id} value={tournament._id}>
                    {tournament.name} ({new Date(tournament.startDate).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={fetchLeaderboard}
              variant="outline"
              disabled={loading || !selectedTournamentId}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {!selectedTournamentId ? (
          <Card className="glass-card p-12 text-center">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Tournament</h3>
            <p className="text-muted-foreground">
              Choose a tournament from the dropdown to view team standings
            </p>
          </Card>
        ) : !leaderboard ? (
          <Card className="glass-card p-12 text-center">
            <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Leaderboard Data</h3>
            <p className="text-muted-foreground">
              No completed matches found for this tournament yet.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Tournament Info */}
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">{leaderboard.tournament.name}</CardTitle>
                  <Badge variant="outline">{leaderboard.tournament.division}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-muted-foreground">Start Date</div>
                      <div className="font-semibold">
                        {new Date(leaderboard.tournament.startDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-muted-foreground">End Date</div>
                      <div className="font-semibold">
                        {new Date(leaderboard.tournament.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {leaderboard.tournament.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Location</div>
                        <div className="font-semibold">{leaderboard.tournament.location}</div>
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-muted-foreground">Format</div>
                    <div className="font-semibold">{leaderboard.tournament.format}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="text-sm text-muted-foreground mb-1">Total Teams</div>
                  <div className="text-3xl font-bold">{leaderboard.totalTeams}</div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="text-sm text-muted-foreground mb-1">Completed Matches</div>
                  <div className="text-3xl font-bold">{leaderboard.completedMatches}</div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="text-sm text-muted-foreground mb-1">Total Matches</div>
                  <div className="text-3xl font-bold">{leaderboard.totalMatches}</div>
                </CardContent>
              </Card>
            </div>

            {/* Standings Table */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Team Standings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.standings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No standings available yet. Teams need to play matches first.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Rank</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead className="text-center">W</TableHead>
                          <TableHead className="text-center">L</TableHead>
                          <TableHead className="text-center">D</TableHead>
                          <TableHead className="text-center">MP</TableHead>
                          <TableHead className="text-center">PF</TableHead>
                          <TableHead className="text-center">PA</TableHead>
                          <TableHead className="text-center">GD</TableHead>
                          <TableHead className="text-center">Win %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaderboard.standings.map((team: TeamStanding) => (
                          <TableRow
                            key={team.teamId}
                            className={team.rank <= 3 ? "bg-primary/5" : ""}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getRankIcon(team.rank)}
                                {team.rank > 3 && (
                                  <span className="font-bold text-muted-foreground">
                                    #{team.rank}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-semibold">{team.teamName}</div>
                                {team.coach && (
                                  <div className="text-xs text-muted-foreground">
                                    Coach: {team.coach.firstName} {team.coach.lastName}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-green-500/20 text-green-600 border-green-500">
                                {team.wins}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-red-500/20 text-red-600 border-red-500">
                                {team.losses}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-600 border-yellow-500">
                                {team.draws}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                              {team.matchesPlayed}
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                              {team.pointsFor}
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                              {team.pointsAgainst}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={
                                  team.goalDifference > 0
                                    ? "bg-green-500/20 text-green-600 border-green-500"
                                    : team.goalDifference < 0
                                    ? "bg-red-500/20 text-red-600 border-red-500"
                                    : "bg-muted"
                                }
                              >
                                {team.goalDifference > 0 ? "+" : ""}
                                {team.goalDifference}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">{team.winPercentage}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Legend */}
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Legend:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>W = Wins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>L = Losses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>D = Draws</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>MP = Matches Played</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>PF = Points For</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>PA = Points Against</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>GD = Goal Difference</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Leaderboards;

