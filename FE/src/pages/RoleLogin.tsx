import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Target, Heart, Users, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const RoleLogin = () => {
  const navigate = useNavigate();
  const { role } = useParams<{ role: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const roleConfig = {
    admin: {
      title: "Admin Login",
      description: "Access tournament management and analytics",
      icon: Trophy,
      color: "from-blue-500 to-blue-600",
      dashboard: "/dashboard/admin"
    },
    coach: {
      title: "Coach Login",
      description: "Manage sessions and track player progress",
      icon: Target,
      color: "from-orange-500 to-orange-600",
      dashboard: "/dashboard/coach"
    },
    volunteer: {
      title: "Volunteer Login",
      description: "View and support program activities",
      icon: Heart,
      color: "from-green-500 to-green-600",
      dashboard: "/dashboard/volunteer"
    },
    player: {
      title: "Player Login",
      description: "Access your games and achievements",
      icon: Users,
      color: "from-purple-500 to-purple-600",
      dashboard: "/dashboard/player"
    }
  };

  const config = role ? roleConfig[role as keyof typeof roleConfig] : roleConfig.admin;
  const Icon = config.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock authentication - replace with actual auth logic
    setTimeout(() => {
      if (email && password) {
        // Store role in localStorage for demo purposes
        localStorage.setItem('userRole', role || 'admin');
        toast.success(`Welcome ${role}!`);
        navigate(config.dashboard);
      } else {
        toast.error("Please fill in all fields");
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none"></div>
      <Card className="w-full max-w-md glass-card animate-slide-up glow-blue relative z-10">
        <CardHeader className="text-center space-y-4">
          <Link 
            to="/select-role" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Change Role
          </Link>
          <div className="flex justify-center">
            <div className={`bg-gradient-to-br ${config.color} p-3 rounded-xl`}>
              <Icon className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">{config.title}</CardTitle>
          <CardDescription className="text-base">
            {config.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className={`w-full bg-gradient-to-r ${config.color} hover:opacity-90 text-white`}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Register here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleLogin;
