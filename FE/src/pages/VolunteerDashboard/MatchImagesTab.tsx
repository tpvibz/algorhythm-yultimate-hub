import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Camera, Upload, X, Image as ImageIcon, RefreshCw, Trash2 } from "lucide-react";
import { matchImageAPI, MatchImage, Match, handleAPIError } from "@/services/api";

const MatchImagesTab = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [images, setImages] = useState<MatchImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    if (selectedMatchId) {
      fetchImages();
      // Poll for new images every 10 seconds
      const interval = setInterval(() => {
        fetchImages();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [selectedMatchId]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const volunteerId = localStorage.getItem("userId");

      if (!volunteerId) {
        toast.error("User not logged in. Please log in again.");
        return;
      }

      const response = await matchImageAPI.getVolunteerMatchesForImages(volunteerId);
      if (response.success) {
        setMatches(response.data.matches);
        // Auto-select first match if available
        if (response.data.matches.length > 0 && !selectedMatchId) {
          setSelectedMatchId(response.data.matches[0]._id);
        }
      } else {
        toast.error(response.message || "Failed to load matches");
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    if (!selectedMatchId) return;

    try {
      const response = await matchImageAPI.getMatchImages(selectedMatchId);
      if (response.success) {
        setImages(response.data.images);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size should be less than 10MB");
        return;
      }
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedMatchId || !selectedImage) {
      toast.error("Please select a match and image");
      return;
    }

    try {
      setUploading(true);
      const volunteerId = localStorage.getItem("userId");

      const response = await matchImageAPI.uploadMatchImage(selectedMatchId, selectedImage, {
        caption: caption.trim() || undefined,
        volunteerId: volunteerId || undefined,
      });

      if (response.success) {
        toast.success("Image uploaded successfully!");
        setSelectedImage(null);
        setCaption("");
        setPreviewUrl(null);
        setShowUploadDialog(false);
        await fetchImages();
        // Reset file input
        const fileInput = document.getElementById("image-upload") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      }
    } catch (error) {
      toast.error(handleAPIError(error));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!window.confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      const volunteerId = localStorage.getItem("userId");
      const response = await matchImageAPI.deleteMatchImage(imageId, volunteerId || undefined);

      if (response.success) {
        toast.success("Image deleted successfully");
        await fetchImages();
      }
    } catch (error) {
      toast.error(handleAPIError(error));
    }
  };

  const selectedMatch = matches.find(m => m._id === selectedMatchId);

  // Group matches by tournament
  const matchesByTournament = matches.reduce((acc, match) => {
    const tournamentName = (match as any).tournamentName || "Unknown Tournament";
    if (!acc[tournamentName]) {
      acc[tournamentName] = [];
    }
    acc[tournamentName].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Match Images</h2>
          <p className="text-muted-foreground">Upload and manage images for matches in your assigned tournaments</p>
        </div>
        <Button
          onClick={() => setShowUploadDialog(true)}
          disabled={!selectedMatchId}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Image
        </Button>
      </div>

      {/* Match Selection */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Select Match</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="match-select">Choose a match to view/upload images</Label>
              <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                <SelectTrigger id="match-select" className="mt-2">
                  <SelectValue placeholder="Select a match" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(matchesByTournament).map(([tournamentName, tournamentMatches]) => (
                    <div key={tournamentName}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                        {tournamentName}
                      </div>
                      {tournamentMatches.map((match) => (
                        <SelectItem key={match._id} value={match._id}>
                          {match.teamA.teamName} vs {match.teamB.teamName}
                          {match.fieldName && ` - ${match.fieldName}`}
                          {match.startTime && ` (${new Date(match.startTime).toLocaleDateString()})`}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMatch && (
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedMatch.teamA.teamName} vs {selectedMatch.teamB.teamName}
                    </h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      {selectedMatch.fieldName && `Field: ${selectedMatch.fieldName} • `}
                      {selectedMatch.startTime && `Date: ${new Date(selectedMatch.startTime).toLocaleString()}`}
                    </div>
                    {selectedMatch.status && (
                      <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${
                        selectedMatch.status === 'completed' ? 'bg-blue-500 text-white' :
                        selectedMatch.status === 'ongoing' ? 'bg-green-500 text-white' :
                        'bg-yellow-500 text-white'
                      }`}>
                        {selectedMatch.status}
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={() => setShowUploadDialog(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Add Image
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Match Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="image-upload">Select Image</Label>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="mt-2"
              />
              {previewUrl && (
                <div className="mt-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="caption">Caption (Optional)</Label>
              <Textarea
                id="caption"
                placeholder="Add a caption for this image..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadDialog(false);
                  setSelectedImage(null);
                  setPreviewUrl(null);
                  setCaption("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedImage || uploading}
                className="flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Images Gallery */}
      {selectedMatchId && (
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Images ({images.length})
              </CardTitle>
              <Button
                onClick={fetchImages}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {images.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No images uploaded yet for this match.</p>
                <Button
                  onClick={() => setShowUploadDialog(true)}
                  variant="outline"
                  className="mt-4"
                >
                  Upload First Image
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image) => (
                  <Card key={image._id} className="glass-card overflow-hidden">
                    <div className="relative">
                      <img
                        src={`http://localhost:9000${image.imageUrl}`}
                        alt={image.caption || "Match image"}
                        className="w-full h-48 object-cover"
                      />
                      {image.uploadedBy && (
                        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          {image.uploadedBy.firstName} {image.uploadedBy.lastName}
                        </div>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 left-2"
                        onClick={() => handleDelete(image._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardContent className="p-4">
                      {image.caption && (
                        <p className="text-sm text-muted-foreground mb-2">{image.caption}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(image.uploadedAt).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MatchImagesTab;

