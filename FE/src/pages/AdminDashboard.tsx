import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy, Target, TrendingUp, Calendar, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

const AdminDashboard = () => {
  const stats = [
    { icon: Users, label: "Total Players", value: "1,247", change: "+12%" },
    { icon: Trophy, label: "Active Tournaments", value: "8", change: "+2" },
    { icon: Target, label: "Teams Registered", value: "156", change: "+18%" },
    { icon: TrendingUp, label: "Avg Spirit Score", value: "14.2", change: "+0.8" },
    { icon: Calendar, label: "Sessions This Month", value: "42", change: "+5" },
    { icon: CheckCircle, label: "Attendance Rate", value: "87%", change: "+3%" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 px-4 pb-32">
        <div className="container mx-auto">
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

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card 
                key={index} 
                className="glass-card glass-hover hover:-translate-y-1 animate-slide-up glow-blue"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <div className="p-2 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg">
                    <stat.icon className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <div className="text-sm text-blue-600 font-medium">{stat.change}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Management Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card glass-hover animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <CardHeader>
                <CardTitle>Tournament Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Summer Championship 2025", teams: 24, status: "Upcoming" },
                  { name: "Youth Development League", teams: 16, status: "In Progress" },
                  { name: "Spring Open Tournament", teams: 20, status: "Completed" }
                ].map((tournament, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div>
                      <p className="font-medium">{tournament.name}</p>
                      <p className="text-sm text-muted-foreground">{tournament.teams} teams</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      tournament.status === 'In Progress' 
                        ? 'bg-blue-500/10 text-blue-600' 
                        : tournament.status === 'Upcoming'
                        ? 'bg-orange-500/10 text-orange-600'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {tournament.status}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-card glass-hover animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: "Pending Team Approvals", count: 5, action: "Review" },
                  { title: "Spirit Scores to Validate", count: 12, action: "Validate" },
                  { title: "Reports to Generate", count: 3, action: "Generate" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-500/5 to-blue-600/5 hover:from-blue-500/10 hover:to-blue-600/10 transition-all">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.count} pending</p>
                    </div>
                    <button className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      {item.action}
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default AdminDashboard;
