import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileCode, Download } from "lucide-react";
import { toast } from "sonner";

export default function ConfigGenerator() {
  const [config, setConfig] = useState({
    gamename: "Call of Duty",
    owner: "",
    distro: "",
    location: "",
    maxclients: "32",
    hostname: "",
    motd: "",
    sv_pure: "0",
    gametype: "dm",
    rconpassword: "",
    g_password: "",
    sv_privatepassword: "",
    privateclients: "0",
    allowdownload: "1",
    cheats: "0",
    g_logsync: "0",
    logfile: "1",
    fps: "20",
    allowanonymous: "0",
    floodprotect: "1",
    inactivity: "0",
    maxrate: "25000",
    maxping: "0",
    minping: "0",
    allowvote: "1",
    scr_allow_vote: "1",
    drawfriend: "1",
    forcerespawn: "0",
    friendlyfire: "1",
    scorelimit: "50",
    timelimit: "15",
  });

  const [weapons, setWeapons] = useState({
    m1carbine: "1",
    m1garand: "1",
    enfield: "1",
    bar: "1",
    bren: "1",
    mp40: "1",
    mp44: "1",
    sten: "1",
    ppsh: "1",
    fg42: "1",
    thompson: "1",
    panzerfaust: "1",
    springfield: "1",
    kar98ksniper: "1",
    nagantsniper: "1",
    kar98k: "1",
    nagant: "1",
    mg42: "1",
  });

  const handleChange = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleWeaponToggle = (weapon: string) => {
    setWeapons(prev => ({ ...prev, [weapon]: prev[weapon as keyof typeof prev] === "1" ? "0" : "1" }));
  };

  const generateConfig = () => {
    const configText = `// Add server to xFire
set gamename "${config.gamename}"

// Developer settings
set developer ""
set developer_script ""

// Server information
sets ^1Owner "${config.owner}"
sets ^1Distro "${config.distro}"
sets ^1Location "${config.location}"

// Server options
set sv_maxclients "${config.maxclients}"
set sv_hostname "${config.hostname}"
set scr_motd "${config.motd}"
set sv_pure "${config.sv_pure}"
set g_gametype "${config.gametype}"

set rconpassword "${config.rconpassword}"
set g_password "${config.g_password}"
set sv_privatepassword "${config.sv_privatepassword}"

set sv_privateclients "${config.privateclients}"
set sv_allowdownload "${config.allowdownload}"
set sv_cheats "${config.cheats}"

set g_log "games_mp.log"
set g_logsync "${config.g_logsync}"
set logfile "${config.logfile}"

set sv_fps "${config.fps}"
set sv_allowanonymous "${config.allowanonymous}"
set sv_floodprotect "${config.floodprotect}"
set g_inactivity "${config.inactivity}"

// Network options
set sv_maxrate "${config.maxrate}"
set sv_maxping "${config.maxping}"
set sv_minping "${config.minping}"

// Additional masterservers (up to sv_master5, sv_master1 default to Activision)
set sv_master2 "master.cod.pm"

// Game options (stock gametypes)
set g_allowvote "${config.allowvote}"
set scr_allow_vote "${config.scr_allow_vote}"
set scr_drawfriend "${config.drawfriend}"
set scr_forcerespawn "${config.forcerespawn}"
set scr_friendlyfire "${config.friendlyfire}"

// Deathmatch
set scr_dm_scorelimit "50"
set scr_dm_timelimit "30"

// Team Deathmatch
set scr_tdm_scorelimit "100"
set scr_tdm_timelimit "30"

// Behind Enemy Lines
set scr_bel_scorelimit "50"
set scr_bel_timelimit "30"
set scr_bel_alivepointtime "10"

// Retrieval
set scr_re_scorelimit "10"
set scr_re_timelimit "0"
set scr_re_graceperiod "15"
set scr_re_roundlength "2.50"
set scr_re_roundlimit "0"
set scr_re_showcarrier "0"

// Search and Destroy
set scr_sd_scorelimit "10"
set scr_sd_timelimit "0"
set scr_sd_graceperiod "20"
set scr_sd_roundlength "2.50"
set scr_sd_roundlimit "0"

// Weapons
set scr_allow_m1carbine "${weapons.m1carbine}"
set scr_allow_m1garand "${weapons.m1garand}"
set scr_allow_enfield "${weapons.enfield}"
set scr_allow_bar "${weapons.bar}"
set scr_allow_bren "${weapons.bren}"
set scr_allow_mp40 "${weapons.mp40}"
set scr_allow_mp44 "${weapons.mp44}"
set scr_allow_sten "${weapons.sten}"
set scr_allow_ppsh "${weapons.ppsh}"
set scr_allow_fg42 "${weapons.fg42}"
set scr_allow_thompson "${weapons.thompson}"
set scr_allow_panzerfaust "${weapons.panzerfaust}"
set scr_allow_springfield "${weapons.springfield}"
set scr_allow_kar98ksniper "${weapons.kar98ksniper}"
set scr_allow_nagantsniper "${weapons.nagantsniper}"
set scr_allow_kar98k "${weapons.kar98k}"
set scr_allow_nagant "${weapons.nagant}"
set scr_allow_mg42 "${weapons.mg42}"

// Execute CoDaM Configuration
exec CoDaM.cfg
exec CoDaM_HamGoodies.cfg
exec CoDaM_MiscMod.cfg

map_rotate`;

    const blob = new Blob([configText], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "server.cfg";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success("Config file downloaded!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <Card className="border-primary/20 bg-card/50 backdrop-blur mb-6 card-hover border-glow">
          <CardHeader>
            <CardTitle className="text-3xl text-glow-intense flex items-center gap-3 justify-center">
              <FileCode className="h-8 w-8 text-primary" />
              CoD 1.1 Config Generator
            </CardTitle>
            <p className="text-center text-muted-foreground">Generate your Call of Duty 1.1 server configuration file</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner">Owner Name</Label>
                <Input
                  id="owner"
                  value={config.owner}
                  onChange={(e) => handleChange("owner", e.target.value)}
                  placeholder="Your name"
                  className="bg-background/50 border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hostname">Server Hostname</Label>
                <Input
                  id="hostname"
                  value={config.hostname}
                  onChange={(e) => handleChange("hostname", e.target.value)}
                  placeholder="STB Server"
                  className="bg-background/50 border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={config.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="Pakistan"
                  className="bg-background/50 border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxclients">Max Clients</Label>
                <Input
                  id="maxclients"
                  type="number"
                  value={config.maxclients}
                  onChange={(e) => handleChange("maxclients", e.target.value)}
                  className="bg-background/50 border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gametype">Game Type</Label>
                <Select value={config.gametype} onValueChange={(value) => handleChange("gametype", value)}>
                  <SelectTrigger className="bg-background/50 border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dm">Deathmatch</SelectItem>
                    <SelectItem value="tdm">Team Deathmatch</SelectItem>
                    <SelectItem value="bel">Behind Enemy Lines</SelectItem>
                    <SelectItem value="re">Retrieval</SelectItem>
                    <SelectItem value="sd">Search and Destroy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rconpassword">RCON Password</Label>
                <Input
                  id="rconpassword"
                  type="password"
                  value={config.rconpassword}
                  onChange={(e) => handleChange("rconpassword", e.target.value)}
                  placeholder="Admin password"
                  className="bg-background/50 border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="g_password">Server Password (Optional)</Label>
                <Input
                  id="g_password"
                  type="password"
                  value={config.g_password}
                  onChange={(e) => handleChange("g_password", e.target.value)}
                  placeholder="Leave empty for public"
                  className="bg-background/50 border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fps">Server FPS</Label>
                <Input
                  id="fps"
                  type="number"
                  value={config.fps}
                  onChange={(e) => handleChange("fps", e.target.value)}
                  className="bg-background/50 border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scorelimit">Score Limit</Label>
                <Input
                  id="scorelimit"
                  type="number"
                  value={config.scorelimit}
                  onChange={(e) => handleChange("scorelimit", e.target.value)}
                  className="bg-background/50 border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timelimit">Time Limit (minutes)</Label>
                <Input
                  id="timelimit"
                  type="number"
                  value={config.timelimit}
                  onChange={(e) => handleChange("timelimit", e.target.value)}
                  className="bg-background/50 border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timelimit">Time Limit (minutes)</Label>
                <Input
                  id="timelimit"
                  type="number"
                  value={config.timelimit}
                  onChange={(e) => handleChange("timelimit", e.target.value)}
                  className="bg-background/50 border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motd">Message of the Day</Label>
                <Input
                  id="motd"
                  value={config.motd}
                  onChange={(e) => handleChange("motd", e.target.value)}
                  placeholder="Welcome to STB!"
                  className="bg-background/50 border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="distro">Distribution</Label>
                <Input
                  id="distro"
                  value={config.distro}
                  onChange={(e) => handleChange("distro", e.target.value)}
                  placeholder="CoDaM"
                  className="bg-background/50 border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxrate">Max Rate</Label>
                <Input
                  id="maxrate"
                  type="number"
                  value={config.maxrate}
                  onChange={(e) => handleChange("maxrate", e.target.value)}
                  className="bg-background/50 border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowvote">Allow Vote (0/1)</Label>
                <Input
                  id="allowvote"
                  value={config.allowvote}
                  onChange={(e) => handleChange("allowvote", e.target.value)}
                  className="bg-background/50 border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="drawfriend">Draw Friend (0/1)</Label>
                <Input
                  id="drawfriend"
                  value={config.drawfriend}
                  onChange={(e) => handleChange("drawfriend", e.target.value)}
                  className="bg-background/50 border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="friendlyfire">Friendly Fire (0/1)</Label>
                <Input
                  id="friendlyfire"
                  value={config.friendlyfire}
                  onChange={(e) => handleChange("friendlyfire", e.target.value)}
                  className="bg-background/50 border-primary/20"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-lg font-semibold">Weapons (Click to Enable/Disable)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.entries(weapons).map(([weapon, enabled]) => (
                  <Button
                    key={weapon}
                    type="button"
                    variant={enabled === "1" ? "default" : "outline"}
                    onClick={() => handleWeaponToggle(weapon)}
                    className={enabled === "1" ? "bg-gradient-primary" : "border-primary/30"}
                  >
                    {weapon.replace(/([A-Z])/g, ' $1').toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={generateConfig}
              className="w-full bg-gradient-primary hover:opacity-90 text-lg py-6"
            >
              <Download className="mr-2 h-5 w-5" />
              Generate & Download Config
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
