import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Users, Map, Gamepad2 } from "lucide-react";

interface ServerData {
  sv_hostname?: string;
  mapname?: string;
  clients?: number;
  sv_maxclients?: number;
  gametype?: string;
}

export const ServerStatus = () => {
  const [server, setServer] = useState<ServerData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchServerStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-server-status');
      
      if (error) throw error;
      
      const stbServers = data?.stbServers || [];
      // Find the main STB server (port 6198)
      const mainServer = stbServers.find((s: any) => 
        String(s.port) === '6198' || String(s.sv_hostname || '').toLowerCase().includes('stb')
      ) || stbServers[0] || null;
      
      setServer(mainServer);
    } catch (error) {
      console.error('Error fetching server status:', error);
      setServer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerStatus();
    const interval = setInterval(fetchServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = !!server;
  const hostname = server?.sv_hostname?.replace(/\^[0-9]/g, '') || 'STB Gaming';

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-foreground">Server Status</h3>
          <div className="flex items-center space-x-2">
            <Activity className={`h-5 w-5 ${isOnline ? 'text-green-500 animate-pulse' : 'text-red-500'}`} />
            <span className={`text-sm font-medium ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
              {loading ? 'CHECKING...' : isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-muted-foreground">
            <Gamepad2 className="h-5 w-5" />
            <span className="text-sm">IP: 5.39.63.207:6198</span>
          </div>

          {isOnline && (
            <>
              <div className="flex items-center space-x-3 text-muted-foreground">
                <Users className="h-5 w-5" />
                <span className="text-sm">
                  Players: {server.clients || 0}/{server.sv_maxclients || 0}
                </span>
              </div>

              {server.mapname && (
                <div className="flex items-center space-x-3 text-muted-foreground">
                  <Map className="h-5 w-5" />
                  <span className="text-sm">Map: {server.mapname}</span>
                </div>
              )}

              {server.gametype && (
                <div className="flex items-center space-x-3 text-muted-foreground">
                  <Gamepad2 className="h-5 w-5" />
                  <span className="text-sm">Mode: {server.gametype}</span>
                </div>
              )}
            </>
          )}

          {!isOnline && !loading && (
            <p className="text-sm text-muted-foreground">Server is currently offline</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
