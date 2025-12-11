import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Calendar,
  Users,
  FileCheck
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';

const StudentForms = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [availableForms, setAvailableForms] = useState([]);
  const [hasGroup, setHasGroup] = useState(false);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_BASE}/student/dashboard`);
      
      if (response.ok) {
        const data = await response.json();
        setAvailableForms(data.pendingForms || []);
        setHasGroup(data.hasGroup);
      } else {
        const errData = await response.json();
        setError(errData.message || 'Failed to load forms');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const getFormDescription = (formType) => {
    const descriptions = {
      FormA: 'Project registration form with student details, group information, and project overview.',
      FormB: 'Supervisor selection form to request and confirm your project supervisor.'
    };
    return descriptions[formType] || 'Form submission required';
  };

  const getFormIcon = (formType, isSubmitted) => {
    if (isSubmitted) {
      return <CheckCircle2 className="h-6 w-6 text-green-600" />;
    }
    return <FileText className="h-6 w-6 text-indigo-600" />;
  };

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
        <p className="text-gray-500 mt-1">View and submit required FYP forms</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* No Group Warning */}
      {!hasGroup && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Users className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800">Group Required</h3>
              <p className="text-amber-700 text-sm mt-1">
                You need to be part of a group before you can submit forms. 
                Create a group or accept an invitation first.
              </p>
              <button
                onClick={() => navigate('/student/my-group')}
                className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
              >
                Go to My Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Available Forms */}
      {availableForms.filter(f => f.formType === 'FormA' || f.formType === 'FormB').length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Available Forms</h2>
          {availableForms.filter(f => f.formType === 'FormA' || f.formType === 'FormB').map((form, index) => (
            <div 
              key={index}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all
                ${form.isSubmitted ? 'border-green-200' : 'border-gray-100 hover:shadow-md cursor-pointer'}
              `}
              onClick={() => !form.isSubmitted && hasGroup && navigate(`/student/forms/${form.formType}`)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${form.isSubmitted ? 'bg-green-100' : 'bg-indigo-100'}`}>
                      {getFormIcon(form.formType, form.isSubmitted)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{form.formName}</h3>
                      <p className="text-gray-500 text-sm mt-1 max-w-lg">
                        {getFormDescription(form.formType)}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-500">
                            Deadline: {new Date(form.deadline).toLocaleDateString()}
                          </span>
                        </div>
                        <div className={`flex items-center gap-1 text-sm ${
                          form.daysRemaining <= 1 ? 'text-red-600' : 
                          form.daysRemaining <= 3 ? 'text-amber-600' : 'text-gray-500'
                        }`}>
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">{form.daysRemaining} days remaining</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {form.isSubmitted ? (
                      <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Submitted
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          hasGroup && navigate(`/student/forms/${form.formType}`);
                        }}
                        disabled={!hasGroup}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        Fill Form
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {/* Progress Bar */}
              {!form.isSubmitted && (
                <div className="px-5 pb-4">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        form.daysRemaining <= 1 ? 'bg-red-500' : 
                        form.daysRemaining <= 3 ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.max(100 - (form.daysRemaining / 14) * 100, 10)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileCheck className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Forms Available</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            There are currently no forms available for submission. 
            You will be notified when the coordinator releases a new form.
          </p>
        </div>
      )}

      {/* Form Types Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Form Types Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <span className="font-medium text-gray-900">Form-A</span>
            </div>
            <p className="text-sm text-gray-600">
              Project registration with student details and group information
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-gray-900">Form-B</span>
            </div>
            <p className="text-sm text-gray-600">
              Supervisor selection and confirmation - submitted after Form-A approval
            </p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Form-D (Supervisor Endorsement) will be submitted by your supervisor within 7 days after accepting your supervision request. You don't need to fill this form.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentForms;

