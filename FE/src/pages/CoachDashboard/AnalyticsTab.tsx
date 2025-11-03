import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Trophy, Users, TrendingUp, FileDown, Download, BarChart3, 
  UserCheck, Target, Award, Activity
} from "lucide-react";
import { analyticsAPI, tournamentAPI, Tournament, TournamentSummaryResponse, PlayerParticipationResponse, handleAPIError } from "@/services/api";
import { toast } from "sonner";

const CoachAnalyticsTab = () => {
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [summaryData, setSummaryData] = useState<TournamentSummaryResponse | null>(null);
  const [participationData, setParticipationData] = useState<PlayerParticipationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingParticipation, setLoadingParticipation] = useState(false);

  useEffect(() => {
    fetchCoachTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchSummary();
      fetchParticipationData();
    }
  }, [selectedTournament]);

  const fetchCoachTournaments = async () => {
    try {
      // Fetch all tournaments, backend will filter to coach's tournaments
      const response = await tournamentAPI.getAllTournaments();
      if (response.success) {
        setTournaments(response.data.tournaments);
      }
    } catch (error) {
      toast.error(handleAPIError(error));
    }
  };

  const fetchSummary = async () => {
    if (!selectedTournament) return;
    setLoading(true);
    try {
      const response = await analyticsAPI.getTournamentSummary(selectedTournament);
      if (response.success) {
        setSummaryData(response);
      }
    } catch (error) {
      toast.error(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipationData = async () => {
    if (!selectedTournament) return;
    setLoadingParticipation(true);
    try {
      const response = await analyticsAPI.getPlayerParticipationData(selectedTournament);
      if (response.success) {
        setParticipationData(response);
      }
    } catch (error) {
      toast.error(handleAPIError(error));
    } finally {
      setLoadingParticipation(false);
    }
  };

  const handleDownloadReport = async (reportType: 'attendance' | 'matches' | 'scoring' | 'full') => {
    if (!selectedTournament) {
      toast.error("Please select a tournament first");
      return;
    }
    try {
      await analyticsAPI.downloadTournamentReport(selectedTournament, reportType);
      toast.success(`Report downloaded successfully!`);
    } catch (error) {
      toast.error(handleAPIError(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Teams Analytics & Reports</h2>
      </div>

      {/* Tournament Selection */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Select Tournament</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedTournament} onValueChange={setSelectedTournament}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a tournament to view analytics for your teams" />
            </SelectTrigger>
            <SelectContent>
              {tournaments.map((tournament) => (
                <SelectItem key={tournament._id} value={tournament._id}>
                  {tournament.name} - {new Date(tournament.startDate).getFullYear()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {!selectedTournament && (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">Select a tournament to view analytics for your teams</p>
          </CardContent>
        </Card>
      )}

      {selectedTournament && loading && (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <div className="animate-spin h-8 w-8 mx-auto mb-4 border-4 border-orange-600 border-t-transparent rounded-full" />
            <p className="text-muted-foreground">Loading analytics...</p>
          </CardContent>
        </Card>
      )}

      {selectedTournament && summaryData && !loading && (
        <>
          {/* Tournament Summary Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">My Teams</p>
                    <p className="text-2xl font-bold">{summaryData.data.summary?.totalTeams || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Matches</p>
                    <p className="text-2xl font-bold">{summaryData.data.summary?.totalMatches || 0}</p>
                  </div>
                  <Trophy className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{summaryData.data.summary?.completedMatches || 0}</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Points</p>
                    <p className="text-2xl font-bold">{summaryData.data.summary?.totalPointsScored || 0}</p>
                  </div>
                  <Activity className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Teams Statistics */}
          {summaryData.data.teams && summaryData.data.teams.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>My Teams Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Team</th>
                        <th className="text-center p-2">Matches</th>
                        <th className="text-center p-2">Wins</th>
                        <th className="text-center p-2">Losses</th>
                        <th className="text-center p-2">Points For</th>
                        <th className="text-center p-2">Points Against</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryData.data.teams.map((team) => (
                        <tr key={team.teamId} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{team.teamName}</td>
                          <td className="p-2 text-center">{team.matchesPlayed}</td>
                          <td className="p-2 text-center text-green-600">{team.wins}</td>
                          <td className="p-2 text-center text-red-600">{team.losses}</td>
                          <td className="p-2 text-center">{team.totalPointsFor}</td>
                          <td className="p-2 text-center">{team.totalPointsAgainst}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Spirit Rankings */}
          {summaryData.data.spiritRankings && summaryData.data.spiritRankings.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Spirit Rankings (My Teams)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {summaryData.data.spiritRankings.map((ranking, index) => (
                    <div key={ranking.teamId} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-orange-500/5 to-orange-600/5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-muted text-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{ranking.teamName}</p>
                          <p className="text-sm text-muted-foreground">
                            Avg: {ranking.averageScore.toFixed(2)} • {ranking.submissionCount} submissions
                          </p>
                        </div>
                      </div>
                      <Award className="h-5 w-5 text-yellow-500" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Player Participation Data */}
      {selectedTournament && participationData && !loadingParticipation && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>My Players Participation Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Gender Distribution */}
            {participationData.data.genderDistribution && (
              <div>
                <h3 className="font-semibold mb-3">Gender Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(participationData.data.genderDistribution).map(([gender, count]) => (
                    <div key={gender} className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">{gender}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Age Statistics */}
            {participationData.data.ageStats && (
              <div>
                <h3 className="font-semibold mb-3">Age Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Youngest</p>
                    <p className="text-2xl font-bold">{participationData.data.ageStats.youngest || 'N/A'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Oldest</p>
                    <p className="text-2xl font-bold">{participationData.data.ageStats.oldest || 'N/A'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Average</p>
                    <p className="text-2xl font-bold">{participationData.data.ageStats.average.toFixed(1) || 'N/A'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Median</p>
                    <p className="text-2xl font-bold">{participationData.data.ageStats.median || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Participation Stats */}
            <div>
              <h3 className="font-semibold mb-3">Participation Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Total Players</p>
                  <p className="text-2xl font-bold">{participationData.data.participationStats.totalPlayers}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Matches Played</p>
                  <p className="text-2xl font-bold">{participationData.data.participationStats.totalMatchesPlayed}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Avg Matches/Player</p>
                  <p className="text-2xl font-bold">{participationData.data.participationStats.averageMatchesPerPlayer.toFixed(1)}</p>
                </div>
              </div>
            </div>

            {/* Attendance Stats */}
            {participationData.data.attendanceStats && (
              <div>
                <h3 className="font-semibold mb-3">Attendance Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Present</p>
                    <p className="text-2xl font-bold text-green-600">{participationData.data.attendanceStats.presentCount}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Absent</p>
                    <p className="text-2xl font-bold text-red-600">{participationData.data.attendanceStats.absentCount}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Late</p>
                    <p className="text-2xl font-bold text-orange-600">{participationData.data.attendanceStats.lateCount}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                    <p className="text-2xl font-bold">{participationData.data.attendanceStats.attendanceRate}%</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Download Reports */}
      {selectedTournament && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Download Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                onClick={() => handleDownloadReport('attendance')}
                className="w-full"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Attendance Report
              </Button>
              <Button 
                onClick={() => handleDownloadReport('matches')}
                className="w-full"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Matches Report
              </Button>
              <Button 
                onClick={() => handleDownloadReport('scoring')}
                className="w-full"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Scoring Report
              </Button>
              <Button 
                onClick={() => handleDownloadReport('full')}
                className="w-full"
                variant="default"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Full Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CoachAnalyticsTab;

