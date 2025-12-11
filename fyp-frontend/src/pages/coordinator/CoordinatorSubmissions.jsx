import { useState, useEffect } from 'react';
import { 
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  Users,
  FileCheck,
  BookOpen,
  ClipboardList,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';
import CoordinatorLayout from '../../components/layouts/CoordinatorLayout';
import { generateFormAPDF, generateFormBPDF } from '../../utils/pdfGenerator';

const CoordinatorSubmissions = () => {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Expanded rows
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  // View modal
  const [viewItem, setViewItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all submissions (proposals + documents)
      const submissionsRes = await api.get(`${API_BASE}/coordinator/submissions/all`);
      
      if (submissionsRes.ok) {
        const data = await submissionsRes.json();
        const groupsData = data.groups || [];
        setGroups(groupsData);
        
        // Debug: Log groups data
        console.log('Groups data from API:', groupsData);
        
        // Aggregate all submissions (proposals + documents)
        const allSubmissions = [];
        groupsData.forEach(group => {
          const groupId = group.groupId || group.GroupId;
          
          // Add proposals
          if (group.proposals && group.proposals.length > 0) {
            group.proposals.forEach(proposal => {
              allSubmissions.push({
                ...proposal,
                id: proposal.id || proposal.Id,
                groupId: groupId,
                groupName: group.groupName || group.GroupName,
                projectTitle: group.projectTitle || group.ProjectTitle,
                submissionType: 'proposal',
                formType: proposal.formType || proposal.FormType,
                documentType: proposal.documentType || proposal.DocumentType || proposal.formType || proposal.FormType,
                status: proposal.status || proposal.Status,
                submittedAt: proposal.submittedAt || proposal.SubmittedAt,
                submittedByName: proposal.submittedByName || proposal.SubmittedByName,
                hasAttachment: proposal.hasAttachment ?? proposal.HasAttachment ?? false
              });
            });
          }
          
          // Add documents
          if (group.documents && group.documents.length > 0) {
            group.documents.forEach(doc => {
              allSubmissions.push({
                ...doc,
                id: doc.id || doc.Id,
                groupId: groupId,
                groupName: group.groupName || group.GroupName,
                projectTitle: group.projectTitle || group.ProjectTitle,
                submissionType: 'document',
                formType: doc.documentType || doc.DocumentType,
                documentType: doc.documentType || doc.DocumentType,
                status: doc.status || doc.Status,
                workflowStatus: doc.workflowStatus || doc.WorkflowStatus,
                submittedAt: doc.submittedAt || doc.SubmittedAt || doc.uploadedAt || doc.UploadedAt,
                submittedByName: doc.submittedByName || doc.SubmittedByName,
                supervisorName: doc.supervisorName || doc.SupervisorName,
                supervisorReviewedAt: doc.supervisorReviewedAt || doc.SupervisorReviewedAt,
                supervisorRemarks: doc.supervisorRemarks || doc.SupervisorRemarks,
                fileName: doc.fileName || doc.FileName
              });
            });
          }
        });
        
        console.log('All submissions aggregated:', allSubmissions);
        setSubmissions(allSubmissions);
      } else {
        let errorMessage = 'Failed to load submissions';
        try {
          const errorData = await submissionsRes.json();
          // Show detailed error if available, otherwise show generic message
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error('API Error Response:', errorData);
          
          // Log full error details for debugging
          if (errorData.details) {
            console.error('Error Details:', errorData.details);
          }
        } catch (parseErr) {
          console.error('Error parsing error response:', parseErr);
          errorMessage = `Server error: ${submissionsRes.status} ${submissionsRes.statusText}`;
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError(err.message || 'Failed to load submissions. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const getFormIcon = (type) => {
    switch (type) {
      case 'FormA': return FileText;
      case 'FormB': return ClipboardList;
      case 'FormC': return BookOpen;
      case 'FormD': return FileCheck;
      case 'SRS':
      case 'SDS': return BookOpen;
      default: return FileText;
    }
  };

  const getFormColor = (type) => {
    switch (type) {
      case 'FormA': return 'blue';
      case 'FormB': return 'indigo';
      case 'FormC': return 'purple';
      case 'FormD': return 'pink';
      case 'SRS': return 'green';
      case 'SDS': return 'emerald';
      case 'MonthlyReport': return 'amber';
      case 'FinalReport': return 'teal';
      default: return 'gray';
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      Pending: 'bg-amber-100 text-amber-700',
      Approved: 'bg-green-100 text-green-700',
      Rejected: 'bg-red-100 text-red-700',
      Submitted: 'bg-blue-100 text-blue-700',
      UnderReview: 'bg-purple-100 text-purple-700',
      StudentSubmitted: 'bg-blue-100 text-blue-700',
      SupervisorReviewed: 'bg-purple-100 text-purple-700',
      SupervisorRejected: 'bg-red-100 text-red-700',
      CoordinatorFinalized: 'bg-green-100 text-green-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const handleFinalizeDocument = async (documentId, documentType) => {
    if (!confirm(`Are you sure you want to finalize this ${documentType}? This will lock the document.`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      const response = await api.post(
        `${API_BASE}/documentsubmission/documents/${documentId}/finalize`,
        {
          approved: true,
          remarks: null
        }
      );

      if (response.ok) {
        setSuccess('Document finalized successfully');
        await fetchData(); // Refresh the list
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to finalize document');
      }
    } catch (err) {
      setError('Failed to finalize document');
    }
  };

  const handleReviewProposal = async (proposalId, action, remarks = '') => {
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this proposal?`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      const response = await api.put(`${API_BASE}/proposals/${proposalId}/review`, {
        status: action,
        remarks: remarks || null
      });

      if (response.ok) {
        setSuccess(`Proposal ${action.toLowerCase()} successfully`);
        await fetchData();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to review proposal');
      }
    } catch (err) {
      setError('Failed to review proposal');
    }
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      // Determine if it's a proposal or document
      const submission = submissions.find(s => s.id === documentId);
      if (!submission) return;

      // Check if this is Form-A or Form-B proposal (generate PDF)
      const formType = submission.formType || submission.FormType || submission.documentType || submission.DocumentType;
      if (submission.submissionType === 'proposal' && (formType === 'FormA' || formType === 'FormB')) {
        // Find the group data for this submission
        const groupData = groups.find(g => 
          (g.groupId || g.GroupId) === submission.groupId
        );
        
        if (!groupData) {
          setError('Group data not found');
          return;
        }

        // Generate PDF
        let doc;
        if (formType === 'FormA') {
          doc = generateFormAPDF(submission, groupData);
        } else {
          doc = generateFormBPDF(submission, groupData);
        }
        
        // Download the generated PDF
        doc.save(`${formType}_${groupData.groupName || 'Group'}_${new Date().toISOString().split('T')[0]}.pdf`);
        return;
      }

      // If proposal has no attachment, show a friendly message
      if (submission.submissionType === 'proposal' && submission.hasAttachment === false) {
        setError('This proposal has no file attachment to download.');
        return;
      }

      let downloadUrl = '';
      if (submission.submissionType === 'document') {
        downloadUrl = `${API_BASE}/coordinator/submissions/document/${documentId}/download`;
      } else {
        downloadUrl = `${API_BASE}/coordinator/submissions/proposal/${documentId}/download`;
      }

      const response = await api.get(downloadUrl);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'document';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        try {
          const data = await response.json();
          setError(data.message || 'Failed to download document');
        } catch {
          setError('Failed to download document');
        }
      }
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download document');
    }
  };

  // Group submissions by group
  const groupedSubmissions = groups.map(group => {
    // Handle both GroupId and groupId (case-insensitive matching)
    const groupId = group.groupId || group.GroupId || group.id;
    const groupSubmissions = submissions.filter(s => {
      const sGroupId = s.groupId || s.GroupId;
      return sGroupId === groupId;
    });
    
    // Combine proposals and documents from the group data
    const allGroupSubmissions = [
      ...(group.proposals || []).map(p => ({
        ...p,
        groupId: groupId,
        submissionType: 'proposal',
        formType: p.formType || p.FormType,
        documentType: p.documentType || p.DocumentType || p.formType || p.FormType,
        status: p.status || p.Status,
        submittedAt: p.submittedAt || p.SubmittedAt,
        submittedByName: p.submittedByName || p.SubmittedByName,
        hasAttachment: p.hasAttachment ?? p.HasAttachment ?? false
      })),
      ...(group.documents || []).map(d => ({
        ...d,
        groupId: groupId,
        submissionType: 'document',
        formType: d.documentType || d.DocumentType,
        documentType: d.documentType || d.DocumentType,
        status: d.status || d.Status,
        workflowStatus: d.workflowStatus || d.WorkflowStatus,
        submittedAt: d.submittedAt || d.SubmittedAt || d.uploadedAt || d.UploadedAt,
        submittedByName: d.submittedByName || d.SubmittedByName,
        supervisorName: d.supervisorName || d.SupervisorName,
        supervisorReviewedAt: d.supervisorReviewedAt || d.SupervisorReviewedAt,
        supervisorRemarks: d.supervisorRemarks || d.SupervisorRemarks
      })),
      ...groupSubmissions // Also include any from the aggregated list
    ];
    
    // Remove duplicates by ID
    const uniqueSubmissions = Array.from(
      new Map(allGroupSubmissions.map(s => [s.id || s.Id, s])).values()
    );
    
    return {
      ...group,
      id: groupId,
      groupId: groupId,
      groupName: group.groupName || group.GroupName,
      projectTitle: group.projectTitle || group.ProjectTitle,
      submissions: uniqueSubmissions,
      submissionCount: uniqueSubmissions.length,
      pendingCount: uniqueSubmissions.filter(s => {
        const status = s.status || s.Status;
        const workflowStatus = s.workflowStatus || s.WorkflowStatus;
        return status === 'Pending' || 
               status === 'Submitted' || 
               workflowStatus === 'StudentSubmitted' ||
               workflowStatus === 'SupervisorReviewed';
      }).length,
      approvedCount: uniqueSubmissions.filter(s => {
        const status = s.status || s.Status;
        const workflowStatus = s.workflowStatus || s.WorkflowStatus;
        return status === 'Approved' || 
               workflowStatus === 'CoordinatorFinalized';
      }).length
    };
  });

  // Filter groups - show all groups that have submissions
  const filteredGroups = groupedSubmissions.filter(group => {
    // Only show groups that have submissions
    if (!group.submissions || group.submissions.length === 0) {
      return false;
    }
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const groupName = (group.groupName || group.GroupName || '').toLowerCase();
      const projectTitle = (group.projectTitle || group.ProjectTitle || '').toLowerCase();
      const members = group.members || group.Members || [];
      const matchesSearch = 
        groupName.includes(search) ||
        projectTitle.includes(search) ||
        members.some(m => {
          const studentName = (m.studentName || m.StudentName || '').toLowerCase();
          return studentName.includes(search);
        });
      if (!matchesSearch) return false;
    }
    
    if (typeFilter !== 'all') {
      const matchesType = group.submissions.some(s => {
        const formType = s.formType || s.FormType || '';
        const docType = s.documentType || s.DocumentType || '';
        return formType === typeFilter || docType === typeFilter;
      });
      if (!matchesType) return false;
    }
    
    if (statusFilter === 'pending' && group.pendingCount === 0) return false;
    if (statusFilter === 'complete' && group.pendingCount > 0) return false;
    
    return true;
  });

  // Stats - calculate from grouped submissions (only groups with submissions)
  const allGroupSubmissions = groupedSubmissions.flatMap(g => g.submissions || []);
  const stats = {
    totalGroups: filteredGroups.length,
    totalSubmissions: allGroupSubmissions.length,
    pendingReview: groupedSubmissions.reduce((sum, g) => sum + (g.pendingCount || 0), 0),
    approved: groupedSubmissions.reduce((sum, g) => sum + (g.approvedCount || 0), 0)
  };

  const submissionTypes = [
    { value: 'FormA', label: 'Form-A' },
    { value: 'FormB', label: 'Form-B' },
    { value: 'FormD', label: 'Form-D' },
    { value: 'SRS', label: 'SRS' },
    { value: 'SDS', label: 'SDS' },
    { value: 'LogForm1', label: 'Log Form 1' },
    { value: 'LogForm2', label: 'Log Form 2' },
    { value: 'LogForm3', label: 'Log Form 3' },
    { value: 'LogForm4', label: 'Log Form 4' },
    { value: 'LogForm5', label: 'Log Form 5' },
    { value: 'LogForm6', label: 'Log Form 6' },
    { value: 'LogForm7', label: 'Log Form 7' },
    { value: 'LogForm8', label: 'Log Form 8' },
    { value: 'MonthlyReport', label: 'Monthly Report' },
    { value: 'MidTermReport', label: 'Mid-Term Report' },
    { value: 'FinalReport', label: 'Final Report' },
    { value: 'Thesis', label: 'Thesis' }
  ];

  return (
    <CoordinatorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Submissions</h1>
          <p className="text-gray-500 mt-1">View and track all document submissions from groups</p>
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalGroups}</p>
                <p className="text-xs text-gray-500">Total Groups</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
                <p className="text-xs text-gray-500">Total Submissions</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReview}</p>
                <p className="text-xs text-gray-500">Pending Review</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                <p className="text-xs text-gray-500">Approved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search groups, projects, or students..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="all">All Types</option>
              {submissionTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Has Pending</option>
              <option value="complete">All Reviewed</option>
            </select>
          </div>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="space-y-4">
            {filteredGroups.map(group => (
              <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Group Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                  onClick={() => toggleExpand(group.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{group.groupName}</h3>
                      <p className="text-sm text-gray-500">{group.projectTitle || 'No project title'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        {group.pendingCount > 0 && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            {group.pendingCount} Pending
                          </span>
                        )}
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          {group.approvedCount} Approved
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{group.submissionCount} total submissions</p>
                    </div>
                    {expandedGroups.has(group.id) ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedGroups.has(group.id) && (
                  <div className="border-t bg-gray-50 p-4">
                    {group.submissions.length > 0 ? (
                      <div className="space-y-3">
                        {group.submissions.map(submission => {
                          const formType = submission.formType || submission.FormType || submission.documentType || submission.DocumentType || 'Unknown';
                          const Icon = getFormIcon(formType);
                          const color = getFormColor(formType);
                          const displayStatus = submission.workflowStatus || submission.WorkflowStatus || submission.status || submission.Status || 'Unknown';
                          const submittedAt = submission.submittedAt || submission.SubmittedAt || submission.uploadedAt || submission.UploadedAt;
                          const submittedByName = submission.submittedByName || submission.SubmittedByName;
                          const submissionType = submission.submissionType || submission.Type || (submission.documentType || submission.DocumentType ? 'document' : 'proposal');
                          
                          return (
                            <div
                              key={submission.id || submission.Id}
                              className="bg-white rounded-lg border p-4 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                                  <Icon className={`h-5 w-5 text-${color}-600`} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-gray-900">{formType}</p>
                                    {submissionType === 'document' && (
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                        Document
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {submittedByName && `By ${submittedByName} • `}
                                    {submittedAt && new Date(submittedAt).toLocaleDateString()}
                                  </p>
                                  {submission.supervisorName && (
                                    <p className="text-xs text-purple-600 mt-1">
                                      Reviewed by {submission.supervisorName} on {submission.supervisorReviewedAt ? new Date(submission.supervisorReviewedAt).toLocaleDateString() : ''}
                                    </p>
                                  )}
                                  {submission.supervisorRemarks && (
                                    <p className="text-xs text-gray-600 mt-1 italic">
                                      "{submission.supervisorRemarks}"
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(displayStatus)}`}>
                                  {displayStatus}
                                </span>
                                
                                {/* Approve/Reject buttons for submitted proposals */}
                                {submissionType === 'proposal' && displayStatus === 'Submitted' && (
                                  <>
                                    <button
                                      onClick={() => handleReviewProposal(submission.id, 'Approved')}
                                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium transition-colors flex items-center gap-1"
                                      title="Approve Proposal"
                                    >
                                      <CheckCircle2 className="h-3 w-3" />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleReviewProposal(submission.id, 'Rejected', 'Please revise and resubmit')}
                                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-medium transition-colors flex items-center gap-1"
                                      title="Reject Proposal"
                                    >
                                      <X className="h-3 w-3" />
                                      Reject
                                    </button>
                                  </>
                                )}
                                
                                {/* Finalize button for supervisor-reviewed documents */}
                                {(displayStatus === 'SupervisorReviewed' || displayStatus === 'supervisorReviewed') && submission.documentType && (
                                  <button
                                    onClick={() => handleFinalizeDocument(submission.id, submission.documentType)}
                                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium transition-colors flex items-center gap-1"
                                    title="Finalize Document"
                                  >
                                    <FileCheck className="h-3 w-3" />
                                    Finalize
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => handleDownload(submission.id, submission.fileName || submission.formType)}
                                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                  title="Download"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setViewItem(submission)}
                                  className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-4">No submissions yet</p>
                    )}
                    
                    {/* Group Members */}
                    {group.members && group.members.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-gray-700 mb-2">Group Members</p>
                        <div className="flex flex-wrap gap-2">
                          {group.members.map(member => (
                            <span
                              key={member.id}
                              className={`px-3 py-1 rounded-full text-sm ${
                                member.isGroupLead ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {member.studentName}
                              {member.isGroupLead && ' (Lead)'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Submissions Found</h2>
            <p className="text-gray-500">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No submissions have been made yet'}
            </p>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">
                  {viewItem.submissionType === 'proposal' ? 'Proposal' : 'Document'}
                </p>
                <h3 className="text-xl font-bold text-gray-900">
                  {viewItem.documentType || viewItem.formType}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {viewItem.submittedByName ? `By ${viewItem.submittedByName}` : 'Submitted'}
                  {viewItem.submittedAt && ` • ${new Date(viewItem.submittedAt).toLocaleDateString()}`}
                </p>
              </div>
              <button
                onClick={() => setViewItem(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Type:</span>
                <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                  {viewItem.documentType || viewItem.formType}
                </span>
              </div>

              {viewItem.status && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(viewItem.status)}`}>
                    {viewItem.status}
                  </span>
                </div>
              )}

              {viewItem.workflowStatus && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Workflow:</span>
                  <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                    {viewItem.workflowStatus}
                  </span>
                </div>
              )}

              {viewItem.supervisorName && (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">Supervisor Review:</span>
                  <span className="text-gray-700">
                    {viewItem.supervisorName}
                    {viewItem.supervisorReviewedAt && ` • ${new Date(viewItem.supervisorReviewedAt).toLocaleDateString()}`}
                  </span>
                  {viewItem.supervisorRemarks && (
                    <span className="italic text-gray-600">"{viewItem.supervisorRemarks}"</span>
                  )}
                </div>
              )}

              {viewItem.coordinatorRemarks && (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">Coordinator Remarks:</span>
                  <span className="italic text-gray-600">"{viewItem.coordinatorRemarks}"</span>
                </div>
              )}

              {/* Review remarks */}
              {viewItem.reviewRemarks && (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">Coordinator Remarks:</span>
                  <span className="italic text-gray-600">"{viewItem.reviewRemarks}"</span>
                </div>
              )}

              {/* Individual Student Submissions for Form-A and Form-B */}
              {viewItem.submissionType === 'proposal' && viewItem.studentSubmissions && viewItem.studentSubmissions.length > 0 && (
                <div className="space-y-3">
                  <span className="font-semibold block">Student Submissions:</span>
                  {viewItem.studentSubmissions.map((studentSub, idx) => (
                    <div key={studentSub.id} className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {studentSub.studentName}
                            {studentSub.isGroupManager && (
                              <span className="ml-2 px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full text-xs">Lead</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600">{studentSub.enrollmentNumber}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownload(viewItem.id, `${viewItem.formType}_${studentSub.studentName.replace(/\s/g, '_')}`)}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-medium flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Form
                          </button>
                          {studentSub.hasTranscript && (
                            <button
                              onClick={() => {
                                fetch(`${API_BASE}/coordinator/submissions/student/${studentSub.id}/transcript`, {
                                  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                                })
                                .then(res => res.blob())
                                .then(blob => {
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = studentSub.transcriptFileName || 'transcript.pdf';
                                  document.body.appendChild(a);
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                  document.body.removeChild(a);
                                });
                              }}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium flex items-center gap-1"
                              title="Download Transcript"
                            >
                              <FileText className="h-3 w-3" />
                              Transcript
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Email:</span>
                          <p className="text-gray-900">{studentSub.email}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Cell:</span>
                          <p className="text-gray-900">{studentSub.cellNumber}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Address:</span>
                          <p className="text-gray-900">{studentSub.postalAddress}</p>
                        </div>
                        {studentSub.submittedAt && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Submitted:</span>
                            <p className="text-gray-900">{new Date(studentSub.submittedAt).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Parsed form data display */}
              {viewItem.submissionType === 'proposal' && viewItem.formData && (() => {
                let parsed = null;
                try {
                  parsed = typeof viewItem.formData === 'string' ? JSON.parse(viewItem.formData) : viewItem.formData;
                } catch {
                  parsed = null;
                }
                if (!parsed) return (
                  <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                    Unable to display form details (invalid data format).
                  </div>
                );
                const entries = Object.entries(parsed).filter(([_, v]) => v !== null && v !== undefined && v !== '');
                if (entries.length === 0) return null;
                return (
                  <div className="space-y-2">
                    <span className="font-semibold block">Form Details:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {entries.map(([k, v]) => (
                        <div key={k} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                          <p className="text-xs uppercase tracking-wide text-gray-500">{k}</p>
                          <p className="text-gray-800 break-words">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Download hint for proposals without attachment */}
              {viewItem.submissionType === 'proposal' && viewItem.hasAttachment === false && (
                <div className="p-3 rounded-lg bg-amber-50 text-amber-800 text-sm">
                  This proposal was submitted as form data and has no file attachment to download. Use this view to review details above.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setViewItem(null)}
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
              {(viewItem.submissionType === 'document' || viewItem.hasAttachment) && (
                <button
                  onClick={() => {
                    handleDownload(viewItem.id, viewItem.fileName || viewItem.formType);
                  }}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </CoordinatorLayout>
  );
};

export default CoordinatorSubmissions;

// View modal for submission details
// (rendered inside component body above return)

