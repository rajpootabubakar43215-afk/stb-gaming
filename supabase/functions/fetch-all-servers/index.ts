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
    console.log('Fetching all servers from cod.pm API');
    
    const response = await fetch('https://api.cod.pm/masterlist/cod/1.1');
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    const servers = data?.servers || data || [];
    
    console.log(`Received ${Array.isArray(servers) ? servers.length : 0} servers`);

    return new Response(
      JSON.stringify(Array.isArray(servers) ? servers : []),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error fetching servers:', error);
    
    return new Response(
      JSON.stringify([]),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
