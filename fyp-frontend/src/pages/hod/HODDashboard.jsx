import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle,
  DollarSign,
  Award,
  Users,
  Clock,
  CheckCircle2,
  ChevronRight,
  Bell,
  TrendingUp,
  FileText,
  AlertCircle
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';
import HODLayout from '../../components/layouts/HODLayout';

const HODDashboard = () => {
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
      const response = await api.get(`${API_BASE}/hod/dashboard`);
      
      if (response.ok) {
        const data = await response.json();
        setDashboard(data);
      } else {
        // Fallback data
        setDashboard({
          departmentName: 'Computer Science',
          totalGroups: 0,
          activeGroups: 0,
          pendingEscalations: 0,
          pendingBudgets: 0,
          pendingMarkReviews: 0,
          escalations: [],
          budgets: [],
          recentActivities: []
        });
      }
    } catch (err) {
      setError('Failed to load dashboard');
      setDashboard({
        departmentName: 'Computer Science',
        totalGroups: 0,
        activeGroups: 0,
        pendingEscalations: 0,
        pendingBudgets: 0,
        pendingMarkReviews: 0,
        escalations: [],
        budgets: [],
        recentActivities: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <HODLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
        </div>
      </HODLayout>
    );
  }

  return (
    <HODLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 rounded-2xl shadow-xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="relative px-6 py-8 md:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Welcome back, {user.fullName}! 👋
                </h1>
                <p className="text-rose-100 text-lg">
                  Head of Department - {dashboard?.departmentName || 'Department'}
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex gap-2">
                <button
                  onClick={() => navigate('/hod/escalations')}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium text-white transition-colors backdrop-blur-sm flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  View Escalations
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
            onClick={() => navigate('/hod/escalations')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{dashboard?.pendingEscalations || 0}</p>
                <p className="text-sm text-gray-500">Pending Escalations</p>
              </div>
            </div>
            {(dashboard?.pendingEscalations || 0) > 0 && (
              <div className="mt-3 flex items-center gap-1 text-red-600 text-sm font-medium">
                <Bell className="h-4 w-4" />
                <span>Requires attention</span>
              </div>
            )}
          </div>

          <div 
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/hod/budgets')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{dashboard?.pendingBudgets || 0}</p>
                <p className="text-sm text-gray-500">Budget Requests</p>
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/hod/marks')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{dashboard?.pendingMarkReviews || 0}</p>
                <p className="text-sm text-gray-500">Mark Reviews</p>
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/hod/groups')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{dashboard?.activeGroups || 0}</p>
                <p className="text-sm text-gray-500">Active Groups</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Escalations */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Active Escalations</h2>
              </div>
              <button
                onClick={() => navigate('/hod/escalations')}
                className="text-sm text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
              >
                View All <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {dashboard?.escalations && dashboard.escalations.length > 0 ? (
              <div className="space-y-3">
                {dashboard.escalations.slice(0, 5).map((escalation) => (
                  <div 
                    key={escalation.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      escalation.severity === 'Critical' ? 'bg-red-50 border-l-red-500' :
                      escalation.severity === 'Serious' ? 'bg-amber-50 border-l-amber-500' :
                      'bg-yellow-50 border-l-yellow-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{escalation.groupName}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            escalation.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                            escalation.severity === 'Serious' ? 'bg-amber-100 text-amber-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {escalation.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{escalation.reason}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Type: {escalation.type} • Reported {new Date(escalation.reportedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/hod/escalations/${escalation.id}`)}
                        className="px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-sm hover:bg-rose-200"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
                <p className="text-gray-500">No active escalations</p>
                <p className="text-sm text-gray-400 mt-1">All groups are on track</p>
              </div>
            )}
          </div>

          {/* Quick Actions & Pending Budgets */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/hod/escalations')}
                  className="w-full p-3 flex items-center gap-3 text-left hover:bg-red-50 rounded-lg transition-colors"
                >
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Review Escalations</p>
                    <p className="text-xs text-gray-500">Issue warnings for missed reports</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/hod/budgets')}
                  className="w-full p-3 flex items-center gap-3 text-left hover:bg-green-50 rounded-lg transition-colors"
                >
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Approve Budgets</p>
                    <p className="text-xs text-gray-500">Review project funding requests</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/hod/marks')}
                  className="w-full p-3 flex items-center gap-3 text-left hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Award className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Review Marks</p>
                    <p className="text-xs text-gray-500">Approve final compiled marks</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/hod/reports')}
                  className="w-full p-3 flex items-center gap-3 text-left hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">View Reports</p>
                    <p className="text-xs text-gray-500">Department statistics & analytics</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Pending Budget Approvals */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Budgets</h2>
              
              {dashboard?.budgets && dashboard.budgets.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.budgets.slice(0, 3).map((budget) => (
                    <div 
                      key={budget.id}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900 text-sm">{budget.groupName}</p>
                        <span className="text-green-600 font-semibold text-sm">
                          PKR {budget.requestedAmount?.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{budget.title}</p>
                    </div>
                  ))}
                  <button
                    onClick={() => navigate('/hod/budgets')}
                    className="w-full text-center text-sm text-rose-600 hover:text-rose-700 font-medium py-2"
                  >
                    View All →
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No pending budgets</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          
          {dashboard?.recentActivities && dashboard.recentActivities.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recentActivities.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-1.5 rounded-lg ${
                    activity.type === 'escalation' ? 'bg-red-100' :
                    activity.type === 'budget' ? 'bg-green-100' :
                    activity.type === 'marks' ? 'bg-purple-100' :
                    'bg-gray-100'
                  }`}>
                    {activity.type === 'escalation' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                    {activity.type === 'budget' && <DollarSign className="h-4 w-4 text-green-600" />}
                    {activity.type === 'marks' && <Award className="h-4 w-4 text-purple-600" />}
                    {!['escalation', 'budget', 'marks'].includes(activity.type) && <Clock className="h-4 w-4 text-gray-600" />}
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </HODLayout>
  );
};

export default HODDashboard;

