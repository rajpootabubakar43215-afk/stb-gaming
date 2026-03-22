import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching masterlist from cod.pm API');
    
    const response = await fetch('https://api.cod.pm/masterlist/cod/1.1');
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    const servers = data?.servers || data || [];
    
    // Find STB Gaming servers
    const stbServers = (Array.isArray(servers) ? servers : []).filter((s: any) => {
      const hostname = (s.sv_hostname || s.hostname || '').toLowerCase();
      return hostname.includes('stb');
    });
    
    console.log(`Found ${stbServers.length} STB servers out of ${servers.length} total`);

    return new Response(
      JSON.stringify({ stbServers, totalServers: servers.length }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error fetching server status:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        stbServers: [],
        totalServers: 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
