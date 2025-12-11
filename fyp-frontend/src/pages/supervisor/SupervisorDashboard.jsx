import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  FileText, 
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Calendar,
  ClipboardCheck,
  Award,
  Bell,
  TrendingUp
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';
import SupervisorLayout from '../../components/layouts/SupervisorLayout';

const SupervisorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_BASE}/supervisor/dashboard`);
      
      if (response.ok) {
        const data = await response.json();
        setDashboard(data);
      } else {
        // Fallback data for initial display
        setDashboard({
          totalGroups: 0,
          pendingRequests: 0,
          pendingFormD: 0,
          pendingGrading: 0,
          groups: [],
          recentActivities: []
        });
      }
    } catch (err) {
      setError('Failed to load dashboard');
      setDashboard({
        totalGroups: 0,
        pendingRequests: 0,
        pendingFormD: 0,
        pendingGrading: 0,
        groups: [],
        recentActivities: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SupervisorLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </SupervisorLayout>
    );
  }

  return (
    <SupervisorLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-2xl shadow-xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="relative px-6 py-8 md:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Welcome back, {user.fullName}! 👋
                </h1>
                <p className="text-amber-100 text-lg">
                  Supervisor Dashboard
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex gap-2">
                <button
                  onClick={() => navigate('/supervisor/requests')}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium text-white transition-colors backdrop-blur-sm flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  View Requests
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/supervisor/groups')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{dashboard?.totalGroups || 0}</p>
                <p className="text-sm text-gray-500">Assigned Groups</p>
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/supervisor/requests')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <UserCheck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{dashboard?.pendingRequests || 0}</p>
                <p className="text-sm text-gray-500">Pending Requests</p>
              </div>
            </div>
            {(dashboard?.pendingRequests || 0) > 0 && (
              <div className="mt-3 flex items-center gap-1 text-blue-600 text-sm font-medium">
                <Bell className="h-4 w-4" />
                <span>Action required</span>
              </div>
            )}
          </div>

          <div 
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/supervisor/form-d')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{dashboard?.pendingFormD || 0}</p>
                <p className="text-sm text-gray-500">Pending Form-D</p>
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/supervisor/grading')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{dashboard?.pendingGrading || 0}</p>
                <p className="text-sm text-gray-500">To Grade</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assigned Groups */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">My Groups</h2>
              <button
                onClick={() => navigate('/supervisor/groups')}
                className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
              >
                View All <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {dashboard?.groups && dashboard.groups.length > 0 ? (
              <div className="space-y-3">
                {dashboard.groups.slice(0, 5).map((group) => (
                  <div 
                    key={group.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => navigate(`/supervisor/groups/${group.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{group.groupName}</h3>
                        <p className="text-sm text-gray-500">{group.projectTitle || 'No title yet'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Users className="h-3 w-3" />
                            {group.memberCount} members
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            group.status === 'Active' ? 'bg-green-100 text-green-700' :
                            group.status === 'PendingApproval' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {group.status}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No groups assigned yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Groups will appear here once students select you as supervisor
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/supervisor/requests')}
                  className="w-full p-3 flex items-center gap-3 text-left hover:bg-amber-50 rounded-lg transition-colors"
                >
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <UserCheck className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Review Requests</p>
                    <p className="text-xs text-gray-500">Accept or reject supervision requests</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/supervisor/form-d')}
                  className="w-full p-3 flex items-center gap-3 text-left hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Fill Form-D</p>
                    <p className="text-xs text-gray-500">Endorse student proposals</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/supervisor/grading')}
                  className="w-full p-3 flex items-center gap-3 text-left hover:bg-green-50 rounded-lg transition-colors"
                >
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Award className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Grade Students</p>
                    <p className="text-xs text-gray-500">Enter evaluation marks</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/supervisor/logs')}
                  className="w-full p-3 flex items-center gap-3 text-left hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ClipboardCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Meeting Logs</p>
                    <p className="text-xs text-gray-500">Review student log forms</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              
              {dashboard?.recentActivities && dashboard.recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.recentActivities.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-lg ${
                        activity.type === 'submission' ? 'bg-blue-100' :
                        activity.type === 'request' ? 'bg-amber-100' :
                        'bg-gray-100'
                      }`}>
                        {activity.type === 'submission' ? (
                          <FileText className="h-4 w-4 text-blue-600" />
                        ) : activity.type === 'request' ? (
                          <UserCheck className="h-4 w-4 text-amber-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SupervisorLayout>
  );
};

export default SupervisorDashboard;

