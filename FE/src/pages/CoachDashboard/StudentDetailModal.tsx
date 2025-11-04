import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Home, User, Mail, Phone, Calendar, Award, Users } from "lucide-react";
import { toast } from "sonner";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import HomeVisitForm from "./HomeVisitForm";
import HomeVisitHistory from "./HomeVisitHistory";

interface StudentDetails {
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    name: string;
    email: string;
    phone?: string;
    uniqueUserId: string;
    age?: number;
    gender?: string;
    experience?: string;
    team?: { _id: string; name: string } | null;
    coach?: { _id: string; name: string } | null;
    stats: {
      totalMatchesPlayed: number;
      totalGoals: number;
      totalAssists: number;
      winRate: number;
      spiritAverage: number;
    };
  };
  attendance: {
    percentage: number;
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    records: Array<{
      _id: string;
      sessionTitle: string;
      sessionDate: string;
      status: string;
      date: string;
    }>;
  };
  performance: {
    assessments: Array<{
      _id: string;
      type: string;
      date: string;
      score: number;
      assessor: string;
    }>;
  };
  homeVisits: Array<{
    _id: string;
    visitDate: string;
    notes: string;
    remarks: string;
    durationMinutes?: number;
    visitedBy: string;
    createdAt: string;
  }>;
}

interface StudentDetailModalProps {
  studentId: string;
  onClose: () => void;
}

const StudentDetailModal = ({ studentId, onClose }: StudentDetailModalProps) => {
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHomeVisitForm, setShowHomeVisitForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"attendance" | "performance">("attendance");

  useEffect(() => {
    fetchStudentDetails();
  }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:9000/api/students/${studentId}/details`);
      const data = await response.json();
      if (response.ok) {
        setStudentDetails(data);
      } else {
        toast.error(data.message || "Failed to load student details");
      }
    } catch (error) {
      toast.error("Error fetching student details");
      console.error("Error fetching student details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleHomeVisitSuccess = () => {
    setShowHomeVisitForm(false);
    fetchStudentDetails(); // Refresh to show new visit
  };

  const getGenderLabel = (gender?: string) => {
    if (!gender) return "N/A";
    const labels: { [key: string]: string } = {
      male: "Male",
      female: "Female",
      other: "Other",
      "prefer-not-to-say": "Prefer not to say",
    };
    return labels[gender] || gender;
  };

  const getExperienceLabel = (exp?: string) => {
    if (!exp) return "N/A";
    const labels: { [key: string]: string } = {
      beginner: "Beginner (0-1 years)",
      intermediate: "Intermediate (1-3 years)",
      advanced: "Advanced (3-5 years)",
      expert: "Expert (5+ years)",
    };
    return labels[exp] || exp;
  };

  // Prepare attendance data for bar chart
  const attendanceChartData = studentDetails
    ? [
        { name: "Present", value: studentDetails.attendance.presentCount, fill: "#22c55e" },
        { name: "Absent", value: studentDetails.attendance.absentCount, fill: "#ef4444" },
      ]
    : [];

  // Prepare performance data for bar chart
  const performanceChartData = studentDetails
    ? studentDetails.performance.assessments.map((assessment) => ({
        name: `${assessment.type} ${new Date(assessment.date).getFullYear()}`,
        score: assessment.score || 0,
      }))
    : [];

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading student details...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!studentDetails) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <p className="text-red-500">Failed to load student details</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { student, attendance, performance, homeVisits } = studentDetails;

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{student.name}'s Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Student Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Name:</span>
                      <span className="text-sm">{student.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Email:</span>
                      <span className="text-sm">{student.email}</span>
                    </div>
                    {student.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium">Phone:</span>
                        <span className="text-sm">{student.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">ID:</span>
                      <span className="text-sm">{student.uniqueUserId}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {student.age && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium">Age:</span>
                        <span className="text-sm">{student.age} years</span>
                      </div>
                    )}
                    {student.gender && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium">Gender:</span>
                        <span className="text-sm">{getGenderLabel(student.gender)}</span>
                      </div>
                    )}
                    {student.experience && (
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium">Experience:</span>
                        <span className="text-sm">{getExperienceLabel(student.experience)}</span>
                      </div>
                    )}
                    {student.team && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium">Team:</span>
                        <span className="text-sm">{student.team.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance & Performance Tabs */}
            <Tabs defaultValue="attendance" onValueChange={(v) => setActiveTab(v as "attendance" | "performance")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              <TabsContent value="attendance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Attendance Rate</span>
                        <span className="text-2xl font-bold text-orange-600">
                          {attendance.percentage}%
                        </span>
                      </div>
                      <Progress value={attendance.percentage} className="h-3" />
                    </div>

                    {/* Attendance Bar Chart */}
                    {attendance.totalSessions > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium mb-4">Attendance Breakdown</h4>
                        <ChartContainer
                          config={{
                            present: { label: "Present", color: "#22c55e" },
                            absent: { label: "Absent", color: "#ef4444" },
                          }}
                          className="h-[200px]"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={attendanceChartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar dataKey="value" fill="#8884d8" />
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="p-3 rounded-lg bg-green-500/10">
                        <p className="text-sm text-muted-foreground">Present</p>
                        <p className="text-2xl font-bold text-green-600">
                          {attendance.presentCount}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-red-500/10">
                        <p className="text-sm text-muted-foreground">Absent</p>
                        <p className="text-2xl font-bold text-red-600">
                          {attendance.absentCount}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-500/10">
                        <p className="text-sm text-muted-foreground">Total Sessions</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {attendance.totalSessions}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance & Skills</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Performance Bar Chart */}
                    {performance.assessments.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-medium mb-4">Assessment Scores</h4>
                        <ChartContainer
                          config={{
                            score: { label: "Score", color: "#3b82f6" },
                          }}
                          className="h-[250px]"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={performanceChartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis domain={[0, 100]} />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar dataKey="score" fill="#3b82f6" />
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No performance assessments available yet
                      </p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="p-3 rounded-lg bg-purple-500/10">
                        <p className="text-sm text-muted-foreground">Matches Played</p>
                        <p className="text-xl font-bold">{student.stats.totalMatchesPlayed}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-500/10">
                        <p className="text-sm text-muted-foreground">Goals</p>
                        <p className="text-xl font-bold">{student.stats.totalGoals}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-green-500/10">
                        <p className="text-sm text-muted-foreground">Assists</p>
                        <p className="text-xl font-bold">{student.stats.totalAssists}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-orange-500/10">
                        <p className="text-sm text-muted-foreground">Win Rate</p>
                        <p className="text-xl font-bold">{student.stats.winRate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Home Visits Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Home Visits</CardTitle>
                  <Button
                    onClick={() => setShowHomeVisitForm(true)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Log Home Visit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <HomeVisitHistory
                  studentId={studentId}
                  homeVisits={homeVisits}
                  onRefresh={fetchStudentDetails}
                />
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Home Visit Form Modal */}
      {showHomeVisitForm && (
        <HomeVisitForm
          studentId={studentId}
          onClose={() => setShowHomeVisitForm(false)}
          onSuccess={handleHomeVisitSuccess}
        />
      )}
    </>
  );
};

export default StudentDetailModal;

