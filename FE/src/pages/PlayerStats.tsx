import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const PlayerStats = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-32">
        <h1 className="text-4xl font-bold mb-8">Player Stats</h1>
        <div className="grid gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Card key={item} className="glass-card glass-hover p-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback>P{item}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">Player {item}</h3>
                  <p className="text-muted-foreground">Team {item}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">0</div>
                  <div className="text-sm text-muted-foreground">Goals</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">0</div>
                  <div className="text-sm text-muted-foreground">Assists</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">0</div>
                  <div className="text-sm text-muted-foreground">Blocks</div>
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

export default PlayerStats;
