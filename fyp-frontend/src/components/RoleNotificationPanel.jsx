import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  X,
  Calendar,
  FileText,
  Award,
  AlertCircle,
  Clock,
} from "lucide-react";
import api, { API_BASE } from "../utils/api";

/**
 * Reusable Notification Panel Component
 * @param {string} role - Target audience: 'Student', 'Supervisor', 'Coordinator', 'HOD', 'Evaluator'
 * @param {string} accentColor - Tailwind color class, e.g., 'amber', 'teal', 'purple'
 */
const RoleNotificationPanel = ({
  role = "Student",
  accentColor = "indigo",
}) => {
  const navigate = useNavigate();
  const [showPanel, setShowPanel] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [role]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowPanel(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowPanel(false);
      }
    };

    if (showPanel) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      // Mark as seen
      const key = `notifications_last_seen_${role.toLowerCase()}`;
      localStorage.setItem(key, new Date().toISOString());
      setUnreadCount(0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showPanel, role]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Get notifications filtered by audience - include relevant types for each role
      const response = await api.get(
        `${API_BASE}/notifications?pageSize=10&activeOnly=true`
      );

      if (response.ok) {
        const data = await response.json();

        // Filter notifications based on role and target audience
        const filtered = (data.notifications || []).filter((n) => {
          const audience = n.targetAudience?.toLowerCase() || "";
          const roleLC = role.toLowerCase();

          // Filter by relevant notification types for each role
          if (roleLC === "student") {
            // Students see: form releases, defense scheduled, grade releases, announcements
            return (
              audience === "all" ||
              audience === "students" ||
              audience === "group" ||
              (n.type === "FormRelease" &&
                (audience === "all" || audience === "students"))
            );
          } else if (roleLC === "supervisor" || roleLC === "teacher") {
            // Supervisors see: evaluator notices, form D reminders, defense scheduled, etc.
            return (
              audience === "all" ||
              audience === "supervisor" ||
              audience === "supervisors" ||
              audience === "teacher" ||
              audience === "evaluator"
            );
          } else if (roleLC === "coordinator" || roleLC === "fypcoordinator") {
            // Coordinators see: form submissions, group updates, defense notices
            return (
              audience === "all" ||
              audience === "coordinator" ||
              audience === "coordinators" ||
              audience === "fypcoordinator"
            );
          } else if (roleLC === "hod") {
            // HOD sees: coordinator updates, department-wide
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
            // Evaluators see: defense scheduled, evaluation assignments
            return (
              audience === "all" ||
              audience === "evaluator" ||
              audience === "evaluators" ||
              audience === "committee"
            );
          }
          return audience === "all";
        });

        setNotifications(filtered.slice(0, 8)); // Show max 8 notifications

        // Count unread
        const key = `notifications_last_seen_${role.toLowerCase()}`;
        const lastSeenStr = localStorage.getItem(key);
        const lastSeen = lastSeenStr ? new Date(lastSeenStr) : new Date(0);
        const newCount = filtered.filter(
          (n) => new Date(n.createdAt) > lastSeen
        ).length;
        setUnreadCount(newCount);
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
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case "FormRelease":
        return <FileText className="h-4 w-4 text-purple-600" />;
      case "GradeRelease":
        return <Award className="h-4 w-4 text-green-600" />;
      case "Announcement":
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority) => {
    if (priority >= 2) {
      return (
        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">
          Urgent
        </span>
      );
    } else if (priority === 1) {
      return (
        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">
          Important
        </span>
      );
    }
    return null;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const accentClasses = {
    amber: "bg-amber-100 text-amber-600",
    teal: "bg-teal-100 text-teal-600",
    purple: "bg-purple-100 text-purple-600",
    rose: "bg-rose-100 text-rose-600",
    indigo: "bg-indigo-100 text-indigo-600",
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-100 text-blue-600",
  };

  const getNotificationsPath = () => {
    const roleLC = role.toLowerCase();
    if (roleLC === "student") return "/student/notifications";
    if (roleLC === "supervisor" || roleLC === "teacher")
      return "/supervisor/notifications";
    if (roleLC === "coordinator" || roleLC === "fypcoordinator")
      return "/coordinator/notifications";
    if (roleLC === "hod") return "/hod/notifications";
    if (
      roleLC === "evaluator" ||
      roleLC === "committee" ||
      roleLC === "committeemember"
    )
      return "/evaluator/notifications";
    return "/";
  };

  const handleNotificationClick = (notif) => {
    setShowPanel(false);
    navigate(`${getNotificationsPath()}?id=${notif.id}`);
  };

  const handleViewAll = () => {
    setShowPanel(false);
    navigate(getNotificationsPath());
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full ring-2 ring-white flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {showPanel && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <h3 className="text-sm font-bold text-gray-900">Announcements</h3>
            <button
              onClick={() => setShowPanel(false)}
              className="p-1 hover:bg-gray-200 rounded-full"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className="p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          accentClasses[accentColor] || accentClasses.indigo
                        }`}
                      >
                        {getTypeIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notif.title}
                          </p>
                          {getPriorityBadge(notif.priority)}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {notif.message}
                        </p>

                        {/* Form deadline if applicable */}
                        {notif.formDeadline && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                            <Clock className="h-3 w-3" />
                            <span>{notif.daysRemaining} days left</span>
                          </div>
                        )}

                        <p className="text-[10px] text-gray-400 mt-1">
                          {formatDate(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - View All Link */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
              <button
                onClick={handleViewAll}
                className={`text-xs font-semibold text-${accentColor}-600 hover:text-${accentColor}-800`}
              >
                View All Announcements
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoleNotificationPanel;
