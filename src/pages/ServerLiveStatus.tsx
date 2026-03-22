import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, Map, Gamepad2, RefreshCw, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServerData {
  ip: string;
  port: number;
  sv_hostname?: string;
  hostname?: string;
  mapname?: string;
  g_gametype?: string;
  gametype?: string;
  clients?: number;
  bots?: number;
  sv_maxclients?: number;
  g_needpass?: string;
  country?: string;
  playerinfo?: Array<{ name?: string; score?: number; ping?: number }>;
}

function cleanCodColors(text: string): string {
  return text.replace(/\^[0-9]/g, '');
}

export default function ServerLiveStatus() {
  const [stbServers, setStbServers] = useState<ServerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchServerStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-server-status`);
      const data = await response.json();
      console.log('STB server data:', data);
      setStbServers(data.stbServers || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching server status:', error);
      setStbServers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerStatus();
    const interval = setInterval(fetchServerStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground">STB Servers Status</h1>
              <p className="text-muted-foreground mt-1">
                Live status of all STB Gaming servers • Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
            <Button onClick={fetchServerStatus} variant="outline" size="icon">
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {loading && stbServers.length === 0 ? (
            <Card className="border-primary/20 bg-card/50 backdrop-blur">
              <CardContent className="p-8 text-center text-muted-foreground">
                Loading server status...
              </CardContent>
            </Card>
          ) : stbServers.length === 0 ? (
            <Card className="border-primary/20 bg-card/50 backdrop-blur">
              <CardContent className="p-8 text-center text-muted-foreground">
                No STB servers found online at the moment.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {stbServers.map((server, index) => {
                const hostname = cleanCodColors(server.sv_hostname || server.hostname || 'Unknown');
                const players = (server.clients || 0) + (server.bots || 0);
                const maxPlayers = server.sv_maxclients || 0;
                const mapName = server.mapname || 'N/A';
                const gameType = server.g_gametype || server.gametype || 'N/A';
                const ipPort = `${server.ip}:${server.port}`;
                const isOnline = true;

                return (
                  <Card key={`${server.ip}:${server.port}`} className="border-primary/20 bg-card/50 backdrop-blur">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">{hostname}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Activity className="h-5 w-5 text-green-500 animate-pulse" />
                          <span className="text-sm font-bold text-green-500">ONLINE</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-3 p-3 bg-background/50 rounded-lg">
                          <Globe className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">IP:Port</p>
                            <p className="font-mono font-semibold text-sm">{ipPort}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-background/50 rounded-lg">
                          <Users className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Players</p>
                            <p className="font-semibold">{players}/{maxPlayers}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-background/50 rounded-lg">
                          <Map className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Map</p>
                            <p className="font-semibold">{mapName}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-background/50 rounded-lg">
                          <Gamepad2 className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Game Mode</p>
                            <p className="font-semibold">{gameType}</p>
                          </div>
                        </div>

                        {server.country && (
                          <div className="flex items-center space-x-3 p-3 bg-background/50 rounded-lg">
                            <Globe className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Country</p>
                              <p className="font-semibold">{server.country}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Player List */}
                      {server.playerinfo && server.playerinfo.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2">Online Players</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {server.playerinfo.map((player, pIdx) => (
                              <div key={pIdx} className="flex items-center justify-between p-2 bg-background/30 rounded text-sm">
                                <span className="truncate">{cleanCodColors(player.name || 'Unknown')}</span>
                                <span className="text-muted-foreground text-xs ml-2">{player.score || 0} pts</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
