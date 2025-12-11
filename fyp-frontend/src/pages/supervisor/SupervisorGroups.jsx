import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users,
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Calendar,
  Award,
  Mail,
  Phone,
  User
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';
import SupervisorLayout from '../../components/layouts/SupervisorLayout';

const SupervisorGroups = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_BASE}/supervisor/groups`);
      
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (err) {
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      Active: 'bg-green-100 text-green-700',
      PendingApproval: 'bg-amber-100 text-amber-700',
      Forming: 'bg-blue-100 text-blue-700',
      Completed: 'bg-purple-100 text-purple-700',
      Deferred: 'bg-orange-100 text-orange-700',
      Rejected: 'bg-red-100 text-red-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const getProgressWidth = (group) => {
    const stages = [
      group.formASubmitted,
      group.formBSubmitted,
      group.supervisorAccepted,
      group.proposalApproved,
      group.formCSubmitted,
      group.midTermCompleted,
      group.finalCompleted
    ];
    const completed = stages.filter(Boolean).length;
    return (completed / stages.length) * 100;
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          group.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || group.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <SupervisorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Groups</h1>
            <p className="text-gray-500 mt-1">Manage your assigned FYP groups</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 w-64"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="PendingApproval">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Groups List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <div 
                key={group.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Group Header */}
                <div 
                  className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">{group.groupName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(group.status)}`}>
                          {group.status}
                        </span>
                      </div>
                      
                      {group.projectTitle && (
                        <p className="text-gray-600 mb-2">{group.projectTitle}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {group.memberCount} members
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {group.degreeProgram}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Accepted {new Date(group.acceptedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(getProgressWidth(group))}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                            style={{ width: `${getProgressWidth(group)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {expandedGroup === group.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedGroup === group.id && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50">
                    {/* Progress Milestones */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Progress Milestones</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {[
                          { label: 'Form-A', done: group.formASubmitted },
                          { label: 'Form-B', done: group.formBSubmitted },
                          { label: 'Supervisor', done: group.supervisorAccepted },
                          { label: 'Proposal', done: group.proposalApproved },
                          { label: 'Mid-Term', done: group.midTermCompleted },
                          { label: 'Final', done: group.finalCompleted }
                        ].map((milestone, idx) => (
                          <div 
                            key={idx}
                            className={`p-3 rounded-lg text-center ${
                              milestone.done 
                                ? 'bg-green-100 border border-green-200' 
                                : 'bg-gray-100 border border-gray-200'
                            }`}
                          >
                            {milestone.done ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                            ) : (
                              <Clock className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                            )}
                            <p className={`text-xs font-medium ${
                              milestone.done ? 'text-green-700' : 'text-gray-500'
                            }`}>
                              {milestone.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Group Members */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Group Members</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {group.members?.map((member) => (
                          <div 
                            key={member.id}
                            className="p-4 bg-white rounded-lg border border-gray-200"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-amber-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900">{member.studentName}</p>
                                  {member.isGroupManager && (
                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                                      Lead
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">{member.enrollmentId}</p>
                                {member.email && (
                                  <a href={`mailto:${member.email}`} className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                                    <Mail className="h-3 w-3" />
                                    {member.email}
                                  </a>
                                )}
                                {member.phone && (
                                  <span className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                    <Phone className="h-3 w-3" />
                                    {member.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => navigate(`/supervisor/form-d?groupId=${group.id}`)}
                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Fill Form-D
                      </button>
                      <button
                        onClick={() => navigate(`/supervisor/grading?groupId=${group.id}`)}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium flex items-center gap-2"
                      >
                        <Award className="h-4 w-4" />
                        Grade
                      </button>
                      <button
                        onClick={() => navigate(`/supervisor/logs?groupId=${group.id}`)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Meeting Logs
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Groups Found</h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'All' 
                ? 'Try adjusting your search or filter criteria'
                : 'You have no assigned groups yet. Groups will appear here once you accept supervision requests.'
              }
            </p>
          </div>
        )}
      </div>
    </SupervisorLayout>
  );
};

export default SupervisorGroups;

