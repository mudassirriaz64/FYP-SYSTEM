import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Shield, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Eye
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';
import AdminLayout from '../../components/layouts/AdminLayout';

const AdminAuditLogs = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [error, setError] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    actionType: '',
    action: '',
    startDate: '',
    endDate: '',
    success: '',
    search: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [page, filters]);

  // Auto-open log detail when coming from notification
  useEffect(() => {
    if (location.state?.selectedLogId && logs.length > 0) {
      const log = logs.find(l => l.id === location.state.selectedLogId);
      if (log) {
        setSelectedLog(log);
        // Clear the state to prevent reopening on refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, logs]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(filters.actionType && { actionType: filters.actionType }),
        ...(filters.action && { action: filters.action }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.success !== '' && { success: filters.success }),
        ...(filters.search && { search: filters.search })
      });

      const response = await api.get(`${API_BASE}/auditlogs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setTotalCount(data.totalCount || 0);
      } else {
        setError('Failed to load audit logs');
      }
    } catch (err) {
      setError('An error occurred while loading logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get(`${API_BASE}/auditlogs/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load stats');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      actionType: '',
      action: '',
      startDate: '',
      endDate: '',
      success: '',
      search: ''
    });
    setPage(1);
  };

  const getActionTypeColor = (actionType) => {
    const colors = {
      Authentication: 'bg-blue-100 text-blue-800',
      UserManagement: 'bg-purple-100 text-purple-800',
      FormSubmission: 'bg-green-100 text-green-800',
      GroupManagement: 'bg-yellow-100 text-yellow-800',
      SystemConfiguration: 'bg-red-100 text-red-800',
      DataAccess: 'bg-gray-100 text-gray-800'
    };
    return colors[actionType] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Shield className="mr-3 text-indigo-600" size={36} />
              System Audit Logs
            </h1>
            <p className="text-gray-600 mt-1">Monitor and track all system activities</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Filter size={20} />
            <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
          </button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Logs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalLogs}</p>
                </div>
                <Activity className="text-blue-500" size={32} />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Successful</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.successfulActions}</p>
                </div>
                <CheckCircle className="text-green-500" size={32} />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.failedActions}</p>
                </div>
                <XCircle className="text-red-500" size={32} />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Action Types</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.actionTypeCounts?.length || 0}</p>
                </div>
                <TrendingUp className="text-purple-500" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Logs</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Type
                </label>
                <select
                  value={filters.actionType}
                  onChange={(e) => handleFilterChange('actionType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Types</option>
                  <option value="Authentication">Authentication</option>
                  <option value="UserManagement">User Management</option>
                  <option value="FormSubmission">Form Submission</option>
                  <option value="GroupManagement">Group Management</option>
                  <option value="SystemConfiguration">System Configuration</option>
                  <option value="DataAccess">Data Access</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.success}
                  onChange={(e) => handleFilterChange('success', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All</option>
                  <option value="true">Success</option>
                  <option value="false">Failed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Description, IP, action..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Logs Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Timestamp</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Action</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">IP Address</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <span className="ml-3">Loading logs...</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center">
                          <Clock size={14} className="text-gray-400 mr-2" />
                          {formatDate(log.timestamp)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{log.fullName || 'System'}</p>
                          <p className="text-gray-500">{log.userName || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionTypeColor(log.actionType)}`}>
                          {log.actionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {log.success ? (
                          <span className="flex items-center text-green-600">
                            <CheckCircle size={16} className="mr-1" />
                            Success
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600">
                            <XCircle size={16} className="mr-1" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.ipAddress || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-indigo-600 hover:text-indigo-800 flex items-center"
                        >
                          <Eye size={16} className="mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} logs
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Log Details Modal */}
        {selectedLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Audit Log Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Timestamp</p>
                  <p className="font-semibold text-gray-900">{formatDate(selectedLog.timestamp)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold">
                    {selectedLog.success ? (
                      <span className="text-green-600">Success</span>
                    ) : (
                      <span className="text-red-600">Failed</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Action</p>
                  <p className="font-semibold text-gray-900">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Action Type</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getActionTypeColor(selectedLog.actionType)}`}>
                    {selectedLog.actionType}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">User</p>
                  <p className="font-semibold text-gray-900">{selectedLog.fullName || 'System'}</p>
                  <p className="text-sm text-gray-500">{selectedLog.userName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">IP Address</p>
                  <p className="font-semibold text-gray-900">{selectedLog.ipAddress || 'N/A'}</p>
                </div>
              </div>
              
              {selectedLog.description && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Description</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedLog.description}</p>
                </div>
              )}
              
              {selectedLog.errorMessage && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Error Message</p>
                  <p className="text-red-600 bg-red-50 p-3 rounded-lg">{selectedLog.errorMessage}</p>
                </div>
              )}
              
              {selectedLog.details && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Additional Details</p>
                  <pre className="text-xs text-gray-900 bg-gray-50 p-3 rounded-lg overflow-x-auto">
                    {selectedLog.details}
                  </pre>
                </div>
              )}
              
              {selectedLog.userAgent && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">User Agent</p>
                  <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg break-all">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
};

export default AdminAuditLogs;
