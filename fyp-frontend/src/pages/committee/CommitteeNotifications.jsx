import { useState, useEffect } from "react";
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Users,
  X,
} from "lucide-react";
import api, { API_BASE } from "../../utils/api";
import CommitteeLayout from "../../components/layouts/CommitteeLayout";

const CommitteeNotifications = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_BASE}/committee/notifications`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications;

  const getNotificationIcon = (type) => {
    switch (type) {
      case "DefenseScheduled":
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case "DefenseUpdated":
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case "DefenseCancelled":
        return <X className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <CommitteeLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </CommitteeLayout>
    );
  }

  return (
    <CommitteeLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">
            Stay updated on defense schedules and changes
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Notifications</p>
              <p className="text-3xl font-bold text-gray-900">
                {notifications.length}
              </p>
            </div>
          </div>
        </div>
        {/* Notifications List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              All Notifications
            </h2>
            <p className="text-sm text-gray-500">
              Defense schedules and updates
            </p>
          </div>

          {/* Notifications */}
          <div className="divide-y divide-gray-200">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  No notifications
                </h3>
                <p className="text-gray-500 mt-1">
                  No notifications to display
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="p-3 rounded-xl bg-blue-100">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-gray-900">
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(
                                notification.createdAt
                              ).toLocaleString()}
                            </span>
                            {notification.relatedFormType && (
                              <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                                {notification.relatedFormType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </CommitteeLayout>
  );
};

export default CommitteeNotifications;
