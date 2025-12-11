import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import {
  Users,
  GraduationCap,
  Briefcase,
  Layers,
  RefreshCw,
  Clock,
  Info,
  Shield,
  CheckCircle,
  XCircle,
  Activity,
  ArrowRight
} from 'lucide-react';

const API_BASE = 'http://localhost:5073/api';

const AdminDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [stats, setStats] = useState([
    { title: 'TOTAL USERS', value: 0, subtitle: 'all roles', icon: Users, color: 'text-primary-600', bg: 'bg-primary-50' },
    { title: 'TOTAL DEPARTMENTS', value: 0, subtitle: 'active depts', icon: Layers, color: 'text-slate-600', bg: 'bg-slate-100' },
    { title: 'TOTAL STAFF', value: 0, subtitle: 'hover for breakdown', icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50', tooltip: 'Teachers: 0\nFinance: 0' },
    { title: 'TOTAL STUDENTS', value: 0, subtitle: 'enrolled', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]);

  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_BASE}/dashboard/summary`, {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
        });

        if (!response.ok) throw new Error('Failed to load dashboard data');
        const data = await response.json();

        const staffTooltip = `Teachers: ${data.staffTeachers ?? 0}\nFinance: ${data.staffFinance ?? 0}`;

        setStats([
          { title: 'TOTAL USERS', value: data.totalUsers ?? 0, subtitle: 'all roles', icon: Users, color: 'text-primary-600', bg: 'bg-primary-50' },
          { title: 'TOTAL DEPARTMENTS', value: data.totalDepartments ?? 0, subtitle: 'active depts', icon: Layers, color: 'text-slate-600', bg: 'bg-slate-100' },
          { title: 'TOTAL STAFF', value: data.totalStaff ?? 0, subtitle: 'hover for breakdown', icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50', tooltip: staffTooltip },
          { title: 'TOTAL STUDENTS', value: data.totalStudents ?? 0, subtitle: 'enrolled', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ]);

        setError('');
      } catch (err) {
        console.error(err);
        setError('Using offline mode');
      } finally {
        // specific timeout to prevent flickering if API is too fast
        setTimeout(() => setLoading(false), 500);
      }
    };

    const fetchRecentActivities = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/auditlogs?page=1&pageSize=10`, {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
        });

        if (response.ok) {
          const data = await response.json();
          setActivities(data.logs || []);
        }
      } catch (err) {
        console.error('Failed to fetch activities:', err);
      }
    };

    fetchDashboardData();
    fetchRecentActivities();
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <AdminLayout>
      <div className="font-body min-h-screen pb-10 animate-in fade-in duration-500">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-neutral-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-neutral-500 mt-2 text-base">
              Welcome back, <span className="font-semibold text-primary-700">{user.fullName || 'Administrator'}</span>.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-neutral-500 bg-white px-4 py-2 rounded-full border border-neutral-200 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group relative">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                {stat.tooltip && (
                  <div className="group/tooltip relative">
                    <Info className="w-4 h-4 text-neutral-300 hover:text-neutral-500 cursor-help" />
                    <div className="absolute right-0 top-6 z-20 hidden group-hover/tooltip:block w-32 bg-neutral-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl whitespace-pre-line leading-relaxed">
                      {stat.tooltip}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-500 tracking-wider uppercase mb-1 font-heading">
                  {stat.title}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-heading font-bold text-neutral-900">
                    {stat.value.toLocaleString()}
                  </span>
                  <span className="text-xs text-neutral-400 font-medium truncate">
                    {stat.subtitle}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity (simple feed) */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
          <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-white">
            <div>
              <p className="text-xs font-semibold uppercase text-primary-600 tracking-[0.12em]">Activity</p>
              <h2 className="text-lg font-heading font-bold text-neutral-800">Recent Activity</h2>
              <p className="text-xs text-neutral-500 mt-1">Latest system and user events</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/admin/audit-logs')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                View All
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="text-neutral-900 font-medium">No recent activity</p>
              <p className="text-sm text-neutral-500">Logs will appear here when available.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {activities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="p-4 flex items-center gap-4 hover:bg-neutral-50/50 transition-colors cursor-pointer"
                  onClick={() => navigate('/admin/audit-logs')}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.success ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    {activity.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{activity.action}</p>
                    <p className="text-xs text-neutral-500 truncate">
                      by {activity.fullName || activity.userName || 'System'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 mb-1">
                      {activity.actionType}
                    </span>
                    <p className="text-xs text-neutral-400 whitespace-nowrap">
                      {new Date(activity.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout >
  );
};

// --- Sub Components ---

const DashboardSkeleton = () => (
  <AdminLayout>
    <div className="animate-pulse font-body min-h-screen">
      <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 w-64 bg-gray-200 rounded mb-8"></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 h-32">
            <div className="flex justify-between">
              <div className="w-12 h-12 bg-gray-100 rounded-xl"></div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 w-20 bg-gray-100 rounded"></div>
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white h-80 rounded-2xl border border-gray-100"></div>
        <div className="bg-white h-80 rounded-2xl border border-gray-100"></div>
      </div>
    </div>
  </AdminLayout>
);

export default AdminDashboard;