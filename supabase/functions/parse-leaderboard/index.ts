import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Parse game log lines to extract player stats
function parseGameLog(logContent: string): Map<string, any> {
  const players = new Map<string, any>();

  const getPlayer = (name: string) => {
    if (!name || name === '' || name === 'world') return null;
    // Clean color codes
    const cleanName = name.replace(/\^[0-9]/g, '').trim();
    if (!cleanName) return null;
    
    if (!players.has(cleanName)) {
      players.set(cleanName, {
        player_name: cleanName,
        kills: 0,
        deaths: 0,
        headshots: 0,
        matches_played: 0,
        wins: 0,
        plants: 0,
        defuses: 0,
        grenades: 0,
      });
    }
    return players.get(cleanName);
  };

  const lines = logContent.split('\n');
  const playersInMatch = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();

    // Kill event: K;<victim>;<attacker>;<weapon>;<damage>;<meansOfDeath>;<hitLocation>
    // Common format: K;victim_guid;victim_slot;victim_team;victim_name;attacker_guid;attacker_slot;attacker_team;attacker_name;weapon;damage;meansOfDeath;hitLocation
    if (trimmed.startsWith('K;')) {
      const parts = trimmed.split(';');
      if (parts.length >= 12) {
        const victimName = parts[4];
        const attackerName = parts[8];
        const hitLocation = parts[12] || '';
        const weapon = parts[9] || '';

        const attacker = getPlayer(attackerName);
        const victim = getPlayer(victimName);

        if (attacker && attackerName !== victimName) {
          attacker.kills++;
          if (hitLocation?.toLowerCase() === 'head') {
            attacker.headshots++;
          }
          if (weapon?.toLowerCase().includes('frag') || weapon?.toLowerCase().includes('grenade')) {
            attacker.grenades++;
          }
        }
        if (victim) {
          victim.deaths++;
        }

        if (attackerName) playersInMatch.add(attackerName.replace(/\^[0-9]/g, '').trim());
        if (victimName) playersInMatch.add(victimName.replace(/\^[0-9]/g, '').trim());
      }
    }

    // Damage event for grenade tracking
    if (trimmed.startsWith('D;')) {
      const parts = trimmed.split(';');
      if (parts.length >= 12) {
        const weapon = parts[9] || '';
        const attackerName = parts[8];
        if (weapon?.toLowerCase().includes('frag') || weapon?.toLowerCase().includes('grenade')) {
          // Already tracked in kills
        }
      }
    }

    // Bomb plant
    if (trimmed.includes('Planted') || trimmed.includes('planted') || trimmed.includes('bomb_plant')) {
      // Try to extract player name
      const match = trimmed.match(/;([^;]+);.*(?:plant|Planted)/i);
      if (match) {
        const player = getPlayer(match[1]);
        if (player) player.plants++;
      }
    }

    // Bomb defuse
    if (trimmed.includes('Defused') || trimmed.includes('defused') || trimmed.includes('bomb_defuse')) {
      const match = trimmed.match(/;([^;]+);.*(?:defuse|Defused)/i);
      if (match) {
        const player = getPlayer(match[1]);
        if (player) player.defuses++;
      }
    }

    // Round/match end - track wins
    if (trimmed.includes('W;') || trimmed.includes('Win_') || trimmed.includes('round_win')) {
      const parts = trimmed.split(';');
      if (parts.length >= 4) {
        const winnerName = parts[3] || parts[2];
        const winner = getPlayer(winnerName);
        if (winner) winner.wins++;
      }
    }

    // Init game / map restart - count matches
    if (trimmed.includes('InitGame') || trimmed.includes('map_restart')) {
      // Mark all known players for match count
      for (const name of playersInMatch) {
        const player = getPlayer(name);
        if (player) player.matches_played++;
      }
      playersInMatch.clear();
    }
  }

  // Final match count for remaining players
  for (const name of playersInMatch) {
    const player = getPlayer(name);
    if (player) player.matches_played++;
  }

  return players;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sftpHost = Deno.env.get('SFTP_HOST');
    const sftpPort = Deno.env.get('SFTP_PORT') || '2022';
    const sftpUser = Deno.env.get('SFTP_USER');
    const sftpPass = Deno.env.get('SFTP_PASS');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!sftpHost || !sftpUser || !sftpPass) {
      throw new Error('SFTP credentials not configured');
    }

    // Since Deno doesn't have native SFTP support, we'll use an HTTP-based approach
    // For now, let's try to fetch the log via alternative methods
    // We'll use a simple approach: try to read from the game server's log endpoint
    
    // Alternative: Use the RCON to get status or fetch logs via HTTP if available
    // For production, you'd set up a small HTTP server on the game server to serve logs
    // Or use a cron job to sync logs to Supabase storage
    
    // For now, let's create a manual endpoint where logs can be uploaded
    // and also support direct log text in the request body
    
    let logContent = '';
    
    if (req.method === 'POST') {
      const body = await req.json();
      logContent = body.log_content || '';
    }

    if (!logContent) {
      // Return current leaderboard from database
      const supabaseClient = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabaseClient
        .from('leaderboard')
        .select('*')
        .order('kills', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ leaderboard: data, source: 'database' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the log
    const players = parseGameLog(logContent);
    const playerStats = Array.from(players.values());

    console.log(`Parsed ${playerStats.length} players from log`);

    // Upsert to database
    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    
    for (const stats of playerStats) {
      // Check if player exists
      const { data: existing } = await supabaseClient
        .from('leaderboard')
        .select('*')
        .eq('player_name', stats.player_name)
        .maybeSingle();

      if (existing) {
        // Update - add to existing stats
        await supabaseClient
          .from('leaderboard')
          .update({
            kills: (existing.kills || 0) + stats.kills,
            deaths: (existing.deaths || 0) + stats.deaths,
            headshots: (existing.headshots || 0) + stats.headshots,
            matches_played: (existing.matches_played || 0) + stats.matches_played,
            wins: (existing.wins || 0) + stats.wins,
            plants: (existing.plants || 0) + stats.plants,
            defuses: (existing.defuses || 0) + stats.defuses,
            grenades: (existing.grenades || 0) + stats.grenades,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabaseClient
          .from('leaderboard')
          .insert(stats);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        players_processed: playerStats.length,
        leaderboard: playerStats 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
