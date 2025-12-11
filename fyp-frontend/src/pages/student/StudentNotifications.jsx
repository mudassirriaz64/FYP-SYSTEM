import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  FileText, 
  Calendar,
  Clock,
  AlertCircle,
  Info,
  AlertTriangle,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';

const StudentNotifications = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_BASE}/notifications/student`);
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || data || []);
      } else {
        // Fallback to dashboard notifications
        const dashResponse = await api.get(`${API_BASE}/student/dashboard`);
        if (dashResponse.ok) {
          const dashData = await dashResponse.json();
          setNotifications(dashData.activeNotifications || []);
        }
      }
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type, priority) => {
    if (type === 'FormRelease') {
      return <FileText className="h-6 w-6 text-indigo-600" />;
    }
    if (priority === 2) {
      return <AlertTriangle className="h-6 w-6 text-red-600" />;
    }
    if (priority === 1) {
      return <AlertCircle className="h-6 w-6 text-amber-600" />;
    }
    return <Info className="h-6 w-6 text-blue-600" />;
  };

  const getPriorityBadge = (priority) => {
    if (priority === 2) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">Urgent</span>;
    }
    if (priority === 1) {
      return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">Important</span>;
    }
    return null;
  };

  const getTypeBadge = (type) => {
    const types = {
      FormRelease: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Form Release' },
      Deadline: { bg: 'bg-red-100', text: 'text-red-700', label: 'Deadline' },
      Announcement: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Announcement' },
      DefenseSchedule: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Defense' },
      GradeRelease: { bg: 'bg-green-100', text: 'text-green-700', label: 'Grades' },
      General: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'General' }
    };
    
    const config = types[type] || types.General;
    return (
      <span className={`px-2 py-1 ${config.bg} ${config.text} rounded text-xs font-medium`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">Stay updated with announcements and deadlines</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Bell className="h-4 w-4" />
          {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const now = new Date();
            const isFormAvailable = notification.type === 'FormRelease' &&
              notification.formAvailableFrom && notification.formDeadline &&
              new Date(notification.formAvailableFrom) <= now &&
              new Date(notification.formDeadline) > now;
            
            const daysRemaining = notification.formDeadline 
              ? Math.ceil((new Date(notification.formDeadline) - now) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <div 
                key={notification.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all
                  ${isFormAvailable ? 'border-indigo-200 hover:shadow-md' : 'border-gray-100'}
                `}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${
                      notification.type === 'FormRelease' ? 'bg-indigo-100' :
                      notification.priority === 2 ? 'bg-red-100' :
                      notification.priority === 1 ? 'bg-amber-100' : 'bg-blue-100'
                    }`}>
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                            {getPriorityBadge(notification.priority)}
                          </div>
                          <p className="text-gray-600 text-sm">{notification.message}</p>
                        </div>
                        {getTypeBadge(notification.type)}
                      </div>

                      {/* Form Release Info */}
                      {notification.type === 'FormRelease' && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {notification.formAvailableFrom && (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Calendar className="h-4 w-4" />
                                  Available: {new Date(notification.formAvailableFrom).toLocaleDateString()}
                                </div>
                              )}
                              {notification.formDeadline && (
                                <div className={`flex items-center gap-1 text-sm ${
                                  daysRemaining && daysRemaining <= 1 ? 'text-red-600 font-medium' :
                                  daysRemaining && daysRemaining <= 3 ? 'text-amber-600 font-medium' :
                                  'text-gray-600'
                                }`}>
                                  <Clock className="h-4 w-4" />
                                  {daysRemaining && daysRemaining > 0 
                                    ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`
                                    : 'Deadline passed'
                                  }
                                </div>
                              )}
                            </div>
                            {isFormAvailable && (
                              <button
                                onClick={() => navigate(`/student/forms/${notification.relatedFormType}`)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-1"
                              >
                                Fill Form
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Meta info */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span>
                          {new Date(notification.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {notification.createdByName && (
                          <span>by {notification.createdByName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bell className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Notifications</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            You're all caught up! Check back later for announcements and updates.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentNotifications;

