import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, ArrowLeft, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  username: string;
  wallpaper_url: string | null;
  username_color: string | null;
  created_at: string;
}

interface UserRole {
  role: 'admin' | 'moderator' | 'member';
}

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkOwner();
    if (userId) {
      fetchProfile();
      fetchRoles();
    }
  }, [userId]);

  const checkOwner = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      
      if (data?.username === "Abubakar") {
        setIsOwner(true);
      }
    }
  };

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const fetchRoles = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (data) {
      setRoles(data);
    }
  };

  const handleAddRole = async (role: 'admin' | 'moderator' | 'member') => {
    if (!userId) return;

    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: role });

    if (error) {
      if (error.message.includes("duplicate")) {
        toast.error("User already has this role");
      } else {
        toast.error("Failed to add role");
      }
    } else {
      toast.success("Role added successfully");
      fetchRoles();
    }
  };

  const handleRemoveRole = async (role: 'admin' | 'moderator' | 'member') => {
    if (!userId) return;

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);

    if (error) {
      toast.error("Failed to remove role");
    } else {
      toast.success("Role removed successfully");
      fetchRoles();
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12 text-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="mb-4 border-primary/50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="border-primary/20 bg-card/50 backdrop-blur card-hover">
          {profile.wallpaper_url && (
            <div className="w-full h-64 rounded-t-lg overflow-hidden">
              <img
                src={profile.wallpaper_url}
                alt="Profile Wallpaper"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-4 border-primary/30">
                <AvatarImage src={profile.wallpaper_url || ''} />
                <AvatarFallback>{profile.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle
                  className="text-3xl text-glow-intense"
                  style={{ color: profile.username_color || '#ffffff' }}
                >
                  {profile.username}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Roles
              </h3>
              <div className="flex flex-wrap gap-2">
                {roles.length === 0 ? (
                  <Badge variant="outline">Member</Badge>
                ) : (
                  roles.map((r) => (
                    <Badge
                      key={r.role}
                      className="bg-gradient-primary"
                    >
                      {r.role}
                      {isOwner && (
                        <button
                          onClick={() => handleRemoveRole(r.role)}
                          className="ml-2 hover:text-red-500"
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {isOwner && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Assign Role</h3>
                <Select onValueChange={handleAddRole}>
                  <SelectTrigger className="bg-background/50 border-primary/20">
                    <SelectValue placeholder="Select a role to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
