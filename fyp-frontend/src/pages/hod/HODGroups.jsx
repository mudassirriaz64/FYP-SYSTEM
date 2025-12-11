import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users,
  Search,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Award
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';
import HODLayout from '../../components/layouts/HODLayout';

const HODGroups = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_BASE}/hod/groups`);
      
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

  const getStatusBadge = (status) => {
    const styles = {
      Active: 'bg-green-100 text-green-700',
      PendingApproval: 'bg-amber-100 text-amber-700',
      Forming: 'bg-blue-100 text-blue-700',
      Completed: 'bg-purple-100 text-purple-700',
      Deferred: 'bg-orange-100 text-orange-700',
      Rejected: 'bg-red-100 text-red-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.groupName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          group.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          group.supervisorName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || group.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: groups.length,
    active: groups.filter(g => g.status === 'Active').length,
    pending: groups.filter(g => g.status === 'PendingApproval').length,
    completed: groups.filter(g => g.status === 'Completed').length
  };

  return (
    <HODLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Department Groups</h1>
            <p className="text-gray-500 mt-1">All FYP groups in your department</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Users className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Groups</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search groups, projects, supervisors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="PendingApproval">Pending Approval</option>
              <option value="Forming">Forming</option>
              <option value="Completed">Completed</option>
            </select>
            <div className="text-right text-sm text-gray-500 flex items-center justify-end">
              {filteredGroups.length} group(s)
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Groups List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Members</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredGroups.map((group) => (
                  <tr key={group.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{group.groupName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700 line-clamp-1">{group.projectTitle || 'No title'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600">{group.supervisorName || 'Not assigned'}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        {group.memberCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(group.status)}`}>
                        {group.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/hod/marks?groupId=${group.id}`)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="View Marks"
                      >
                        <Award className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Groups Found</h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'All'
                ? 'Try adjusting your search or filter criteria'
                : 'No FYP groups in your department yet.'
              }
            </p>
          </div>
        )}
      </div>
    </HODLayout>
  );
};

export default HODGroups;

