import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, User, Award, Calendar } from "lucide-react";
import { toast } from "sonner";
import StudentDetailModal from "./StudentDetailModal";
import { API_BASE_URL } from "@/services/api";

interface Student {
  _id: string;
  profileId: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  uniqueUserId: string;
  age?: number;
  gender?: string;
  experience?: string;
  team?: {
    _id: string;
    name: string;
  } | null;
}

const StudentsTab = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignedStudents();
  }, []);

  const fetchAssignedStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const coachId = localStorage.getItem("userId");
      if (!coachId) {
        setError("Coach ID not found. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/students/coach/${coachId}`);
      const data = await response.json();
      if (response.ok) {
        setStudents(Array.isArray(data) ? data : []);
      } else {
        setError(data.message || "Failed to load students");
        toast.error(data.message || "Failed to load students");
        console.error("Failed to load students:", data.message);
      }
    } catch (error: any) {
      setError("Error fetching students. Please try again.");
      toast.error("Error fetching students. Please try again.");
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const getExperienceLabel = (exp: string) => {
    const labels: { [key: string]: string } = {
      beginner: "Beginner (0-1 years)",
      intermediate: "Intermediate (1-3 years)",
      advanced: "Advanced (3-5 years)",
      expert: "Expert (5+ years)",
    };
    return labels[exp] || exp;
  };

  const getGenderLabel = (gender: string) => {
    const labels: { [key: string]: string } = {
      male: "Male",
      female: "Female",
      other: "Other",
      "prefer-not-to-say": "Prefer not to say",
    };
    return labels[gender] || gender;
  };

  return (
    <Card className="glass-card glass-hover animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          My Assigned Students ({students.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Loading students...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchAssignedStudents}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : students.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <div
                key={student._id}
                onClick={() => setSelectedStudentId(student._id)}
                className="p-4 rounded-lg bg-gradient-to-r from-orange-500/5 to-orange-600/5 hover:from-orange-500/10 hover:to-orange-600/10 transition-all border border-orange-500/10 cursor-pointer hover:scale-105"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ID: {student.uniqueUserId}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2 mt-3 pt-3 border-t border-orange-500/10">
                  {student.age && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-orange-600" />
                      <span className="text-muted-foreground">Age: {student.age}</span>
                    </div>
                  )}
                  {student.gender && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        Gender: {getGenderLabel(student.gender)}
                      </span>
                    </div>
                  )}
                  {student.experience && (
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-orange-600" />
                      <span className="text-muted-foreground">
                        {getExperienceLabel(student.experience)}
                      </span>
                    </div>
                  )}
                  {student.team && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      <span className="text-muted-foreground">Team: {student.team.name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">No students assigned yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Students will appear here once they are assigned to you by an admin
            </p>
          </div>
        )}
      </CardContent>

      {/* Student Detail Modal */}
      {selectedStudentId && (
        <StudentDetailModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}
    </Card>
  );
};

export default StudentsTab;

