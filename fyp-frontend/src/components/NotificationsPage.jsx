import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Bell,
  Calendar,
  FileText,
  Award,
  AlertCircle,
  Clock,
  ChevronRight,
  ArrowLeft,
  Filter,
} from "lucide-react";
import api, { API_BASE } from "../utils/api";

/**
 * Reusable Notifications Page Component
 * @param {string} role - Target audience: 'Student', 'Supervisor', 'Coordinator', 'HOD', 'Evaluator'
 * @param {string} accentColor - Tailwind color class, e.g., 'amber', 'teal', 'purple'
 * @param {string} backPath - Path to navigate back to (e.g., '/supervisor/dashboard')
 * @param {React.Component} Layout - Layout component to wrap the page
 */
const NotificationsPage = ({
  role = "Student",
  accentColor = "indigo",
  backPath = "/",
  Layout,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("id");

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchNotifications();
  }, [role]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `${API_BASE}/notifications?pageSize=50&activeOnly=true`
      );

      if (response.ok) {
        const data = await response.json();

        // Filter notifications based on role and target audience
        const filtered = (data.notifications || []).filter((n) => {
          const audience = n.targetAudience?.toLowerCase() || "";
          const roleLC = role.toLowerCase();

          if (roleLC === "student") {
            return (
              audience === "all" ||
              audience === "students" ||
              audience === "group" ||
              (n.type === "FormRelease" &&
                (audience === "all" || audience === "students"))
            );
          } else if (roleLC === "supervisor" || roleLC === "teacher") {
            return (
              audience === "all" ||
              audience === "supervisor" ||
              audience === "supervisors" ||
              audience === "teacher" ||
              audience === "evaluator"
            );
          } else if (roleLC === "coordinator" || roleLC === "fypcoordinator") {
            return (
              audience === "all" ||
              audience === "coordinator" ||
              audience === "coordinators" ||
              audience === "fypcoordinator"
            );
          } else if (roleLC === "hod") {
            return (
              audience === "all" ||
              audience === "hod" ||
              audience === "coordinator"
            );
          } else if (
            roleLC === "evaluator" ||
            roleLC === "committee" ||
            roleLC === "committeemember"
          ) {
            return (
              audience === "all" ||
              audience === "evaluator" ||
              audience === "evaluators" ||
              audience === "committee"
            );
          }
          return audience === "all";
        });

        setNotifications(filtered);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "DefenseScheduled":
        return <Calendar className="h-5 w-5 text-blue-600" />;
      case "FormRelease":
        return <FileText className="h-5 w-5 text-purple-600" />;
      case "GradeRelease":
        return <Award className="h-5 w-5 text-green-600" />;
      case "Announcement":
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeBadge = (type) => {
    const badges = {
      DefenseScheduled: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "Defense",
      },
      FormRelease: {
        bg: "bg-purple-100",
        text: "text-purple-700",
        label: "Form Release",
      },
      GradeRelease: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Grades",
      },
      Announcement: {
        bg: "bg-amber-100",
        text: "text-amber-700",
        label: "Announcement",
      },
    };
    return (
      badges[type] || { bg: "bg-gray-100", text: "text-gray-700", label: type }
    );
  };

  const getPriorityBadge = (priority) => {
    if (priority >= 2) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
          Urgent
        </span>
      );
    } else if (priority === 1) {
      return (
        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
          Important
        </span>
      );
    }
    return null;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredNotifications =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.type === filter);

  const accentClasses = {
    amber: {
      bg: "bg-amber-600",
      hover: "hover:bg-amber-700",
      light: "bg-amber-100 text-amber-600",
    },
    teal: {
      bg: "bg-teal-600",
      hover: "hover:bg-teal-700",
      light: "bg-teal-100 text-teal-600",
    },
    purple: {
      bg: "bg-purple-600",
      hover: "hover:bg-purple-700",
      light: "bg-purple-100 text-purple-600",
    },
    rose: {
      bg: "bg-rose-600",
      hover: "hover:bg-rose-700",
      light: "bg-rose-100 text-rose-600",
    },
    indigo: {
      bg: "bg-indigo-600",
      hover: "hover:bg-indigo-700",
      light: "bg-indigo-100 text-indigo-600",
    },
    slate: {
      bg: "bg-slate-600",
      hover: "hover:bg-slate-700",
      light: "bg-slate-100 text-slate-600",
    },
  };

  const accent = accentClasses[accentColor] || accentClasses.indigo;

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(backPath)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Announcements & Notifications
          </h1>
          <p className="text-gray-500 mt-1">
            View all system announcements and notifications
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter className="h-4 w-4" />
          <span>Filter:</span>
        </div>
        {[
          "all",
          "DefenseScheduled",
          "FormRelease",
          "GradeRelease",
          "Announcement",
        ].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === type
                ? `${accent.bg} text-white`
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {type === "all" ? "All" : getTypeBadge(type).label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div
            className={`animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600`}
          ></div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Notifications
          </h3>
          <p className="text-gray-500">
            You don't have any notifications at the moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notif) => {
            const typeBadge = getTypeBadge(notif.type);
            const isHighlighted =
              highlightId && parseInt(highlightId) === notif.id;

            return (
              <div
                key={notif.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                  isHighlighted
                    ? "border-2 border-blue-500 ring-2 ring-blue-200"
                    : "border-gray-100 hover:shadow-md"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${accent.light}`}>
                      {getTypeIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">
                          {notif.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${typeBadge.bg} ${typeBadge.text}`}
                        >
                          {typeBadge.label}
                        </span>
                        {getPriorityBadge(notif.priority)}
                      </div>
                      <p className="text-gray-600 mb-3">{notif.message}</p>

                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDate(notif.createdAt)}</span>
                        </div>

                        {notif.formDeadline && (
                          <div className="flex items-center gap-1 text-amber-600">
                            <Calendar className="h-4 w-4" />
                            <span>{notif.daysRemaining} days remaining</span>
                          </div>
                        )}

                        {notif.departmentName && (
                          <span className="text-gray-400">
                            • {notif.departmentName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // If Layout is provided, wrap content in it
  if (Layout) {
    return <Layout>{content}</Layout>;
  }

  return content;
};

export default NotificationsPage;
