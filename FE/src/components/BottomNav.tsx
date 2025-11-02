import { Link, useLocation } from "react-router-dom";
import { Calendar, Trophy, Users, BarChart3, Heart, Image, Target, Award } from "lucide-react";

const BottomNav = () => {
  const location = useLocation();

  const tabs = [
    { name: "Schedule", path: "/schedule", icon: Calendar },
    { name: "Pool & Bracket", path: "/pool-bracket", icon: Trophy },
    { name: "Teams", path: "/teams", icon: Users },
    { name: "Player Stats", path: "/player-stats", icon: BarChart3 },
    { name: "Spirit", path: "/spirit", icon: Heart },
    { name: "Gallery", path: "/gallery", icon: Image },
    { name: "Scoreboard", path: "/scoreboard", icon: Target },
    { name: "Leaderboards", path: "/leaderboards", icon: Award },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card/95 backdrop-blur-xl border border-border rounded-full shadow-2xl shadow-black/20 px-4 py-3">
      <div className="flex items-center gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`p-3 rounded-full transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:text-foreground hover:bg-accent"
              }`}
              title={tab.name}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;