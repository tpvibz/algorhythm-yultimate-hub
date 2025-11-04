import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap } from "lucide-react";
import { toast } from "sonner";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    confirmPassword: "",
    // Player-specific fields
    age: "",
    gender: "",
    experience: "",
    affiliationType: "",
    affiliationId: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);

  useEffect(() => {
    if (formData.role === "player") {
      fetchInstitutions();
    }
  }, [formData.role]);

  const fetchInstitutions = async () => {
    try {
      setLoadingInstitutions(true);
      const [schoolsRes, communitiesRes] = await Promise.all([
        fetch("http://localhost:9000/api/institutions/schools"),
        fetch("http://localhost:9000/api/institutions/communities"),
      ]);

      if (schoolsRes.ok) {
        const schoolsData = await schoolsRes.json();
        setSchools(schoolsData);
      }
      if (communitiesRes.ok) {
        const communitiesData = await communitiesRes.json();
        setCommunities(communitiesData);
      }
    } catch (error) {
      console.error("Error fetching institutions:", error);
    } finally {
      setLoadingInstitutions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic front-end validations
    if (!formData.name.trim()) return toast.error("Full name is required");
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!formData.phone.trim()) return toast.error("Phone number is required");
    if (!formData.role) return toast.error("Please select a role");
    if (!formData.password.trim()) return toast.error("Password is required");
    if (formData.password.length < 6)
      return toast.error("Password must be at least 6 characters");
    if (formData.password !== formData.confirmPassword)
      return toast.error("Passwords do not match");

    // Player-specific validations
    if (formData.role === "player") {
      if (!formData.age.trim()) return toast.error("Age is required");
      if (isNaN(Number(formData.age)) || Number(formData.age) < 1 || Number(formData.age) > 120)
        return toast.error("Please enter a valid age");
      if (!formData.gender) return toast.error("Gender is required");
      if (!formData.experience.trim()) return toast.error("Experience level is required");
      if (!formData.affiliationType) return toast.error("Affiliation type is required");
      if (!formData.affiliationId) return toast.error("Please select your school or community");
    }

    setIsLoading(true);

    try {
      const [firstName, ...rest] = formData.name.trim().split(" ");
      const lastName = rest.join(" ") || "";

      const requestBody: any = {
        firstName,
        lastName,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        password: formData.password.trim(),
        confirmPassword: formData.confirmPassword.trim(),
      };

      // Add player-specific fields if role is player
      if (formData.role === "player") {
        requestBody.age = Number(formData.age);
        requestBody.gender = formData.gender;
        requestBody.experience = formData.experience.trim();
        requestBody.affiliationType = formData.affiliationType;
        requestBody.affiliationId = formData.affiliationId;
      }

      const response = await fetch("http://localhost:9000/api/auth/signup/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Signup request submitted! Wait for admin approval.");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        toast.error(data.message || "Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none"></div>
      <Card className="w-full max-w-md glass-card animate-slide-up glow-blue relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-xl">
              <Zap className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Join AlgoRhythm</CardTitle>
          <CardDescription className="text-base">
            Create your account to get started
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">I am a...</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    role: value,
                    age: "",
                    gender: "",
                    experience: "",
                    affiliationType: "",
                    affiliationId: "",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Tournament Director / Admin</SelectItem>
                  <SelectItem value="coach">Coach / Programme Manager</SelectItem>
                  <SelectItem value="player">Player</SelectItem>
                  <SelectItem value="volunteer">Volunteer / Supporter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Player-specific fields */}
            {formData.role === "player" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="e.g., 25"
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Experience Level</Label>
                  <Select
                    value={formData.experience}
                    onValueChange={(value) => setFormData({ ...formData, experience: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (0-1 years)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                      <SelectItem value="advanced">Advanced (3-5 years)</SelectItem>
                      <SelectItem value="expert">Expert (5+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Affiliation fields */}
                <div className="space-y-2">
                  <Label htmlFor="affiliationType">Affiliation Type</Label>
                  <Select
                    value={formData.affiliationType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, affiliationType: value, affiliationId: "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select affiliation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="school">School</SelectItem>
                      <SelectItem value="community">Community</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.affiliationType && (
                  <div className="space-y-2">
                    <Label htmlFor="affiliationId">
                      Select {formData.affiliationType === "school" ? "School" : "Community"}
                    </Label>
                    {loadingInstitutions ? (
                      <div className="text-sm text-muted-foreground py-2">Loading...</div>
                    ) : (
                      <Select
                        value={formData.affiliationId}
                        onValueChange={(value) => setFormData({ ...formData, affiliationId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select a ${formData.affiliationType}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {(formData.affiliationType === "school" ? schools : communities).map(
                            (institution) => (
                              <SelectItem key={institution._id} value={institution._id}>
                                {institution.name} ({institution.location})
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Password fields */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Register"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in here
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
              ← Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
