import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  UserPlus, 
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Crown,
  Mail,
  Phone,
  Trash2,
  Edit2,
  Save,
  ArrowLeft
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';

const StudentMyGroup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Create group modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    groupName: '',
    projectTitle: '',
    projectDescription: '',
    degreeLevel: 'Bachelor',
    degreeProgram: 'CS',
    departmentId: ''
  });
  
  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState(false);
  
  // Edit group modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editing, setEditing] = useState(false);
  
  // Departments
  const [departments, setDepartments] = useState([]);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
    fetchDepartments();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch group
      const groupResponse = await api.get(`${API_BASE}/student/my-group`);
      if (groupResponse.ok) {
        const groupData = await groupResponse.json();
        setGroup(groupData);
      } else if (groupResponse.status !== 404) {
        const errData = await groupResponse.json();
        setError(errData.message);
      }
      
      // Fetch pending invitations
      const invitesResponse = await api.get(`${API_BASE}/student/invitations`);
      if (invitesResponse.ok) {
        const invitesData = await invitesResponse.json();
        setPendingInvites(invitesData);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get(`${API_BASE}/departments`);
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (err) {
      console.error('Failed to fetch departments');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    
    if (!createForm.groupName || !createForm.departmentId) {
      setError('Please fill in required fields');
      return;
    }
    
    try {
      setCreating(true);
      setError('');
      
      const response = await api.post(`${API_BASE}/fypgroups`, {
        ...createForm,
        departmentId: parseInt(createForm.departmentId)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Group created successfully!');
        setShowCreateModal(false);
        setCreateForm({
          groupName: '',
          projectTitle: '',
          projectDescription: '',
          degreeLevel: 'Bachelor',
          degreeProgram: 'CS',
          departmentId: ''
        });
        fetchData();
      } else {
        setError(data.message || 'Failed to create group');
      }
    } catch (err) {
      setError('Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleSearchStudents = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setSearching(true);
      const response = await api.get(`${API_BASE}/students?search=${encodeURIComponent(searchQuery)}&pageSize=10`);
      if (response.ok) {
        const data = await response.json();
        // Filter out current group members
        const memberIds = group?.members?.map(m => m.studentId) || [];
        const filteredStudents = (data.students || []).filter(s => !memberIds.includes(s.id));
        setSearchResults(filteredStudents);
      }
    } catch (err) {
      console.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleInviteStudent = async (studentId) => {
    try {
      setInviting(true);
      const response = await api.post(`${API_BASE}/fypgroups/${group.id}/invite`, {
        studentId
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Invitation sent!');
        setSearchResults(prev => prev.filter(s => s.id !== studentId));
        fetchData();
      } else {
        setError(data.message || 'Failed to send invitation');
      }
    } catch (err) {
      setError('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRespondToInvite = async (groupId, accept) => {
    try {
      const response = await api.post(`${API_BASE}/fypgroups/${groupId}/respond`, {
        accept
      });
      
      if (response.ok) {
        setSuccess(accept ? 'Joined group!' : 'Invitation declined');
        fetchData();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to respond to invitation');
      }
    } catch (err) {
      setError('Failed to respond to invitation');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
      const response = await api.delete(`${API_BASE}/fypgroups/${group.id}/members/${memberId}`);
      
      if (response.ok) {
        setSuccess('Member removed');
        fetchData();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to remove member');
      }
    } catch (err) {
      setError('Failed to remove member');
    }
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    
    try {
      setEditing(true);
      const response = await api.put(`${API_BASE}/fypgroups/${group.id}`, editForm);
      
      if (response.ok) {
        setSuccess('Group updated successfully!');
        setShowEditModal(false);
        fetchData();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update group');
      }
    } catch (err) {
      setError('Failed to update group');
    } finally {
      setEditing(false);
    }
  };

  const openEditModal = () => {
    setEditForm({
      groupName: group.groupName,
      projectTitle: group.projectTitle || '',
      projectDescription: group.projectDescription || '',
      degreeLevel: group.degreeLevel || 'Bachelor',
      degreeProgram: group.degreeProgram || 'CS'
    });
    setShowEditModal(true);
  };

  const isManager = group?.members?.some(m => m.studentId === user.id && m.isGroupManager);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My FYP Group</h1>
          <p className="text-gray-500 mt-1">Manage your group and team members</p>
        </div>
        {!group && pendingInvites.length === 0 && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Create Group
          </button>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="h-4 w-4 text-red-600" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-green-700">{success}</p>
          <button onClick={() => setSuccess('')} className="ml-auto">
            <X className="h-4 w-4 text-green-600" />
          </button>
        </div>
      )}

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <UserPlus className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-amber-800">Pending Invitations</h2>
          </div>
          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div key={invite.groupMemberId} className="bg-white rounded-lg p-4 shadow-sm border border-amber-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{invite.groupName}</h3>
                    {invite.projectTitle && (
                      <p className="text-sm text-gray-600 mt-1">{invite.projectTitle}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Invited by {invite.invitedByName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespondToInvite(invite.groupId, true)}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespondToInvite(invite.groupId, false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Group State */}
      {!group && pendingInvites.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="h-10 w-10 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Group Yet</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create a new FYP group to start your project journey, or wait for an invitation from another student.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Create New Group
          </button>
        </div>
      )}

      {/* Group Details */}
      {group && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Group Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">{group.groupName}</h2>
                {group.projectTitle && (
                  <p className="text-indigo-100 mt-1 text-lg">{group.projectTitle}</p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium
                    ${group.status === 'Active' ? 'bg-green-500/20 text-green-100' :
                      group.status === 'PendingApproval' ? 'bg-amber-500/20 text-amber-100' :
                      'bg-white/20 text-white'}
                  `}>
                    {group.status}
                  </span>
                  <span className="text-indigo-200">
                    {group.degreeProgram} • {group.degreeLevel}
                  </span>
                </div>
              </div>
              {isManager && (
                <button
                  onClick={openEditModal}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Project Description */}
          {group.projectDescription && (
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Project Description</h3>
              <p className="text-gray-700">{group.projectDescription}</p>
            </div>
          )}

          {/* Supervisor */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Supervisor</h3>
            {group.supervisorName ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold">
                      {group.supervisorName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{group.supervisorName}</p>
                    <span className={`text-sm ${
                      group.supervisorStatus === 'Accepted' ? 'text-green-600' :
                      group.supervisorStatus === 'Rejected' ? 'text-red-600' :
                      'text-amber-600'
                    }`}>
                      {group.supervisorStatus || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 italic">No supervisor assigned yet</div>
            )}
          </div>

          {/* Members */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">
                Members ({group.members?.filter(m => m.status === 'Accepted').length || 0}/3)
              </h3>
              {isManager && group.members?.filter(m => m.status === 'Accepted').length < 3 && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium flex items-center gap-1"
                >
                  <UserPlus className="h-4 w-4" />
                  Invite Member
                </button>
              )}
            </div>
            <div className="space-y-3">
              {group.members?.map((member) => (
                <div 
                  key={member.id} 
                  className={`flex items-center justify-between p-4 rounded-lg border
                    ${member.status === 'Accepted' ? 'bg-gray-50 border-gray-200' : 
                      member.status === 'Pending' ? 'bg-amber-50 border-amber-200' : 
                      'bg-red-50 border-red-200'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold">
                        {member.studentName?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{member.studentName}</p>
                        {member.isGroupManager && (
                          <Crown className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{member.enrollmentId}</p>
                      {member.email && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${member.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                        member.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'}
                    `}>
                      {member.status}
                    </span>
                    {isManager && !member.isGroupManager && member.status !== 'Declined' && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Create New Group</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleCreateGroup} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={createForm.groupName}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, groupName: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Team Alpha"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Title (Optional)
                </label>
                <input
                  type="text"
                  value={createForm.projectTitle}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, projectTitle: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., AI-Powered FYP Management System"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Description (Optional)
                </label>
                <textarea
                  value={createForm.projectDescription}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, projectDescription: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder="Brief description of your project..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Degree Level *
                  </label>
                  <select
                    value={createForm.degreeLevel}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, degreeLevel: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Bachelor">Bachelor</option>
                    <option value="Master">Master</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Degree Program *
                  </label>
                  <select
                    value={createForm.degreeProgram}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, degreeProgram: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="CS">CS (Computer Science)</option>
                    <option value="SE">SE (Software Engineering)</option>
                    <option value="CE">CE (Computer Engineering)</option>
                    <option value="IT">IT (Information Technology)</option>
                    <option value="AI">AI (Artificial Intelligence)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  value={createForm.departmentId}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, departmentId: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Group
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Invite Member</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-5">
              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchStudents()}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Search by name or enrollment ID..."
                  />
                </div>
                <button
                  onClick={handleSearchStudents}
                  disabled={searching}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map(student => (
                      <div 
                        key={student.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{student.fullName}</p>
                          <p className="text-sm text-gray-500">{student.enrollmentId}</p>
                        </div>
                        <button
                          onClick={() => handleInviteStudent(student.id)}
                          disabled={inviting}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                          Invite
                        </button>
                      </div>
                    ))}
                  </div>
                ) : searchQuery && !searching ? (
                  <div className="text-center py-8 text-gray-500">
                    No students found
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Search for students to invite
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Edit Group</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateGroup} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={editForm.groupName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, groupName: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={editForm.projectTitle}
                  onChange={(e) => setEditForm(prev => ({ ...prev, projectTitle: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Description
                </label>
                <textarea
                  value={editForm.projectDescription}
                  onChange={(e) => setEditForm(prev => ({ ...prev, projectDescription: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {editing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMyGroup;

