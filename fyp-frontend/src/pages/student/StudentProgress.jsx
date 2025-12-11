import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  ChevronRight,
  Award,
  FileText,
  Users,
  UserCheck,
  Calendar,
  RotateCcw,
  XCircle,
  Star,
} from "lucide-react";
import api, { API_BASE } from "../../utils/api";

const StudentProgress = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_BASE}/student/progress`);

      if (response.ok) {
        const data = await response.json();
        setProgress(data);
      } else {
        // Fallback to dashboard data
        const dashResponse = await api.get(`${API_BASE}/student/dashboard`);
        if (dashResponse.ok) {
          const dashData = await dashResponse.json();
          setProgress(buildProgressFromDashboard(dashData));
        }
      }
    } catch (err) {
      setError("Failed to load progress");
    } finally {
      setLoading(false);
    }
  };

  const buildProgressFromDashboard = (dashData) => {
    const hasGroup = dashData.hasGroup;
    const group = dashData.currentGroup;

    return {
      hasGroup,
      groupStatus: group?.status,
      supervisorStatus: group?.supervisorStatus,
      stages: [
        {
          id: 1,
          name: "Group Formation",
          description: "Form your FYP group with 2-3 members",
          status: hasGroup ? "completed" : "in_progress",
          icon: Users,
        },
        {
          id: 2,
          name: "Form-A Submission",
          description: "Submit project registration form",
          status: dashData.pendingForms?.some((f) => f.formType === "FormA")
            ? dashData.pendingForms.find((f) => f.formType === "FormA")
                .isSubmitted
              ? "completed"
              : "in_progress"
            : "pending",
          icon: FileText,
        },
        {
          id: 3,
          name: "Form-B Submission",
          description: "Select and confirm your supervisor",
          status: dashData.pendingForms?.some((f) => f.formType === "FormB")
            ? dashData.pendingForms.find((f) => f.formType === "FormB")
                .isSubmitted
              ? "completed"
              : "in_progress"
            : "pending",
          icon: UserCheck,
        },
        {
          id: 4,
          name: "Supervisor Approval",
          description: "Waiting for supervisor confirmation",
          status:
            group?.supervisorStatus === "Accepted"
              ? "completed"
              : group?.supervisorStatus === "Rejected"
              ? "failed"
              : group?.supervisorId
              ? "in_progress"
              : "pending",
          icon: CheckCircle2,
        },
        {
          id: 5,
          name: "Initial Defense",
          description: "Present your project to the evaluation committee",
          status:
            group?.status === "Active"
              ? "completed"
              : group?.status === "Deferred"
              ? "revision_needed"
              : "pending",
          icon: Calendar,
        },
        {
          id: 6,
          name: "SRS Submission",
          description: "Submit Software Requirements Specification",
          status: "pending",
          icon: FileText,
        },
        {
          id: 7,
          name: "Mid-Term Defense",
          description: "Present 50-60% progress",
          status: "pending",
          icon: Calendar,
        },
        {
          id: 8,
          name: "Final Defense",
          description: "Present your completed project",
          status: "pending",
          icon: Award,
        },
        {
          id: 9,
          name: "Project Completion",
          description: "Submit all final deliverables",
          status: group?.status === "Completed" ? "completed" : "pending",
          icon: Star,
        },
      ],
      marks: dashData.marks || null,
    };
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case "in_progress":
        return <Clock className="h-6 w-6 text-blue-600 animate-pulse" />;
      case "revision_needed":
        return <RotateCcw className="h-6 w-6 text-amber-600" />;
      case "failed":
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Circle className="h-6 w-6 text-gray-300" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
        return "bg-blue-500";
      case "revision_needed":
        return "bg-amber-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "completed":
        return { text: "Completed", class: "bg-green-100 text-green-700" };
      case "in_progress":
        return { text: "In Progress", class: "bg-blue-100 text-blue-700" };
      case "revision_needed":
        return {
          text: "Revision Needed",
          class: "bg-amber-100 text-amber-700",
        };
      case "failed":
        return { text: "Action Required", class: "bg-red-100 text-red-700" };
      default:
        return { text: "Upcoming", class: "bg-gray-100 text-gray-600" };
    }
  };

  const calculateOverallProgress = () => {
    if (!progress?.stages) return 0;
    const completed = progress.stages.filter(
      (s) => s.status === "completed"
    ).length;
    return Math.round((completed / progress.stages.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          FYP Progress Tracker
        </h1>
        <p className="text-gray-500 mt-1">
          Track your journey through the FYP process
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Overall Progress Card */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Overall Progress</h2>
            <p className="text-indigo-200 mt-1">
              {progress?.stages?.filter((s) => s.status === "completed")
                .length || 0}{" "}
              of {progress?.stages?.length || 0} milestones completed
            </p>
          </div>
          <div className="text-4xl font-bold">{overallProgress}%</div>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-6">Project Milestones</h3>

        <div className="relative">
          {progress?.stages?.map((stage, index) => {
            const Icon = stage.icon;
            const isLast = index === progress.stages.length - 1;
            const statusLabel = getStatusLabel(stage.status);

            return (
              <div key={stage.id} className="flex gap-4">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      stage.status === "completed"
                        ? "bg-green-100"
                        : stage.status === "in_progress"
                        ? "bg-blue-100"
                        : stage.status === "revision_needed"
                        ? "bg-amber-100"
                        : stage.status === "failed"
                        ? "bg-red-100"
                        : "bg-gray-100"
                    }`}
                  >
                    {getStatusIcon(stage.status)}
                  </div>
                  {!isLast && (
                    <div
                      className={`w-0.5 h-16 ${getStatusColor(stage.status)}`}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">
                          {stage.name}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusLabel.class}`}
                        >
                          {statusLabel.text}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {stage.description}
                      </p>
                    </div>

                    {stage.status === "in_progress" && (
                      <button
                        onClick={() => {
                          if (stage.name.includes("Form-A"))
                            navigate("/student/forms/FormA");
                          else if (stage.name.includes("Form-B"))
                            navigate("/student/forms/FormB");
                          else if (stage.name.includes("Group"))
                            navigate("/student/my-group");
                          else if (stage.name.includes("Defense"))
                            navigate("/student/defenses");
                        }}
                        className="px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-200 flex items-center gap-1"
                      >
                        Continue
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}

                    {stage.status === "revision_needed" && (
                      <button
                        onClick={() => navigate("/student/forms")}
                        className="px-3 py-1.5 bg-amber-100 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-200 flex items-center gap-1"
                      >
                        Resubmit
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Marks Card (if available) */}
      {progress?.marks && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Your Marks</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {progress.marks.proposalMarks !== null && (
              <div className="p-4 bg-indigo-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  {progress.marks.proposalMarks}
                </p>
                <p className="text-sm text-gray-600">Initial Defense</p>
              </div>
            )}
            {progress.marks.midEvalMarks !== null && (
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {progress.marks.midEvalMarks}
                </p>
                <p className="text-sm text-gray-600">Mid-Term</p>
              </div>
            )}
            {progress.marks.supervisorMarks !== null && (
              <div className="p-4 bg-teal-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-teal-600">
                  {progress.marks.supervisorMarks}
                </p>
                <p className="text-sm text-gray-600">Supervisor</p>
              </div>
            )}
            {progress.marks.finalEvalMarks !== null && (
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">
                  {progress.marks.finalEvalMarks}
                </p>
                <p className="text-sm text-gray-600">Final Defense</p>
              </div>
            )}
          </div>

          {progress.marks.totalMarks !== null && (
            <div className="mt-4 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white text-center">
              <p className="text-3xl font-bold">{progress.marks.totalMarks}</p>
              <p className="text-indigo-200">Total Marks</p>
              {progress.marks.grade && (
                <p className="mt-2 text-lg font-semibold">
                  Grade: {progress.marks.grade}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("/student/forms")}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left flex items-center gap-3"
          >
            <FileText className="h-6 w-6 text-indigo-600" />
            <div>
              <p className="font-medium text-gray-900">View Forms</p>
              <p className="text-sm text-gray-500">Submit required forms</p>
            </div>
          </button>
          <button
            onClick={() => navigate("/student/submissions")}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left flex items-center gap-3"
          >
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">My Submissions</p>
              <p className="text-sm text-gray-500">Track submission status</p>
            </div>
          </button>
          <button
            onClick={() => navigate("/student/defenses")}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left flex items-center gap-3"
          >
            <Calendar className="h-6 w-6 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900">Defense Schedule</p>
              <p className="text-sm text-gray-500">View defense dates</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentProgress;
