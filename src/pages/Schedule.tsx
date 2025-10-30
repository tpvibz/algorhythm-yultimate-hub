import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";

const Schedule = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-32">
        <h1 className="text-4xl font-bold mb-8">Schedule & Results</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Card key={item} className="glass-card glass-hover p-6">
              <h3 className="text-xl font-semibold mb-2">Match {item}</h3>
              <p className="text-muted-foreground mb-4">Date: TBD</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Team A</span>
                  <span className="font-bold">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Team B</span>
                  <span className="font-bold">0</span>
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

export default Schedule;
