import { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Handle,
  Position,
  Node,
  Edge,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trophy, RefreshCw, Clock, Award, CheckCircle2, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { tournamentAPI, scheduleAPI, Tournament, Team, Match, handleAPIError } from "@/services/api";

// Enhanced Custom Node Components
const MatchNode = ({ data }: { data: any }) => {
  const isCompleted = data.status === 'completed';
  const isOngoing = data.status === 'ongoing';
  const isScheduled = data.status === 'scheduled';
  
  return (
    <div className={`relative glass-card p-4 hover:shadow-lg transition-all min-w-[200px] ${
      isCompleted ? 'border-2 border-green-500/50 bg-green-500/5' : 
      isOngoing ? 'border-2 border-yellow-500/50 bg-yellow-500/5' : 
      'border-2 border-blue-500/30 bg-blue-500/5'
    }`}>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-primary" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-primary" />
      
      {/* Round Label */}
      <div className="text-center text-xs font-bold text-primary mb-2 uppercase tracking-wide">
        {data.roundName || `Round ${data.round || 1}`}
      </div>
      
      {/* Match Info */}
      <div className="space-y-2">
        {/* Team A */}
        <div className={`flex justify-between items-center p-2 rounded ${
          data.teamAWinner ? 'bg-green-500/20 font-bold' : 'bg-secondary/20'
        }`}>
          <span className={`text-sm truncate flex-1 ${data.teamAWinner ? 'text-green-600' : ''}`}>
            {data.teamA || 'TBD'}
          </span>
          {data.score && (
            <span className={`font-bold ml-2 ${data.teamAWinner ? 'text-green-600' : ''}`}>
              {data.score.teamA}
            </span>
          )}
        </div>
        
        {/* VS Separator */}
        <div className="text-center text-xs text-muted-foreground">vs</div>
        
        {/* Team B */}
        <div className={`flex justify-between items-center p-2 rounded ${
          data.teamBWinner ? 'bg-green-500/20 font-bold' : 'bg-secondary/20'
        }`}>
          <span className={`text-sm truncate flex-1 ${data.teamBWinner ? 'text-green-600' : ''}`}>
            {data.teamB || 'TBD'}
          </span>
          {data.score && (
            <span className={`font-bold ml-2 ${data.teamBWinner ? 'text-green-600' : ''}`}>
              {data.score.teamB}
            </span>
          )}
        </div>
        
        {/* Status and Time */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
          <Badge variant={isCompleted ? "default" : isOngoing ? "secondary" : "outline"} className="text-xs">
            {isCompleted ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </span>
            ) : isOngoing ? (
              <span className="flex items-center gap-1">
                <PlayCircle className="h-3 w-3" />
                Live
              </span>
            ) : (
              "Scheduled"
            )}
          </Badge>
          {data.matchNumber && (
            <span className="text-xs text-muted-foreground">#{data.matchNumber}</span>
          )}
        </div>
        
        {/* Start Time */}
        {data.startTime && (
          <div className="text-xs text-center text-muted-foreground mt-1">
            <Clock className="h-3 w-3 inline mr-1" />
            {new Date(data.startTime).toLocaleDateString("en-US", { 
              month: "short", 
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyMatchNode = ({ data }: { data: any }) => {
  return (
    <div className="relative glass-card p-4 border-2 border-dashed border-muted-foreground/30 bg-muted/10 min-w-[200px] opacity-60">
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-muted-foreground/50" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-muted-foreground/50" />
      
      <div className="text-center text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
        {data.roundName || `Round ${data.round || 1}`}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center p-2 rounded bg-muted/20">
          <span className="text-sm text-muted-foreground">TBD</span>
        </div>
        <div className="text-center text-xs text-muted-foreground">vs</div>
        <div className="flex justify-between items-center p-2 rounded bg-muted/20">
          <span className="text-sm text-muted-foreground">TBD</span>
        </div>
      </div>
    </div>
  );
};

const FinalNode = ({ data }: { data: any }) => {
  const isCompleted = data.status === 'completed';
  const isOngoing = data.status === 'ongoing';
  
  return (
    <div className={`relative glass-card glass-hover p-6 min-w-[220px] border-4 ${
      isCompleted ? 'border-green-500/50 bg-green-500/10' : 
      isOngoing ? 'border-yellow-500/50 bg-yellow-500/10' : 
      'border-primary/50 bg-primary/5'
    }`}>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-primary" />
      
      <div className="text-center mb-4">
        <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
        <div className="text-sm font-bold text-primary uppercase tracking-wider">FINALS</div>
      </div>
      
      <div className="space-y-3">
        <div className={`flex justify-between items-center p-3 rounded ${
          data.teamAWinner ? 'bg-green-500/30 font-bold' : 'bg-background/50'
        }`}>
          <span className={`font-semibold text-sm flex-1 truncate ${data.teamAWinner ? 'text-green-600' : ''}`}>
            {data.teamA || 'TBD'}
          </span>
          {data.score && (
            <span className={`font-bold text-lg ml-2 ${data.teamAWinner ? 'text-green-600' : ''}`}>
              {data.score.teamA}
            </span>
          )}
        </div>
        <div className="text-center text-xs text-muted-foreground font-semibold">vs</div>
        <div className={`flex justify-between items-center p-3 rounded ${
          data.teamBWinner ? 'bg-green-500/30 font-bold' : 'bg-background/50'
        }`}>
          <span className={`font-semibold text-sm flex-1 truncate ${data.teamBWinner ? 'text-green-600' : ''}`}>
            {data.teamB || 'TBD'}
          </span>
          {data.score && (
            <span className={`font-bold text-lg ml-2 ${data.teamBWinner ? 'text-green-600' : ''}`}>
              {data.score.teamB}
            </span>
          )}
        </div>
      </div>
      
      {data.startTime && (
        <div className="text-xs text-center text-muted-foreground mt-3 pt-3 border-t border-border/50">
          <Clock className="h-3 w-3 inline mr-1" />
          {new Date(data.startTime).toLocaleDateString("en-US", { 
            month: "short", 
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })}
        </div>
      )}
    </div>
  );
};

const ChampionNode = ({ data }: { data: any }) => (
  <div className="relative glass-card glass-hover p-6 min-w-[180px] border-4 border-yellow-500/50 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20">
    <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-yellow-500" />
    <div className="text-center">
      <Trophy className="w-10 h-10 mx-auto mb-3 text-yellow-600" />
      <div className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">CHAMPION</div>
      <div className="font-bold text-xl text-primary">{data.label || 'TBD'}</div>
    </div>
  </div>
);

const nodeTypes = {
  match: MatchNode,
  emptyMatch: EmptyMatchNode,
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
    if (selectedTournamentId && teams.length > 0) {
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

    const selectedTournament = tournaments.find(t => t._id === selectedTournamentId);
    const format = selectedTournament?.format || 'round-robin';
    
    if (format === 'pool-play-bracket' || format === 'pools') {
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

        standings[poolId].sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
        });
      }
    } else {
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

  // Generate ReactFlow visualization with proper bracket structure
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
  }, [selectedTournamentId, teams, matches, tournaments]);

  // Generate proper single elimination bracket with rounds
  const generateSingleEliminationBracket = (nodes: Node[], edges: Edge[]) => {
    // Group matches by round
    const matchesByRound = matches.reduce((acc, match) => {
      const round = match.round || 1;
      const roundName = match.roundName || `Round ${round}`;
      const key = `${round}-${roundName}`;
      
      if (!acc[key]) {
        acc[key] = {
          round: round,
          roundName: roundName,
          matches: []
        };
      }
      acc[key].matches.push(match);
      return acc;
    }, {} as Record<string, { round: number; roundName: string; matches: Match[] }>);

    // Sort rounds by round number
    const sortedRounds = Object.values(matchesByRound).sort((a, b) => a.round - b.round);

    if (sortedRounds.length === 0) return;

    // Calculate bracket dimensions
    const maxMatchesPerRound = Math.max(...sortedRounds.map(r => r.matches.length));
    const horizontalSpacing = 350;
    const verticalSpacing = 120;
    const startX = 100;
    let currentX = startX;

    // Get team map for winner lookups
    const teamMap = new Map(teams.map(t => [t._id, t.teamName]));

    // Generate nodes for each round
    sortedRounds.forEach((roundData, roundIndex) => {
      const { round, roundName, matches: roundMatches } = roundData;
      const isFinals = roundName.toLowerCase().includes('final');
      
      // Sort matches by bracket position or match number
      const sortedMatches = [...roundMatches].sort((a, b) => {
        if (a.bracketPosition && b.bracketPosition) return a.bracketPosition - b.bracketPosition;
        if (a.matchNumber && b.matchNumber) return a.matchNumber - b.matchNumber;
        return 0;
      });

      const numMatches = sortedMatches.length;
      const totalHeight = Math.max(400, (numMatches - 1) * verticalSpacing);
      const startY = 100;

      sortedMatches.forEach((match, matchIndex) => {
        const yPos = startY + matchIndex * verticalSpacing;

        if (isFinals) {
          // Finals node
          const finalNode: Node = {
            id: `final-${match._id}`,
            type: 'final',
            position: { x: currentX, y: yPos },
            data: {
              round: round,
              roundName: roundName,
              teamA: match.teamA.teamName,
              teamB: match.teamB.teamName,
              score: match.score,
              teamAWinner: match.winnerTeamId === match.teamA._id,
              teamBWinner: match.winnerTeamId === match.teamB._id,
              startTime: match.startTime,
              status: match.status,
              matchNumber: match.matchNumber
            }
          };
          nodes.push(finalNode);

          // Champion node
          if (match.status === 'completed' && match.winnerTeamId) {
            const championNode: Node = {
              id: `champion-${match._id}`,
              type: 'champion',
              position: { x: currentX + horizontalSpacing, y: yPos + 20 },
              data: {
                label: teamMap.get(match.winnerTeamId) || 'Champion'
              }
            };
            nodes.push(championNode);

            edges.push({
              id: `edge-final-champion-${match._id}`,
              source: `final-${match._id}`,
              target: `champion-${match._id}`,
              animated: false,
              style: { 
                stroke: '#10b981', 
                strokeWidth: 3,
                strokeDasharray: '5,5'
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#10b981',
                width: 30,
                height: 30
              }
            });
          }
        } else {
          // Regular match node
          const matchNode: Node = {
            id: `match-${match._id}`,
            type: 'match',
            position: { x: currentX, y: yPos },
            data: {
              round: round,
              roundName: roundName,
              teamA: match.teamA.teamName,
              teamB: match.teamB.teamName,
              score: match.score,
              teamAWinner: match.winnerTeamId === match.teamA._id,
              teamBWinner: match.winnerTeamId === match.teamB._id,
              startTime: match.startTime,
              status: match.status,
              matchNumber: match.matchNumber
            }
          };
          nodes.push(matchNode);
        }

        // Connect to next round match (if parent matches exist)
        if (match.parentMatchAId || match.parentMatchBId) {
          // This match has parent matches, so we can draw connections
          // But we need to find the next round match this winner should connect to
          const nextRound = sortedRounds[roundIndex + 1];
          if (nextRound) {
            // Find matches in next round that reference this match as parent
            const nextRoundMatches = nextRound.matches.filter(m => 
              m.parentMatchAId === match._id || m.parentMatchBId === match._id
            );

            nextRoundMatches.forEach(nextMatch => {
              const isFinals = nextMatch.roundName?.toLowerCase().includes('final');
              const targetId = isFinals ? `final-${nextMatch._id}` : `match-${nextMatch._id}`;
              const sourceId = match.roundName?.toLowerCase().includes('final') 
                ? `final-${match._id}` 
                : `match-${match._id}`;

              // Only draw edge if match is completed and has a winner
              if (match.status === 'completed' && match.winnerTeamId) {
                edges.push({
                  id: `edge-${match._id}-${nextMatch._id}`,
                  source: sourceId,
                  target: targetId,
                  animated: false,
                  style: { 
                    stroke: '#10b981', 
                    strokeWidth: 2,
                    strokeDasharray: match.status === 'completed' ? '0' : '5,5'
                  },
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#10b981',
                    width: 25,
                    height: 25
                  }
                });
              } else {
                // Draw dotted line for incomplete matches
                edges.push({
                  id: `edge-${match._id}-${nextMatch._id}-pending`,
                  source: sourceId,
                  target: targetId,
                  animated: false,
                  style: { 
                    stroke: '#6b7280', 
                    strokeWidth: 1,
                    strokeDasharray: '10,5',
                    opacity: 0.5
                  },
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#6b7280',
                    width: 20,
                    height: 20
                  }
                });
              }
            });
          }
        } else if (roundIndex < sortedRounds.length - 1) {
          // No parent info, but we can infer next round connections
          // Calculate which match in next round this should connect to
          const nextRound = sortedRounds[roundIndex + 1];
          if (nextRound && nextRound.matches.length > 0) {
            const nextMatchIndex = Math.floor(matchIndex / 2);
            if (nextMatchIndex < nextRound.matches.length) {
              const nextMatch = nextRound.matches[nextMatchIndex];
              const isFinals = nextMatch.roundName?.toLowerCase().includes('final');
              const targetId = isFinals ? `final-${nextMatch._id}` : `match-${nextMatch._id}`;
              const sourceId = `match-${match._id}`;

              if (match.status === 'completed' && match.winnerTeamId) {
                edges.push({
                  id: `edge-${match._id}-${nextMatch._id}`,
                  source: sourceId,
                  target: targetId,
                  animated: false,
                  style: { 
                    stroke: '#10b981', 
                    strokeWidth: 2
                  },
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#10b981',
                    width: 25,
                    height: 25
                  }
                });
              } else {
                edges.push({
                  id: `edge-${match._id}-${nextMatch._id}-pending`,
                  source: sourceId,
                  target: targetId,
                  animated: false,
                  style: { 
                    stroke: '#6b7280', 
                    strokeWidth: 1,
                    strokeDasharray: '10,5',
                    opacity: 0.5
                  },
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#6b7280',
                    width: 20,
                    height: 20
                  }
                });
              }
            }
          }
        }
      });

      currentX += horizontalSpacing;
    });

    // Generate empty match nodes for upcoming rounds
    if (sortedRounds.length > 0) {
      const lastRound = sortedRounds[sortedRounds.length - 1];
      const nextRoundNumber = lastRound.round + 1;
      const totalRounds = Math.ceil(Math.log2(teams.length));
      
      // If we haven't reached finals yet, show upcoming rounds
      if (nextRoundNumber <= totalRounds && lastRound.round < totalRounds) {
        const nextRoundMatchesCount = Math.ceil(lastRound.matches.length / 2);
        
        if (nextRoundMatchesCount > 0) {
          const roundNames: Record<number, string> = {
            [totalRounds]: "Finals",
            [totalRounds - 1]: "Semifinals",
            [totalRounds - 2]: "Quarterfinals",
            [totalRounds - 3]: "Round of 16",
            [totalRounds - 4]: "Round of 32",
          };
          
          const nextRoundName = roundNames[nextRoundNumber] || `Round ${nextRoundNumber}`;
          const horizontalSpacing = 350;
          const verticalSpacing = 120;
          const startY = 100;
          let currentX = 100 + (sortedRounds.length * horizontalSpacing);

          for (let i = 0; i < nextRoundMatchesCount; i++) {
            const yPos = startY + i * verticalSpacing;
            const isFinals = nextRoundName.toLowerCase().includes('final');
            
            const emptyNode: Node = {
              id: `empty-${nextRoundNumber}-${i}`,
              type: isFinals ? 'final' : 'emptyMatch',
              position: { x: currentX, y: yPos },
              data: {
                round: nextRoundNumber,
                roundName: nextRoundName
              }
            };
            nodes.push(emptyNode);

            // Connect from last round matches to empty nodes
            if (lastRound.matches.length > 0) {
              const sourceMatchIndex = i * 2;
              const sourceMatch = lastRound.matches[sourceMatchIndex];
              if (sourceMatch) {
                const sourceId = lastRound.roundName?.toLowerCase().includes('final')
                  ? `final-${sourceMatch._id}`
                  : `match-${sourceMatch._id}`;
                
                edges.push({
                  id: `edge-${sourceMatch._id}-empty-${nextRoundNumber}-${i}`,
                  source: sourceId,
                  target: `empty-${nextRoundNumber}-${i}`,
                  animated: false,
                  style: { 
                    stroke: '#9ca3af', 
                    strokeWidth: 1,
                    strokeDasharray: '5,5',
                    opacity: 0.4
                  },
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#9ca3af',
                    width: 20,
                    height: 20
                  }
                });
              }
            }
          }

          // If it's not finals, recursively generate more empty rounds
          if (nextRoundNumber < totalRounds) {
            generateEmptyRoundsRecursive(nodes, edges, nextRoundNumber + 1, totalRounds, currentX + horizontalSpacing, sortedRounds.length + 1);
          }
        }
      }
    }
  };

  // Recursively generate empty rounds
  const generateEmptyRoundsRecursive = (
    nodes: Node[], 
    edges: Edge[], 
    roundNumber: number, 
    totalRounds: number,
    xPos: number,
    currentRoundIndex: number
  ) => {
    if (roundNumber > totalRounds) return;

    const roundNames: Record<number, string> = {
      [totalRounds]: "Finals",
      [totalRounds - 1]: "Semifinals",
      [totalRounds - 2]: "Quarterfinals",
      [totalRounds - 3]: "Round of 16",
      [totalRounds - 4]: "Round of 32",
    };

    const roundName = roundNames[roundNumber] || `Round ${roundNumber}`;
    const horizontalSpacing = 350;
    const verticalSpacing = 120;
    const startY = 100;
    const matchesInThisRound = Math.pow(2, totalRounds - roundNumber);
    const isFinals = roundName.toLowerCase().includes('final');

    for (let i = 0; i < matchesInThisRound; i++) {
      const yPos = startY + i * verticalSpacing;
      
      const emptyNode: Node = {
        id: `empty-${roundNumber}-${i}`,
        type: isFinals ? 'final' : 'emptyMatch',
        position: { x: xPos, y: yPos },
        data: {
          round: roundNumber,
          roundName: roundName
        }
      };
      nodes.push(emptyNode);

      // Connect from previous empty round
      if (roundNumber > 1) {
        const prevRoundNumber = roundNumber - 1;
        const sourceIndex = Math.floor(i / 2);
        const sourceId = `empty-${prevRoundNumber}-${sourceIndex}`;
        
        edges.push({
          id: `edge-empty-${prevRoundNumber}-${sourceIndex}-empty-${roundNumber}-${i}`,
          source: sourceId,
          target: `empty-${roundNumber}-${i}`,
          animated: false,
          style: { 
            stroke: '#9ca3af', 
            strokeWidth: 1,
            strokeDasharray: '5,5',
            opacity: 0.4
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#9ca3af',
            width: 20,
            height: 20
          }
        });
      }
    }

    // If not finals, continue to next round
    if (roundNumber < totalRounds) {
      generateEmptyRoundsRecursive(nodes, edges, roundNumber + 1, totalRounds, xPos + horizontalSpacing, currentRoundIndex + 1);
    } else {
      // Add champion node for finals
      const championNode: Node = {
        id: `empty-champion`,
        type: 'champion',
        position: { x: xPos + horizontalSpacing, y: startY + 20 },
        data: {
          label: 'TBD'
        }
      };
      nodes.push(championNode);

      edges.push({
        id: `edge-empty-final-champion`,
        source: `empty-${roundNumber}-0`,
        target: `empty-champion`,
        animated: false,
        style: { 
          stroke: '#9ca3af', 
          strokeWidth: 1,
          strokeDasharray: '5,5',
          opacity: 0.4
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#9ca3af',
          width: 20,
          height: 20
        }
      });
    }
  };

  const generatePoolPlayBracket = (nodes: Node[], edges: Edge[]) => {
    // For pool play, show pools first, then bracket rounds
    const poolKeys = Object.keys(poolStandings).sort();
    const horizontalSpacing = 300;
    let xPos = 50;
    const verticalSpacing = 80;
    const startY = 100;

    // Show pool standings
    poolKeys.forEach((poolKey, poolIndex) => {
      const standings = poolStandings[poolKey];
      
      standings.forEach((standing, index) => {
        // For now, skip team nodes for pool play - focus on bracket matches
      });
      
      xPos += horizontalSpacing;
    });

    // Now show bracket matches grouped by rounds
    const matchesByRound = matches.reduce((acc, match) => {
      const round = match.round || 1;
      const roundName = match.roundName || `Round ${round}`;
      const key = `${round}-${roundName}`;
      
      if (!acc[key]) {
        acc[key] = {
          round: round,
          roundName: roundName,
          matches: []
        };
      }
      acc[key].matches.push(match);
      return acc;
    }, {} as Record<string, { round: number; roundName: string; matches: Match[] }>);

    const sortedRounds = Object.values(matchesByRound).sort((a, b) => a.round - b.round);

    sortedRounds.forEach((roundData, roundIndex) => {
      const { round, roundName, matches: roundMatches } = roundData;
      const isFinals = roundName.toLowerCase().includes('final');
      
      const sortedMatches = [...roundMatches].sort((a, b) => {
        if (a.bracketPosition && b.bracketPosition) return a.bracketPosition - b.bracketPosition;
        if (a.matchNumber && b.matchNumber) return a.matchNumber - b.matchNumber;
        return 0;
      });

      const numMatches = sortedMatches.length;
      const verticalSpacing = 120;
      const startY = 100;

      sortedMatches.forEach((match, matchIndex) => {
        const yPos = startY + matchIndex * verticalSpacing;

        const matchNode: Node = {
          id: `match-${match._id}`,
          type: isFinals ? 'final' : 'match',
          position: { x: xPos, y: yPos },
          data: {
            round: round,
            roundName: roundName,
            teamA: match.teamA.teamName,
            teamB: match.teamB.teamName,
            score: match.score,
            teamAWinner: match.winnerTeamId === match.teamA._id,
            teamBWinner: match.winnerTeamId === match.teamB._id,
            startTime: match.startTime,
            status: match.status,
            matchNumber: match.matchNumber
          }
        };
        nodes.push(matchNode);

        // Connect to next round
        if (roundIndex < sortedRounds.length - 1) {
          const nextRound = sortedRounds[roundIndex + 1];
          const nextMatchIndex = Math.floor(matchIndex / 2);
          if (nextMatchIndex < nextRound.matches.length) {
            const nextMatch = nextRound.matches[nextMatchIndex];
            const isNextFinals = nextMatch.roundName?.toLowerCase().includes('final');
            const targetId = isNextFinals ? `final-${nextMatch._id}` : `match-${nextMatch._id}`;

            if (match.status === 'completed' && match.winnerTeamId) {
              edges.push({
                id: `edge-${match._id}-${nextMatch._id}`,
                source: `match-${match._id}`,
                target: targetId,
                animated: false,
                style: { stroke: '#10b981', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' }
              });
            } else {
              edges.push({
                id: `edge-${match._id}-${nextMatch._id}-pending`,
                source: `match-${match._id}`,
                target: targetId,
                animated: false,
                style: { stroke: '#6b7280', strokeWidth: 1, strokeDasharray: '10,5', opacity: 0.5 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' }
              });
            }
          }
        }
      });

      xPos += horizontalSpacing;
    });
  };

  const generateRoundRobinView = (nodes: Node[], edges: Edge[]) => {
    // Group by rounds
    const matchesByRound = matches.reduce((acc, match) => {
      const round = match.round || 1;
      const roundName = match.roundName || `Round ${round}`;
      const key = `${round}-${roundName}`;
      
      if (!acc[key]) {
        acc[key] = {
          round: round,
          roundName: roundName,
          matches: []
        };
      }
      acc[key].matches.push(match);
      return acc;
    }, {} as Record<string, { round: number; roundName: string; matches: Match[] }>);

    const sortedRounds = Object.values(matchesByRound).sort((a, b) => a.round - b.round);
    const horizontalSpacing = 300;
    let xPos = 50;
    const verticalSpacing = 100;

    sortedRounds.forEach((roundData) => {
      const { roundName, matches: roundMatches } = roundData;
      
      roundMatches.forEach((match, index) => {
        const matchNode: Node = {
          id: `match-${match._id}`,
          type: 'match',
          position: { 
            x: xPos + (index % 4) * horizontalSpacing, 
            y: 100 + Math.floor(index / 4) * verticalSpacing 
          },
          data: {
            round: roundData.round,
            roundName: roundName,
            teamA: match.teamA.teamName,
            teamB: match.teamB.teamName,
            score: match.score,
            teamAWinner: match.winnerTeamId === match.teamA._id,
            teamBWinner: match.winnerTeamId === match.teamB._id,
            status: match.status,
            startTime: match.startTime,
            matchNumber: match.matchNumber
          }
        };
        nodes.push(matchNode);
      });

      xPos += horizontalSpacing * 4;
    });
  };

  const selectedTournament = tournaments.find(t => t._id === selectedTournamentId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-32">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Tournament Bracket</h1>
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
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {selectedTournament && (
          <>
            {/* Pool Standings (if pool play) */}
            {selectedTournament.format === 'pool-play-bracket' && Object.keys(poolStandings).length > 0 && (
              <div className="grid gap-6 lg:grid-cols-2 mb-8">
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
                    {selectedTournament.format === 'single-elimination' ? 'Elimination Bracket' : 
                     selectedTournament.format === 'pool-play-bracket' ? 'Playoff Bracket' : 
                     'Tournament Matches'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[800px] rounded-lg border border-border/50 bg-background/30 overflow-hidden">
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      nodeTypes={nodeTypes}
                      fitView
                      fitViewOptions={{ padding: 0.2 }}
                      minZoom={0.2}
                      maxZoom={2}
                      defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
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
            <p className="text-muted-foreground">Please select a tournament to view the bracket.</p>
          </Card>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default PoolBracket;
