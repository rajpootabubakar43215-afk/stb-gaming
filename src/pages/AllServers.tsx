import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Map, Gamepad2, RefreshCw, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface Server {
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
}

function cleanCodColors(text: string): string {
  return text.replace(/\^[0-9]/g, '');
}

export default function AllServers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchServers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-all-servers`);
      const data = await response.json();
      
      const sortedServers = (Array.isArray(data) ? data : [])
        .sort((a: Server, b: Server) => {
          const aPlayers = (a.clients || 0) + (a.bots || 0);
          const bPlayers = (b.clients || 0) + (b.bots || 0);
          return bPlayers - aPlayers;
        })
        .slice(0, 20);
      
      setServers(sortedServers);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching servers:', error);
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground">All Servers</h1>
              <p className="text-muted-foreground mt-2">
                Top 20 Call of Duty 1.1 servers • Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
            <Button onClick={fetchServers} variant="outline" size="icon">
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Server List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Server Name</TableHead>
                      <TableHead>IP:Port</TableHead>
                      <TableHead>Map</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead className="text-right">Players</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : servers.length > 0 ? (
                      servers.map((server, index) => {
                        const hostname = cleanCodColors(server.sv_hostname || server.hostname || 'Unknown');
                        const players = (server.clients || 0) + (server.bots || 0);
                        const maxPlayers = server.sv_maxclients || 0;
                        
                        return (
                          <TableRow key={`${server.ip}:${server.port}`}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {server.g_needpass === '1' && (
                                  <Lock className="h-4 w-4 text-yellow-500" />
                                )}
                                <span className="truncate max-w-xs">{hostname}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {server.ip}:{server.port}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Map className="h-4 w-4 text-muted-foreground" />
                                <span>{server.mapname || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                                <span>{server.g_gametype || server.gametype || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Users className="h-4 w-4 text-primary" />
                                <span className="font-semibold">{players}/{maxPlayers}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No servers found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
