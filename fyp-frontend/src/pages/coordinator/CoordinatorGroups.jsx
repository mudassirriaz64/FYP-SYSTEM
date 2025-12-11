import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  UserCheck,
  FileText,
  Calendar,
  Send,
  Download,
  UserPlus,
  XCircle,
  Edit2,
  Filter,
  BarChart3,
  FileCheck,
  ClipboardList,
  Award,
  DollarSign,
  ExternalLink
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';
import CoordinatorLayout from '../../components/layouts/CoordinatorLayout';

const CoordinatorGroups = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formProgressFilter, setFormProgressFilter] = useState('all');
  
  // Departments & Supervisors
  const [departments, setDepartments] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  
  // Selected group for detail view
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [groupProposals, setGroupProposals] = useState([]);
  
  // Supervisor assignment modal
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');
  const [assigning, setAssigning] = useState(false);
  
  // Expanded rows for inline view
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch groups with their proposals
      let url = `${API_BASE}/fypgroups?pageSize=100`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      
      const [groupsRes, deptsRes, supRes] = await Promise.all([
        api.get(url),
        api.get(`${API_BASE}/departments`),
        api.get(`${API_BASE}/staff?staffType=Teacher&pageSize=100`)
      ]);
      
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        
        // Fetch proposals for each group to get progress
        const groupsWithProgress = await Promise.all(
          (groupsData.groups || []).map(async (group) => {
            const proposalsRes = await api.get(`${API_BASE}/proposals/by-group/${group.id}`);
            const proposals = proposalsRes.ok ? await proposalsRes.json() : [];
            
            return {
              ...group,
              proposals,
              formAStatus: getFormStatus(proposals, 'FormA'),
              formBStatus: getFormStatus(proposals, 'FormB'),
              formCStatus: getFormStatus(proposals, 'FormC'),
              formDStatus: getFormStatus(proposals, 'FormD'),
              progress: calculateProgress(proposals)
            };
          })
        );
        
        setGroups(groupsWithProgress);
      }
      
      if (deptsRes.ok) {
        const deptsData = await deptsRes.json();
        setDepartments(deptsData.departments || []);
      }
      
      if (supRes.ok) {
        const supData = await supRes.json();
        setSupervisors(supData.staff || []);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getFormStatus = (proposals, formType) => {
    const proposal = proposals.find(p => p.formType === formType);
    if (!proposal) return { status: 'NotStarted', label: 'Not Started', color: 'gray' };
    
    const statusMap = {
      Draft: { label: 'In Progress', color: 'amber' },
      Submitted: { label: 'Submitted', color: 'blue' },
      UnderReview: { label: 'Under Review', color: 'purple' },
      Approved: { label: 'Approved', color: 'green' },
      Rejected: { label: 'Rejected', color: 'red' },
      Revision: { label: 'Revision Required', color: 'orange' }
    };
    
    return { 
      status: proposal.status, 
      proposal,
      ...statusMap[proposal.status] || { label: proposal.status, color: 'gray' }
    };
  };

  const calculateProgress = (proposals) => {
    let completed = 0;
    const forms = ['FormA', 'FormB', 'FormC', 'FormD'];
    
    forms.forEach(form => {
      const p = proposals.find(pr => pr.formType === form);
      if (p && p.status === 'Approved') completed++;
    });
    
    return Math.round((completed / forms.length) * 100);
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

  const openDetailModal = async (group) => {
    setSelectedGroup(group);
    setGroupProposals(group.proposals || []);
    setShowDetailModal(true);
  };

  const openSupervisorModal = (group) => {
    setSelectedGroup(group);
    setSelectedSupervisorId(group.supervisorId?.toString() || '');
    setShowSupervisorModal(true);
  };

  const handleAssignSupervisor = async () => {
    if (!selectedSupervisorId) {
      setError('Please select a supervisor');
      return;
    }
    
    try {
      setAssigning(true);
      const response = await api.put(`${API_BASE}/fypgroups/${selectedGroup.id}/supervisor`, {
        supervisorId: parseInt(selectedSupervisorId)
      });
      
      if (response.ok) {
        setSuccess('Supervisor assigned successfully!');
        setShowSupervisorModal(false);
        fetchData();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to assign supervisor');
      }
    } catch (err) {
      setError('Failed to assign supervisor');
    } finally {
      setAssigning(false);
    }
  };

  const handleReviewProposal = async (proposalId, status, remarks = '') => {
    try {
      const response = await api.put(`${API_BASE}/proposals/${proposalId}/review`, {
        status,
        remarks
      });
      
      if (response.ok) {
        setSuccess(`Proposal ${status.toLowerCase()} successfully!`);
        fetchData();
        if (selectedGroup) {
          const updatedProposals = await api.get(`${API_BASE}/proposals/by-group/${selectedGroup.id}`);
          if (updatedProposals.ok) {
            setGroupProposals(await updatedProposals.json());
          }
        }
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to review proposal');
      }
    } catch (err) {
      setError('Failed to review proposal');
    }
  };

  const getStatusBadge = (formStatus) => {
    const colors = {
      gray: 'bg-gray-100 text-gray-600',
      amber: 'bg-amber-100 text-amber-700',
      blue: 'bg-blue-100 text-blue-700',
      purple: 'bg-purple-100 text-purple-700',
      green: 'bg-green-100 text-green-700',
      red: 'bg-red-100 text-red-700',
      orange: 'bg-orange-100 text-orange-700'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[formStatus.color]}`}>
        {formStatus.label}
      </span>
    );
  };

  const filteredGroups = groups.filter(g => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!g.groupName?.toLowerCase().includes(query) && 
          !g.projectTitle?.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Form progress filter
    if (formProgressFilter !== 'all') {
      if (formProgressFilter === 'formA-pending' && g.formAStatus.status !== 'Submitted') return false;
      if (formProgressFilter === 'formB-pending' && g.formBStatus.status !== 'Submitted') return false;
      if (formProgressFilter === 'no-supervisor' && g.supervisorId) return false;
    }
    
    return true;
  });

  const stats = {
    total: groups.length,
    active: groups.filter(g => g.status === 'Active').length,
    pendingFormA: groups.filter(g => g.formAStatus.status === 'Submitted').length,
    pendingFormB: groups.filter(g => g.formBStatus.status === 'Submitted').length,
    noSupervisor: groups.filter(g => !g.supervisorId).length
  };

  return (
    <CoordinatorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">FYP Groups & Progress</h1>
            <p className="text-gray-500 mt-1">Monitor groups, review proposals, and track progress</p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Users className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Groups</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
            </div>
          </div>
          
          <div 
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:bg-blue-50 transition-colors"
            onClick={() => setFormProgressFilter('formA-pending')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingFormA}</p>
                <p className="text-xs text-gray-500">Form-A Pending</p>
              </div>
            </div>
          </div>
          
          <div 
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:bg-purple-50 transition-colors"
            onClick={() => setFormProgressFilter('formB-pending')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ClipboardList className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingFormB}</p>
                <p className="text-xs text-gray-500">Form-B Pending</p>
              </div>
            </div>
          </div>
          
          <div 
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:bg-amber-50 transition-colors"
            onClick={() => setFormProgressFilter('no-supervisor')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <UserPlus className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.noSupervisor}</p>
                <p className="text-xs text-gray-500">No Supervisor</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="Search by group name or project..."
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="Forming">Forming</option>
              <option value="PendingApproval">Pending Approval</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
            
            <select
              value={formProgressFilter}
              onChange={(e) => setFormProgressFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="all">All Progress</option>
              <option value="formA-pending">Form-A Pending Review</option>
              <option value="formB-pending">Form-B Pending Review</option>
              <option value="no-supervisor">No Supervisor</option>
            </select>
            
            {formProgressFilter !== 'all' && (
              <button
                onClick={() => setFormProgressFilter('all')}
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1"
              >
                <X className="h-4 w-4" /> Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Groups Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase w-8"></th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Group</th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Progress</th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Form-A</th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Form-B</th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Form-D</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Supervisor</th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredGroups.map((group) => (
                    <>
                      <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <button
                            onClick={() => toggleExpand(group.id)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            {expandedGroups.has(group.id) ? (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{group.groupName}</p>
                            <p className="text-sm text-gray-500 truncate max-w-[200px]">
                              {group.projectTitle || 'No title'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400">{group.degreeProgram}</span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-400">{group.memberCount} members</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-teal-500 rounded-full transition-all"
                                style={{ width: `${group.progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600">{group.progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {getStatusBadge(group.formAStatus)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {getStatusBadge(group.formBStatus)}
                            {group.formBStatus.status === 'Submitted' && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReviewProposal(group.formBStatus.proposal.id, 'Approved');
                                  }}
                                  className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                  title="Approve Form-B"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReviewProposal(group.formBStatus.proposal.id, 'Rejected', 'Please revise and resubmit');
                                  }}
                                  className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                  title="Reject Form-B"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {getStatusBadge(group.formDStatus)}
                        </td>
                        <td className="px-4 py-4">
                          {group.supervisorName ? (
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-green-500" />
                              <span className="text-sm">{group.supervisorName}</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => openSupervisorModal(group)}
                              className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700"
                            >
                              <UserPlus className="h-4 w-4" />
                              Assign
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openDetailModal(group)}
                              className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                              title="View Details"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            {(group.formAStatus.status === 'Submitted' || 
                              group.formBStatus.status === 'Submitted') && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                            )}
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Row */}
                      {expandedGroups.has(group.id) && (
                        <tr>
                          <td colSpan={8} className="px-4 py-4 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Quick Actions */}
                              <div className="space-y-3">
                                <h4 className="font-semibold text-gray-700 text-sm">Quick Actions</h4>
                                <div className="flex flex-wrap gap-2">
                                  {group.formAStatus.status === 'Submitted' && (
                                    <>
                                      <button
                                        onClick={() => handleReviewProposal(group.formAStatus.proposal.id, 'Approved')}
                                        className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 flex items-center gap-1"
                                      >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Approve Form-A
                                      </button>
                                      <button
                                        onClick={() => handleReviewProposal(group.formAStatus.proposal.id, 'Rejected', 'Please revise and resubmit')}
                                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 flex items-center gap-1"
                                      >
                                        <XCircle className="h-4 w-4" />
                                        Reject Form-A
                                      </button>
                                    </>
                                  )}
                                  {group.formBStatus.status === 'Submitted' && (
                                    <>
                                      <button
                                        onClick={() => handleReviewProposal(group.formBStatus.proposal.id, 'Approved')}
                                        className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 flex items-center gap-1"
                                      >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Approve Form-B
                                      </button>
                                      <button
                                        onClick={() => handleReviewProposal(group.formBStatus.proposal.id, 'Rejected', 'Please revise and resubmit')}
                                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 flex items-center gap-1"
                                      >
                                        <XCircle className="h-4 w-4" />
                                        Reject Form-B
                                      </button>
                                    </>
                                  )}
                                  {group.formDStatus.status === 'Submitted' && (
                                    <>
                                      <button
                                        onClick={() => handleReviewProposal(group.formDStatus.proposal.id, 'Approved')}
                                        className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 flex items-center gap-1"
                                      >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Approve Form-D
                                      </button>
                                      <button
                                        onClick={() => handleReviewProposal(group.formDStatus.proposal.id, 'Rejected', 'Please revise and resubmit')}
                                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 flex items-center gap-1"
                                      >
                                        <XCircle className="h-4 w-4" />
                                        Reject Form-D
                                      </button>
                                    </>
                                  )}
                                  {!group.supervisorId && (
                                    <button
                                      onClick={() => openSupervisorModal(group)}
                                      className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 flex items-center gap-1"
                                    >
                                      <UserPlus className="h-4 w-4" />
                                      Assign Supervisor
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Members */}
                              <div className="space-y-3">
                                <h4 className="font-semibold text-gray-700 text-sm">Members</h4>
                                <div className="flex flex-wrap gap-2">
                                  {group.members?.map(m => (
                                    <div key={m.id} className="flex items-center gap-2 px-2 py-1 bg-white border rounded-lg">
                                      <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center text-xs font-medium text-teal-600">
                                        {m.studentName?.charAt(0)}
                                      </div>
                                      <span className="text-sm">{m.studentName}</span>
                                      {m.isGroupManager && (
                                        <span className="text-xs bg-teal-100 text-teal-600 px-1 rounded">GM</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Groups Found</h2>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden my-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedGroup.groupName}</h2>
                  <p className="text-teal-100 mt-1">{selectedGroup.projectTitle || 'No project title'}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                      {selectedGroup.degreeProgram} • {selectedGroup.degreeLevel}
                    </span>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                      {selectedGroup.memberCount} members
                    </span>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                      {selectedGroup.progress}% Complete
                    </span>
                  </div>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              {/* Progress Timeline */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-teal-600" />
                  Progress Timeline
                </h3>
                <div className="flex items-center justify-between">
                  {['FormA', 'FormB', 'FormD'].map((form, idx) => {
                    const status = selectedGroup[`form${form.slice(-1)}Status`];
                    const isCompleted = status.status === 'Approved';
                    const isPending = status.status === 'Submitted';
                    
                    return (
                      <div key={form} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center
                            ${isCompleted ? 'bg-green-500 text-white' :
                              isPending ? 'bg-blue-500 text-white' :
                              status.status !== 'NotStarted' ? 'bg-amber-500 text-white' :
                              'bg-gray-200 text-gray-500'}
                          `}>
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <span className="font-semibold text-sm">{idx + 1}</span>
                            )}
                          </div>
                          <span className="text-xs font-medium mt-2 text-gray-600">Form-{form.slice(-1)}</span>
                          <span className={`text-xs mt-1 ${
                            isCompleted ? 'text-green-600' :
                            isPending ? 'text-blue-600' : 'text-gray-400'
                          }`}>
                            {status.label}
                          </span>
                        </div>
                        {idx < 2 && (
                          <div className={`h-1 flex-1 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> Form-D is submitted by the supervisor within 7 days after accepting the supervision request.
                  </p>
                </div>
              </div>

              {/* Members & Submissions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Members */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-teal-600" />
                    Group Members
                  </h3>
                  <div className="space-y-2">
                    {selectedGroup.members?.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                            <span className="text-teal-600 font-medium text-sm">{m.studentName?.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{m.studentName}</p>
                            <p className="text-xs text-gray-500">{m.enrollmentId}</p>
                          </div>
                        </div>
                        {m.isGroupManager && (
                          <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full font-medium">
                            Group Manager
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Supervisor */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-teal-600" />
                    Supervisor
                  </h3>
                  {selectedGroup.supervisorName ? (
                    <div className="p-4 bg-white rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                          <span className="text-teal-600 font-semibold">{selectedGroup.supervisorName?.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{selectedGroup.supervisorName}</p>
                          <span className={`text-sm ${
                            selectedGroup.supervisorStatus === 'Accepted' ? 'text-green-600' :
                            selectedGroup.supervisorStatus === 'Rejected' ? 'text-red-600' : 'text-amber-600'
                          }`}>
                            {selectedGroup.supervisorStatus || 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-amber-700 text-sm mb-3">No supervisor assigned yet</p>
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          openSupervisorModal(selectedGroup);
                        }}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700"
                      >
                        Assign Supervisor
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supervisor Assignment Modal */}
      {showSupervisorModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Assign Supervisor</h3>
              <p className="text-sm text-gray-500 mt-1">{selectedGroup.groupName}</p>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Supervisor</label>
              <select
                value={selectedSupervisorId}
                onChange={(e) => setSelectedSupervisorId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- Select a Supervisor --</option>
                {supervisors
                  .filter(s => s.departmentId === selectedGroup.departmentId || !s.departmentId)
                  .map(sup => (
                    <option key={sup.id} value={sup.id}>
                      {sup.fullName}
                      {sup.isHOD && ' (HOD)'}
                      {sup.isFYPCoordinator && ' (Coordinator)'}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Showing supervisors from {selectedGroup.departmentName || 'all departments'}
              </p>
            </div>
            
            <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowSupervisorModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSupervisor}
                disabled={assigning || !selectedSupervisorId}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
              >
                {assigning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Assign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </CoordinatorLayout>
  );
};

export default CoordinatorGroups;
