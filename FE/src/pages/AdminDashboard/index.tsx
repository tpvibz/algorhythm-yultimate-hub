import { useState, useEffect } from "react";
import {
  Trophy, BarChart3, Calendar, UserCheck, Users, FileText, CalendarDays, TrendingUp
} from "lucide-react";
import AdminNavbar from "@/components/AdminNavbar";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import OverviewTab from "./OverviewTab";
import TournamentsTab from "./TournamentsTab";
import SessionsTab from "./SessionsTab";
import AccountsTab from "./AccountsTab";

import ReportsTab from "./ReportsTab";
import AnalyticsTab from "./AnalyticsTab";
import ScheduleBuilderTab from "./ScheduleBuilderTab";
import { tournamentAPI, authAPI, Tournament, handleAPIError } from "@/services/api";
import SpiritLeaderboardTab from "../CoachDashboard/SpiritLeaderboardTab";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [accountRequests, setAccountRequests] = useState([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
  const [volunteerRequests] = useState([
    { id: 1, volunteer: "Vikram Singh", tournament: "Summer Championship 2025", role: "Score Keeper", date: "2025-10-30" },
    { id: 2, volunteer: "Anjali Mehta", tournament: "Youth Development League", role: "Field Marshal", date: "2025-10-29" },
    { id: 3, volunteer: "Rohan Gupta", tournament: "Summer Championship 2025", role: "Medical Support", date: "2025-10-28" }
  ]);

  useEffect(() => {
    fetchPendingRequests();
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setTournamentsLoading(true);
      const response = await tournamentAPI.getAllTournaments();
      if (response.success) {
        setTournaments(response.data.tournaments);
      } else {
        toast.error(response.message || "Failed to load tournaments");
      }
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage);
    } finally {
      setTournamentsLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await authAPI.getPendingRequests();
      setAccountRequests(response);
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage);
    }
  };

  const handleApprove = async (id: string | number, type: 'account' | 'volunteer' = 'account') => {
    try {
      if (type === 'account') {
        await authAPI.approvePlayer(id.toString());
        toast.success('Player approved successfully!');
        fetchPendingRequests();
      } else {
        // Handle volunteer approval (if implemented in backend)
        toast.success('Volunteer approved successfully!');
      }
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage);
    }
  };

  const handleReject = async (id: string | number, type: 'account' | 'volunteer' = 'account') => {
    try {
      if (type === 'account') {
        await authAPI.rejectPlayer(id.toString());
        toast.success('Request rejected!');
        fetchPendingRequests();
      } else {
        // Handle volunteer rejection (if implemented in backend)
        toast.success('Volunteer rejected!');
      }
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage);
    }
  };

  const onTournamentSuccess = () => {
    fetchTournaments(); // Refresh tournaments list
  };

  const TabButton = ({ id, label, icon: Icon }: { id: string; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        activeTab === id
          ? "bg-blue-600 text-white shadow-lg"
          : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar/>
      
      <div className="pt-20 px-4 pb-32">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 space-y-2 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground text-lg">
                  Tournament Director & System Administrator
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-3 mb-8">
            <TabButton id="overview" label="Overview" icon={BarChart3} />
            <TabButton id="tournaments" label="Tournaments" icon={Trophy} />
            <TabButton id="schedule-builder" label="Schedule Builder" icon={CalendarDays} />
            <TabButton id="sessions" label="Coaching Sessions" icon={Calendar} />
            <TabButton id="accounts" label="Account Requests" icon={UserCheck} />
            
            <TabButton id="analytics" label="Analytics" icon={TrendingUp} />
            <TabButton id="spirit-leaderboard" label="Spirit Leaderboard" icon={Trophy} />
            <TabButton id="reports" label="Reports & Analysis" icon={FileText} />
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && <OverviewTab setActiveTab={setActiveTab} tournaments={tournaments} />}
          {activeTab === "tournaments" && <TournamentsTab tournaments={tournaments} tournamentsLoading={tournamentsLoading} onTournamentSuccess={onTournamentSuccess} />}
          {activeTab === "schedule-builder" && <ScheduleBuilderTab />}
          {activeTab === "sessions" && <SessionsTab />}
          {activeTab === "accounts" && (
            <AccountsTab 
              accountRequests={accountRequests}
              handleApprove={handleApprove}
              handleReject={handleReject}
            />
          )}
          
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "spirit-leaderboard" && <SpiritLeaderboardTab />}
          {activeTab === "reports" && <ReportsTab />}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default AdminDashboard;

