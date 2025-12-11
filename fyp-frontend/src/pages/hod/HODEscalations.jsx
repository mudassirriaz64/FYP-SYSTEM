import { useState, useEffect } from 'react';
import { 
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Clock,
  Users,
  FileText,
  MessageSquare,
  Bell,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';
import HODLayout from '../../components/layouts/HODLayout';

const HODEscalations = () => {
  const [loading, setLoading] = useState(true);
  const [escalations, setEscalations] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Open');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [expandedEscalation, setExpandedEscalation] = useState(null);
  
  // Action modal
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [actionType, setActionType] = useState('warning');
  const [actionRemarks, setActionRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchEscalations();
  }, [filterStatus, filterSeverity]);

  const fetchEscalations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'All') params.append('status', filterStatus);
      if (filterSeverity !== 'All') params.append('severity', filterSeverity);
      
      const response = await api.get(`${API_BASE}/hod/escalations?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setEscalations(data.escalations || []);
      }
    } catch (err) {
      setError('Failed to load escalations');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedEscalation) return;

    try {
      setProcessing(true);

      const response = await api.post(`${API_BASE}/hod/escalations/${selectedEscalation.id}/action`, {
        action: actionType,
        remarks: actionRemarks
      });

      if (response.ok) {
        setSuccess(`Action completed successfully!`);
        setShowActionModal(false);
        setActionRemarks('');
        fetchEscalations();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to process action');
      }
    } catch (err) {
      setError('Failed to process action');
    } finally {
      setProcessing(false);
    }
  };

  const openActionModal = (escalation, action) => {
    setSelectedEscalation(escalation);
    setActionType(action);
    setActionRemarks('');
    setShowActionModal(true);
  };

  const getSeverityBadge = (severity) => {
    const styles = {
      Critical: 'bg-red-100 text-red-700',
      Serious: 'bg-amber-100 text-amber-700',
      Warning: 'bg-yellow-100 text-yellow-700'
    };
    return styles[severity] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadge = (status) => {
    const styles = {
      Open: 'bg-red-100 text-red-700',
      UnderReview: 'bg-blue-100 text-blue-700',
      WarningIssued: 'bg-amber-100 text-amber-700',
      Resolved: 'bg-green-100 text-green-700',
      Closed: 'bg-gray-100 text-gray-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const filteredEscalations = escalations.filter(e =>
    e.groupName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <HODLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Escalations & Alerts</h1>
            <p className="text-gray-500 mt-1">Manage disciplinary issues and missed report alerts</p>
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

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search escalations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="UnderReview">Under Review</option>
              <option value="WarningIssued">Warning Issued</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            >
              <option value="All">All Severity</option>
              <option value="Critical">Critical</option>
              <option value="Serious">Serious</option>
              <option value="Warning">Warning</option>
            </select>
            <div className="text-right text-sm text-gray-500 flex items-center justify-end">
              {filteredEscalations.length} escalation(s) found
            </div>
          </div>
        </div>

        {/* Escalations List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
          </div>
        ) : filteredEscalations.length > 0 ? (
          <div className="space-y-4">
            {filteredEscalations.map((escalation) => (
              <div 
                key={escalation.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                  escalation.severity === 'Critical' ? 'border-l-4 border-l-red-500' :
                  escalation.severity === 'Serious' ? 'border-l-4 border-l-amber-500' :
                  'border-l-4 border-l-yellow-500'
                }`}
              >
                {/* Header */}
                <div 
                  className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedEscalation(expandedEscalation === escalation.id ? null : escalation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${
                          escalation.severity === 'Critical' ? 'bg-red-100' :
                          escalation.severity === 'Serious' ? 'bg-amber-100' :
                          'bg-yellow-100'
                        }`}>
                          <AlertTriangle className={`h-5 w-5 ${
                            escalation.severity === 'Critical' ? 'text-red-600' :
                            escalation.severity === 'Serious' ? 'text-amber-600' :
                            'text-yellow-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{escalation.groupName}</h3>
                          <p className="text-sm text-gray-500">{escalation.type}</p>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-2">{escalation.reason}</p>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityBadge(escalation.severity)}`}>
                          {escalation.severity}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(escalation.status)}`}>
                          {escalation.status}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Reported {new Date(escalation.reportedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {escalation.status === 'Open' && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); openActionModal(escalation, 'warning'); }}
                            className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm hover:bg-amber-200"
                          >
                            Issue Warning
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openActionModal(escalation, 'resolve'); }}
                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                          >
                            Resolve
                          </button>
                        </>
                      )}
                      {expandedEscalation === escalation.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedEscalation === escalation.id && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-lg border">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Group Details</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-gray-500">Group:</span> {escalation.groupName}</p>
                          <p><span className="text-gray-500">Project:</span> {escalation.projectTitle || 'N/A'}</p>
                          <p><span className="text-gray-500">Supervisor:</span> {escalation.supervisorName || 'N/A'}</p>
                          <p><span className="text-gray-500">Members:</span> {escalation.memberCount || 0}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-white rounded-lg border">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Escalation Details</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-gray-500">Type:</span> {escalation.type}</p>
                          <p><span className="text-gray-500">Reported By:</span> {escalation.reportedByName || 'System'}</p>
                          <p><span className="text-gray-500">Date:</span> {new Date(escalation.reportedAt).toLocaleString()}</p>
                          {escalation.missedReportsCount && (
                            <p><span className="text-gray-500">Missed Reports:</span> {escalation.missedReportsCount}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {escalation.resolutionNotes && (
                      <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="text-sm font-medium text-green-800 mb-1">Resolution</h4>
                        <p className="text-sm text-green-700">{escalation.resolutionNotes}</p>
                        {escalation.resolvedAt && (
                          <p className="text-xs text-green-600 mt-2">
                            Resolved by {escalation.resolvedByName} on {new Date(escalation.resolvedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Escalations Found</h3>
            <p className="text-gray-500">
              {filterStatus !== 'All' || filterSeverity !== 'All'
                ? 'Try adjusting your filters'
                : 'All groups are performing well. No escalations at this time.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && selectedEscalation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {actionType === 'warning' ? 'Issue Warning' : 'Resolve Escalation'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{selectedEscalation.groupName}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className={`p-4 rounded-lg ${
                actionType === 'warning' ? 'bg-amber-50' : 'bg-green-50'
              }`}>
                <p className={`text-sm ${
                  actionType === 'warning' ? 'text-amber-700' : 'text-green-700'
                }`}>
                  {actionType === 'warning' 
                    ? 'A warning will be issued to all group members and their supervisor. This action will be recorded in their academic file.'
                    : 'Resolving this escalation will mark it as complete. Please provide resolution notes.'
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                  {actionType === 'warning' ? 'Warning Message' : 'Resolution Notes'}
                </label>
                <textarea
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  placeholder={actionType === 'warning' 
                    ? 'Enter warning message for the students...'
                    : 'Describe how the issue was resolved...'
                  }
                  required
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowActionModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={processing || !actionRemarks.trim()}
                className={`px-5 py-2 rounded-lg text-white flex items-center gap-2 ${
                  actionType === 'warning' 
                    ? 'bg-amber-600 hover:bg-amber-700' 
                    : 'bg-green-600 hover:bg-green-700'
                } disabled:opacity-50`}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {actionType === 'warning' ? <Bell className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    {actionType === 'warning' ? 'Issue Warning' : 'Resolve'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </HODLayout>
  );
};

export default HODEscalations;

