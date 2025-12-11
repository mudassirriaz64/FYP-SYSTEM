import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  ArrowRight,
  Users,
  FileText,
} from "lucide-react";
import api, { API_BASE } from "../../utils/api";
import EvaluatorLayout from "../../components/layouts/EvaluatorLayout";

const EvaluatorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [upcomingDefenses, setUpcomingDefenses] = useState([]);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch stats
      const statsResponse = await api.get(`${API_BASE}/evaluator/stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        // Normalize casing from backend (camelCase vs PascalCase)
        setStats({
          TotalAssignments:
            statsData.TotalAssignments ?? statsData.totalAssignments ?? 0,
          UpcomingDefenses:
            statsData.UpcomingDefenses ?? statsData.upcomingDefenses ?? 0,
          CompletedDefenses:
            statsData.CompletedDefenses ?? statsData.completedDefenses ?? 0,
          PendingMarksSubmission:
            statsData.PendingMarksSubmission ??
            statsData.pendingMarksSubmission ??
            0,
          SubmittedMarks:
            statsData.SubmittedMarks ?? statsData.submittedMarks ?? 0,
          DefensesByType:
            statsData.DefensesByType ?? statsData.defensesByType ?? [],
        });
      } else {
        const errorData = await statsResponse.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Stats API error (${statsResponse.status})`
        );
      }

      // Fetch upcoming defenses
      const defensesResponse = await api.get(
        `${API_BASE}/evaluator/defenses?status=Scheduled`
      );
      if (defensesResponse.ok) {
        const defensesData = await defensesResponse.json();
        // Filter to only upcoming defenses with proper null checks
        const normalized = (defensesData.defenses || []).map((d, idx) => {
          const defense = d.Defense || d.defense || {};
          const group = d.Group || d.group || {};
          const members = group.Members || group.members || [];

          return {
            EvaluationId:
              d.EvaluationId ?? d.evaluationId ?? d.Id ?? d.id ?? idx,
            Defense: {
              ...defense,
              Type: defense.Type ?? defense.type,
              DateTime: defense.DateTime ?? defense.dateTime,
            },
            Group: {
              ...group,
              GroupName: group.GroupName ?? group.groupName,
              ProjectTitle: group.ProjectTitle ?? group.projectTitle,
              Members: members,
              MemberCount: members.length,
            },
          };
        });

        const upcoming = normalized
          .filter(
            (d) =>
              d &&
              d.Defense &&
              d.Defense.DateTime &&
              new Date(d.Defense.DateTime) > new Date()
          )
          .slice(0, 3); // Show top 3
        setUpcomingDefenses(upcoming);
      } else {
        const errorData = await defensesResponse.json().catch(() => ({}));
        console.warn("Defenses API error:", errorData);
        // Don't throw here, stats are more important
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getDefenseTypeLabel = (type) => {
    const labels = {
      Proposal: "Proposal Defense",
      Initial: "Initial Defense",
      MidTerm: "Mid-Term Defense",
      Final: "Final Defense",
    };
    return labels[type] || type;
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <EvaluatorLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
        </div>
      </EvaluatorLayout>
    );
  }

  return (
    <EvaluatorLayout>
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.fullName?.split(" ")[0] || "Evaluator"}! 👋
              </h1>
              <p className="text-purple-100">Internal Evaluator Dashboard</p>
            </div>
            <button
              onClick={() => navigate("/evaluator/defenses")}
              className="hidden md:flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2.5 rounded-xl font-medium transition-colors"
            >
              <Calendar className="w-4 h-4" />
              View Defenses
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.TotalAssignments || 0}
                </p>
                <p className="text-sm text-gray-500">Assigned Groups</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.UpcomingDefenses || 0}
                </p>
                <p className="text-sm text-gray-500">Upcoming Defenses</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.PendingMarksSubmission || 0}
                </p>
                <p className="text-sm text-gray-500">Pending Marks</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.CompletedDefenses || 0}
                </p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Upcoming Defenses - Left Side */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                Upcoming Defenses
              </h2>
              <button
                onClick={() => navigate("/evaluator/defenses")}
                className="text-slate-600 hover:text-slate-700 text-sm font-medium flex items-center gap-1"
              >
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {upcomingDefenses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No upcoming defenses</p>
                <p className="text-sm mt-1">
                  You don't have any scheduled defenses
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDefenses.map((defense) => (
                  <div
                    key={defense.EvaluationId}
                    className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate("/evaluator/defenses")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {defense.Group.GroupName}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {defense.Group.ProjectTitle}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {defense.Group.MemberCount || "N/A"} members
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-medium">
                            {getDefenseTypeLabel(defense.Defense.Type)}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-300" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions - Right Side */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              Quick Actions
            </h2>

            <div className="space-y-3">
              <button
                onClick={() => navigate("/evaluator/defenses")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-slate-50 hover:border-slate-200 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <ClipboardList className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">View All Defenses</p>
                  <p className="text-xs text-gray-500">
                    See your assigned evaluations
                  </p>
                </div>
              </button>

              <button
                onClick={() => navigate("/evaluator/marks")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-green-50 hover:border-green-200 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Submit Marks</p>
                  <p className="text-xs text-gray-500">
                    Enter evaluation marks
                  </p>
                </div>
              </button>

              <button
                onClick={() => navigate("/evaluator/defenses")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Defense Schedule</p>
                  <p className="text-xs text-gray-500">Check upcoming dates</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </EvaluatorLayout>
  );
};

export default EvaluatorDashboard;
