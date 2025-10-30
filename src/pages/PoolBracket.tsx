import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";

const PoolBracket = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-32">
        <h1 className="text-4xl font-bold mb-8">Pool & Bracket</h1>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass-card glass-hover p-6">
            <h3 className="text-2xl font-semibold mb-4">Pool A</h3>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((team) => (
                <div key={team} className="flex justify-between items-center p-3 rounded-lg bg-background/50">
                  <span>Team {team}</span>
                  <span className="font-bold">0 pts</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="glass-card glass-hover p-6">
            <h3 className="text-2xl font-semibold mb-4">Pool B</h3>
            <div className="space-y-3">
              {[5, 6, 7, 8].map((team) => (
                <div key={team} className="flex justify-between items-center p-3 rounded-lg bg-background/50">
                  <span>Team {team}</span>
                  <span className="font-bold">0 pts</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default PoolBracket;
