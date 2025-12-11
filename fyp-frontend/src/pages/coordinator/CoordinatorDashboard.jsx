import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CoordinatorLayout from '../../components/layouts/CoordinatorLayout';
import {
  Users,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ClipboardList,
  GraduationCap,
  Award,
  BarChart3,
  Rocket
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';

const CoordinatorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGroups: 0,
    activeGroups: 0,
    pendingProposals: 0,
    approvedProposals: 0,
    upcomingDefenses: 0,
    completedDefenses: 0,
    totalStudents: 0,
    supervisors: 0
  });
  const [recentGroups, setRecentGroups] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch groups
      const groupsRes = await api.get(`${API_BASE}/fypgroups?pageSize=5`);
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setRecentGroups(groupsData.groups || []);
        
        const groups = groupsData.groups || [];
        setStats(prev => ({
          ...prev,
          totalGroups: groupsData.totalCount || groups.length,
          activeGroups: groups.filter(g => g.status === 'Active').length
        }));
      }

      // Fetch pending proposals
      const proposalsRes = await api.get(`${API_BASE}/proposals?status=Submitted&pageSize=10`);
      if (proposalsRes.ok) {
        const proposalsData = await proposalsRes.json();
        setPendingReviews(proposalsData.proposals || []);
        setStats(prev => ({
          ...prev,
          pendingProposals: proposalsData.totalCount || proposalsData.proposals?.length || 0
        }));
      }

      // Fetch defenses
      const defensesRes = await api.get(`${API_BASE}/defenses`);
      if (defensesRes.ok) {
        const defensesData = await defensesRes.json();
        const defenses = defensesData.defenses || [];
        const now = new Date();
        setStats(prev => ({
          ...prev,
          upcomingDefenses: defenses.filter(d => new Date(d.dateTime) > now && d.status !== 'Completed').length,
          completedDefenses: defenses.filter(d => d.status === 'Completed').length
        }));
      }

      // Fetch students count
      const studentsRes = await api.get(`${API_BASE}/students?pageSize=1`);
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStats(prev => ({ ...prev, totalStudents: studentsData.totalCount || 0 }));
      }

      // Fetch supervisors count
      const staffRes = await api.get(`${API_BASE}/staff?staffType=Teacher&pageSize=1`);
      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStats(prev => ({ ...prev, supervisors: staffData.totalCount || 0 }));
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Active FYP Groups',
      value: stats.activeGroups,
      subtitle: `${stats.totalGroups} total groups`,
      icon: Users,
      color: 'from-teal-500 to-emerald-500',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-600',
      link: '/coordinator/groups'
    },
    {
      title: 'Pending Proposals',
      value: stats.pendingProposals,
      subtitle: 'Awaiting review',
      icon: FileText,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      link: '/coordinator/groups'
    },
    {
      title: 'Upcoming Defenses',
      value: stats.upcomingDefenses,
      subtitle: `${stats.completedDefenses} completed`,
      icon: Calendar,
      color: 'from-violet-500 to-purple-500',
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-600',
      link: '/coordinator/defenses'
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      subtitle: `${stats.supervisors} supervisors`,
      icon: GraduationCap,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      link: '/coordinator/groups'
    }
  ];

  return (
    <CoordinatorLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {user.fullName || 'Coordinator'}!</h1>
              <p className="text-teal-100 mt-1">Here's what's happening with your FYP groups today.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/coordinator/deadlines')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors backdrop-blur-sm flex items-center gap-2"
              >
                <Rocket className="w-4 h-4" />
                Deadlines & Forms
              </button>
              <button 
                onClick={() => navigate('/coordinator/groups')}
                className="px-4 py-2 bg-white text-teal-600 rounded-xl text-sm font-medium hover:bg-teal-50 transition-colors"
              >
                View All Groups
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                onClick={() => navigate(card.link)}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${card.bgColor} ${card.textColor}`}>
                    {index === 0 ? 'Active' : index === 1 ? 'Review' : index === 2 ? 'Upcoming' : 'Total'}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? '-' : card.value}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{card.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{card.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Reviews */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Pending Reviews</h2>
                  <p className="text-xs text-gray-500">Proposals awaiting your approval</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/coordinator/groups')}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
              >
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                </div>
              ) : pendingReviews.length > 0 ? (
                <div className="space-y-3">
                  {pendingReviews.slice(0, 5).map((proposal) => (
                    <div key={proposal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          proposal.formType === 'FormA' ? 'bg-indigo-500' :
                          proposal.formType === 'FormB' ? 'bg-purple-500' : 'bg-teal-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{proposal.groupProjectTitle || 'Untitled Project'}</p>
                          <p className="text-xs text-gray-500">{proposal.formType} • {proposal.groupDegreeProgram}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">All caught up! No pending reviews.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Groups */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Recent Groups</h2>
                  <p className="text-xs text-gray-500">Latest FYP groups</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                </div>
              ) : recentGroups.length > 0 ? (
                <div className="space-y-3">
                  {recentGroups.map((group) => (
                    <div key={group.id} className="p-3 bg-gray-50 rounded-xl">
                      <p className="font-medium text-gray-900 text-sm truncate">{group.groupName}</p>
                      <p className="text-xs text-gray-500 truncate">{group.projectTitle || 'No title'}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          group.status === 'Active' ? 'bg-green-100 text-green-700' :
                          group.status === 'PendingApproval' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {group.status}
                        </span>
                        <span className="text-xs text-gray-400">{group.memberCount} members</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No groups yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button 
              onClick={() => navigate('/coordinator/deadlines')}
              className="p-4 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors text-left"
            >
              <Rocket className="w-6 h-6 text-teal-600 mb-2" />
              <p className="font-medium text-gray-900 text-sm">Release Form</p>
              <p className="text-xs text-gray-500">Set deadlines & notify</p>
            </button>
            <button 
              onClick={() => navigate('/coordinator/defenses')}
              className="p-4 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors text-left"
            >
              <Calendar className="w-6 h-6 text-violet-600 mb-2" />
              <p className="font-medium text-gray-900 text-sm">Schedule Defense</p>
              <p className="text-xs text-gray-500">Set defense dates</p>
            </button>
            <button 
              onClick={() => navigate('/coordinator/groups')}
              className="p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors text-left"
            >
              <ClipboardList className="w-6 h-6 text-amber-600 mb-2" />
              <p className="font-medium text-gray-900 text-sm">Review Proposals</p>
              <p className="text-xs text-gray-500">Approve/reject forms</p>
            </button>
            <button 
              onClick={() => navigate('/coordinator/results')}
              className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-left"
            >
              <Award className="w-6 h-6 text-blue-600 mb-2" />
              <p className="font-medium text-gray-900 text-sm">Compile Results</p>
              <p className="text-xs text-gray-500">Finalize & publish</p>
            </button>
          </div>
        </div>
      </div>
    </CoordinatorLayout>
  );
};

export default CoordinatorDashboard;
