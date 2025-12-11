import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  User, 
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Clock,
  Users,
  Send,
  Upload,
  Briefcase,
  Target,
  Calendar,
  DollarSign,
  Wrench,
  FileUp,
  UserCheck,
  XCircle,
  Download
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';
import { generateFormBPDF } from '../../utils/pdfGenerator';

const StudentFormB = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formStatus, setFormStatus] = useState(null);
  const [groupInfo, setGroupInfo] = useState(null);
  const [hasGroup, setHasGroup] = useState(false);
  const [supervisors, setSupervisors] = useState([]);
  const [formAStatus, setFormAStatus] = useState(null);
  const [formAApproved, setFormAApproved] = useState(false);
  const [formBProposal, setFormBProposal] = useState(null);
  const [checkingFormA, setCheckingFormA] = useState(true);
  
  // Form-B specific fields
  const [formData, setFormData] = useState({
    // Section 7 - Degree Project Type
    degreeProjectType: 'Project', // Thesis or Project
    thesisDomain: '', // Research Thesis or Research Paper
    projectDomain: '', // Hardware, Software, Hardware/Software
    
    // Section 8 - Industrial/Self Defined
    projectSource: 'SelfDefined', // Industrial or SelfDefined
    industrialNotificationAttached: false,
    industrialReferenceList: '',
    
    // Section 9-17
    workArea: '',
    problemStatement: '',
    objectives: '',
    methodology: '',
    projectScope: '',
    timeline: '',
    budgetDescription: '',
    fundingRequired: false,
    toolsSoftwareHardware: '',
    
    // Supervisor selection
    supervisorId: '',
    
    // Acknowledgment
    agreementAccepted: false,
    
    // File attachment
    transcriptFile: null
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setCheckingFormA(true);
      
      // Prefer the dedicated Form-A status endpoint to decide access
      let formAOk = false;
      let formAData = null;
      try {
        const formAStatusResp = await api.get(`${API_BASE}/student/forms/FormA/status`);
        if (formAStatusResp.ok) {
          const statusData = await formAStatusResp.json();
          const normalizedStatus = statusData.proposalStatus || statusData.status;
          formAData = { ...statusData, status: normalizedStatus }; // ensure .status is present
          // exists flag means Form-A was at least created/submitted
          if (statusData.exists) {
            const s = normalizedStatus;
            // Allow Submitted / UnderReview / Approved
            if (s && s !== 'Draft' && s !== 'Rejected') {
              formAOk = true;
            }
          }
        }
      } catch (err) {
        console.error('Form-A status check failed', err);
      }

      // Also fetch proposals for prefill/info (fallback)
      try {
        const proposalResponse = await api.get(`${API_BASE}/student/my-group/proposals`);
        if (proposalResponse.ok) {
          const proposals = await proposalResponse.json();
          const formAProposal = proposals.find(p => p.formType === 'FormA');
          const formBProposal = proposals.find(p => p.formType === 'FormB');
          
          setFormAStatus(formAProposal || formAData);
          setFormBProposal(formBProposal);

          // Use proposals as a fallback to decide Form-A gate if status endpoint failed
          if (!formAOk && formAProposal) {
            const s = formAProposal.status || formAProposal.Status || formAProposal.proposalStatus || formAProposal.ProposalStatus;
            if (s && s !== 'Draft' && s !== 'Rejected') {
              formAOk = true;
            }
          }
        } else {
          // still keep the status endpoint data
          setFormAStatus(formAData);
        }
      } catch (err) {
        console.error('Proposals fetch failed', err);
        setFormAStatus(formAData);
      }

      setFormAApproved(formAOk);
      setCheckingFormA(false);
      
      // Get group info
      const groupResponse = await api.get(`${API_BASE}/student/my-group`);
      if (groupResponse.ok) {
        const groupData = await groupResponse.json();
        setGroupInfo(groupData);
        setHasGroup(true);
        
        // Fetch supervisors from the same department
        if (groupData.departmentId) {
          const supResponse = await api.get(`${API_BASE}/staff?departmentId=${groupData.departmentId}&staffType=Teacher&isSupervisor=true&pageSize=100`);
          if (supResponse.ok) {
            const supData = await supResponse.json();
            // Additional frontend filter to ensure only supervisors are shown
            const supervisorList = (supData.staff || []).filter(s => s.isSupervisor === true);
            setSupervisors(supervisorList);
          }
        }
      } else {
        setHasGroup(false);
      }

      // Get form status
      const statusResponse = await api.get(`${API_BASE}/student/forms/FormB/status`);
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setFormStatus(statusData);
      }
    } catch (err) {
      setError('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.workArea || !formData.problemStatement || !formData.objectives) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (!formData.supervisorId) {
      setError('Please select a supervisor');
      return;
    }
    
    if (!formData.agreementAccepted) {
      setError('Please accept the agreement to proceed');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'transcriptFile' && formData[key]) {
          formDataToSend.append('TranscriptFile', formData[key]);
        } else if (key !== 'transcriptFile') {
          formDataToSend.append(key.charAt(0).toUpperCase() + key.slice(1), formData[key]);
        }
      });

      const response = await fetch(`${API_BASE}/student/forms/FormB/submit-with-transcript`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });
      
      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Form-B submitted successfully with transcript!');
        fetchData();
      } else {
        setError(data.message || 'Failed to submit form');
      }
    } catch (err) {
      setError('Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = () => {
    try {
      const mySubmission = formStatus?.memberStatuses?.find(m => m.enrollmentId === user.username);
      
      // Prepare form data for PDF
      const proposalData = {
        formData: {
          ...formData,
          supervisorName: supervisors.find(s => s.id === formData.supervisorId)?.name || 'Not assigned'
        },
        submittedAt: mySubmission?.submittedAt || new Date().toISOString(),
        status: formBProposal?.status || 'Submitted',
        reviewRemarks: formBProposal?.reviewRemarks || ''
      };

      const groupData = {
        groupId: groupInfo?.groupId,
        groupName: groupInfo?.groupName,
        projectTitle: groupInfo?.projectTitle,
        departmentName: groupInfo?.departmentName,
        members: groupInfo?.members || []
      };

      const doc = generateFormBPDF(proposalData, groupData);
      doc.save(`FormB_${groupInfo?.groupName || 'Group'}_${new Date().toISOString().split('T')[0]}.pdf`);
      setSuccess('PDF downloaded successfully!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  if (loading || checkingFormA) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Form-A requirement check
  if (!formAApproved) {
    const getFormAMessage = () => {
      const faStatus =
        formAStatus?.status ||
        formAStatus?.Status ||
        formAStatus?.proposalStatus ||
        formAStatus?.ProposalStatus;

      if (!formAStatus) {
        return {
          title: 'Form-A Not Submitted',
          message: 'You must complete and submit Form-A before you can access Form-B.',
          buttonText: 'Go to Form-A',
          color: 'red'
        };
      }
      
      switch (faStatus) {
        case 'Draft':
          return {
            title: 'Form-A Not Submitted',
            message: 'Form-A is still in draft status. You must complete and submit Form-A before accessing Form-B.',
            buttonText: 'Go to Form-A',
            color: 'amber'
          };
        case 'Rejected':
          return {
            title: 'Form-A Rejected',
            message: formAStatus.reviewRemarks 
              ? `Form-A was rejected. Remarks: "${formAStatus.reviewRemarks}". Please revise and resubmit before accessing Form-B.`
              : 'Form-A was rejected. Please revise and resubmit before accessing Form-B.',
            buttonText: 'Revise Form-A',
            color: 'red'
          };
        default:
          return {
            title: 'Form-A Required',
            message: 'You must submit Form-A before you can access Form-B.',
            buttonText: 'Go to Form-A',
            color: 'amber'
          };
      }
    };

    const messageConfig = getFormAMessage();
    const bgColor = messageConfig.color === 'red' ? 'bg-red-50 border-red-200' :
                     messageConfig.color === 'orange' ? 'bg-orange-50 border-orange-200' :
                     'bg-amber-50 border-amber-200';
    const iconColor = messageConfig.color === 'red' ? 'text-red-500' :
                      messageConfig.color === 'orange' ? 'text-orange-500' :
                      'text-amber-500';
    const textColor = messageConfig.color === 'red' ? 'text-red-800' :
                      messageConfig.color === 'orange' ? 'text-orange-800' :
                      'text-amber-800';
    const buttonColor = messageConfig.color === 'red' ? 'bg-red-600 hover:bg-red-700' :
                        messageConfig.color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' :
                        'bg-amber-600 hover:bg-amber-700';

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => navigate('/student/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <div className={`${bgColor} border rounded-xl p-8 text-center`}>
          <AlertCircle className={`h-16 w-16 ${iconColor} mx-auto mb-4`} />
          <h2 className={`text-xl font-semibold ${textColor} mb-2`}>{messageConfig.title}</h2>
          <p className={`${textColor} mb-4`}>
            {messageConfig.message}
          </p>
          <button
            onClick={() => navigate('/student/forms/FormA')}
            className={`px-6 py-2 ${buttonColor} text-white rounded-lg transition-colors font-medium`}
          >
            {messageConfig.buttonText}
          </button>
        </div>
      </div>
    );
  }

  const mySubmission = formStatus?.memberStatuses?.find(m => m.enrollmentId === user.username);
  const hasSubmitted = mySubmission?.isSubmitted;

  if (!hasGroup) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => navigate('/student/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <Users className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-amber-800 mb-2">Group Required</h2>
          <p className="text-amber-700 mb-4">You need to be part of a group and have Form-A approved before filling Form-B.</p>
          <button onClick={() => navigate('/student/my-group')} className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
            Go to My Group
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <button onClick={() => navigate('/student/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      {/* Form-B Header */}
      <div className="bg-gray-900 text-white rounded-t-2xl p-6 text-center">
        <h1 className="text-3xl font-bold underline mb-2">FORM-B</h1>
        <p className="text-gray-300">(To be filled by student(s))</p>
      </div>

      {/* Main Form */}
      <div className="bg-white rounded-b-2xl shadow-lg border border-gray-200 -mt-6">
        {/* Messages */}
        {error && (
          <div className="m-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="m-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Form-B Rejection Notice */}
        {formBProposal && formBProposal.status === 'Rejected' && (
          <div className="m-6 bg-red-50 border-2 border-red-300 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Form-B Rejected</h3>
                <p className="text-red-700 mb-3">
                  Your Form-B submission was rejected by the coordinator. Please review the remarks below and resubmit.
                </p>
                {formBProposal.reviewRemarks && (
                  <div className="bg-white border border-red-200 rounded-lg p-4 mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Coordinator Remarks:</p>
                    <p className="text-sm text-gray-900">{formBProposal.reviewRemarks}</p>
                  </div>
                )}
                <p className="text-sm text-red-600 font-medium">
                  Please revise your proposal and submit again.
                </p>
              </div>
            </div>
          </div>
        )}

        {hasSubmitted && (!formBProposal || formBProposal.status !== 'Rejected') ? (
          <div className="p-8">
            <div className="text-center mb-6">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-green-800 mb-2">Form-B Submitted</h2>
              <p className="text-green-600 mb-4">Your Form-B has been submitted successfully. Waiting for coordinator review.</p>
              {formBProposal?.status && (
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                  formBProposal.status === 'Approved' ? 'bg-green-100 text-green-800' :
                  formBProposal.status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  Status: {formBProposal.status}
                </span>
              )}
            </div>
            <div className="flex justify-center">
              <button
                onClick={handleDownloadPDF}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium"
              >
                <Download className="h-5 w-5" />
                Download Form-B PDF
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            
            {/* Section 7: Degree Project Type */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">7. Degree Project</h3>
              
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="degreeProjectType"
                    value="Thesis"
                    checked={formData.degreeProjectType === 'Thesis'}
                    onChange={handleChange}
                    className="w-5 h-5 text-indigo-600"
                  />
                  <span>Thesis</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="degreeProjectType"
                    value="Project"
                    checked={formData.degreeProjectType === 'Project'}
                    onChange={handleChange}
                    className="w-5 h-5 text-indigo-600"
                  />
                  <span>Project</span>
                </label>
              </div>

              {/* 7a - Thesis Domain */}
              {formData.degreeProjectType === 'Thesis' && (
                <div className="ml-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">a. If Thesis, specify Domain:</p>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="thesisDomain"
                        value="ResearchThesis"
                        checked={formData.thesisDomain === 'ResearchThesis'}
                        onChange={handleChange}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span>Research Thesis</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="thesisDomain"
                        value="ResearchPaper"
                        checked={formData.thesisDomain === 'ResearchPaper'}
                        onChange={handleChange}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span>Research Paper</span>
                    </label>
                  </div>
                </div>
              )}

              {/* 7b - Project Domain */}
              {formData.degreeProjectType === 'Project' && (
                <div className="ml-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">b. If Project, specify Domain:</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="projectDomain"
                        value="Hardware"
                        checked={formData.projectDomain === 'Hardware'}
                        onChange={handleChange}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span>Hardware Project</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="projectDomain"
                        value="Software"
                        checked={formData.projectDomain === 'Software'}
                        onChange={handleChange}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span>Software/Simulation Project</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="projectDomain"
                        value="HardwareSoftware"
                        checked={formData.projectDomain === 'HardwareSoftware'}
                        onChange={handleChange}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span>Hardware/Software Project</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Section 8: Project Source */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">8. Degree Project Type</h3>
              
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="projectSource"
                    value="Industrial"
                    checked={formData.projectSource === 'Industrial'}
                    onChange={handleChange}
                    className="w-5 h-5 text-indigo-600"
                  />
                  <span>Industrial</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="projectSource"
                    value="SelfDefined"
                    checked={formData.projectSource === 'SelfDefined'}
                    onChange={handleChange}
                    className="w-5 h-5 text-indigo-600"
                  />
                  <span>Self Defined</span>
                </label>
              </div>

              {formData.projectSource === 'Industrial' && (
                <div className="ml-6 p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-4">
                  <p className="text-sm font-medium text-amber-800">Note: In case of Industrial project, following documents must be attached:</p>
                  <ul className="text-sm text-amber-700 list-disc ml-5 space-y-1">
                    <li>A copy of approved notification from the organization</li>
                    <li>List of names, designation, departments and contact numbers of the respective references</li>
                  </ul>
                  
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="industrialNotificationAttached"
                        checked={formData.industrialNotificationAttached}
                        onChange={handleChange}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm">I have attached the required documents</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference List</label>
                    <textarea
                      name="industrialReferenceList"
                      value={formData.industrialReferenceList}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Names, designations, departments, and contact numbers..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 9: Work Area */}
            <div className="space-y-2">
              <label className="block text-lg font-semibold text-gray-900">
                9. Identify the area in which you plan to work in *
              </label>
              <textarea
                name="workArea"
                value={formData.workArea}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Machine Learning, Web Development, IoT, etc."
                required
              />
            </div>

            {/* Section 10: Problem Statement */}
            <div className="space-y-2">
              <label className="block text-lg font-semibold text-gray-900">
                10. Problem Statement *
              </label>
              <textarea
                name="problemStatement"
                value={formData.problemStatement}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe the problem you are trying to solve..."
                required
              />
            </div>

            {/* Section 11: Objectives */}
            <div className="space-y-2">
              <label className="block text-lg font-semibold text-gray-900">
                11. Objectives *
              </label>
              <textarea
                name="objectives"
                value={formData.objectives}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="List your project objectives..."
                required
              />
            </div>

            {/* Section 12: Methodology */}
            <div className="space-y-2">
              <label className="block text-lg font-semibold text-gray-900">
                12. Methodology
              </label>
              <textarea
                name="methodology"
                value={formData.methodology}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe your approach and methodology..."
              />
            </div>

            {/* Section 13: Project Scope */}
            <div className="space-y-2">
              <label className="block text-lg font-semibold text-gray-900">
                13. Project Scope
              </label>
              <textarea
                name="projectScope"
                value={formData.projectScope}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Define the scope and boundaries of your project..."
              />
            </div>

            {/* Section 14: Timeline */}
            <div className="space-y-2">
              <label className="block text-lg font-semibold text-gray-900">
                14. Timeline
              </label>
              <textarea
                name="timeline"
                value={formData.timeline}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Provide a timeline/schedule for your project milestones..."
              />
            </div>

            {/* Section 15: Budget */}
            <div className="space-y-2">
              <label className="block text-lg font-semibold text-gray-900">
                15. Budget Description
              </label>
              <textarea
                name="budgetDescription"
                value={formData.budgetDescription}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe the estimated budget for your project..."
              />
            </div>

            {/* Section 16: Funding */}
            <div className="space-y-2">
              <label className="block text-lg font-semibold text-gray-900">
                16. Tell whether funding is required for the execution of proposed research or not?
              </label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="fundingRequired"
                    value="true"
                    checked={formData.fundingRequired === true}
                    onChange={(e) => setFormData(prev => ({ ...prev, fundingRequired: true }))}
                    className="w-5 h-5 text-indigo-600"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="fundingRequired"
                    value="false"
                    checked={formData.fundingRequired === false}
                    onChange={(e) => setFormData(prev => ({ ...prev, fundingRequired: false }))}
                    className="w-5 h-5 text-indigo-600"
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {/* Section 17: Tools */}
            <div className="space-y-2">
              <label className="block text-lg font-semibold text-gray-900">
                17. Tools (Software/Hardware)
              </label>
              <textarea
                name="toolsSoftwareHardware"
                value={formData.toolsSoftwareHardware}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="List the tools, technologies, software, and hardware you plan to use..."
              />
            </div>

            {/* Supervisor Selection */}
            <div className="space-y-4 p-6 bg-teal-50 border-2 border-teal-200 rounded-xl">
              <h3 className="text-lg font-semibold text-teal-900 flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Select Supervisor *
              </h3>
              <p className="text-sm text-teal-700">
                Choose a supervisor from your department's faculty members. Coordinators and HOD can also be selected.
              </p>
              <select
                name="supervisorId"
                value={formData.supervisorId}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                required
              >
                <option value="">-- Select a Supervisor --</option>
                {supervisors.map(sup => (
                  <option key={sup.id} value={sup.id}>
                    {sup.fullName} 
                    {sup.isHOD && ' (HOD)'}
                    {sup.isFYPCoordinator && ' (FYP Coordinator)'}
                    {sup.designation && ` - ${sup.designation}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Transcript Upload */}
            <div className="space-y-2">
              <label className="block text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Attach Latest Transcript (Required)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                <input
                  type="file"
                  name="transcriptFile"
                  onChange={handleChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  id="transcript-upload"
                />
                <label htmlFor="transcript-upload" className="cursor-pointer">
                  <FileUp className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Click to upload your latest transcript</p>
                  <p className="text-sm text-gray-400 mt-1">PDF, JPG, or PNG (max 5MB)</p>
                </label>
                {formData.transcriptFile && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ {formData.transcriptFile.name}
                  </p>
                )}
              </div>
            </div>

            {/* Section 18: Agreement */}
            <div className="p-6 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
              <h3 className="text-lg font-semibold text-indigo-900 mb-4">18. Declaration & Agreement</h3>
              <div className="text-sm text-indigo-800 space-y-3 mb-4">
                <p>
                  I/We hereby state that the above-mentioned goals of our degree project shall be completed 
                  within the due dates specified by the Department. I/We shall abide by all the rules set 
                  by the department and we have read all the instructions mentioned in this form.
                </p>
                <p>
                  I/We shall not be using any unfair means to complete our degree project and we admit that 
                  <strong> Plagiarism is a professional sin</strong> and we shall not use it.
                </p>
              </div>
              
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreementAccepted"
                  checked={formData.agreementAccepted}
                  onChange={handleChange}
                  className="mt-1 w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  required
                />
                <span className="text-sm font-medium text-indigo-900">
                  I/We have read and agree to the above terms and conditions *
                </span>
              </label>
            </div>

            {/* Group Members Signatures (Display only) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Group Members</h3>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Enrollment #</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {groupInfo?.members?.filter(m => m.status === 'Accepted').map((member) => (
                      <tr key={member.id} className={member.enrollmentId === user.username ? 'bg-indigo-50' : ''}>
                        <td className="px-4 py-3 font-medium">{member.studentName}</td>
                        <td className="px-4 py-3 font-mono text-sm">{member.enrollmentId}</td>
                        <td className="px-4 py-3">
                          {member.enrollmentId === user.username ? (
                            <span className="text-indigo-600 font-medium">Current User</span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting || !formData.agreementAccepted}
                className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Submit Form-B
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Submission Progress */}
      {formStatus?.exists && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600" />
            Submission Progress
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ 
                  width: `${((formStatus.memberStatuses?.filter(m => m.isSubmitted).length || 0) / 
                    (formStatus.memberStatuses?.length || 1)) * 100}%` 
                }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600">
              {formStatus.memberStatuses?.filter(m => m.isSubmitted).length || 0} / {formStatus.memberStatuses?.length || 0}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFormB;

