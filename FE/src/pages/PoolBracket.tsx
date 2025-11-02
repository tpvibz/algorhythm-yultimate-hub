import { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Handle,
  Position,
  Node,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, RefreshCw, Clock, Award } from "lucide-react";
import { toast } from "sonner";
import { tournamentAPI, scheduleAPI, Tournament, Team, Match, handleAPIError } from "@/services/api";

// Custom Node Components
const TeamNode = ({ data }: { data: any }) => (
  <div className="glass-card p-3 hover:shadow-lg transition-all min-w-[140px] border-2 border-blue-500/50">
    <Handle type="target" position={Position.Left} className="w-2 h-2 opacity-0" />
    <Handle type="source" position={Position.Right} className="w-2 h-2 opacity-0" />
    <div className="font-semibold text-center">{data.label}</div>
    {data.pool && <div className="text-xs text-muted-foreground text-center mt-1">{data.pool}</div>}
    {data.record && (
      <div className="text-xs text-center mt-1 text-muted-foreground">
        {data.record.wins}-{data.record.losses}
      </div>
    )}
  </div>
);

const MatchNode = ({ data }: { data: any }) => {
  const isCompleted = data.status === 'completed';
  const isOngoing = data.status === 'ongoing';
  
  return (
    <div className={`glass-card p-4 hover:shadow-lg transition-all min-w-[180px] ${isCompleted ? 'border-2 border-green-500/50' : isOngoing ? 'border-2 border-yellow-500/50' : ''}`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2 opacity-0" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 opacity-0" />
      {data.label && <div className="text-center text-xs text-muted-foreground mb-2">{data.label}</div>}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className={`font-semibold text-sm ${data.teamAWinner ? 'text-green-600' : ''}`}>
            {data.teamA || 'TBD'}
          </span>
          {isCompleted && data.score && (
            <span className="font-bold">{data.score.teamA}</span>
          )}
        </div>
        <div className="text-center text-xs text-muted-foreground">vs</div>
        <div className="flex justify-between items-center">
          <span className={`font-semibold text-sm ${data.teamBWinner ? 'text-green-600' : ''}`}>
            {data.teamB || 'TBD'}
          </span>
          {isCompleted && data.score && (
            <span className="font-bold">{data.score.teamB}</span>
          )}
        </div>
        {data.startTime && (
          <div className="text-xs text-center text-muted-foreground mt-2">
            {new Date(data.startTime).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};

const FinalNode = ({ data }: { data: any }) => (
  <div className="glass-card glass-hover p-6 min-w-[200px] border-2 border-primary/50">
    <Handle type="target" position={Position.Left} className="w-2 h-2 opacity-0" />
    <div className="text-center text-sm font-semibold mb-4">FINAL</div>
    <div className="space-y-3">
      <div className={`flex justify-between items-center p-2 rounded bg-background/50 ${data.teamAWinner ? 'bg-green-500/20' : ''}`}>
        <span className={`font-semibold ${data.teamAWinner ? 'text-green-600' : ''}`}>{data.teamA || 'TBD'}</span>
        {data.score && <span className="font-bold">{data.score.teamA}</span>}
      </div>
      <div className="text-center text-xs text-muted-foreground">vs</div>
      <div className={`flex justify-between items-center p-2 rounded bg-background/50 ${data.teamBWinner ? 'bg-green-500/20' : ''}`}>
        <span className={`font-semibold ${data.teamBWinner ? 'text-green-600' : ''}`}>{data.teamB || 'TBD'}</span>
        {data.score && <span className="font-bold">{data.score.teamB}</span>}
      </div>
    </div>
  </div>
);

const ChampionNode = ({ data }: { data: any }) => (
  <div className="glass-card glass-hover p-6 min-w-[160px] border-2 border-primary/50 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20">
    <Handle type="target" position={Position.Left} className="w-2 h-2 opacity-0" />
    <div className="text-center">
      <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
      <div className="text-sm font-semibold text-muted-foreground mb-2">CHAMPION</div>
      <div className="font-bold text-lg">{data.label || 'TBD'}</div>
    </div>
  </div>
);

const nodeTypes = {
  team: TeamNode,
  match: MatchNode,
  final: FinalNode,
  champion: ChampionNode,
};

interface PoolStanding {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  pool?: number;
}

const PoolBracket = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [poolStandings, setPoolStandings] = useState<Record<string, PoolStanding[]>>({});

  // Fetch tournaments
  useEffect(() => {
    fetchTournaments();
  }, []);

  // Fetch teams and matches when tournament is selected
  useEffect(() => {
    if (selectedTournamentId) {
      fetchTournamentData();
      // Start polling for real-time updates
      const interval = setInterval(() => {
        fetchMatches();
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [selectedTournamentId]);

  // Regenerate visualization when matches or teams change
  useEffect(() => {
    if (selectedTournamentId && teams.length > 0 && matches.length > 0) {
      calculatePoolStandings();
      generateVisualization();
    }
  }, [selectedTournamentId, teams, matches]);

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
      toast.error(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchTournamentData = async () => {
    await Promise.all([fetchTeams(), fetchMatches()]);
  };

  const fetchTeams = async () => {
    if (!selectedTournamentId) return;
    
    try {
      const response = await scheduleAPI.getTeamsByTournament(selectedTournamentId);
      if (response.success) {
        setTeams(response.data.teams);
      } else {
        toast.error(response.message || "Failed to load teams");
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const fetchMatches = async () => {
    if (!selectedTournamentId) return;
    
    try {
      const response = await scheduleAPI.getMatchesByTournament(selectedTournamentId);
      if (response.success) {
        setMatches(response.data.matches);
      }
    } catch (error) {
      // Ignore if no matches exist yet
      setMatches([]);
    }
  };

  // Calculate pool standings from matches
  const calculatePoolStandings = useCallback(() => {
    const standings: Record<string, PoolStanding[]> = {};
    const teamMap = new Map(teams.map(t => [t._id, t.teamName]));

    // Group matches by pool (if pool info exists in match, otherwise infer from tournament format)
    const selectedTournament = tournaments.find(t => t._id === selectedTournamentId);
    const format = selectedTournament?.format || 'round-robin';
    
    if (format === 'pool-play-bracket' || format === 'pools') {
      // For pool play, we need to group teams into pools
      // Since we don't have pool info stored, we'll split teams evenly
      const numPools = Math.ceil(Math.sqrt(teams.length));
      const teamsPerPool = Math.ceil(teams.length / numPools);

      for (let pool = 0; pool < numPools; pool++) {
        const poolTeams = teams.slice(pool * teamsPerPool, (pool + 1) * teamsPerPool);
        const poolId = `Pool ${String.fromCharCode(65 + pool)}`;
        
        standings[poolId] = poolTeams.map(team => ({
          teamId: team._id,
          teamName: team.teamName,
          wins: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          pool: pool + 1
        }));

        // Calculate wins/losses from matches
        matches.forEach(match => {
          if (match.status === 'completed' && match.score) {
            const teamAInPool = poolTeams.some(t => t._id === match.teamA._id);
            const teamBInPool = poolTeams.some(t => t._id === match.teamB._id);

            if (teamAInPool && teamBInPool) {
              const teamAStanding = standings[poolId].find(s => s.teamId === match.teamA._id);
              const teamBStanding = standings[poolId].find(s => s.teamId === match.teamB._id);

              if (teamAStanding && teamBStanding) {
                if (match.score.teamA > match.score.teamB) {
                  teamAStanding.wins++;
                  teamBStanding.losses++;
                } else {
                  teamAStanding.losses++;
                  teamBStanding.wins++;
                }
                teamAStanding.pointsFor += match.score.teamA;
                teamAStanding.pointsAgainst += match.score.teamB;
                teamBStanding.pointsFor += match.score.teamB;
                teamBStanding.pointsAgainst += match.score.teamA;
              }
            }
          }
        });

        // Sort by wins, then point differential
        standings[poolId].sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
        });
      }
    } else {
      // For non-pool formats, create a single standings list
      const allStandings: PoolStanding[] = teams.map(team => ({
        teamId: team._id,
        teamName: team.teamName,
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0
      }));

      matches.forEach(match => {
        if (match.status === 'completed' && match.score) {
          const teamAStanding = allStandings.find(s => s.teamId === match.teamA._id);
          const teamBStanding = allStandings.find(s => s.teamId === match.teamB._id);

          if (teamAStanding && teamBStanding) {
            if (match.score.teamA > match.score.teamB) {
              teamAStanding.wins++;
              teamBStanding.losses++;
            } else {
              teamAStanding.losses++;
              teamBStanding.wins++;
            }
            teamAStanding.pointsFor += match.score.teamA;
            teamAStanding.pointsAgainst += match.score.teamB;
            teamBStanding.pointsFor += match.score.teamB;
            teamBStanding.pointsAgainst += match.score.teamA;
          }
        }
      });

      allStandings.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
      });

      standings['Overall'] = allStandings;
    }

    setPoolStandings(standings);
  }, [teams, matches, selectedTournamentId, tournaments]);

  // Generate ReactFlow visualization
  const generateVisualization = useCallback(() => {
    const selectedTournament = tournaments.find(t => t._id === selectedTournamentId);
    if (!selectedTournament) return;

    const format = selectedTournament.format || 'round-robin';
    const visualizationNodes: Node[] = [];
    const visualizationEdges: Edge[] = [];

    if (format === 'single-elimination') {
      generateSingleEliminationBracket(visualizationNodes, visualizationEdges);
    } else if (format === 'pool-play-bracket' || format === 'pools') {
      generatePoolPlayBracket(visualizationNodes, visualizationEdges);
    } else {
      generateRoundRobinView(visualizationNodes, visualizationEdges);
    }

    setNodes(visualizationNodes);
    setEdges(visualizationEdges);
  }, [selectedTournamentId, teams, matches, tournaments, poolStandings]);

  const generateSingleEliminationBracket = (nodes: Node[], edges: Edge[]) => {
    const teamMap = new Map(teams.map(t => [t._id, t.teamName]));

    // Sort matches by time
    const sortedMatches = [...matches].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // Calculate rounds based on number of teams
    const numRounds = Math.ceil(Math.log2(teams.length));
    const rounds: Match[][] = [];
    let remainingMatches = [...sortedMatches];

    // Group matches into rounds (first round has most matches)
    for (let round = 0; round < numRounds; round++) {
      const matchesInThisRound = Math.floor(remainingMatches.length / 2) || remainingMatches.length;
      rounds.push(remainingMatches.slice(0, matchesInThisRound));
      remainingMatches = remainingMatches.slice(matchesInThisRound);
    }

    const horizontalSpacing = 400;
    const verticalSpacing = 150;
    let xPos = 50;

    // Generate nodes and edges for each round
    rounds.forEach((round, roundIndex) => {
      const isFinal = roundIndex === rounds.length - 1;
      const numMatches = round.length;
      const totalHeight = Math.max(200, (numMatches - 1) * verticalSpacing);
      const startY = (900 - totalHeight) / 2;

      round.forEach((match, matchIndex) => {
        const yPos = startY + matchIndex * verticalSpacing;

        if (isFinal) {
          // Final match
          const championNode: Node = {
            id: `champion-${match._id}`,
            type: 'champion',
            position: { x: xPos + horizontalSpacing + 100, y: yPos + 25 },
            data: { 
              label: match.winnerTeamId 
                ? teamMap.get(match.winnerTeamId) || match.teamA.teamName
                : 'TBD'
            }
          };
          nodes.push(championNode);

          const finalNode: Node = {
            id: `match-${match._id}`,
            type: 'final',
            position: { x: xPos, y: yPos },
            data: {
              teamA: match.teamA.teamName,
              teamB: match.teamB.teamName,
              score: match.score,
              teamAWinner: match.winnerTeamId === match.teamA._id,
              teamBWinner: match.winnerTeamId === match.teamB._id,
              startTime: match.startTime,
              status: match.status
            }
          };
          nodes.push(finalNode);

          edges.push({
            id: `edge-final-champion-${match._id}`,
            source: `match-${match._id}`,
            target: `champion-${match._id}`,
            animated: match.status === 'ongoing',
            style: { stroke: match.status === 'completed' ? 'hsl(var(--primary))' : 'hsl(var(--border))', strokeWidth: 2 }
          });
        } else {
          // Regular match node
          const matchNode: Node = {
            id: `match-${match._id}`,
            type: 'match',
            position: { x: xPos, y: yPos },
            data: {
              label: `Round ${roundIndex + 1}`,
              teamA: match.teamA.teamName,
              teamB: match.teamB.teamName,
              score: match.score,
              teamAWinner: match.winnerTeamId === match.teamA._id,
              teamBWinner: match.winnerTeamId === match.teamB._id,
              startTime: match.startTime,
              status: match.status
            }
          };
          nodes.push(matchNode);
        }

        // Connect to next round (if exists)
        if (roundIndex < rounds.length - 1) {
          const nextRound = rounds[roundIndex + 1];
          if (nextRound && nextRound.length > 0) {
            const nextMatchIndex = Math.floor(matchIndex / 2);
            if (nextMatchIndex < nextRound.length) {
              const nextMatch = nextRound[nextMatchIndex];
              edges.push({
                id: `edge-${match._id}-${nextMatch._id}`,
                source: `match-${match._id}`,
                target: `match-${nextMatch._id}`,
                animated: match.status === 'ongoing',
                style: { stroke: match.status === 'completed' ? 'hsl(var(--primary))' : 'hsl(var(--border))' }
              });
            }
          }
        }
      });

      xPos += horizontalSpacing;
    });
  };

  const generatePoolPlayBracket = (nodes: Node[], edges: Edge[]) => {
    const poolKeys = Object.keys(poolStandings).sort();
    const horizontalSpacing = 300;
    let xPos = 50;
    const verticalSpacing = 100;
    const startY = 100;

    // First, show all pool standings
    poolKeys.forEach((poolKey, poolIndex) => {
      const standings = poolStandings[poolKey];

      standings.forEach((standing, index) => {
        const teamNode: Node = {
          id: `team-${standing.teamId}-${poolIndex}`,
          type: 'team',
          position: { x: xPos, y: startY + index * verticalSpacing },
          data: {
            label: standing.teamName,
            pool: poolKey,
            record: { wins: standing.wins, losses: standing.losses }
          }
        };
        nodes.push(teamNode);
      });

      xPos += horizontalSpacing;
    });

    // Then show bracket matches (playoff rounds)
    // Find matches that involve top teams from pools (likely bracket matches)
    const bracketMatches = matches.filter(m => 
      matches.some(otherMatch => 
        otherMatch._id !== m._id && 
        (otherMatch.teamA._id === m.teamA._id || 
         otherMatch.teamB._id === m.teamB._id ||
         otherMatch.teamA._id === m.teamB._id ||
         otherMatch.teamB._id === m.teamA._id)
      )
    );

    bracketMatches.forEach((match, matchIndex) => {
      const matchNode: Node = {
        id: `bracket-match-${match._id}`,
        type: 'match',
        position: { x: xPos, y: startY + matchIndex * 150 },
        data: {
          teamA: match.teamA.teamName,
          teamB: match.teamB.teamName,
          score: match.score,
          status: match.status,
          startTime: match.startTime
        }
      };
      nodes.push(matchNode);

      // Connect from pool teams to bracket matches if it's a top team
      poolKeys.forEach((poolKey, poolIndex) => {
        const standings = poolStandings[poolKey];
        const topTwo = standings.slice(0, 2);
        
        topTwo.forEach((standing, index) => {
          if (match.teamA._id === standing.teamId || match.teamB._id === standing.teamId) {
            edges.push({
              id: `edge-pool-${poolIndex}-${index}-match-${match._id}`,
              source: `team-${standing.teamId}-${poolIndex}`,
              target: `bracket-match-${match._id}`,
              animated: match.status === 'ongoing',
              style: { stroke: 'hsl(var(--border))' }
            });
          }
        });
      });
    });

    // If there's a final match
    const finalMatch = matches.find(m => matches.every(other => 
      other._id === m._id || 
      (other.teamA._id !== m.teamA._id && other.teamB._id !== m.teamB._id &&
       other.teamA._id !== m.teamB._id && other.teamB._id !== m.teamA._id)
    ));

    if (finalMatch && bracketMatches.length > 0) {
      const finalNode: Node = {
        id: `final-${finalMatch._id}`,
        type: 'final',
        position: { x: xPos + horizontalSpacing, y: startY + bracketMatches.length * 75 },
        data: {
          teamA: finalMatch.teamA.teamName,
          teamB: finalMatch.teamB.teamName,
          score: finalMatch.score,
          teamAWinner: finalMatch.winnerTeamId === finalMatch.teamA._id,
          teamBWinner: finalMatch.winnerTeamId === finalMatch.teamB._id,
          startTime: finalMatch.startTime,
          status: finalMatch.status
        }
      };
      nodes.push(finalNode);

      const championNode: Node = {
        id: `champion-${finalMatch._id}`,
        type: 'champion',
        position: { x: xPos + horizontalSpacing * 2, y: startY + bracketMatches.length * 75 + 25 },
        data: {
          label: finalMatch.winnerTeamId ? 
            teams.find(t => t._id === finalMatch.winnerTeamId)?.teamName || 'TBD' : 'TBD'
        }
      };
      nodes.push(championNode);

      edges.push({
        id: `edge-final-champion-${finalMatch._id}`,
        source: `final-${finalMatch._id}`,
        target: `champion-${finalMatch._id}`,
        animated: finalMatch.status === 'ongoing',
        style: { stroke: finalMatch.status === 'completed' ? 'hsl(var(--primary))' : 'hsl(var(--border))', strokeWidth: 2 }
      });
    }
  };

  const generateRoundRobinView = (nodes: Node[], edges: Edge[]) => {
    const horizontalSpacing = 250;
    let xPos = 50;
    const verticalSpacing = 80;
    const startY = 100;

    matches.forEach((match, index) => {
      const matchNode: Node = {
        id: `match-${match._id}`,
        type: 'match',
        position: { x: xPos + (index % 3) * horizontalSpacing, y: startY + Math.floor(index / 3) * verticalSpacing },
        data: {
          teamA: match.teamA.teamName,
          teamB: match.teamB.teamName,
          score: match.score,
          status: match.status,
          startTime: match.startTime
        }
      };
      nodes.push(matchNode);
    });
  };

  const selectedTournament = tournaments.find(t => t._id === selectedTournamentId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-32">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Pool & Bracket</h1>
          <div className="flex gap-4 items-center">
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
            <button
              onClick={fetchMatches}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {selectedTournament && (
          <>
            {/* Pool Standings */}
            {Object.keys(poolStandings).length > 0 && (
              <div className="grid gap-6 lg:grid-cols-2 mb-12">
                {Object.entries(poolStandings).map(([poolKey, standings]) => (
                  <Card key={poolKey} className="glass-card glass-hover">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        {poolKey}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {standings.map((standing, index) => (
                          <div
                            key={standing.teamId}
                            className={`flex justify-between items-center p-3 rounded-lg bg-background/50 ${index < 2 ? 'border-2 border-primary/50' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-lg w-6">{index + 1}</span>
                              <span className="font-semibold">{standing.teamName}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-bold">{standing.wins}-{standing.losses}</span>
                              {standing.pointsFor > 0 && (
                                <span className="text-muted-foreground">
                                  {standing.pointsFor}-{standing.pointsAgainst}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Tournament Bracket with React Flow */}
            {nodes.length > 0 && (
              <Card className="glass-card p-6 mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Tournament Bracket
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[900px] rounded-lg border border-border/50 bg-background/30">
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      nodeTypes={nodeTypes}
                      fitView
                      fitViewOptions={{ padding: 0.2 }}
                      minZoom={0.3}
                      maxZoom={2}
                      defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                      nodesDraggable={false}
                      nodesConnectable={false}
                      elementsSelectable={false}
                      panOnScroll={true}
                      zoomOnScroll={true}
                      zoomOnPinch={true}
                      panOnDrag={true}
                      attributionPosition="bottom-right"
                    >
                      <Background 
                        gap={20} 
                        size={1} 
                        color="hsl(var(--border))" 
                        style={{ opacity: 0.3 }}
                      />
                      <Controls 
                        showZoom={true}
                        showFitView={true}
                        showInteractive={false}
                        className="bg-background border border-border rounded-lg shadow-lg"
                      />
                    </ReactFlow>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedTournamentId && teams.length === 0 && !loading && (
              <Card className="glass-card p-8 text-center">
                <p className="text-muted-foreground">No teams registered for this tournament yet.</p>
              </Card>
            )}

            {selectedTournamentId && matches.length === 0 && teams.length > 0 && !loading && (
              <Card className="glass-card p-8 text-center">
                <p className="text-muted-foreground">No matches scheduled yet. Use Schedule Builder to generate matches.</p>
              </Card>
            )}
          </>
        )}

        {!selectedTournamentId && (
          <Card className="glass-card p-8 text-center">
            <p className="text-muted-foreground">Please select a tournament to view pools and brackets.</p>
          </Card>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default PoolBracket;
