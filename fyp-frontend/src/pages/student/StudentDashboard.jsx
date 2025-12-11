import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  Bell,
  ChevronRight,
  UserPlus,
  FileCheck,
  Calendar
} from 'lucide-react';
import api from '../../utils/api';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('http://localhost:5073/api/student/dashboard');
      const data = await response.json();

      if (response.ok) {
        setDashboard(data);
      } else {
        setError(data.message || 'Failed to load dashboard');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (groupId) => {
    try {
      const response = await api.post(`http://localhost:5073/api/fypgroups/${groupId}/respond`, {
        accept: true
      });

      if (response.ok) {
        fetchDashboard();
      }
    } catch (err) {
      console.error('Failed to accept invite:', err);
    }
  };

  const handleDeclineInvite = async (groupId) => {
    try {
      const response = await api.post(`http://localhost:5073/api/fypgroups/${groupId}/respond`, {
        accept: false
      });

      if (response.ok) {
        fetchDashboard();
      }
    } catch (err) {
      console.error('Failed to decline invite:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
        <div className="relative px-6 py-8 md:px-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Welcome back, {dashboard?.studentName}! 👋
          </h1>
          <p className="text-indigo-100 text-lg">
            Enrollment: <span className="font-mono font-semibold">{dashboard?.enrollmentId}</span>
          </p>
          {dashboard?.departmentName && (
            <p className="text-indigo-200 mt-1">
              Department: {dashboard.departmentName}
            </p>
          )}
        </div>
      </div>

      {/* Pending Invitations */}
      {dashboard?.pendingInvites?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <UserPlus className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-amber-800">Pending Group Invitations</h2>
          </div>
          <div className="space-y-3">
            {dashboard.pendingInvites.map((invite) => (
              <div key={invite.groupMemberId} className="bg-white rounded-lg p-4 shadow-sm border border-amber-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{invite.groupName}</h3>
                    {invite.projectTitle && (
                      <p className="text-sm text-gray-600 mt-1">{invite.projectTitle}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Invited by {invite.invitedByName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptInvite(invite.groupId)}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineInvite(invite.groupId)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Forms */}
      {dashboard?.pendingForms?.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-blue-800">Forms Available for Submission</h2>
          </div>
          <div className="space-y-3">
            {dashboard.pendingForms.map((form, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${form.isSubmitted ? 'bg-green-100' : 'bg-indigo-100'}`}>
                      {form.isSubmitted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <FileCheck className="h-5 w-5 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{form.formName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className={`text-sm ${form.daysRemaining <= 1 ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                          {form.daysRemaining} days remaining
                        </span>
                      </div>
                    </div>
                  </div>
                  {!form.isSubmitted ? (
                    <button
                      onClick={() => navigate(`/student/forms/${form.formType}`)}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                    >
                      Fill Form <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                      Submitted
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Group Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">My FYP Group</h2>
          </div>

          {dashboard?.hasGroup ? (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
                <h3 className="font-semibold text-indigo-900">{dashboard.currentGroup?.groupName}</h3>
                {dashboard.currentGroup?.projectTitle && (
                  <p className="text-sm text-indigo-700 mt-1">{dashboard.currentGroup.projectTitle}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium
                    ${dashboard.currentGroup?.status === 'Active' ? 'bg-green-100 text-green-700' :
                      dashboard.currentGroup?.status === 'PendingApproval' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'}
                  `}>
                    {dashboard.currentGroup?.status}
                  </span>
                  {dashboard.isGroupManager && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                      Group Manager
                    </span>
                  )}
                </div>
              </div>

              {/* Group Members */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Members</h4>
                <div className="space-y-2">
                  {dashboard.currentGroup?.members?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                          {member.studentName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.studentName}</p>
                          <p className="text-xs text-gray-500">{member.enrollmentId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.isGroupManager && (
                          <span className="text-xs text-indigo-600 font-medium">Manager</span>
                        )}
                        <span className={`w-2 h-2 rounded-full 
                          ${member.status === 'Accepted' ? 'bg-green-500' :
                            member.status === 'Pending' ? 'bg-amber-500' : 'bg-gray-400'}
                        `}></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supervisor */}
              {dashboard.currentGroup?.supervisorName && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Supervisor</p>
                  <p className="text-sm font-medium text-gray-900">{dashboard.currentGroup.supervisorName}</p>
                  <span className={`text-xs ${dashboard.currentGroup.supervisorStatus === 'Accepted' ? 'text-green-600' :
                      dashboard.currentGroup.supervisorStatus === 'Rejected' ? 'text-red-600' :
                        'text-amber-600'
                    }`}>
                    {dashboard.currentGroup.supervisorStatus}
                  </span>
                </div>
              )}

              <button
                onClick={() => navigate('/student/my-group')}
                className="w-full py-2 text-indigo-600 text-sm font-medium hover:bg-indigo-50 rounded-lg transition-colors"
              >
                View Group Details →
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Group Yet</h3>
              <p className="text-gray-500 text-sm mb-4">
                Create a new group or wait for an invitation
              </p>
              <button
                onClick={() => navigate('/student/my-group')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Group
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
            </div>
            <button
              onClick={() => navigate('/student/notifications')}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              View All
            </button>
          </div>

          {dashboard?.activeNotifications?.length > 0 ? (
            <div className="space-y-3">
              {dashboard.activeNotifications.map((notif) => (
                <div key={notif.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-indigo-500">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{notif.title}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notif.message}</p>
                      {notif.isFormAvailable && (
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="h-4 w-4 text-red-500" />
                          <span className="text-xs text-red-600 font-medium">
                            {notif.daysRemaining} days left to submit
                          </span>
                        </div>
                      )}
                    </div>
                    {notif.priority > 0 && (
                      <span className={`px-2 py-1 rounded text-xs font-medium
                        ${notif.priority === 2 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}
                      `}>
                        {notif.priority === 2 ? 'Urgent' : 'Important'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No announcements</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

