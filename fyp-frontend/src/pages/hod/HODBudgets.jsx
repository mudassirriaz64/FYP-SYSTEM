import { useState, useEffect } from 'react';
import { 
  DollarSign,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Clock,
  Users,
  FileText,
  Download,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';
import HODLayout from '../../components/layouts/HODLayout';

const HODBudgets = () => {
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('SupervisorEndorsed');
  const [expandedBudget, setExpandedBudget] = useState(null);
  
  // Action modal
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [actionType, setActionType] = useState('approve');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchBudgets();
  }, [filterStatus]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'All') params.append('status', filterStatus);
      
      const response = await api.get(`${API_BASE}/hod/budgets?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setBudgets(data.budgets || []);
      }
    } catch (err) {
      setError('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedBudget) return;

    try {
      setProcessing(true);

      const response = await api.post(`${API_BASE}/hod/budgets/${selectedBudget.id}/review`, {
        approved: actionType === 'approve',
        approvedAmount: actionType === 'approve' ? parseFloat(approvedAmount) : null,
        remarks
      });

      if (response.ok) {
        setSuccess(`Budget ${actionType === 'approve' ? 'approved' : 'rejected'} successfully!`);
        setShowActionModal(false);
        setApprovedAmount('');
        setRemarks('');
        fetchBudgets();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to process budget');
      }
    } catch (err) {
      setError('Failed to process budget');
    } finally {
      setProcessing(false);
    }
  };

  const openActionModal = (budget, action) => {
    setSelectedBudget(budget);
    setActionType(action);
    setApprovedAmount(budget.requestedAmount?.toString() || '');
    setRemarks('');
    setShowActionModal(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      Pending: 'bg-gray-100 text-gray-700',
      SupervisorEndorsed: 'bg-blue-100 text-blue-700',
      HODApproved: 'bg-green-100 text-green-700',
      HODRejected: 'bg-red-100 text-red-700',
      FinanceProcessing: 'bg-purple-100 text-purple-700',
      Disbursed: 'bg-emerald-100 text-emerald-700',
      Cancelled: 'bg-gray-100 text-gray-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const filteredBudgets = budgets.filter(b =>
    b.groupName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <HODLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budget Approvals</h1>
            <p className="text-gray-500 mt-1">Review and approve project funding requests</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search budgets..."
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
              <option value="SupervisorEndorsed">Awaiting Approval</option>
              <option value="HODApproved">Approved</option>
              <option value="HODRejected">Rejected</option>
              <option value="Disbursed">Disbursed</option>
            </select>
            <div className="text-right text-sm text-gray-500 flex items-center justify-end">
              {filteredBudgets.length} budget request(s)
            </div>
          </div>
        </div>

        {/* Budgets List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
          </div>
        ) : filteredBudgets.length > 0 ? (
          <div className="space-y-4">
            {filteredBudgets.map((budget) => (
              <div 
                key={budget.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Header */}
                <div 
                  className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedBudget(expandedBudget === budget.id ? null : budget.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{budget.groupName}</h3>
                          <p className="text-sm text-gray-500">{budget.title}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="font-semibold text-green-600">
                          Requested: PKR {budget.requestedAmount?.toLocaleString()}
                        </span>
                        {budget.approvedAmount && (
                          <span className="font-semibold text-blue-600">
                            Approved: PKR {budget.approvedAmount?.toLocaleString()}
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(budget.status)}`}>
                          {budget.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {budget.status === 'SupervisorEndorsed' && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); openActionModal(budget, 'approve'); }}
                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                          >
                            Approve
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openActionModal(budget, 'reject'); }}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {expandedBudget === budget.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedBudget === budget.id && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-lg border">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Project Details</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-gray-500">Group:</span> {budget.groupName}</p>
                          <p><span className="text-gray-500">Project:</span> {budget.projectTitle || 'N/A'}</p>
                          <p><span className="text-gray-500">Supervisor:</span> {budget.supervisorName || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-white rounded-lg border">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Budget Details</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-gray-500">Title:</span> {budget.title}</p>
                          <p><span className="text-gray-500">Requested:</span> PKR {budget.requestedAmount?.toLocaleString()}</p>
                          <p><span className="text-gray-500">Submitted:</span> {new Date(budget.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    {budget.description && (
                      <div className="mt-4 p-4 bg-white rounded-lg border">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                        <p className="text-sm text-gray-600">{budget.description}</p>
                      </div>
                    )}

                    {budget.boQFilePath && (
                      <div className="mt-4">
                        <a
                          href={`${API_BASE}/${budget.boQFilePath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                        >
                          <Download className="h-4 w-4" />
                          Download Bill of Quantities
                        </a>
                      </div>
                    )}

                    {/* Workflow History */}
                    <div className="mt-4 p-4 bg-white rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Approval Workflow</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            budget.supervisorEndorsedAt ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            {budget.supervisorEndorsedAt ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">Supervisor Endorsement</p>
                            {budget.supervisorEndorsedAt ? (
                              <p className="text-xs text-gray-500">
                                Endorsed by {budget.supervisorEndorsedByName} on {new Date(budget.supervisorEndorsedAt).toLocaleDateString()}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500">Pending</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            budget.hodApprovedAt ? 'bg-green-100' : 
                            budget.status === 'HODRejected' ? 'bg-red-100' : 'bg-gray-100'
                          }`}>
                            {budget.hodApprovedAt ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : budget.status === 'HODRejected' ? (
                              <XCircle className="h-4 w-4 text-red-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">HOD Approval</p>
                            {budget.hodApprovedAt ? (
                              <p className="text-xs text-gray-500">
                                Approved by {budget.hodApprovedByName} on {new Date(budget.hodApprovedAt).toLocaleDateString()}
                              </p>
                            ) : budget.status === 'HODRejected' ? (
                              <p className="text-xs text-red-500">Rejected</p>
                            ) : (
                              <p className="text-xs text-gray-500">Pending</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            budget.financeDisbursedAt ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            {budget.financeDisbursedAt ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">Finance Disbursement</p>
                            {budget.financeDisbursedAt ? (
                              <p className="text-xs text-gray-500">
                                Disbursed on {new Date(budget.financeDisbursedAt).toLocaleDateString()}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500">Pending</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Budget Requests</h3>
            <p className="text-gray-500">
              {filterStatus !== 'All'
                ? 'Try adjusting your filters'
                : 'No budget requests to review at this time.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && selectedBudget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {actionType === 'approve' ? 'Approve Budget' : 'Reject Budget'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{selectedBudget.groupName} - {selectedBudget.title}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Requested Amount:</span> PKR {selectedBudget.requestedAmount?.toLocaleString()}
                </p>
              </div>

              {actionType === 'approve' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approved Amount (PKR)
                  </label>
                  <input
                    type="number"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    placeholder="Enter approved amount"
                    min="0"
                    max={selectedBudget.requestedAmount}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can approve the full amount or a partial amount
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  placeholder={actionType === 'approve' 
                    ? 'Any comments for the finance department...'
                    : 'Reason for rejection...'
                  }
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
                disabled={processing || (actionType === 'approve' && !approvedAmount)}
                className={`px-5 py-2 rounded-lg text-white flex items-center gap-2 ${
                  actionType === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {actionType === 'approve' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {actionType === 'approve' ? 'Approve' : 'Reject'}
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

export default HODBudgets;

