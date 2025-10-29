import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Heart, Users, Trophy, Camera, Star } from "lucide-react";
import Navbar from "@/components/Navbar";

const VolunteerDashboard = () => {
  const stats = [
    { icon: Calendar, label: "Upcoming Events", value: "5", change: "This month" },
    { icon: Heart, label: "Hours Contributed", value: "24", change: "+6 this week" },
    { icon: Users, label: "Students Impacted", value: "86", change: "Across programs" },
    { icon: Trophy, label: "Events Supported", value: "12", change: "This year" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 px-4 pb-12">
        <div className="container mx-auto">
          {/* Header */}
          <div className="mb-8 space-y-2 animate-slide-up">
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
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
