import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FileText, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Clock,
  Users,
  Send,
  GraduationCap,
  BookOpen,
  Download
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';
import { generateFormAPDF } from '../../utils/pdfGenerator';

const StudentFormA = () => {
  const navigate = useNavigate();
  const { formType = 'FormA' } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formStatus, setFormStatus] = useState(null);
  const [groupInfo, setGroupInfo] = useState(null);
  const [hasGroup, setHasGroup] = useState(false);
  const [groupSize, setGroupSize] = useState(0);
  
  // Form-A specific fields matching the template
  const [formData, setFormData] = useState({
    // Student's own information for the table
    fullName: '',
    enrollmentNumber: '',
    cellNumber: '',
    email: '',
    postalAddress: '',
    isGroupManager: false
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchFormStatus();
  }, []);

  const fetchFormStatus = async () => {
    try {
      setLoading(true);
      
      // Get group info
      const groupResponse = await api.get(`${API_BASE}/student/my-group`);
      if (groupResponse.ok) {
        const groupData = await groupResponse.json();
        setGroupInfo(groupData);
        setHasGroup(true);
        // Count group members
        const memberCount = (groupData.members || []).length;
        setGroupSize(memberCount);
      } else {
        setHasGroup(false);
        setGroupSize(0);
      }

      // Get form status
      const statusResponse = await api.get(`${API_BASE}/student/forms/${formType}/status`);
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setFormStatus(statusData);
        
        // Pre-fill form with student data
        setFormData(prev => ({
          ...prev,
          fullName: user.fullName || '',
          enrollmentNumber: user.username || '',
          email: user.email || ''
        }));
      }
    } catch (err) {
      setError('Failed to load form status');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if student is in a group with at least 2 members
    if (!hasGroup) {
      setError('You must be in a group to submit Form-A. Please create or join a group first.');
      return;
    }
    
    if (groupSize < 2) {
      setError('Your group must have at least 2 members to submit Form-A. Please add more members to your group.');
      return;
    }
    
    // Validation
    if (!formData.fullName || !formData.enrollmentNumber || !formData.cellNumber || !formData.email || !formData.postalAddress) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const response = await api.post(`${API_BASE}/student/forms/${formType}/submit`, formData);
      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Form submitted successfully!');
        // Refresh form status
        fetchFormStatus();
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
      // Prepare form data for PDF
      const proposalData = {
        formData: formStatus?.memberStatuses || [],
        submittedAt: mySubmission?.submittedAt || new Date().toISOString(),
        status: formStatus?.status || 'Submitted'
      };

      const groupData = {
        groupId: groupInfo?.groupId,
        projectTitle: groupInfo?.projectTitle,
        departmentName: groupInfo?.departmentName,
        members: groupInfo?.members || []
      };

      const doc = generateFormAPDF(proposalData, groupData);
      doc.save(`FormA_${groupInfo?.groupName || 'Group'}_${new Date().toISOString().split('T')[0]}.pdf`);
      setSuccess('PDF downloaded successfully!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Check if student has submitted
  const mySubmission = formStatus?.memberStatuses?.find(m => m.enrollmentId === user.username);
  const hasSubmitted = mySubmission?.isSubmitted;

  // No group warning
  if (!hasGroup) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/student/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <Users className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-amber-800 mb-2">Group Required</h2>
          <p className="text-amber-700 mb-4">
            You need to be part of a group before you can fill Form-A.
            Create or join a group first.
          </p>
          <button
            onClick={() => navigate('/student/my-group')}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Go to My Group
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/student/dashboard')}
        className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      {/* Group Size Warning */}
      {groupSize < 2 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Insufficient Group Members</h3>
              <p className="text-red-700 mb-3">
                Your group currently has only <span className="font-bold">{groupSize}</span> member{groupSize !== 1 ? 's' : ''}. 
                You need at least <span className="font-bold">2 members</span> in your group to submit Form-A.
              </p>
              <button
                onClick={() => navigate('/student/my-group')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Add Group Members
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form-A Header - Matching Template */}
      <div className="bg-gray-900 text-white rounded-t-2xl p-6 text-center">
        <h1 className="text-3xl font-bold underline mb-2">FORM-A</h1>
        <p className="text-gray-300">(To be filled by student(s))</p>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-b-2xl shadow-lg border border-gray-200 overflow-hidden -mt-6">
        
        {/* Section 1-3: Group Info (Read-only from group data) */}
        <div className="p-6 space-y-6 border-b border-gray-200">
          {/* 1. Degree Level */}
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium w-40">1. Degree Level:</span>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className={`w-6 h-6 border-2 rounded flex items-center justify-center
                  ${groupInfo?.degreeLevel === 'Bachelor' ? 'bg-green-500 border-green-500' : 'border-gray-400'}
                `}>
                  {groupInfo?.degreeLevel === 'Bachelor' && (
                    <span className="text-white font-bold text-sm">✓</span>
                  )}
                </div>
                <span>Bachelor</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <div className={`w-6 h-6 border-2 rounded flex items-center justify-center
                  ${groupInfo?.degreeLevel === 'Master' ? 'bg-green-500 border-green-500' : 'border-gray-400'}
                `}>
                  {groupInfo?.degreeLevel === 'Master' && (
                    <span className="text-white font-bold text-sm">✓</span>
                  )}
                </div>
                <span>Master</span>
              </label>
            </div>
          </div>

          {/* 2. Degree Program */}
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium w-40">2. Degree Program:</span>
            <div className="flex items-center gap-4">
              <span className="text-gray-900 font-semibold">{groupInfo?.degreeProgram || 'Not Set'}</span>
              <div className={`w-6 h-6 border-2 rounded flex items-center justify-center bg-green-500 border-green-500`}>
                <span className="text-white font-bold text-sm">✓</span>
              </div>
            </div>
          </div>

          {/* 3. Number of Students */}
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium w-40">3. Number of Students:</span>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <span>2</span>
                <div className={`w-6 h-6 border-2 rounded flex items-center justify-center
                  ${groupInfo?.memberCount === 2 ? 'bg-green-500 border-green-500' : 'border-gray-400'}
                `}>
                  {groupInfo?.memberCount === 2 && (
                    <span className="text-white font-bold text-sm">✓</span>
                  )}
                </div>
              </label>
              <label className="flex items-center gap-2">
                <span>3</span>
                <div className={`w-6 h-6 border-2 rounded flex items-center justify-center
                  ${groupInfo?.memberCount === 3 ? 'bg-green-500 border-green-500' : 'border-gray-400'}
                `}>
                  {groupInfo?.memberCount === 3 && (
                    <span className="text-white font-bold text-sm">✓</span>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Section 4: Project Title */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start gap-4">
            <span className="text-gray-700 font-medium w-40 pt-2">4. Project Title:</span>
            <div className="flex-1">
              <div className="w-full px-4 py-3 bg-gray-50 border-2 border-green-500 rounded-lg min-h-[60px]">
                <p className="text-gray-900">{groupInfo?.projectTitle || 'Not specified yet'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Supervisor Name */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium w-40">5. Supervisor Name:</span>
            <div className="flex-1 max-w-md">
              <div className="px-4 py-3 bg-gray-50 border-2 border-green-500 rounded-lg">
                <p className="text-gray-900">{groupInfo?.supervisorName || 'Not assigned yet'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Student(s) Information Table */}
        <div className="p-6">
          <h3 className="text-gray-700 font-medium mb-4">6. Student(s) Information:</h3>
          
          {/* Table */}
          <div className="border-2 border-green-500 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-gray-100 border-b-2 border-green-500">
              <div className="col-span-1 p-3 text-center font-semibold text-sm border-r border-gray-300">✓</div>
              <div className="col-span-2 p-3 text-center font-semibold text-sm border-r border-gray-300">Name</div>
              <div className="col-span-2 p-3 text-center font-semibold text-sm border-r border-gray-300">Enrolment #</div>
              <div className="col-span-2 p-3 text-center font-semibold text-sm border-r border-gray-300">Cell #</div>
              <div className="col-span-2 p-3 text-center font-semibold text-sm border-r border-gray-300">Email # ID</div>
              <div className="col-span-3 p-3 text-center font-semibold text-sm">Postal Address</div>
            </div>

            {/* Table Body - Show all group members */}
            {groupInfo?.members?.filter(m => m.status === 'Accepted').map((member, index) => {
              const memberSubmission = formStatus?.memberStatuses?.find(ms => ms.studentId === member.studentId);
              const isCurrentUser = member.enrollmentId === user.username;
              
              return (
                <div 
                  key={member.id} 
                  className={`grid grid-cols-12 border-b border-gray-200 last:border-b-0 
                    ${isCurrentUser ? 'bg-indigo-50' : 'bg-white'}
                  `}
                >
                  {/* Checkbox for Group Manager */}
                  <div className="col-span-1 p-3 flex items-center justify-center border-r border-gray-200">
                    {memberSubmission?.isSubmitted ? (
                      <div className={`w-5 h-5 border-2 rounded flex items-center justify-center
                        ${member.isGroupManager ? 'bg-green-500 border-green-500' : 'border-gray-300'}
                      `}>
                        {member.isGroupManager && <span className="text-white text-xs">✓</span>}
                      </div>
                    ) : isCurrentUser ? (
                      <input
                        type="checkbox"
                        name="isGroupManager"
                        checked={formData.isGroupManager}
                        onChange={handleChange}
                        className="w-5 h-5 text-green-500 rounded border-gray-300 focus:ring-green-500"
                        disabled={hasSubmitted}
                      />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                    )}
                  </div>

                  {/* Name */}
                  <div className="col-span-2 p-3 border-r border-gray-200">
                    {isCurrentUser && !hasSubmitted ? (
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Your name"
                      />
                    ) : (
                      <span className={`text-sm ${memberSubmission?.isSubmitted ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                        {memberSubmission?.isSubmitted ? member.studentName : (member.studentName || 'Pending...')}
                      </span>
                    )}
                  </div>

                  {/* Enrollment # */}
                  <div className="col-span-2 p-3 border-r border-gray-200">
                    <span className="text-sm text-gray-900 font-mono">{member.enrollmentId}</span>
                  </div>

                  {/* Cell # */}
                  <div className="col-span-2 p-3 border-r border-gray-200">
                    {isCurrentUser && !hasSubmitted ? (
                      <input
                        type="tel"
                        name="cellNumber"
                        value={formData.cellNumber}
                        onChange={handleChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="03XX-XXXXXXX"
                      />
                    ) : (
                      <span className={`text-sm ${memberSubmission?.isSubmitted ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                        {memberSubmission?.isSubmitted ? (memberSubmission?.cellNumber || '—') : 'Pending...'}
                      </span>
                    )}
                  </div>

                  {/* Email */}
                  <div className="col-span-2 p-3 border-r border-gray-200">
                    {isCurrentUser && !hasSubmitted ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="email@example.com"
                      />
                    ) : (
                      <span className={`text-sm ${memberSubmission?.isSubmitted ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                        {memberSubmission?.isSubmitted ? (member.email || '—') : 'Pending...'}
                      </span>
                    )}
                  </div>

                  {/* Postal Address */}
                  <div className="col-span-3 p-3">
                    {isCurrentUser && !hasSubmitted ? (
                      <input
                        type="text"
                        name="postalAddress"
                        value={formData.postalAddress}
                        onChange={handleChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Your postal address"
                      />
                    ) : (
                      <span className={`text-sm ${memberSubmission?.isSubmitted ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                        {memberSubmission?.isSubmitted ? (memberSubmission?.postalAddress || '—') : 'Pending...'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Empty rows if less than 3 members */}
            {groupInfo?.members?.filter(m => m.status === 'Accepted').length < 3 && 
              Array.from({ length: 3 - (groupInfo?.members?.filter(m => m.status === 'Accepted').length || 0) }).map((_, index) => (
                <div key={`empty-${index}`} className="grid grid-cols-12 border-b border-gray-200 last:border-b-0 bg-gray-50">
                  <div className="col-span-1 p-3 border-r border-gray-200"><div className="h-5"></div></div>
                  <div className="col-span-2 p-3 border-r border-gray-200 text-gray-300 text-sm italic">Empty slot</div>
                  <div className="col-span-2 p-3 border-r border-gray-200"></div>
                  <div className="col-span-2 p-3 border-r border-gray-200"></div>
                  <div className="col-span-2 p-3 border-r border-gray-200"></div>
                  <div className="col-span-3 p-3"></div>
                </div>
              ))
            }
          </div>

          {/* Note */}
          <p className="text-sm text-gray-600 mt-4 italic">
            <strong>Note:-</strong> Tick the name of Group Manager.
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mx-6 mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mx-6 mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Submission Status */}
        {hasSubmitted ? (
          <div className="mx-6 mb-6 bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">Your Information Submitted</h3>
                  <p className="text-green-600 text-sm">
                    {formStatus?.allSubmitted 
                      ? 'All group members have submitted. Form is complete!' 
                      : 'Waiting for other group members to submit their information.'}
                  </p>
                </div>
              </div>
              {formStatus?.allSubmitted && (
                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Submit Button */
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {groupSize < 2 
                  ? 'Group must have at least 2 members to submit'
                  : 'Fill in your information in the highlighted row above'
                }
              </p>
              <button
                onClick={handleSubmit}
                disabled={submitting || groupSize < 2}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Submit My Information
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Group Submission Progress */}
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
              {formStatus.memberStatuses?.filter(m => m.isSubmitted).length || 0} / {formStatus.memberStatuses?.length || 0} submitted
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFormA;
