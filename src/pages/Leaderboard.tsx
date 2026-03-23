import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Skull, Crosshair, Target, Bomb, Shield, Flame, Gamepad2, RefreshCw, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LeaderboardEntry {
  id: string;
  player_name: string;
  kills: number;
  deaths: number;
  headshots: number;
  matches_played: number;
  wins: number;
  plants: number;
  defuses: number;
  grenades: number;
  updated_at: string;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<keyof LeaderboardEntry>('kills');

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('kills', { ascending: false });

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const sorted = [...leaderboard].sort((a, b) => {
    const aVal = (a[sortBy] as number) || 0;
    const bVal = (b[sortBy] as number) || 0;
    return bVal - aVal;
  });

  const getKD = (kills: number, deaths: number) => {
    if (!deaths) return kills.toFixed(2);
    return (kills / deaths).toFixed(2);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm text-muted-foreground font-mono w-5 text-center">{index + 1}</span>;
  };

  const statColumns: { key: keyof LeaderboardEntry; label: string; icon: React.ReactNode }[] = [
    { key: 'kills', label: 'Kills', icon: <Crosshair className="h-4 w-4" /> },
    { key: 'deaths', label: 'Deaths', icon: <Skull className="h-4 w-4" /> },
    { key: 'headshots', label: 'Headshots', icon: <Target className="h-4 w-4" /> },
    { key: 'wins', label: 'Wins', icon: <Trophy className="h-4 w-4" /> },
    { key: 'matches_played', label: 'Matches', icon: <Gamepad2 className="h-4 w-4" /> },
    { key: 'plants', label: 'Plants', icon: <Bomb className="h-4 w-4" /> },
    { key: 'defuses', label: 'Defuses', icon: <Shield className="h-4 w-4" /> },
    { key: 'grenades', label: 'Grenades', icon: <Flame className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-glow-intense flex items-center gap-3">
              <Trophy className="h-10 w-10 text-primary" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground mt-2">STB Gaming Server Player Statistics</p>
          </div>
          <Button
            onClick={fetchLeaderboard}
            variant="outline"
            className="border-primary/50 hover:bg-primary/10"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Top 3 Players */}
        {sorted.length >= 3 && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {sorted.slice(0, 3).map((player, i) => (
              <Card key={player.id} className={`border-primary/20 bg-card/50 backdrop-blur card-hover ${i === 0 ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : ''}`}>
                <CardContent className="p-6 text-center">
                  <div className="mb-3">{getRankIcon(i)}</div>
                  <h3 className={`text-xl font-bold mb-2 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : 'text-amber-700'}`}>
                    {player.player_name}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Kills:</span>
                      <span className="ml-1 font-bold text-foreground">{player.kills || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">K/D:</span>
                      <span className="ml-1 font-bold text-green-500">{getKD(player.kills || 0, player.deaths || 0)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Wins:</span>
                      <span className="ml-1 font-bold text-foreground">{player.wins || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">HS:</span>
                      <span className="ml-1 font-bold text-foreground">{player.headshots || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Full Leaderboard Table */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl">All Players</CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              {statColumns.map(col => (
                <Button
                  key={col.key}
                  variant={sortBy === col.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy(col.key)}
                  className={sortBy === col.key ? "bg-gradient-primary" : "border-primary/50 hover:bg-primary/10"}
                >
                  {col.icon}
                  <span className="ml-1">{col.label}</span>
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading leaderboard...</div>
            ) : sorted.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No player data available yet</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead className="text-center">Kills</TableHead>
                      <TableHead className="text-center">Deaths</TableHead>
                      <TableHead className="text-center">K/D</TableHead>
                      <TableHead className="text-center">Headshots</TableHead>
                      <TableHead className="text-center">Wins</TableHead>
                      <TableHead className="text-center">Matches</TableHead>
                      <TableHead className="text-center">Plants</TableHead>
                      <TableHead className="text-center">Defuses</TableHead>
                      <TableHead className="text-center">Grenades</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((player, index) => (
                      <TableRow key={player.id} className={index < 3 ? 'bg-primary/5' : ''}>
                        <TableCell>{getRankIcon(index)}</TableCell>
                        <TableCell className="font-bold text-foreground">{player.player_name}</TableCell>
                        <TableCell className="text-center">{player.kills || 0}</TableCell>
                        <TableCell className="text-center">{player.deaths || 0}</TableCell>
                        <TableCell className="text-center text-green-500 font-mono">
                          {getKD(player.kills || 0, player.deaths || 0)}
                        </TableCell>
                        <TableCell className="text-center">{player.headshots || 0}</TableCell>
                        <TableCell className="text-center">{player.wins || 0}</TableCell>
                        <TableCell className="text-center">{player.matches_played || 0}</TableCell>
                        <TableCell className="text-center">{player.plants || 0}</TableCell>
                        <TableCell className="text-center">{player.defuses || 0}</TableCell>
                        <TableCell className="text-center">{player.grenades || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
