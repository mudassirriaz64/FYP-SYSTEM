import { useState, useEffect } from 'react';
import { 
  UserCheck,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Clock,
  FileText,
  MessageSquare
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';
import SupervisorLayout from '../../components/layouts/SupervisorLayout';

const SupervisorRequests = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [responding, setResponding] = useState(null);
  
  // Response modal
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseType, setResponseType] = useState('accept');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_BASE}/supervisor/requests`);
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!selectedRequest) return;

    try {
      setResponding(selectedRequest.groupId);
      
      const response = await api.post(`${API_BASE}/supervisor/requests/${selectedRequest.groupId}/respond`, {
        accept: responseType === 'accept',
        remarks
      });

      if (response.ok) {
        setSuccess(`Request ${responseType === 'accept' ? 'accepted' : 'rejected'} successfully!`);
        setShowResponseModal(false);
        setRemarks('');
        fetchRequests();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to respond to request');
      }
    } catch (err) {
      setError('Failed to respond to request');
    } finally {
      setResponding(null);
    }
  };

  const openResponseModal = (request, type) => {
    setSelectedRequest(request);
    setResponseType(type);
    setRemarks('');
    setShowResponseModal(true);
  };

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const respondedRequests = requests.filter(r => r.status !== 'Pending');

  return (
    <SupervisorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supervision Requests</h1>
          <p className="text-gray-500 mt-1">Review and respond to student supervision requests</p>
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

        {/* Pending Requests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Pending Requests</h2>
              <p className="text-sm text-gray-500">{pendingRequests.length} request(s) awaiting your response</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div 
                  key={request.groupId}
                  className="p-5 border border-gray-200 rounded-xl hover:border-amber-300 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">{request.groupName}</h3>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          Pending
                        </span>
                      </div>
                      
                      {request.projectTitle && (
                        <p className="text-gray-700 mb-3">{request.projectTitle}</p>
                      )}
                      
                      {request.projectDescription && (
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{request.projectDescription}</p>
                      )}

                      {/* Group Members */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-2">Group Members ({request.memberCount})</p>
                        <div className="flex flex-wrap gap-2">
                          {request.members?.map((member, idx) => (
                            <span 
                              key={idx}
                              className={`px-3 py-1 rounded-full text-sm ${
                                member.isGroupManager 
                                  ? 'bg-amber-100 text-amber-700' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {member.studentName}
                              {member.isGroupManager && ' (Lead)'}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {request.degreeProgram} • {request.degreeLevel}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Requested {new Date(request.requestedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openResponseModal(request, 'accept')}
                        disabled={responding === request.groupId}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => openResponseModal(request, 'reject')}
                        disabled={responding === request.groupId}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <UserCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
              <p className="text-gray-500">You have no pending supervision requests at the moment.</p>
            </div>
          )}
        </div>

        {/* Request History */}
        {respondedRequests.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Request History</h2>
            
            <div className="space-y-3">
              {respondedRequests.map((request) => (
                <div 
                  key={request.groupId}
                  className={`p-4 rounded-lg border ${
                    request.status === 'Accepted' ? 'bg-green-50 border-green-200' :
                    'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {request.status === 'Accepted' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{request.groupName}</p>
                        <p className="text-sm text-gray-500">
                          {request.status} on {new Date(request.respondedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      request.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {responseType === 'accept' ? 'Accept' : 'Reject'} Supervision Request
              </h3>
              <p className="text-sm text-gray-500 mt-1">{selectedRequest.groupName}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className={`p-4 rounded-lg ${
                responseType === 'accept' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <p className={`text-sm ${
                  responseType === 'accept' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {responseType === 'accept' 
                    ? 'You are about to accept this group as your supervisee. You will be responsible for guiding them through their FYP.'
                    : 'You are about to reject this supervision request. The students will be notified to find another supervisor.'
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                  Remarks (Optional)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder={responseType === 'accept' 
                    ? 'Add any notes for the students...'
                    : 'Reason for rejection (helps students understand)...'
                  }
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowResponseModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRespond}
                disabled={responding}
                className={`px-5 py-2 rounded-lg text-white flex items-center gap-2 ${
                  responseType === 'accept' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {responding ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {responseType === 'accept' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {responseType === 'accept' ? 'Accept Request' : 'Reject Request'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </SupervisorLayout>
  );
};

export default SupervisorRequests;

