import { useState, useEffect } from 'react';
import { 
  BarChart2,
  Download,
  Users,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Award,
  TrendingUp,
  FileText,
  Calendar
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';
import HODLayout from '../../components/layouts/HODLayout';

const HODReports = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_BASE}/hod/reports?period=${selectedPeriod}`);
      
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        // Use default data structure
        setReportData({
          departmentName: 'Computer Science',
          period: selectedPeriod,
          summary: {
            totalGroups: 0,
            activeGroups: 0,
            completedGroups: 0,
            totalStudents: 0,
            totalSupervisors: 0
          },
          performance: {
            averageGrade: 'N/A',
            passRate: 0,
            onTimeCompletion: 0
          },
          escalations: {
            total: 0,
            resolved: 0,
            pending: 0
          },
          budgets: {
            totalRequested: 0,
            totalApproved: 0,
            totalDisbursed: 0
          }
        });
      }
    } catch (err) {
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // In a real implementation, this would trigger a PDF/Excel export
    alert('Report export feature - would generate PDF/Excel report');
  };

  if (loading) {
    return (
      <HODLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
        </div>
      </HODLayout>
    );
  }

  return (
    <HODLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Department Reports</h1>
            <p className="text-gray-500 mt-1">{reportData?.departmentName} - Analytics & Statistics</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            >
              <option value="current">Current Semester</option>
              <option value="previous">Previous Semester</option>
              <option value="year">Academic Year</option>
              <option value="all">All Time</option>
            </select>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{reportData?.summary?.totalGroups || 0}</p>
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
                <p className="text-2xl font-bold text-green-600">{reportData?.summary?.activeGroups || 0}</p>
                <p className="text-xs text-gray-500">Active Groups</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{reportData?.summary?.completedGroups || 0}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{reportData?.summary?.totalStudents || 0}</p>
                <p className="text-xs text-gray-500">Students</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-lg">
                <Users className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-rose-600">{reportData?.summary?.totalSupervisors || 0}</p>
                <p className="text-xs text-gray-500">Supervisors</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Reports Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Performance Metrics</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Average Grade</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData?.performance?.averageGrade || 'N/A'}</p>
                </div>
                <Award className="h-8 w-8 text-green-500" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Pass Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData?.performance?.passRate || 0}%</p>
                </div>
                <div className="h-12 w-12">
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="3"
                      strokeDasharray={`${reportData?.performance?.passRate || 0}, 100`}
                    />
                  </svg>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">On-Time Completion</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData?.performance?.onTimeCompletion || 0}%</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Escalations Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Escalations Summary</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Total Escalations</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData?.escalations?.total || 0}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-gray-400" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">Resolved</p>
                  <p className="text-xl font-bold text-green-700">{reportData?.escalations?.resolved || 0}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-600">Pending</p>
                  <p className="text-xl font-bold text-amber-700">{reportData?.escalations?.pending || 0}</p>
                </div>
              </div>
              
              {(reportData?.escalations?.total || 0) > 0 && (
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ 
                      width: `${((reportData?.escalations?.resolved || 0) / (reportData?.escalations?.total || 1)) * 100}%` 
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Budget Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Budget Summary</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-blue-600">Total Requested</p>
                  <p className="text-xl font-bold text-blue-700">
                    PKR {(reportData?.budgets?.totalRequested || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-green-600">Total Approved</p>
                  <p className="text-xl font-bold text-green-700">
                    PKR {(reportData?.budgets?.totalApproved || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm text-purple-600">Total Disbursed</p>
                  <p className="text-xl font-bold text-purple-700">
                    PKR {(reportData?.budgets?.totalDisbursed || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-100 rounded-lg">
                <FileText className="h-5 w-5 text-rose-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Generate Reports</h2>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={handleExport}
                className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Group Progress Report</span>
                </div>
                <Download className="h-4 w-4 text-gray-400" />
              </button>
              
              <button 
                onClick={handleExport}
                className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Grade Distribution Report</span>
                </div>
                <Download className="h-4 w-4 text-gray-400" />
              </button>
              
              <button 
                onClick={handleExport}
                className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Budget Utilization Report</span>
                </div>
                <Download className="h-4 w-4 text-gray-400" />
              </button>
              
              <button 
                onClick={handleExport}
                className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Escalation Report</span>
                </div>
                <Download className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </HODLayout>
  );
};

export default HODReports;

