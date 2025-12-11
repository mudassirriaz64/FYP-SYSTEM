import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import {
  Users,
  ArrowLeft,
  Search,
  Shield,
  UserCheck,
  GraduationCap,
  Check,
  X,
  AlertCircle,
  Crown,
  Clipboard,
  BookOpen,
  Mail,
  Phone,
  Building2
} from 'lucide-react';

const API_BASE = 'http://localhost:5073/api';

const AdminDepartmentStaff = () => {
  const { departmentId } = useParams();
  const navigate = useNavigate();

  const [department, setDepartment] = useState(null);
  const [staff, setStaff] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Role assignment modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [roleData, setRoleData] = useState({
    isHOD: false,
    isFYPCoordinator: false,
    isSupervisor: false,
    isCommitteeMember: false
  });
  const [roleError, setRoleError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Fetch department details
  const fetchDepartment = async () => {
    try {
      const response = await fetch(`${API_BASE}/departments/${departmentId}`);
      if (!response.ok) {
        navigate('/admin/departments');
        return;
      }
      const data = await response.json();
      setDepartment(data);
    } catch (error) {
      console.error('Failed to fetch department:', error);
      navigate('/admin/departments');
    }
  };

  // Fetch department staff
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: '100' });
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`${API_BASE}/staff/department/${departmentId}?${params}`);
      const data = await response.json();
      setStaff(data.staff || []);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch department staff summary
  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_BASE}/staff/department/${departmentId}/summary`);
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  useEffect(() => {
    fetchDepartment();
  }, [departmentId]);

  useEffect(() => {
    if (department) {
      fetchStaff();
      fetchSummary();
    }
  }, [department, searchQuery]);

  // Open role assignment modal
  const openRoleModal = (member) => {
    setSelectedStaff(member);
    setRoleData({
      isHOD: member.isHOD,
      isFYPCoordinator: member.isFYPCoordinator,
      isSupervisor: member.isSupervisor,
      isCommitteeMember: member.isCommitteeMember || false
    });
    setRoleError('');
    setIsRoleModalOpen(true);
  };

  // Submit role assignment
  const handleRoleSubmit = async () => {
    try {
      const response = await fetch(`${API_BASE}/staff/${selectedStaff.id}/department-roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleData)
      });

      const data = await response.json();

      if (!response.ok) {
        setRoleError(data.message || 'Failed to update roles');
        return;
      }

      setSubmitSuccess('Roles updated successfully');
      setTimeout(() => setSubmitSuccess(''), 3000);
      setIsRoleModalOpen(false);
      setSelectedStaff(null);
      fetchStaff();
      fetchSummary();
    } catch (error) {
      setRoleError('Network error. Please try again.');
    }
  };

  const getRoleBadges = (member) => {
    const badges = [];
    if (member.isHOD) badges.push({ label: 'HOD', icon: Crown, color: 'bg-purple-100 text-purple-700 border-purple-200' });
    if (member.isFYPCoordinator) badges.push({ label: 'FYP Coordinator', icon: Clipboard, color: 'bg-blue-100 text-blue-700 border-blue-200' });
    if (member.isSupervisor) badges.push({ label: 'Supervisor', icon: BookOpen, color: 'bg-green-100 text-green-700 border-green-200' });
    if (member.isCommitteeMember) badges.push({ label: 'Committee Member', icon: Shield, color: 'bg-amber-100 text-amber-700 border-amber-200' });
    return badges;
  };

  if (!department) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/departments"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Department Staff</h1>
              <div className="flex items-center gap-2 mt-1">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{department.name}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{department.code}</span>
              </div>
            </div>
          </div>
          <Link
            to="/admin/staff"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm"
          >
            <Users className="w-4 h-4" />
            Manage All Staff
          </Link>
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">{submitSuccess}</span>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Staff */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalStaff}</p>
                  <p className="text-sm text-gray-500">Total Staff</p>
                </div>
              </div>
            </div>

            {/* HOD */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Crown className="w-6 h-6 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-500">Head of Department</p>
                  {summary.hod ? (
                    <p className="text-sm font-semibold text-gray-900 truncate">{summary.hod.fullName}</p>
                  ) : (
                    <p className="text-sm text-amber-600 font-medium">Not Assigned</p>
                  )}
                </div>
              </div>
            </div>

            {/* FYP Coordinators */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Clipboard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.fypCoordinators?.length || 0}
                    <span className="text-sm font-normal text-gray-400">/2</span>
                  </p>
                  <p className="text-sm text-gray-500">FYP Coordinators</p>
                </div>
              </div>
            </div>

            {/* Supervisors */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{summary.supervisorCount}</p>
                  <p className="text-sm text-gray-500">Supervisors</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search department staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Staff List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Staff Members</h2>
            <p className="text-sm text-gray-500">Click "Manage Roles" to assign HOD, FYP Coordinator, or Supervisor roles</p>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-500">Loading staff...</span>
              </div>
            </div>
          ) : staff.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">No staff in this department</p>
                  <p className="text-gray-500 text-sm">Assign staff to this department from the Staff page</p>
                </div>
                <Link
                  to="/admin/staff"
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <Users className="w-4 h-4" />
                  Go to Staff Management
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {staff.map((member) => {
                const roleBadges = getRoleBadges(member);
                return (
                  <div
                    key={member.id}
                    className="px-6 py-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{member.fullName}</p>
                          {roleBadges.map((badge, i) => {
                            const Icon = badge.icon;
                            return (
                              <span
                                key={i}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}
                              >
                                <Icon className="w-3 h-3" />
                                {badge.label}
                              </span>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          {member.designation && (
                            <span>{member.designation}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {member.email}
                          </span>
                          {member.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" />
                              {member.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => openRoleModal(member)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-colors text-sm font-medium flex-shrink-0"
                    >
                      <Shield className="w-4 h-4" />
                      Manage Roles
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Role Assignment Modal */}
      {isRoleModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsRoleModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Assign Department Roles</h2>
                <p className="text-sm text-gray-500">{selectedStaff.fullName}</p>
              </div>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {roleError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{roleError}</span>
                </div>
              )}

              {/* HOD Role */}
              <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                roleData.isHOD ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    roleData.isHOD ? 'bg-purple-100' : 'bg-gray-100'
                  }`}>
                    <Crown className={`w-5 h-5 ${roleData.isHOD ? 'text-purple-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Head of Department</p>
                    <p className="text-xs text-gray-500">Only 1 HOD per department</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={roleData.isHOD}
                  onChange={(e) => setRoleData({ ...roleData, isHOD: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
              </label>

              {/* FYP Coordinator Role */}
              <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                roleData.isFYPCoordinator ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    roleData.isFYPCoordinator ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Clipboard className={`w-5 h-5 ${roleData.isFYPCoordinator ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">FYP Coordinator</p>
                    <p className="text-xs text-gray-500">Maximum 2 coordinators per department</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={roleData.isFYPCoordinator}
                  onChange={(e) => setRoleData({ ...roleData, isFYPCoordinator: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>

              {/* Supervisor Role */}
              <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                roleData.isSupervisor ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    roleData.isSupervisor ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <BookOpen className={`w-5 h-5 ${roleData.isSupervisor ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">FYP Supervisor</p>
                    <p className="text-xs text-gray-500">Can supervise student FYP projects</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={roleData.isSupervisor}
                  onChange={(e) => setRoleData({ ...roleData, isSupervisor: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
              </label>

              {/* Committee Member Role */}
              <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                roleData.isCommitteeMember ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    roleData.isCommitteeMember ? 'bg-amber-100' : 'bg-gray-100'
                  }`}>
                    <Shield className={`w-5 h-5 ${roleData.isCommitteeMember ? 'text-amber-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Committee Member</p>
                    <p className="text-xs text-gray-500">Can be assigned as evaluator for defenses</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={roleData.isCommitteeMember}
                  onChange={(e) => setRoleData({ ...roleData, isCommitteeMember: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
              </label>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleSubmit}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
              >
                Save Roles
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDepartmentStaff;

