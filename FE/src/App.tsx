import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Home from "./pages/Home";
import SelectRole from "./pages/SelectRole";
import RoleLogin from "./pages/RoleLogin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import CoachDashboard from "./pages/CoachDashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import PlayerDashboard from "./pages/PlayerDashboard";
import Schedule from "./pages/Schedule";
import PoolBracket from "./pages/PoolBracket";
import Teams from "./pages/Teams";
import PlayerStats from "./pages/PlayerStats";
import Spirit from "./pages/Spirit";
import Fanzone from "./pages/Fanzone";
import Gallery from "./pages/Gallery";
import Scoreboard from "./pages/Scoreboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/select-role" element={<SelectRole />} />
            <Route path="/login/:role" element={<RoleLogin />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/coach" element={<CoachDashboard />} />
            <Route path="/dashboard/volunteer" element={<VolunteerDashboard />} />
            <Route path="/dashboard/player" element={<PlayerDashboard />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/pool-bracket" element={<PoolBracket />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/player-stats" element={<PlayerStats />} />
            <Route path="/spirit" element={<Spirit />} />
            <Route path="/fanzone" element={<Fanzone />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/scoreboard" element={<Scoreboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
