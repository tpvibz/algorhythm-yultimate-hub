import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, CheckCircle, TrendingUp, BookOpen, Home } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

const CoachDashboard = () => {
  const stats = [
    { icon: Users, label: "Active Students", value: "42", change: "+3" },
    { icon: Calendar, label: "Sessions This Week", value: "6", change: "2 upcoming" },
    { icon: CheckCircle, label: "Attendance Rate", value: "91%", change: "+5%" },
    { icon: TrendingUp, label: "Avg Progress Score", value: "8.4", change: "+0.6" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
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
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card 
                key={index} 
                className="glass-card glass-hover hover:-translate-y-1 animate-slide-up glow-orange"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <div className="p-2 bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-lg">
                    <stat.icon className="h-4 w-4 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <div className="text-sm text-orange-600 font-medium">{stat.change}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Management Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card glass-hover animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Morning Skills Training", time: "Today, 9:00 AM", location: "Field A", students: 18 },
                  { name: "Youth Development", time: "Tomorrow, 3:00 PM", location: "Community Center", students: 24 },
                  { name: "Advanced Drills", time: "Wed, 10:00 AM", location: "Field B", students: 15 }
                ].map((session, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-orange-500/5 to-orange-600/5 hover:from-orange-500/10 hover:to-orange-600/10 transition-all border border-orange-500/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-lg">{session.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{session.time}</p>
                        <p className="text-sm text-muted-foreground">{session.location}</p>
                      </div>
                      <span className="text-sm px-3 py-1 rounded-full bg-orange-500/10 text-orange-600">
                        {session.students} students
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-card glass-hover animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: "Mark Attendance", icon: CheckCircle, count: 2, desc: "sessions pending" },
                  { title: "Log Home Visits", icon: Home, count: 3, desc: "visits to record" },
                  { title: "Update Assessments", icon: TrendingUp, count: 5, desc: "students due" }
                ].map((action, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{action.title}</p>
                        <p className="text-sm text-muted-foreground">{action.count} {action.desc}</p>
                      </div>
                    </div>
                    <button className="text-sm px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                      Open
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

export default CoachDashboard;
