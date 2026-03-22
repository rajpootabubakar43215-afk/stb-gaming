import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serverIp = '5.39.63.207';
    const serverPort = 7919;
    
    console.log(`Checking server status for ${serverIp}:${serverPort}`);

    // Query CoD 1.1 server using UDP protocol
    // CoD uses a specific query protocol
    const socket = Deno.listenDatagram({
      port: 0,
      transport: "udp",
      hostname: "0.0.0.0"
    });

    const queryCommand = new TextEncoder().encode("\xff\xff\xff\xffgetstatus\n");
    await socket.send(queryCommand, { transport: "udp", hostname: serverIp, port: serverPort });

    const buffer = new Uint8Array(4096);
    const [bytesRead, _] = await Promise.race([
      socket.receive(buffer),
      new Promise<[number, Deno.NetAddr]>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 5000)
      )
    ]);
    
    if (typeof bytesRead === 'number' && bytesRead > 0) {
      const response = new TextDecoder().decode(buffer.subarray(0, bytesRead));
      console.log('Server response:', response);
      
      // Parse server info
      const lines = response.split('\n');
      let serverInfo: any = {
        online: true,
        name: 'STB',
        map: 'Unknown',
        players: 0,
        maxPlayers: 0,
        gameType: 'Unknown'
      };

      // Parse response (CoD server response format)
      if (response.includes('\\')) {
        const parts = response.split('\\');
        for (let i = 0; i < parts.length - 1; i += 2) {
          const key = parts[i].toLowerCase();
          const value = parts[i + 1];
          
          if (key === 'hostname' || key === 'sv_hostname') {
            serverInfo.name = value;
          } else if (key === 'mapname') {
            serverInfo.map = value;
          } else if (key === 'clients') {
            serverInfo.players = parseInt(value) || 0;
          } else if (key === 'sv_maxclients') {
            serverInfo.maxPlayers = parseInt(value) || 0;
          } else if (key === 'gametype' || key === 'g_gametype') {
            serverInfo.gameType = value;
          }
        }
      }

      socket.close();

      return new Response(
        JSON.stringify(serverInfo),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    socket.close();

    // If no response, return offline status
    return new Response(
      JSON.stringify({ 
        online: false,
        name: 'STB',
        message: 'Server is offline'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking server status:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Return offline status on error
    return new Response(
      JSON.stringify({ 
        online: false,
        name: 'STB',
        message: 'Unable to connect to server',
        error: errorMessage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});