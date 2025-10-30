import { Link, useLocation } from "react-router-dom";
import { Calendar, Trophy, Users, BarChart3, Heart, PartyPopper, Image, Target } from "lucide-react";

const BottomNav = () => {
  const location = useLocation();

  const tabs = [
    { name: "Schedule", path: "/schedule", icon: Calendar },
    { name: "Pool & Bracket", path: "/pool-bracket", icon: Trophy },
    { name: "Teams", path: "/teams", icon: Users },
    { name: "Player Stats", path: "/player-stats", icon: BarChart3 },
    { name: "Spirit", path: "/spirit", icon: Heart },
    { name: "Fanzone", path: "/fanzone", icon: PartyPopper },
    { name: "Gallery", path: "/gallery", icon: Image },
    { name: "Scoreboard", path: "/scoreboard", icon: Target },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-card px-3 py-2 max-w-[95vw] overflow-x-auto">
      <div className="flex items-center gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
