import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

const Fanzone = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-32">
        <h1 className="text-4xl font-bold mb-8">Fanzone</h1>
        <div className="grid gap-6">
          {[1, 2, 3, 4, 5].map((item) => (
            <Card key={item} className="glass-card glass-hover p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">Fan {item}</h3>
                    <span className="text-sm text-muted-foreground">• 2h ago</span>
                  </div>
                  <p className="text-foreground/80">
                    Great match today! The spirit of the game was amazing. Can't wait for the next round! 🔥
                  </p>
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

export default Fanzone;
