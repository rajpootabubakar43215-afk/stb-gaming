import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Mic, X, Smile, Sticker, Play, Pause } from "lucide-react";
import { User } from "@supabase/supabase-js";
import EmojiPicker from "emoji-picker-react";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function Chat() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();
  const { isRecording, audioBlob, startRecording, stopRecording, cancelRecording, setAudioBlob } = useVoiceRecorder();

  const stickers = ["😀", "😂", "❤️", "👍", "🎉", "🔥", "✨", "💯", "🚀", "⭐", "💪", "🙌"];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(100);
      
      if (data) {
        setMessages(data);
        fetchProfiles(data);
      }
    };

    const fetchProfiles = async (msgs: any[]) => {
      const userIds = [...new Set(msgs.map(m => m.user_id).filter(Boolean))];
      const { data } = await supabase
        .from("profiles")
        .select("id, wallpaper_url, username_color")
        .in("id", userIds);
      
      if (data) {
        const profileMap: Record<string, any> = {};
        data.forEach(p => {
          profileMap[p.id] = { 
            wallpaper_url: p.wallpaper_url || "",
            username_color: p.username_color || "#ffffff"
          };
        });
        setProfiles(profileMap);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel("chat-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages"
        },
        async (payload) => {
          const newMsg = payload.new as any;
          setMessages((prev) => [...prev, newMsg]);
          
          // Fetch profile if not loaded
          if (newMsg.user_id && !profiles[newMsg.user_id]) {
            const { data } = await supabase
              .from("profiles")
              .select("id, wallpaper_url, username_color")
              .eq("id", newMsg.user_id)
              .single();
            
            if (data) {
              setProfiles(prev => ({
                ...prev,
                [data.id]: {
                  wallpaper_url: data.wallpaper_url || "",
                  username_color: data.username_color || "#ffffff"
                }
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setLoading(true);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      const { error } = await supabase.from("chat_messages").insert({
        user_id: user.id,
        username: profile?.username || "Anonymous",
        message: newMessage.trim(),
        message_type: "text",
      });

      if (error) throw error;

      setNewMessage("");
      setShowEmojiPicker(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleSendVoice = async () => {
    if (!audioBlob || !user) return;

    setLoading(true);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      const fileName = `${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("voice-messages")
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("voice-messages")
        .getPublicUrl(fileName);

      const { error } = await supabase.from("chat_messages").insert({
        user_id: user.id,
        username: profile?.username || "Anonymous",
        message: "Voice message",
        message_type: "voice",
        media_url: publicUrl,
      });

      if (error) throw error;

      setAudioBlob(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to send voice message");
    } finally {
      setLoading(false);
    }
  };

  const handleSendSticker = async (sticker: string) => {
    if (!user) return;

    setLoading(true);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      const { error } = await supabase.from("chat_messages").insert({
        user_id: user.id,
        username: profile?.username || "Anonymous",
        message: sticker,
        message_type: "sticker",
      });

      if (error) throw error;

      setShowStickers(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send sticker");
    } finally {
      setLoading(false);
    }
  };

  const toggleAudio = (audioUrl: string) => {
    if (playingAudio === audioUrl) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingAudio(null);
      setPlayingAudio(audioUrl);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <Card className="max-w-4xl mx-auto border-primary/20 bg-card/50 backdrop-blur h-[calc(100vh-200px)] flex flex-col">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl text-glow">Live Chat</CardTitle>
              <ThemeToggle />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.user_id === user?.id ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarImage src={profiles[msg.user_id]?.wallpaper_url} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {msg.username?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`p-3 rounded-lg max-w-[70%] ${
                    msg.user_id === user?.id
                      ? "bg-primary/10"
                      : "bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="text-sm font-bold"
                      style={{ color: profiles[msg.user_id]?.username_color || "#ffffff" }}
                    >
                      {msg.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  {msg.message_type === "voice" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleAudio(msg.media_url)}
                      className="gap-2"
                    >
                      {playingAudio === msg.media_url ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      Voice message
                    </Button>
                  ) : msg.message_type === "sticker" ? (
                    <span className="text-4xl">{msg.message}</span>
                  ) : (
                    <p className="text-sm text-foreground">{msg.message}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </CardContent>
          <div className="p-4 border-t border-border">
            {audioBlob ? (
              <div className="flex gap-2 items-center mb-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={cancelRecording}
                >
                  <X className="h-4 w-4" />
                </Button>
                <span className="text-sm">Voice message ready</span>
                <Button
                  size="sm"
                  onClick={handleSendVoice}
                  disabled={loading}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Popover open={showStickers} onOpenChange={setShowStickers}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="ghost" size="icon">
                      <Sticker className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="grid grid-cols-6 gap-2">
                      {stickers.map((sticker) => (
                        <button
                          key={sticker}
                          type="button"
                          onClick={() => handleSendSticker(sticker)}
                          className="text-3xl hover:scale-110 transition-transform"
                        >
                          {sticker}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="ghost" size="icon">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 border-0">
                    <EmojiPicker
                      onEmojiClick={(emoji) => {
                        setNewMessage((prev) => prev + emoji.emoji);
                      }}
                    />
                  </PopoverContent>
                </Popover>

                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-input border-border"
                  disabled={loading || isRecording}
                />
                
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "ghost"}
                  size="icon"
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  <Mic className="h-4 w-4" />
                </Button>
                
                <Button
                  type="submit"
                  className="bg-gradient-primary hover:opacity-90"
                  disabled={loading || !newMessage.trim() || isRecording}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}