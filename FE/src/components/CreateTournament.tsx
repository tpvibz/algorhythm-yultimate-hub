import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { tournamentAPI } from '@/services/api';

interface CreateTournamentProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

const CreateTournament = ({ onClose, onSuccess }: CreateTournamentProps) => {
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    location: '',
    maxTeams: '24',
    division: '',
    format: '',
    prizePool: '',
    description: '',
    rules: '',
    registrationDeadline: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation
      if (!formData.name.trim()) {
        toast.error('Tournament name is required');
        setIsLoading(false);
        return;
      }
      if (!formData.location.trim()) {
        toast.error('Location is required');
        setIsLoading(false);
        return;
      }
      if (!formData.division) {
        toast.error('Division is required');
        setIsLoading(false);
        return;
      }
      if (!formData.format) {
        toast.error('Format is required');
        setIsLoading(false);
        return;
      }
      if (!formData.prizePool.trim()) {
        toast.error('Prize pool is required');
        setIsLoading(false);
        return;
      }
      if (!formData.description || formData.description.trim().length < 10) {
        toast.error('Description must be at least 10 characters');
        setIsLoading(false);
        return;
      }
      if (!formData.rules || formData.rules.trim().length < 10) {
        toast.error('Rules must be at least 10 characters');
        setIsLoading(false);
        return;
      }
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        toast.error('End date must be after start date');
        setIsLoading(false);
        return;
      }

      if (new Date(formData.registrationDeadline) >= new Date(formData.startDate)) {
        toast.error('Registration deadline must be before start date');
        setIsLoading(false);
        return;
      }
      // Optional: prevent start date in the past (mirrors backend rule allowing today)
      const start = new Date(formData.startDate);
      const now = new Date();
      if (start < now && start.toDateString() !== now.toDateString()) {
        toast.error('Start date cannot be in the past');
        setIsLoading(false);
        return;
      }

      // Create FormData for multipart/form-data
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('startDate', formData.startDate);
      submitData.append('endDate', formData.endDate);
      submitData.append('location', formData.location);
      submitData.append('maxTeams', formData.maxTeams);
      submitData.append('division', formData.division);
      submitData.append('format', formData.format);
      submitData.append('prizePool', formData.prizePool);
      submitData.append('description', formData.description);
      submitData.append('rules', formData.rules);
      submitData.append('registrationDeadline', formData.registrationDeadline);

      if (selectedImage) {
        submitData.append('image', selectedImage);
      }

      const response = await tournamentAPI.createTournament(submitData);

      if (response.success) {
        toast.success('Tournament created successfully!');
        handleCancel();
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.message || 'Failed to create tournament');
      }
    } catch (error: any) {
      console.error('Error creating tournament:', error);
      const backendErrors = error?.response?.data?.errors as Array<{ msg: string }>|undefined;
      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        backendErrors.slice(0, 3).forEach((e) => toast.error(e.msg));
      } else {
        const msg = error?.response?.data?.message || error?.message || 'Failed to create tournament';
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      location: '',
      maxTeams: '24',
      division: '',
      format: '',
      prizePool: '',
      description: '',
      rules: '',
      registrationDeadline: ''
    });
    setSelectedImage(null);
    setImagePreview(null);
    if (onClose) onClose();
  };

  return (
    <Card className="w-full max-w-4xl mx-auto glass-card border-2 border-blue-500/50">
      <CardHeader>
        <CardTitle>Create New Tournament</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tournament Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Tournament Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter tournament name"
                required
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Enter tournament location"
                required
              />
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Registration Deadline */}
            <div className="space-y-2">
              <Label htmlFor="registrationDeadline">Registration Deadline</Label>
              <Input
                id="registrationDeadline"
                name="registrationDeadline"
                type="date"
                value={formData.registrationDeadline}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Max Teams */}
            <div className="space-y-2">
              <Label htmlFor="maxTeams">Max Teams</Label>
              <Input
                id="maxTeams"
                name="maxTeams"
                type="number"
                value={formData.maxTeams}
                onChange={handleInputChange}
                min="2"
                max="64"
                required
              />
            </div>

            {/* Division */}
            <div className="space-y-2">
              <Label htmlFor="division">Division</Label>
              <Select value={formData.division} onValueChange={(value) => handleSelectChange('division', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tournament division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open Division">Open Division</SelectItem>
                  <SelectItem value="Women's Division">Women's Division</SelectItem>
                  <SelectItem value="Mixed Division">Mixed Division</SelectItem>
                  <SelectItem value="Open & Women's">Open & Women's</SelectItem>
                  <SelectItem value="Youth Division">Youth Division</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Format */}
            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select value={formData.format} onValueChange={(value) => handleSelectChange('format', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tournament format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pool-play-bracket">Pool Play + Bracket</SelectItem>
                  <SelectItem value="single-elimination">Single Elimination</SelectItem>
                  <SelectItem value="double-elimination">Double Elimination</SelectItem>
                  <SelectItem value="round-robin">Round Robin</SelectItem>
                  <SelectItem value="swiss">Swiss System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prize Pool */}
            <div className="space-y-2">
              <Label htmlFor="prizePool">Prize Pool</Label>
              <Input
                id="prizePool"
                name="prizePool"
                value={formData.prizePool}
                onChange={handleInputChange}
                placeholder="e.g., ₹5,00,000"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter tournament description and overview..."
              rows={3}
              required
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Tournament Image</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Tournament preview" 
                    className="max-w-full h-48 object-cover mx-auto rounded"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">Click to upload tournament image</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    Choose File
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Rules & Guidelines */}
          <div className="space-y-2">
            <Label htmlFor="rules">Rules & Guidelines</Label>
            <Textarea
              id="rules"
              name="rules"
              value={formData.rules}
              onChange={handleInputChange}
              placeholder="Enter tournament rules, eligibility criteria, and guidelines..."
              rows={4}
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Tournament'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel} className="flex-1" disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateTournament;

