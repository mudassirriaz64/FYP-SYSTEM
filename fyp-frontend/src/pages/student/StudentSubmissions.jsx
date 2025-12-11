import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  XCircle,
  Eye,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';
import { generateFormAPDF, generateFormBPDF } from '../../utils/pdfGenerator';

const StudentSubmissions = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [groupInfo, setGroupInfo] = useState(null);

  useEffect(() => {
    fetchSubmissions();
    fetchGroupInfo();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      
      // Fetch all form statuses
      const formTypes = ['FormA', 'FormB', 'FormC', 'FormD'];
      const submissionData = [];
      
      // Also fetch proposal data for detailed form content
      let proposalData = [];
      try {
        const proposalResponse = await api.get(`${API_BASE}/student/my-group/proposals`);
        if (proposalResponse.ok) {
          proposalData = await proposalResponse.json();
        }
      } catch (err) {
        console.error('Failed to fetch proposals:', err);
      }
      
      for (const formType of formTypes) {
        const response = await api.get(`${API_BASE}/student/forms/${formType}/status`);
        if (response.ok) {
          const data = await response.json();
          if (data.exists) {
            // Find matching proposal for this form type
            const proposal = proposalData.find(p => p.formType === formType);
            
            submissionData.push({
              formType,
              ...data,
              proposal: proposal || null
            });
          }
        }
      }
      
      setSubmissions(submissionData);
    } catch (err) {
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupInfo = async () => {
    try {
      const response = await api.get(`${API_BASE}/student/my-group`);
      if (response.ok) {
        const data = await response.json();
        setGroupInfo(data);
      }
    } catch (err) {
      console.error('Failed to fetch group info:', err);
    }
  };

  const handleDownloadPDF = async (submission) => {
    try {
      setError('');
      setSuccess('');

      if (!groupInfo) {
        setError('Group information not available');
        return;
      }

      const { formType, proposal } = submission;

      // Only generate PDFs for FormA and FormB
      if (formType !== 'FormA' && formType !== 'FormB') {
        setError('PDF download is only available for Form-A and Form-B');
        return;
      }

      // Prepare data for PDF generation
      let proposalFormData = submission.memberStatuses || [];
      
      // If we have the actual proposal data, use its formData
      if (proposal && proposal.formData) {
        try {
          proposalFormData = typeof proposal.formData === 'string' 
            ? JSON.parse(proposal.formData) 
            : proposal.formData;
        } catch (e) {
          console.error('Failed to parse proposal formData:', e);
        }
      }

      const proposalData = {
        formData: proposalFormData,
        submittedAt: proposal?.submittedAt || submission.submittedAt || new Date().toISOString(),
        status: proposal?.status || submission.proposalStatus || 'Submitted',
        reviewRemarks: proposal?.reviewRemarks || submission.reviewRemarks || ''
      };

      const groupData = {
        groupId: groupInfo.groupId,
        groupName: groupInfo.groupName,
        projectTitle: groupInfo.projectTitle,
        departmentName: groupInfo.departmentName,
        members: groupInfo.members || []
      };

      let doc;
      if (formType === 'FormA') {
        doc = generateFormAPDF(proposalData, groupData);
      } else {
        doc = generateFormBPDF(proposalData, groupData);
      }

      doc.save(`${formType}_${groupInfo.groupName || 'Group'}_${new Date().toISOString().split('T')[0]}.pdf`);
      setSuccess('PDF downloaded successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  const getFormName = (formType) => {
    const names = {
      FormA: 'Form-A (Project Registration)',
      FormB: 'Form-B (Supervisor Selection)',
      FormC: 'Form-C (Progress Evaluation)',
      FormD: 'Form-D (Final Defense)'
    };
    return names[formType] || formType;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
      Submitted: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle2 },
      UnderReview: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
      Approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
      Rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
      RevisionRequired: { bg: 'bg-orange-100', text: 'text-orange-700', icon: AlertCircle }
    };
    
    const config = statusConfig[status] || statusConfig.Draft;
    const Icon = config.icon;
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text} flex items-center gap-1`}>
        <Icon className="h-4 w-4" />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Submissions</h1>
        <p className="text-gray-500 mt-1">Track the status of your form submissions</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Submissions List */}
      {submissions.length > 0 ? (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div 
              key={submission.formType}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Submission Header */}
              <div 
                className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedSubmission(
                  expandedSubmission === submission.formType ? null : submission.formType
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      submission.allSubmitted ? 'bg-green-100' : 'bg-indigo-100'
                    }`}>
                      <FileText className={`h-6 w-6 ${
                        submission.allSubmitted ? 'text-green-600' : 'text-indigo-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{getFormName(submission.formType)}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        {submission.submittedAt && (
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                          </span>
                        )}
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {submission.memberStatuses?.filter(m => m.isSubmitted).length || 0}/
                          {submission.memberStatuses?.length || 0} members
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(submission.proposalStatus)}
                    {expandedSubmission === submission.formType ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedSubmission === submission.formType && (
                <div className="border-t border-gray-100 p-5 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Member Submissions</h4>
                  <div className="space-y-2">
                    {submission.memberStatuses?.map((member, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-semibold text-sm">
                              {member.studentName?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.studentName}</p>
                            <p className="text-xs text-gray-500">{member.enrollmentId}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.isSubmitted ? (
                            <>
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                              <span className="text-sm text-green-600 font-medium">Submitted</span>
                              {member.submittedAt && (
                                <span className="text-xs text-gray-500 ml-2">
                                  {new Date(member.submittedAt).toLocaleString()}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <Clock className="h-5 w-5 text-amber-500" />
                              <span className="text-sm text-amber-600 font-medium">Pending</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Status Info */}
                  {submission.allSubmitted && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-medium">All group members have submitted this form</span>
                        </div>
                        {(submission.formType === 'FormA' || submission.formType === 'FormB') && (
                          <button
                            onClick={() => handleDownloadPDF(submission)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium"
                          >
                            <Download className="h-4 w-4" />
                            Download PDF
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {!submission.allSubmitted && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-700">
                        <Clock className="h-5 w-5" />
                        <span className="font-medium">Waiting for all group members to submit</span>
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
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Submissions Yet</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            You haven't submitted any forms yet. Check the Forms page to see what's available.
          </p>
          <button
            onClick={() => navigate('/student/forms')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            View Available Forms
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentSubmissions;

