import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, CheckCircle, XCircle, Clock } from 'lucide-react';
import api, { API_BASE } from '../utils/api';

const NotificationPanel = () => {
  const navigate = useNavigate();
  const [showPanel, setShowPanel] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

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
      if (event.key === 'Escape') {
        setShowPanel(false);
      }
    };

    if (showPanel) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      // Mark notifications as seen when panel is opened
      localStorage.setItem('notifications_last_seen', new Date().toISOString());
      setUnreadCount(0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showPanel]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_BASE}/auditlogs?page=1&pageSize=5`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.logs || []);

        // Get last seen timestamp from localStorage
        const lastSeenStr = localStorage.getItem('notifications_last_seen');
        const lastSeen = lastSeenStr ? new Date(lastSeenStr) : new Date(0);

        // Count notifications newer than last seen time
        const newCount = (data.logs || []).filter(log =>
          new Date(log.timestamp) > lastSeen
        ).length;
        setUnreadCount(newCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionTypeColor = (actionType) => {
    const colors = {
      Authentication: 'bg-blue-100 text-blue-800',
      UserManagement: 'bg-purple-100 text-purple-800',
      FormSubmission: 'bg-green-100 text-green-800',
      GroupManagement: 'bg-yellow-100 text-yellow-800',
      SystemConfiguration: 'bg-red-100 text-red-800',
      DataAccess: 'bg-gray-100 text-gray-800'
    };
    return colors[actionType] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <>
      {/* --- BELL ICON & DROPDOWN --- */}
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setShowPanel(!showPanel)}
          className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full ring-2 ring-white flex items-center justify-center">
              <span className="text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
            </span>
          )}
        </button>

        {showPanel && (
          <div
            ref={panelRef}
            className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 origin-top-right animate-in fade-in slide-in-from-top-2"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-xl">
              <h3 className="text-sm font-bold text-gray-900">System Activity</h3>
              <button onClick={() => setShowPanel(false)} className="p-1 hover:bg-gray-200 rounded-full">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-400">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No logs found</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((log) => (
                    <div
                      key={log.id}
                      onClick={() => {
                        setShowPanel(false);
                        navigate('/admin/audit-logs', { state: { selectedLogId: log.id } });
                      }}
                      className="p-3 hover:bg-blue-50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${log.success ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700">{log.action}</p>
                          <p className="text-xs text-gray-500">{log.fullName || log.userName || 'System'}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{formatDate(log.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-2 border-t border-gray-100 bg-gray-50 rounded-b-xl text-center">
              <button
                onClick={() => { setShowPanel(false); navigate('/admin/audit-logs'); }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                View Full History
              </button>
            </div>
          </div>
        )}
      </div>

    </>
  );
};

export default NotificationPanel;