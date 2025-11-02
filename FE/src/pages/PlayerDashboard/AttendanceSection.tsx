import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, CheckCircle2, XCircle, Clock } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface AttendanceSectionProps {
  playerId: string;
}

const AttendanceSection = ({ playerId }: AttendanceSectionProps) => {
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, [playerId]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/player/${playerId}/attendance`);
      if (response.ok) {
        const data = await response.json();
        setAttendance(data);
      } else {
        toast.error("Failed to load attendance data");
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Error loading attendance");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Attendance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!attendance) {
    return (
      <Card className="glass-card">
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">No attendance data available</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = attendance.weeklyChart?.slice(-8).map((week: any) => ({
    week: new Date(week.week).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    Present: week.present,
    Absent: week.absent,
    Late: week.late,
  })) || [];

  return (
    <Card className="glass-card glass-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Attendance Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Attendance Percentage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Attendance Rate</span>
            <span className="text-2xl font-bold text-purple-600">{attendance.percentage}%</span>
          </div>
          <Progress value={attendance.percentage} className="h-3" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-green-500/10">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Present</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{attendance.presentCount}</p>
          </div>
          <div className="p-4 rounded-lg bg-orange-500/10">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-muted-foreground">Late</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{attendance.lateCount}</p>
          </div>
          <div className="p-4 rounded-lg bg-red-500/10">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Absent</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{attendance.absentCount}</p>
          </div>
        </div>

        {/* Weekly Chart */}
        {chartData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-4">Attendance by Week</h4>
            <ChartContainer
              config={{
                Present: { label: "Present", color: "#22c55e" },
                Absent: { label: "Absent", color: "#ef4444" },
                Late: { label: "Late", color: "#f97316" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="Present" stackId="a" fill="#22c55e" />
                  <Bar dataKey="Late" stackId="a" fill="#f97316" />
                  <Bar dataKey="Absent" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}

        {/* Total Sessions */}
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">Total Sessions</p>
          <p className="text-2xl font-bold">{attendance.totalSessions}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceSection;

