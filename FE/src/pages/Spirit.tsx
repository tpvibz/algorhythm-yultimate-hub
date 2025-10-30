import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Heart } from "lucide-react";

const Spirit = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-32">
        <h1 className="text-4xl font-bold mb-8">Spirit of the Game</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Card key={item} className="glass-card glass-hover p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Team {item}</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Fair-mindedness</span>
                  <span className="font-bold text-primary">0/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Communication</span>
                  <span className="font-bold text-primary">0/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Rules Knowledge</span>
                  <span className="font-bold text-primary">0/5</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-primary text-lg">0/15</span>
                  </div>
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

export default Spirit;
