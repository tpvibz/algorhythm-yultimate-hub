import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Trophy, TrendingUp, Heart, Target, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Empowering Youth Through{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Sport & AI
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              AlgoRhythm brings together Ultimate Frisbee tournaments and youth development programs with AI-driven insights
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Link to="/select-role">
                <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg px-8">
                  Get Started
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none"></div>
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Trophy,
                title: "Tournament Management",
                description: "Seamlessly organize and manage Ultimate Frisbee tournaments with real-time scoring and spirit tracking"
              },
              {
                icon: Users,
                title: "Youth Development",
                description: "Track attendance, assessments, and progress for coaching programs across communities"
              },
              {
                icon: TrendingUp,
                title: "AI-Powered Insights",
                description: "Get predictive analytics and actionable insights to maximize engagement and impact"
              }
            ].map((feature, index) => (
              <Card 
                key={index} 
                className="glass-card glass-hover border-white/10 hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
                    <feature.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">Our Mission</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              We believe in the transformative power of sport. Through Ultimate Frisbee and 
              structured youth programs, we're building communities, developing life skills, 
              and creating opportunities for young people to thrive.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
              {[
                { icon: Heart, label: "Inclusive & Accessible", value: "For Everyone" },
                { icon: Target, label: "Impact Driven", value: "Real Results" },
                { icon: Shield, label: "Transparent & Fair", value: "Spirit First" }
              ].map((stat, index) => (
                <div key={index} className="space-y-2">
                  <stat.icon className="h-8 w-8 mx-auto text-primary" />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto text-center text-primary-foreground space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold">Ready to Join?</h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Whether you're organizing tournaments or running youth programs, AlgoRhythm has the tools you need
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Create Account
              </Button>
            </Link>
            <Link to="/select-role">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 pb-32 border-t border-border">
        <div className="container mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-lg">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">AlgoRhythm</span>
          </div>
          <p className="text-muted-foreground">
            © 2025 Y-Ultimate. Empowering communities through sport.
          </p>
          <div className="flex gap-6 justify-center text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
      <BottomNav />
    </div>
  );
};

export default Home;
