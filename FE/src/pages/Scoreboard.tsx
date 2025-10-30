import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Target } from "lucide-react";

const Scoreboard = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-32">
        <h1 className="text-4xl font-bold mb-8">Live Scoreboard</h1>
        <div className="grid gap-6">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="glass-card glass-hover p-8">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Target className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-semibold">Field {item}</h3>
              </div>
              <div className="flex items-center justify-between gap-8">
                <div className="flex-1 text-center">
                  <h4 className="text-2xl font-bold mb-2">Team A</h4>
                  <div className="text-6xl font-bold text-primary">0</div>
                </div>
                <div className="text-4xl font-bold text-muted-foreground">VS</div>
                <div className="flex-1 text-center">
                  <h4 className="text-2xl font-bold mb-2">Team B</h4>
                  <div className="text-6xl font-bold text-primary">0</div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary font-semibold">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  Live Now
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Scoreboard;
