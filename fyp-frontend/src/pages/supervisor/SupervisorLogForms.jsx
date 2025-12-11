import { useState, useEffect } from 'react';
import { 
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Eye,
  AlertCircle,
  Search,
  Filter,
  MessageSquare,
  Users,
  FileCheck
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';
import SupervisorLayout from '../../components/layouts/SupervisorLayout';

const SupervisorLogForms = () => {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    fetchPendingDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm, statusFilter]);

  const fetchPendingDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`${API_BASE}/supervisor/documents/pending`);

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        setError('Failed to load pending log forms');
      }
    } catch (err) {
      setError('Failed to load pending log forms');
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = [...documents];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.groupName?.toLowerCase().includes(search) ||
        doc.projectTitle?.toLowerCase().includes(search) ||
        doc.studentName?.toLowerCase().includes(search) ||
        doc.studentEnrollmentId?.toLowerCase().includes(search) ||
        doc.documentType?.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        filtered = filtered.filter(doc => doc.status === 'Submitted' || doc.workflowStatus === 'StudentSubmitted');
      } else if (statusFilter === 'reviewed') {
        filtered = filtered.filter(doc => doc.workflowStatus === 'SupervisorReviewed');
      } else if (statusFilter === 'rejected') {
        filtered = filtered.filter(doc => doc.workflowStatus === 'SupervisorRejected');
      }
    }

    setFilteredDocuments(filtered);
  };

  const handleReview = (document) => {
    setSelectedDocument(document);
    setReviewRemarks('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (approved) => {
    if (!selectedDocument) return;

    try {
      setReviewing(true);
      setError('');
      setSuccess('');

      const response = await api.post(
        `${API_BASE}/supervisor/documents/${selectedDocument.id}/review`,
        {
          approved,
          remarks: reviewRemarks || null
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message || (approved ? 'Log form approved successfully' : 'Log form rejected'));
        setShowReviewModal(false);
        setSelectedDocument(null);
        setReviewRemarks('');
        // Refresh the list
        await fetchPendingDocuments();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to submit review');
      }
    } catch (err) {
      setError('Failed to submit review');
    } finally {
      setReviewing(false);
    }
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      const response = await api.get(`${API_BASE}/supervisor/documents/${documentId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to download document');
      }
    } catch (err) {
      setError('Failed to download document');
    }
  };

  const getDocumentTypeLabel = (type) => {
    const match = type.match(/LogForm(\d+)/);
    if (match) {
      return `Log Form ${match[1]}`;
    }
    return type;
  };

  const getStatusBadge = (status, workflowStatus) => {
    if (workflowStatus === 'SupervisorReviewed') {
      return 'bg-green-100 text-green-700';
    } else if (workflowStatus === 'SupervisorRejected') {
      return 'bg-red-100 text-red-700';
    } else if (workflowStatus === 'StudentSubmitted' || status === 'Submitted') {
      return 'bg-amber-100 text-amber-700';
    }
    return 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status, workflowStatus) => {
    if (workflowStatus === 'SupervisorReviewed') {
      return 'Approved';
    } else if (workflowStatus === 'SupervisorRejected') {
      return 'Rejected';
    } else if (workflowStatus === 'StudentSubmitted' || status === 'Submitted') {
      return 'Pending Review';
    }
    return status;
  };

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.workflowStatus === 'StudentSubmitted' || d.status === 'Submitted').length,
    approved: documents.filter(d => d.workflowStatus === 'SupervisorReviewed').length,
    rejected: documents.filter(d => d.workflowStatus === 'SupervisorRejected').length
  };

  return (
    <SupervisorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Log Form Review</h1>
            <p className="text-gray-600 mt-1">Review and approve log forms submitted by your groups</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="ml-auto">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Log Forms</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.approved}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by group, project, student..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Review</option>
                <option value="reviewed">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            <p className="text-gray-600 mt-4">Loading log forms...</p>
          </div>
        ) : filteredDocuments.length > 0 ? (
          <div className="space-y-4">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <FileText className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{getDocumentTypeLabel(doc.documentType)}</h3>
                        <p className="text-sm text-gray-600">{doc.fileName}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Group</p>
                        <p className="text-sm font-medium text-gray-900">{doc.groupName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Project Title</p>
                        <p className="text-sm font-medium text-gray-900">{doc.projectTitle || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Submitted By</p>
                        <p className="text-sm font-medium text-gray-900">
                          {doc.studentName} ({doc.studentEnrollmentId})
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Submitted At</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(doc.uploadedAt).toLocaleDateString()} {new Date(doc.uploadedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    {doc.supervisorRemarks && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Previous Remarks</p>
                        <p className="text-sm text-gray-700">{doc.supervisorRemarks}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 ml-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                        doc.status,
                        doc.workflowStatus
                      )}`}
                    >
                      {getStatusLabel(doc.status, doc.workflowStatus)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(doc.id, doc.fileName)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {(doc.workflowStatus === 'StudentSubmitted' || doc.status === 'Submitted') && (
                        <button
                          onClick={() => handleReview(doc)}
                          className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Review"
                        >
                          <FileCheck className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No log forms found</p>
            {searchTerm || statusFilter !== 'all' ? (
              <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
            ) : (
              <p className="text-sm text-gray-400 mt-2">Log forms will appear here when students submit them</p>
            )}
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && selectedDocument && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Review Log Form</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {getDocumentTypeLabel(selectedDocument.documentType)} - {selectedDocument.groupName}
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks/Comments (Optional)
                  </label>
                  <textarea
                    value={reviewRemarks}
                    onChange={(e) => setReviewRemarks(e.target.value)}
                    placeholder="Add any comments or feedback for the student..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleSubmitReview(true)}
                    disabled={reviewing}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {reviewing ? 'Processing...' : 'Approve & Forward to Coordinator'}
                  </button>
                  <button
                    onClick={() => handleSubmitReview(false)}
                    disabled={reviewing}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    {reviewing ? 'Processing...' : 'Reject & Return to Student'}
                  </button>
                  <button
                    onClick={() => {
                      setShowReviewModal(false);
                      setSelectedDocument(null);
                      setReviewRemarks('');
                    }}
                    disabled={reviewing}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SupervisorLayout>
  );
};

export default SupervisorLogForms;

