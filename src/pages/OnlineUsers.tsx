import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";

interface OnlineUser {
  id: string;
  username: string;
  wallpaper_url: string | null;
  username_color: string | null;
  last_seen: string;
}

export default function OnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    fetchOnlineUsers();

    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchOnlineUsers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOnlineUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, wallpaper_url, username_color')
      .order('username', { ascending: true });

    if (data) {
      setOnlineUsers(data.map(user => ({
        ...user,
        last_seen: new Date().toISOString()
      })));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <Card className="border-primary/20 bg-card/50 backdrop-blur card-hover">
          <CardHeader>
            <CardTitle className="text-3xl text-glow-intense flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Registered Users ({onlineUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {onlineUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No registered users yet</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {onlineUsers.map((user) => (
                  <Link key={user.id} to={`/profile/${user.id}`}>
                    <Card className="border-primary/20 hover:border-primary/50 transition-all cursor-pointer">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-primary/30">
                          <AvatarImage src={user.wallpaper_url || ''} />
                          <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p
                            className="font-semibold"
                            style={{ color: user.username_color || '#ffffff' }}
                          >
                            {user.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Member
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
