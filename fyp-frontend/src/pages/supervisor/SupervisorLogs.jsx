import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  ArrowLeft,
  Clock,
  Calendar,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  FileText
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';
import SupervisorLayout from '../../components/layouts/SupervisorLayout';

const SupervisorLogs = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preSelectedGroupId = searchParams.get('groupId');

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [responding, setResponding] = useState(null);

  // View Log Modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (preSelectedGroupId && groups.length > 0) {
      const group = groups.find(g => g.id === parseInt(preSelectedGroupId));
      if (group) {
        handleSelectGroup(group);
      }
    }
  }, [preSelectedGroupId, groups]);

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

  const handleSelectGroup = async (group) => {
    setSelectedGroup(group);
    
    try {
      const response = await api.get(`${API_BASE}/supervisor/groups/${group.id}/logs`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      } else {
        // Mock data for now
        setLogs([
          {
            id: 1,
            weekNumber: 1,
            studentName: 'Ahmad Ali',
            enrollmentId: '01-131232-001',
            submittedAt: new Date().toISOString(),
            status: 'Pending',
            meetingDate: new Date().toISOString(),
            topics: 'Discussed project scope and requirements',
            progress: 'Completed initial research',
            nextTasks: 'Start designing database schema',
            issues: 'None'
          },
          {
            id: 2,
            weekNumber: 1,
            studentName: 'Sara Khan',
            enrollmentId: '01-131232-002',
            submittedAt: new Date().toISOString(),
            status: 'Approved',
            meetingDate: new Date().toISOString(),
            topics: 'Reviewed literature survey',
            progress: 'Completed 5 research papers review',
            nextTasks: 'Finalize technology stack',
            issues: 'Need clarification on ML requirements'
          }
        ]);
      }
    } catch (err) {
      // Use mock data on error
      setLogs([]);
    }
  };

  const handleViewLog = (log) => {
    setSelectedLog(log);
    setFeedback('');
    setShowLogModal(true);
  };

  const handleApproveLog = async (approve) => {
    if (!selectedLog) return;

    try {
      setResponding(selectedLog.id);

      const response = await api.post(`${API_BASE}/supervisor/logs/${selectedLog.id}/review`, {
        approved: approve,
        feedback
      });

      if (response.ok) {
        setSuccess(`Log ${approve ? 'approved' : 'rejected'} successfully!`);
        setShowLogModal(false);
        // Refresh logs
        handleSelectGroup(selectedGroup);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to review log');
      }
    } catch (err) {
      setError('Failed to review log');
    } finally {
      setResponding(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      Pending: 'bg-amber-100 text-amber-700',
      Approved: 'bg-green-100 text-green-700',
      Rejected: 'bg-red-100 text-red-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  // Group logs by week
  const logsByWeek = logs.reduce((acc, log) => {
    const week = log.weekNumber;
    if (!acc[week]) acc[week] = [];
    acc[week].push(log);
    return acc;
  }, {});

  return (
    <SupervisorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/supervisor/groups')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meeting Logs</h1>
            <p className="text-gray-500 mt-1">Review and approve student weekly meeting logs</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
            <button onClick={() => setError('')}><X className="h-4 w-4 text-red-600" /></button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-green-700">{success}</p>
            </div>
            <button onClick={() => setSuccess('')}><X className="h-4 w-4 text-green-600" /></button>
          </div>
        )}

        {/* Group Selection */}
        {!selectedGroup && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a Group</h2>
            
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              </div>
            ) : groups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleSelectGroup(group)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <ClipboardCheck className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{group.groupName}</h3>
                        <p className="text-sm text-gray-500">{group.projectTitle || 'No title'}</p>
                        <span className="text-xs text-amber-600">{group.memberCount} members</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ClipboardCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Groups Found</h3>
                <p className="text-gray-500">You don't have any assigned groups yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Logs View */}
        {selectedGroup && (
          <div className="space-y-6">
            {/* Selected Group Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Users className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900">{selectedGroup.groupName}</h3>
                    <p className="text-sm text-amber-700">{selectedGroup.projectTitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="text-sm text-amber-600 hover:text-amber-700"
                >
                  Change Group
                </button>
              </div>
            </div>

            {/* Logs by Week */}
            {Object.keys(logsByWeek).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(logsByWeek).sort(([a], [b]) => b - a).map(([week, weekLogs]) => (
                  <div key={week} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-5 py-3 border-b">
                      <h3 className="font-semibold text-gray-900">Week {week}</h3>
                    </div>
                    
                    <div className="divide-y divide-gray-100">
                      {weekLogs.map((log) => (
                        <div key={log.id} className="p-5 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <FileText className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{log.studentName}</h4>
                                <p className="text-sm text-gray-500">{log.enrollmentId}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Meeting: {new Date(log.meetingDate).toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Submitted: {new Date(log.submittedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(log.status)}`}>
                                {log.status}
                              </span>
                              <button
                                onClick={() => handleViewLog(log)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {log.status === 'Pending' && (
                                <>
                                  <button
                                    onClick={() => { setSelectedLog(log); handleApproveLog(true); }}
                                    disabled={responding === log.id}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                    title="Quick Approve"
                                  >
                                    <ThumbsUp className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Quick Preview */}
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                            <p className="text-gray-700 line-clamp-2">
                              <span className="font-medium">Topics:</span> {log.topics}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <ClipboardCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Logs Submitted</h3>
                <p className="text-gray-500">Students haven't submitted any meeting logs yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {showLogModal && selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Meeting Log - Week {selectedLog.weekNumber}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedLog.studentName}</p>
                </div>
                <button
                  onClick={() => setShowLogModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Log Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Student</p>
                  <p className="font-medium text-gray-900">{selectedLog.studentName}</p>
                  <p className="text-sm text-gray-500">{selectedLog.enrollmentId}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Meeting Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedLog.meetingDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Topics Discussed</h4>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedLog.topics}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Progress Made</h4>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedLog.progress}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Next Week Tasks</h4>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedLog.nextTasks}</p>
              </div>

              {selectedLog.issues && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Issues/Blockers</h4>
                  <p className="text-gray-700 bg-red-50 p-4 rounded-lg border border-red-200">
                    {selectedLog.issues}
                  </p>
                </div>
              )}

              {/* Feedback */}
              {selectedLog.status === 'Pending' && (
                <div>
                  <label className="block font-medium text-gray-900 mb-2">
                    <MessageSquare className="h-4 w-4 inline mr-1" />
                    Your Feedback (Optional)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="Add any feedback for the student..."
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            {selectedLog.status === 'Pending' && (
              <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
                <button
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApproveLog(false)}
                  disabled={responding}
                  className="px-5 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2"
                >
                  <ThumbsDown className="h-4 w-4" />
                  Reject
                </button>
                <button
                  onClick={() => handleApproveLog(true)}
                  disabled={responding}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  {responding ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <ThumbsUp className="h-4 w-4" />
                  )}
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </SupervisorLayout>
  );
};

export default SupervisorLogs;

