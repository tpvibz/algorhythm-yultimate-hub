import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, Heart, Trophy, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";

const SelectRole = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: "admin",
      title: "Admin / Tournament Director",
      description: "Manage tournaments, teams, and view comprehensive analytics",
      icon: Trophy,
      color: "from-blue-500 to-blue-600"
    },
    {
      id: "coach",
      title: "Coach / Programme Manager",
      description: "Track sessions, attendance, and player development",
      icon: Target,
      color: "from-orange-500 to-orange-600"
    },
    {
      id: "volunteer",
      title: "Volunteer / Supporter",
      description: "View events, support activities, and track impact",
      icon: Heart,
      color: "from-green-500 to-green-600"
    },
    {
      id: "player",
      title: "Player",
      description: "View schedules, scores, and personal achievements",
      icon: Users,
      color: "from-purple-500 to-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 space-y-4 animate-slide-up">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-primary to-secondary p-4 rounded-2xl">
                <Zap className="h-12 w-12 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Welcome to AlgoRhythm</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Select your role to continue to your personalized dashboard
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map((role, index) => (
              <Card
                key={role.id}
                className="glass-card glass-hover border-white/10 hover:border-primary/50 cursor-pointer transition-all hover:-translate-y-2 animate-slide-up glow-blue"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => navigate(`/login/${role.id}`)}
              >
                <CardContent className="p-8 space-y-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${role.color} rounded-2xl flex items-center justify-center`}>
                    <role.icon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{role.title}</h3>
                    <p className="text-muted-foreground">{role.description}</p>
                  </div>
                  <div className="pt-4">
                    <span className="text-primary font-medium">
                      Continue as {role.title.split('/')[0].trim()} →
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <button
                onClick={() => navigate('/register')}
                className="text-primary hover:underline font-medium"
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectRole;
