import { useState } from "react";
import { Users, Calendar, BookOpen, BarChart3, GraduationCap, ClipboardCheck, MessageSquare } from "lucide-react";
import CoachNavbar from "@/components/CoachNavbar";
import BottomNav from "@/components/BottomNav";
import CoachNotifications from "@/components/CoachNotifications";
import CoachTeams from "@/components/CoachTeams";
import OverviewTab from "./OverviewTab";
import UpcomingSessionsTab from "./UpcomingSessionsTab";
import QuickActionsTab from "./QuickActionsTab";
import SessionsTab from "./SessionsTab";
import StudentsTab from "./StudentsTab";
import AttendanceTab from "./AttendanceTab";
import FeedbackTab from "./FeedbackTab";

const CoachDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showTeams, setShowTeams] = useState(false);

  const TabButton = ({ id, label, icon: Icon }: { id: string; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        activeTab === id
          ? "bg-orange-600 text-white shadow-lg"
          : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-background relative">
      {/* Top Navbar */}
      <div className="relative">
        <CoachNavbar />

        {/* Floating Notification Component */}
        <div className="fixed top-10 right-60 z-50 animate-fade-in">
          <CoachNotifications />
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 px-4 pb-32">
        <div className="container mx-auto">
          {/* Header */}
          <div className="mb-8 space-y-2 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Coach Dashboard</h1>
                <p className="text-muted-foreground text-lg">
                  Track sessions and student development
                </p>
              </div>
              
              {/* Your Teams button */}
              <div className="ml-auto">
                <button 
                  id="open-your-teams" 
                  onClick={() => setShowTeams(true)} 
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Your Teams
                </button>
              </div>
            </div>
          </div>

          <CoachTeams open={showTeams} onOpenChange={(open) => setShowTeams(open)} />

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-3 mb-8">
            <TabButton id="overview" label="Overview" icon={BarChart3} />
            <TabButton id="students" label="My Students" icon={GraduationCap} />
            <TabButton id="sessions" label="Sessions" icon={Calendar} />
            <TabButton id="attendance" label="Attendance" icon={ClipboardCheck} />
            <TabButton id="feedback" label="Post-Tournament Feedback" icon={MessageSquare} />
            <TabButton id="actions" label="Quick Actions" icon={BookOpen} />
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeTab === "overview" && (
              <>
                <div className="lg:col-span-2">
                  <OverviewTab />
                </div>
                <UpcomingSessionsTab />
                <QuickActionsTab />
              </>
            )}
            {activeTab === "students" && (
              <div className="lg:col-span-2">
                <StudentsTab />
              </div>
            )}
            {activeTab === "sessions" && (
              <div className="lg:col-span-2">
                <SessionsTab />
              </div>
            )}
            {activeTab === "attendance" && (
              <div className="lg:col-span-2">
                <AttendanceTab />
              </div>
            )}
            {activeTab === "feedback" && (
              <div className="lg:col-span-2">
                <FeedbackTab />
              </div>
            )}
            {activeTab === "actions" && (
              <div className="lg:col-span-2">
                <QuickActionsTab />
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default CoachDashboard;

