import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import Rules from "./pages/Rules";
import Announcements from "./pages/Announcements";
import Report from "./pages/Report";
import About from "./pages/About";
import Admins from "./pages/Admins";
import OnlineUsers from "./pages/OnlineUsers";
import UserProfile from "./pages/UserProfile";
import Profile from "./pages/Profile";
import ConfigGenerator from "./pages/ConfigGenerator";
import ServerLiveStatus from "./pages/ServerLiveStatus";
import AllServers from "./pages/AllServers";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  useOnlineStatus();
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/rules" element={<Rules />} />
      <Route path="/announcements" element={<Announcements />} />
      <Route path="/report" element={<Report />} />
      <Route path="/about" element={<About />} />
      <Route path="/admins" element={<Admins />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/config-generator" element={<ConfigGenerator />} />
      <Route path="/server-status" element={<ServerLiveStatus />} />
      <Route path="/all-servers" element={<AllServers />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/online-users" element={<OnlineUsers />} />
      <Route path="/profile/:userId" element={<UserProfile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
