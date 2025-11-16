import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Heart, Target, Shield, Award, Lightbulb, Globe, TrendingUp, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              About{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                YUltimate
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Building the future of youth sports through Ultimate Frisbee, community engagement, and AI-driven innovation
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/5 to-transparent pointer-events-none"></div>
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Our Story</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
            </div>
            
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                YUltimate was born from a simple belief: that sport has the power to transform lives, 
                build character, and create lasting positive change in communities. What started as a 
                passion project to organize Ultimate Frisbee tournaments has evolved into a comprehensive 
                platform serving youth development programs across regions.
              </p>
              <p>
                We recognized that organizing tournaments and youth programs came with unique challenges—tracking 
                attendance, managing assessments, coordinating schedules, and measuring impact. Traditional 
                tools weren't built for the dynamic, spirit-driven nature of Ultimate Frisbee and youth sports.
              </p>
              <p>
                Today, YUltimate combines cutting-edge technology with grassroots sports culture, offering 
                tournament organizers and youth program coordinators the tools they need to focus on what 
                matters most: building communities and empowering young people.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none"></div>
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Core Values</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Heart,
                title: "Spirit First",
                description: "We embrace the Spirit of the Game—fair play, respect, and joy—in everything we build and every decision we make."
              },
              {
                icon: Users,
                title: "Community Driven",
                description: "Our platform is built by the community, for the community. We listen, adapt, and grow together."
              },
              {
                icon: Target,
                title: "Impact Focused",
                description: "We measure success by the positive change we create in young people's lives and communities."
              },
              {
                icon: Shield,
                title: "Transparent & Fair",
                description: "We operate with complete transparency, ensuring fairness and accountability in all our systems."
              },
              {
                icon: Globe,
                title: "Inclusive & Accessible",
                description: "Everyone deserves access to great sports programs. We break down barriers and welcome all."
              },
              {
                icon: Lightbulb,
                title: "Innovation Minded",
                description: "We leverage technology and AI to solve real problems and create meaningful improvements."
              }
            ].map((value, index) => (
              <Card 
                key={index} 
                className="glass-card glass-hover border-white/10 hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-8 space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
                    <value.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">What We Do</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Comprehensive solutions for tournaments and youth development
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="glass-card border-white/10">
                <CardContent className="p-8 space-y-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
                    <Award className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-3xl font-bold">Tournament Platform</h3>
                  <ul className="space-y-4">
                    {[
                      "Real-time scoring and bracket management",
                      "Spirit of the Game scoring system",
                      "Team registration and scheduling",
                      "Live updates and standings",
                      "Historical data and analytics"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
{/* heyy wassup */}
              <Card className="glass-card border-white/10">
                <CardContent className="p-8 space-y-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-3xl font-bold">Youth Programs</h3>
                  <ul className="space-y-4">
                    {[
                      "Attendance tracking and management",
                      "Skill assessments and progress reports",
                      "Coach coordination tools",
                      "Parent communication portal",
                      "AI-powered insights and recommendations"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement Section */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/5 to-transparent pointer-events-none"></div>
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">Our Mission</h2>
            <p className="text-2xl text-muted-foreground leading-relaxed font-medium">
              "To empower youth through the transformative power of Ultimate Frisbee, 
              building stronger communities and developing the leaders of tomorrow."
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
              {[
                { value: "1000+", label: "Youth Impacted" },
                { value: "50+", label: "Tournaments Hosted" },
                { value: "100%", label: "Spirit of the Game" }
              ].map((stat, index) => (
                <div key={index} className="space-y-2">
                  <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  <p className="text-muted-foreground text-lg">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto text-center text-primary-foreground space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold">Join Our Community</h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Be part of something bigger. Whether you're organizing tournaments or running youth programs, 
            we're here to support your journey.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              Learn More
            </Button>
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
            <span className="text-lg font-bold">YUltimate</span>
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

export default AboutUs;