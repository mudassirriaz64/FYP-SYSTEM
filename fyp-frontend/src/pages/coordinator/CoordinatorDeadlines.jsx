import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Rocket,
  Bell,
  BookOpen,
  FileCode,
  FilePen,
  FileCheck,
  GraduationCap,
  ClipboardList,
  Presentation
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';
import CoordinatorLayout from '../../components/layouts/CoordinatorLayout';

const CoordinatorDeadlines = () => {
  const [loading, setLoading] = useState(true);
  const [releases, setReleases] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    formType: 'FormA',
    daysAvailable: 7,
    title: '',
    message: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`${API_BASE}/notifications?type=FormRelease`);
      if (response.ok) {
        const data = await response.json();
        setReleases(data.notifications || []);
      } else {
        let errorMessage = 'Failed to load form releases';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseErr) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error fetching releases:', err);
      setError(err.message || 'Failed to load data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const selectedForm = formTypes.find(f => f.value === formData.formType);

      const response = await api.post(`${API_BASE}/notifications/release-form`, {
        formType: formData.formType,
        daysAvailable: formData.daysAvailable,
        title: formData.title || `${selectedForm?.label} - Submission Open`,
        message: formData.message || `Please complete and submit ${selectedForm?.label} within ${formData.daysAvailable} days.`,
        priority: 'High'
      });
      
      if (response.ok) {
        setSuccess(`${selectedForm?.label} has been released! Students will be notified.`);
        setShowModal(false);
        resetForm();
        fetchData();
      } else {
        let errorMessage = 'Failed to release form';
        try {
          const data = await response.json();
          errorMessage = data.message || errorMessage;
          console.error('Release form error:', data);
        } catch (parseErr) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error releasing form:', err);
      setError(err.message || 'Failed to release form. Please check your connection and try again.');
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Are you sure you want to deactivate this release? Students will no longer be able to submit.')) return;
    
    try {
      const response = await api.put(`${API_BASE}/notifications/${id}`, { isActive: false });
      if (response.ok) {
        setSuccess('Release deactivated!');
        fetchData();
      }
    } catch (err) {
      setError('Failed to deactivate');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this release record?')) return;
    
    try {
      const response = await api.delete(`${API_BASE}/notifications/${id}`);
      if (response.ok) {
        setSuccess('Release deleted!');
        fetchData();
      }
    } catch (err) {
      setError('Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      formType: 'FormA',
      daysAvailable: 7,
      title: '',
      message: ''
    });
  };

  const getStatus = (release) => {
    const now = new Date();
    const deadline = new Date(release.formDeadline);
    const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    
    if (!release.isActive) return { label: 'Inactive', color: 'gray', daysLeft: 0 };
    if (daysLeft < 0) return { label: 'Expired', color: 'red', daysLeft };
    if (daysLeft <= 2) return { label: 'Ending Soon', color: 'amber', daysLeft };
    return { label: 'Active', color: 'green', daysLeft };
  };

  // Comprehensive form types for real FYP system
  const formTypes = [
    // Project Registration & Proposal (Student fills)
    { value: 'FormA', label: 'Form-A', description: 'Student Info & Group Registration', category: 'Proposal', icon: FileText, color: 'indigo' },
    { value: 'FormB', label: 'Form-B', description: 'Project Details, Methodology & Supervisor Selection', category: 'Proposal', icon: FilePen, color: 'purple' },
    
    // Note: Form-D is automatically submitted by supervisor within 7 days after accepting supervision request
    
    // Documentation
    { value: 'SRS', label: 'SRS', description: 'Software Requirement Specification', category: 'Documentation', icon: FileCode, color: 'blue' },
    { value: 'SDS', label: 'SDS', description: 'System Design Specification', category: 'Documentation', icon: FileCode, color: 'cyan' },
    
    // Progress Reports
    { value: 'MonthlyReport', label: 'Monthly Log', description: 'Monthly Progress Report', category: 'Reports', icon: ClipboardList, color: 'teal' },
    { value: 'MidTermReport', label: 'Mid-Term Report', description: 'Mid-Semester Progress Report', category: 'Reports', icon: FileText, color: 'sky' },
    
    // Final Submissions
    { value: 'FinalReport', label: 'Final Report', description: 'Project Final Report', category: 'Final', icon: BookOpen, color: 'orange' },
    { value: 'Thesis', label: 'Final Thesis', description: 'Complete Thesis Document', category: 'Final', icon: GraduationCap, color: 'rose' },
    
    // Additional Documents
    { value: 'PlagiarismReport', label: 'Plagiarism Report', description: 'Turnitin/Plagiarism Check', category: 'Additional', icon: FileCheck, color: 'red' },
    { value: 'PosterPresentation', label: 'Poster', description: 'Project Poster for Exhibition', category: 'Additional', icon: Presentation, color: 'pink' },
    { value: 'DemoVideo', label: 'Demo Video', description: 'Project Demonstration Video', category: 'Additional', icon: Presentation, color: 'violet' },
    { value: 'SourceCode', label: 'Source Code', description: 'Project Source Code Submission', category: 'Additional', icon: FileCode, color: 'gray' },
  ];

  const categories = ['Proposal', 'Documentation', 'Reports', 'Final', 'Additional'];

  const activeReleases = releases.filter(r => r.isActive && new Date(r.formDeadline) > new Date());
  const expiredReleases = releases.filter(r => !r.isActive || new Date(r.formDeadline) <= new Date());

  const getFormInfo = (formType) => formTypes.find(f => f.value === formType) || { label: formType, color: 'gray' };

  const getColorClasses = (color) => {
    const colors = {
      indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      teal: 'bg-teal-100 text-teal-700 border-teal-200',
      emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      rose: 'bg-rose-100 text-rose-700 border-rose-200',
      amber: 'bg-amber-100 text-amber-700 border-amber-200',
      red: 'bg-red-100 text-red-700 border-red-200',
      pink: 'bg-pink-100 text-pink-700 border-pink-200',
      violet: 'bg-violet-100 text-violet-700 border-violet-200',
      gray: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[color] || colors.gray;
  };

  return (
    <CoordinatorLayout>
      <div className="space-y-6 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Form Releases</h1>
            <p className="text-gray-500 mt-1">Release forms to students and set submission deadlines</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Rocket className="h-5 w-5" />
            Release New Form
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
            <button onClick={() => setError('')}><X className="h-4 w-4 text-red-600" /></button>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p className="text-green-700">{success}</p>
            </div>
            <button onClick={() => setSuccess('')}><X className="h-4 w-4 text-green-600" /></button>
          </div>
        )}

        {/* Active Releases */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Active Releases ({activeReleases.length})
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
            </div>
          ) : activeReleases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeReleases.map(release => {
                const status = getStatus(release);
                const formInfo = getFormInfo(release.relatedFormType);
                const Icon = formInfo.icon || FileText;
                
                return (
                  <div 
                    key={release.id} 
                    className={`bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow
                      ${status.color === 'amber' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-green-500'}
                    `}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 ${getColorClasses(formInfo.color)}`}>
                        <Icon className="h-4 w-4" />
                        {formInfo.label}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${status.color === 'green' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}
                      `}>
                        {status.daysLeft} days left
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{release.title}</h3>
                    <p className="text-sm text-gray-500 mb-3">{formInfo.description}</p>
                    
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>Due: {new Date(release.formDeadline).toLocaleDateString()}</span>
                    </div>

                    {release.message && (
                      <p className="text-xs text-gray-500 mb-4 line-clamp-2 bg-gray-50 p-2 rounded">
                        {release.message}
                      </p>
                    )}
                    
                    <button
                      onClick={() => handleDeactivate(release.id)}
                      className="w-full px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors"
                    >
                      Deactivate Release
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <Rocket className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No active form releases</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
              >
                Release First Form
              </button>
            </div>
          )}
        </div>

        {/* Past Releases */}
        {expiredReleases.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              Past Releases ({expiredReleases.length})
            </h2>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Form</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Released</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Deadline</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expiredReleases.map(release => {
                      const status = getStatus(release);
                      const formInfo = getFormInfo(release.relatedFormType);
                      
                      return (
                        <tr key={release.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getColorClasses(formInfo.color)}`}>
                              {formInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{release.title}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {release.formAvailableFrom && new Date(release.formAvailableFrom).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {release.formDeadline && new Date(release.formDeadline).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDelete(release.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Release Form Modal - Fixed scrolling */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="sticky top-0 bg-white rounded-t-2xl p-5 border-b flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                  <Rocket className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Release Form to Students</h3>
                  <p className="text-sm text-gray-500">Students will be notified immediately</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Form Type Selection - Categorized */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Form to Release</label>
                
                {categories.map(category => {
                  const categoryForms = formTypes.filter(f => f.category === category);
                  return (
                    <div key={category} className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{category}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {categoryForms.map(type => {
                          const Icon = type.icon;
                          const isSelected = formData.formType === type.value;
                          return (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => setFormData({...formData, formType: type.value})}
                              className={`p-3 rounded-xl border-2 text-left transition-all ${
                                isSelected 
                                  ? 'border-teal-500 bg-teal-50' 
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Icon className={`h-4 w-4 ${isSelected ? 'text-teal-600' : 'text-gray-400'}`} />
                                <span className={`font-semibold text-sm ${isSelected ? 'text-teal-700' : 'text-gray-900'}`}>
                                  {type.label}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-1">{type.description}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Deadline Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Submission Deadline</label>
                <select
                  value={formData.daysAvailable}
                  onChange={(e) => setFormData({...formData, daysAvailable: parseInt(e.target.value)})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                >
                  <option value={3}>3 days</option>
                  <option value={5}>5 days</option>
                  <option value={7}>1 week</option>
                  <option value={10}>10 days</option>
                  <option value={14}>2 weeks</option>
                  <option value={21}>3 weeks</option>
                  <option value={30}>1 month</option>
                  <option value={45}>45 days</option>
                  <option value={60}>2 months</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Deadline: {new Date(Date.now() + formData.daysAvailable * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              
              {/* Custom Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Title <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder={`${formTypes.find(f => f.value === formData.formType)?.label} - Submission Open`}
                />
              </div>
              
              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Students <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                  rows={3}
                  placeholder="Add instructions or notes for students..."
                />
              </div>
              
              {/* Info Box */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-start gap-3">
                <Bell className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-teal-800">
                  <p className="font-medium">What happens next?</p>
                  <ul className="mt-1 text-teal-700 space-y-0.5 text-xs">
                    <li>• Students will receive a notification</li>
                    <li>• Form will appear on their dashboard</li>
                    <li>• Submission closes automatically on deadline</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 font-medium"
                >
                  <Rocket className="h-4 w-4" />
                  Release Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CoordinatorLayout>
  );
};

export default CoordinatorDeadlines;
