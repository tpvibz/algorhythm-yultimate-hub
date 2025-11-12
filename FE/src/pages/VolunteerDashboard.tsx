import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Heart, Users, Trophy, Camera, Star, Trophy as TrophyIcon, TrendingUp, Image as ImageIcon, UserCheck } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

import VolunteerNavbar from "@/components/VolunteerNavbar";
import VolunteerNotifications from "@/components/VolunteerNotifications";
import AssignedTournamentsTab from "./VolunteerDashboard/AssignedTournamentsTab";
import LiveScoringTab from "./VolunteerDashboard/LiveScoringTab";
import MatchImagesTab from "./VolunteerDashboard/MatchImagesTab";
import MatchAttendanceTab from "./VolunteerDashboard/MatchAttendanceTab";
import { analyticsAPI, VolunteerOverviewResponse } from "@/services/api";

const VolunteerDashboard = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "assigned-tournaments" | "attendance" | "live-scoring" | "match-images">("overview");
  const [overviewData, setOverviewData] = useState<VolunteerOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVolunteerOverview();
  }, []);

  const fetchVolunteerOverview = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getVolunteerOverview();
      if (response.success) {
        setOverviewData(response);
      } else {
        toast.error("Failed to load volunteer overview");
      }
    } catch (error) {
      toast.error("Server error while loading volunteer overview");
      console.error("Error fetching volunteer overview:", error);
    } finally {
      setLoading(false);
    }
  };

  // Use real data from backend or fallback to defaults
  const stats = overviewData ? [
    { icon: Calendar, label: "Upcoming Events", value: overviewData.data.stats.upcomingEvents.value, change: overviewData.data.stats.upcomingEvents.change },
    { icon: Heart, label: "Hours Contributed", value: overviewData.data.stats.hoursContributed.value, change: overviewData.data.stats.hoursContributed.change },
    { icon: Users, label: "Students Impacted", value: overviewData.data.stats.studentsImpacted.value, change: overviewData.data.stats.studentsImpacted.change },
    { icon: Trophy, label: "Events Supported", value: overviewData.data.stats.eventsSupported.value, change: overviewData.data.stats.eventsSupported.change }
  ] : [
    { icon: Calendar, label: "Upcoming Events", value: "0", change: "No upcoming" },
    { icon: Heart, label: "Hours Contributed", value: "0", change: "0 this week" },
    { icon: Users, label: "Students Impacted", value: "0", change: "No students yet" },
    { icon: Trophy, label: "Events Supported", value: "0", change: "No events" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <VolunteerNavbar />
      <div className="fixed top-10 right-60 z-50 animate-fade-in">
                <VolunteerNotifications />
              </div>
      <div className="pt-20 px-4 pb-32">
        <div className="container mx-auto">
          {/* Header */}
          <div className="mb-8 space-y-2 mt-10 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Volunteer Dashboard</h1>
                <p className="text-muted-foreground text-lg">
                  Support and engage with the community
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="glass-card animate-pulse">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground h-4 w-24 bg-gray-200 rounded"></CardTitle>
                    <div className="p-2 bg-gray-200 rounded-lg w-8 h-8"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col">
                      <div className="text-3xl font-bold h-8 w-16 bg-gray-200 rounded mb-2"></div>
                      <div className="text-sm h-4 w-20 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
              <Card 
                key={index} 
                className="glass-card glass-hover hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <div className="p-2 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg">
                    <stat.icon className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col">
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <div className="text-sm text-green-600 font-medium mt-1">{stat.change}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6 flex gap-3 border-b border-border">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "overview"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("assigned-tournaments")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "assigned-tournaments"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrophyIcon className="h-4 w-4 inline mr-2" />
              Assigned Tournaments
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "attendance"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserCheck className="h-4 w-4 inline mr-2" />
              Attendance
            </button>
            <button
              onClick={() => setActiveTab("live-scoring")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "live-scoring"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp className="h-4 w-4 inline mr-2" />
              Live Scoring
            </button>
            <button
              onClick={() => setActiveTab("match-images")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "match-images"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ImageIcon className="h-4 w-4 inline mr-2" />
              Match Images
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "assigned-tournaments" && <AssignedTournamentsTab />}
          {activeTab === "attendance" && <MatchAttendanceTab />}
          {activeTab === "live-scoring" && <LiveScoringTab />}
          {activeTab === "match-images" && <MatchImagesTab />}

          {activeTab === "overview" && (
            <>
              {/* Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card glass-hover animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Volunteer Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Summer Championship", date: "May 15-17", role: "Score Keeper", spots: 3 },
                  { name: "Youth Training Session", date: "May 12", role: "Field Support", spots: 2 },
                  { name: "Community Cleanup", date: "May 20", role: "General Help", spots: 5 }
                ].map((opportunity, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-green-500/5 to-green-600/5 hover:from-green-500/10 hover:to-green-600/10 transition-all border border-green-500/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-lg">{opportunity.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{opportunity.date}</p>
                        <p className="text-sm text-green-600 font-medium">{opportunity.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{opportunity.spots} spots left</p>
                        <button className="mt-2 text-sm px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                          Sign Up
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-card glass-hover animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Impact Stories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: "Youth Empowerment Success", impact: "42 students", desc: "Completed life skills program" },
                  { title: "Community Tournament", impact: "156 players", desc: "Participated across 12 teams" },
                  { title: "Spirit of the Game", impact: "98% positive", desc: "Fair play ratings maintained" }
                ].map((story, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{story.title}</p>
                      <p className="text-sm text-green-600 font-medium">{story.impact}</p>
                      <p className="text-sm text-muted-foreground">{story.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
            </>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default VolunteerDashboard;
