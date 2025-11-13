import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Image as ImageIcon, RefreshCw, Calendar, MapPin, Users, Trophy } from "lucide-react";
import { matchImageAPI, tournamentAPI, MatchImage, Tournament, handleAPIError, API_BASE_URL } from "@/services/api";
import { toast } from "sonner";

const Gallery = () => {
  const [images, setImages] = useState<MatchImage[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<MatchImage | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);

  useEffect(() => {
    fetchTournaments();
    fetchImages();
    // Poll for new images every 15 seconds
    const interval = setInterval(() => {
      fetchImages();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchImages();
  }, [selectedTournamentId]);

  const fetchTournaments = async () => {
    try {
      const response = await tournamentAPI.getAllTournaments();
      if (response.success) {
        setTournaments(response.data.tournaments);
      }
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    }
  };

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await matchImageAPI.getAllMatchImages(
        selectedTournamentId === "all" ? undefined : selectedTournamentId
      );
      
      if (response.success) {
        setImages(response.data.images || []);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
      toast.error(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (image: MatchImage) => {
    setSelectedImage(image);
    setShowImageDialog(true);
  };

  const filteredImages = images.filter(img => {
    if (selectedTournamentId === "all") return true;
    return img.tournamentId === selectedTournamentId;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-32">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Gallery</h1>
          <p className="text-muted-foreground mb-4">
            Match photos and highlights from tournaments
          </p>
          <div className="flex gap-4 items-center flex-wrap">
            <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Filter by tournament" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tournaments</SelectItem>
                {tournaments.map((tournament) => (
                  <SelectItem key={tournament._id} value={tournament._id}>
                    {tournament.name} ({new Date(tournament.startDate).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={fetchImages}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {loading && filteredImages.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading images...</p>
          </div>
        ) : filteredImages.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Images Found</h3>
            <p className="text-muted-foreground">
              {selectedTournamentId === "all"
                ? "No match images have been uploaded yet."
                : "No images found for this tournament."}
            </p>
          </Card>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {filteredImages.length} image{filteredImages.length !== 1 ? "s" : ""}
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredImages.map((image) => (
                <Card
                  key={image._id}
                  className="glass-card glass-hover overflow-hidden cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
                  onClick={() => handleImageClick(image)}
                >
                  <div className="relative aspect-video overflow-hidden bg-primary/10">
                    {image.imageUrl ? (
                      <img
                        src={image.imageUrl.startsWith("http") ? image.imageUrl : `${API_BASE_URL.replace("/api", "")}${image.imageUrl}`}
                        alt={image.caption || "Match image"}
                        className="w-full h-full object-cover transition-transform hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No Image</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-black/50 text-white border-0">
                        {image.tournament?.name || image.tournamentName || "Tournament"}
                      </Badge>
                    </div>
                    {image.uploadedBy && (
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {image.uploadedBy.firstName} {image.uploadedBy.lastName}
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    {image.match && image.match.teamA && image.match.teamB && (
                      <div className="mb-2">
                        <h3 className="font-semibold text-sm line-clamp-1">
                          {image.match.teamA.teamName} vs {image.match.teamB.teamName}
                        </h3>
                      </div>
                    )}
                    {image.caption && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {image.caption}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(image.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Image Detail Dialog */}
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedImage && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Match Image
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative w-full h-96 rounded-lg overflow-hidden">
                    {selectedImage.imageUrl ? (
                      <img
                        src={selectedImage.imageUrl.startsWith("http") ? selectedImage.imageUrl : `${API_BASE_URL.replace("/api", "")}${selectedImage.imageUrl}`}
                        alt={selectedImage.caption || "Match image"}
                        className="w-full h-full object-contain bg-muted"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">No Image Available</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {selectedImage.match && selectedImage.match.teamA && selectedImage.match.teamB && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-lg">
                          {selectedImage.match.teamA.teamName} vs {selectedImage.match.teamB.teamName}
                        </span>
                      </div>
                    )}
                    {selectedImage.match && selectedImage.match.fieldName && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        Field: {selectedImage.match.fieldName}
                      </div>
                    )}
                    {selectedImage.match && selectedImage.match.startTime && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Match Date: {new Date(selectedImage.match.startTime).toLocaleString()}
                      </div>
                    )}
                    {selectedImage.caption && (
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-sm">{selectedImage.caption}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        Uploaded: {new Date(selectedImage.uploadedAt).toLocaleString()}
                      </div>
                      {selectedImage.uploadedBy && (
                        <div className="text-xs text-muted-foreground">
                          By: {selectedImage.uploadedBy.firstName} {selectedImage.uploadedBy.lastName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <BottomNav />
    </div>
  );
};

export default Gallery;
