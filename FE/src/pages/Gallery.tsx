import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Image } from "lucide-react";

const Gallery = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-32">
        <h1 className="text-4xl font-bold mb-8">Gallery</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
            <Card key={item} className="glass-card glass-hover overflow-hidden">
              <div className="aspect-video bg-primary/10 flex items-center justify-center">
                <Image className="h-12 w-12 text-primary/50" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1">Match Highlight {item}</h3>
                <p className="text-sm text-muted-foreground">Tournament Day {Math.ceil(item / 3)}</p>
              </div>
            </Card>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Gallery;
