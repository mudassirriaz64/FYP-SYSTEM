import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  Send,
  ArrowLeft,
  Building,
  Phone,
  Mail,
  User,
  Clock
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';
import SupervisorLayout from '../../components/layouts/SupervisorLayout';

const SupervisorFormD = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preSelectedGroupId = searchParams.get('groupId');

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [formData, setFormData] = useState({
    projectTitle: '',
    supervisorName: '',
    telephone: '',
    cellNo: '',
    email: '',
    facultyType: 'Permanent',
    department: '',
    companyLetter: false,
    workplaceAddress: '',
    designation: '',
    comments: '',
    signature: '',
    agreedToTerms: false
  });

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
      const response = await api.get(`${API_BASE}/supervisor/groups?needsFormD=true`);
      
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

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setFormData(prev => ({
      ...prev,
      projectTitle: group.projectTitle || '',
      supervisorName: user.fullName || '',
      email: user.email || '',
      department: group.departmentName || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedGroup) {
      setError('Please select a group');
      return;
    }

    if (!formData.agreedToTerms) {
      setError('Please agree to the terms to submit');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const response = await api.post(`${API_BASE}/supervisor/form-d/submit`, {
        groupId: selectedGroup.id,
        ...formData
      });

      if (response.ok) {
        setSuccess('Form-D submitted successfully! The coordinator will review your endorsement.');
        setTimeout(() => {
          navigate('/supervisor/groups');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to submit Form-D');
      }
    } catch (err) {
      setError('Failed to submit Form-D');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingGroups = groups.filter(g => !g.formDSubmitted);

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
            <h1 className="text-2xl font-bold text-gray-900">Form-D: Supervisor Endorsement</h1>
            <p className="text-gray-500 mt-1">Endorse student proposals for your assigned groups</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How Form-D Works:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>After accepting a supervision request, you have <strong>7 days</strong> to submit Form-D</li>
                <li>Form-D is automatically available - no coordinator approval needed to start</li>
                <li>Once submitted, the coordinator will review and approve your endorsement</li>
                <li>After approval, the group can proceed to their proposal defense</li>
              </ul>
            </div>
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
            ) : pendingGroups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleSelectGroup(group)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Users className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{group.groupName}</h3>
                        <p className="text-sm text-gray-500">{group.projectTitle || 'No title yet'}</p>
                        <span className="text-xs text-amber-600">{group.memberCount} members</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Form-D</h3>
                <p className="text-gray-500">All your groups have Form-D submitted or don't need endorsement yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Form-D Form */}
        {selectedGroup && (
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  type="button"
                  onClick={() => setSelectedGroup(null)}
                  className="text-sm text-amber-600 hover:text-amber-700"
                >
                  Change Group
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">FORM-D (To be filled by supervisor)</h2>

              <div className="space-y-6">
                {/* Project Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    19. Title of Project being supervised:
                  </label>
                  <input
                    type="text"
                    value={formData.projectTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectTitle: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                {/* Supervisor Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    20. Name of Supervisor:
                  </label>
                  <input
                    type="text"
                    value={formData.supervisorName}
                    onChange={(e) => setFormData(prev => ({ ...prev, supervisorName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      21. Telephone No:
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.telephone}
                        onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        placeholder="Office phone"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cell No:
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.cellNo}
                        onChange={(e) => setFormData(prev => ({ ...prev, cellNo: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        placeholder="Mobile number"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    22. Email Contact:
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>

                {/* Supervisor Details */}
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h3 className="font-medium text-gray-900 mb-4">23. Supervisor Details:</h3>
                  
                  <div className="space-y-4">
                    {/* Faculty Type */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Faculty Member Type:</p>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="facultyType"
                            value="Permanent"
                            checked={formData.facultyType === 'Permanent'}
                            onChange={(e) => setFormData(prev => ({ ...prev, facultyType: e.target.value }))}
                            className="text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-sm">Permanent Faculty Member</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="facultyType"
                            value="Visiting"
                            checked={formData.facultyType === 'Visiting'}
                            onChange={(e) => setFormData(prev => ({ ...prev, facultyType: e.target.value }))}
                            className="text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-sm">Visiting Faculty Member</span>
                        </label>
                      </div>
                    </div>

                    {/* Department */}
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">a. Specify Department:</label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        required
                      >
                        <option value="">Select Department</option>
                        <option value="CS">CS (Computer Science)</option>
                        <option value="SE">SE (Software Engineering)</option>
                        <option value="CE">CE (Computer Engineering)</option>
                        <option value="EE">EE (Electrical Engineering)</option>
                      </select>
                    </div>

                    {/* External Supervisor */}
                    {formData.facultyType === 'Visiting' && (
                      <>
                        <div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.companyLetter}
                              onChange={(e) => setFormData(prev => ({ ...prev, companyLetter: e.target.checked }))}
                              className="rounded text-amber-600 focus:ring-amber-500"
                            />
                            <span className="text-sm text-gray-700">
                              b. Company's letter and professional details attached
                            </span>
                          </label>
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-600 mb-1 block">Address of working place:</label>
                          <textarea
                            value={formData.workplaceAddress}
                            onChange={(e) => setFormData(prev => ({ ...prev, workplaceAddress: e.target.value }))}
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    24. Designation:
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="e.g., Assistant Professor, Lecturer"
                    required
                  />
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    25. Supervisor Comments:
                  </label>
                  <textarea
                    value={formData.comments}
                    onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter your comments about the project proposal..."
                  />
                </div>

                {/* Digital Signature */}
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    26. Supervisor Signature / Date:
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    By typing your name below, you are digitally signing this endorsement.
                  </p>
                  <input
                    type="text"
                    value={formData.signature}
                    onChange={(e) => setFormData(prev => ({ ...prev, signature: e.target.value }))}
                    className="w-full px-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                    placeholder="Type your full name as signature"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Date: {new Date().toLocaleDateString()}
                  </p>
                </div>

                {/* Agreement */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreedToTerms}
                      onChange={(e) => setFormData(prev => ({ ...prev, agreedToTerms: e.target.checked }))}
                      className="rounded text-amber-600 focus:ring-amber-500 mt-1"
                    />
                    <span className="text-sm text-gray-700">
                      I hereby confirm that I have reviewed the project proposal and agree to supervise 
                      this group through their Final Year Project. I understand my responsibilities as 
                      outlined in the FYP guidelines.
                    </span>
                  </label>
                </div>

                {/* Note about transcript */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> For submission of this form, students must attach their latest 
                    transcript result copy.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/supervisor/groups')}
                className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.agreedToTerms}
                className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Form-D
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </SupervisorLayout>
  );
};

export default SupervisorFormD;

