import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Send,
  Users,
  Globe,
  Lightbulb,
  Target
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';

const StudentFormC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [groupInfo, setGroupInfo] = useState(null);
  const [hasGroup, setHasGroup] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // UN Sustainable Development Goals
  const sdgGoals = [
    { id: 1, name: 'No Poverty' },
    { id: 2, name: 'Zero Hunger' },
    { id: 3, name: 'Good Health and Wellbeing' },
    { id: 4, name: 'Quality Education' },
    { id: 5, name: 'Gender Equality' },
    { id: 6, name: 'Clean Water and Sanitation' },
    { id: 7, name: 'Affordable and Clean Energy' },
    { id: 8, name: 'Decent Work and Economic Growth' },
    { id: 9, name: 'Industry, Innovation and Infrastructure' },
    { id: 10, name: 'Reduced Inequalities' },
    { id: 11, name: 'Sustainable Cities and Communities' },
    { id: 12, name: 'Responsible Consumption and Production' },
    { id: 13, name: 'Climate Action' },
    { id: 14, name: 'Life Below Water' },
    { id: 15, name: 'Life on Land' },
    { id: 16, name: 'Peace and Justice and Strong Institutions' },
    { id: 17, name: 'Partnerships to Achieve the Goals' }
  ];

  // Complex Problem Solving Attributes
  const problemSolvingAttributes = [
    { id: 1, name: 'Range of conflicting requirements', description: 'Involve wide-ranging or conflicting technical, engineering and other issues.' },
    { id: 2, name: 'Depth of analysis required', description: 'Have no obvious solution and require abstract thinking, originality in analysis to formulate suitable models.' },
    { id: 3, name: 'Depth of knowledge required', description: 'Requires research-based knowledge much of which is at, or informed by, the forefront of the professional discipline.' },
    { id: 4, name: 'Familiarity of issues', description: 'Involve infrequently encountered issues.' },
    { id: 5, name: 'Extent of applicable codes', description: 'Are outside problems encompassed by standards and codes of practice for professional engineering.' },
    { id: 6, name: 'Extent of stakeholder involvement', description: 'Involve diverse groups of stakeholders with widely varying needs.' },
    { id: 7, name: 'Consequences', description: 'Have significant consequences in a range of contexts.' },
    { id: 8, name: 'Interdependence', description: 'Are high level problems including many component parts or sub-problems.' }
  ];

  // Complex Problem Activities Attributes
  const activityAttributes = [
    { id: 1, name: 'Range of resources', description: 'Involve the use of diverse resources (people, money, equipment, materials, information and technologies).' },
    { id: 2, name: 'Level of interaction', description: 'Require resolution of significant problems arising from interactions between wide ranging and conflicting technical, engineering or other issues.' },
    { id: 3, name: 'Innovation', description: 'Involve creative use of engineering principles and research-based knowledge in novel ways.' },
    { id: 4, name: 'Consequences to society and the environment', description: 'Have significant consequences in a range of contexts, characterized by difficulty of prediction and mitigation.' },
    { id: 5, name: 'Familiarity', description: 'Can extend beyond previous experiences by applying principles-based approaches.' }
  ];

  const [formData, setFormData] = useState({
    selectedSDGs: [],
    problemSolvingRatings: {},
    activityRatings: {},
    justification: ''
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const groupResponse = await api.get(`${API_BASE}/student/my-group`);
      if (groupResponse.ok) {
        const groupData = await groupResponse.json();
        setGroupInfo(groupData);
        setHasGroup(true);
      } else {
        setHasGroup(false);
      }

      // Check if already submitted
      const statusResponse = await api.get(`${API_BASE}/student/forms/FormC/status`);
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        const mySubmission = statusData.memberStatuses?.find(m => m.enrollmentId === user.username);
        setHasSubmitted(mySubmission?.isSubmitted || false);
      }
    } catch (err) {
      setError('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const handleSDGToggle = (sdgId) => {
    setFormData(prev => ({
      ...prev,
      selectedSDGs: prev.selectedSDGs.includes(sdgId)
        ? prev.selectedSDGs.filter(id => id !== sdgId)
        : [...prev.selectedSDGs, sdgId]
    }));
  };

  const handleRatingChange = (type, attrId, value) => {
    if (type === 'problem') {
      setFormData(prev => ({
        ...prev,
        problemSolvingRatings: { ...prev.problemSolvingRatings, [attrId]: value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        activityRatings: { ...prev.activityRatings, [attrId]: value }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.selectedSDGs.length === 0) {
      setError('Please select at least one UN Sustainable Development Goal');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const response = await api.post(`${API_BASE}/student/forms/FormC/submit`, {
        fullName: user.fullName || '',
        enrollmentNumber: user.username || '',
        additionalData: JSON.stringify(formData)
      });
      
      const data = await response.json();

      if (response.ok) {
        setSuccess('Form-C submitted successfully!');
        setHasSubmitted(true);
      } else {
        setError(data.message || 'Failed to submit form');
      }
    } catch (err) {
      setError('Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!hasGroup) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => navigate('/student/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <Users className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-amber-800 mb-2">Group Required</h2>
          <p className="text-amber-700 mb-4">You need to be part of a group before filling Form-C.</p>
        </div>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => navigate('/student/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-green-800 mb-2">Form-C Submitted</h2>
          <p className="text-green-600">Your Form-C has been submitted successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Back Button */}
      <button onClick={() => navigate('/student/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="bg-emerald-900 text-white rounded-t-2xl p-6 text-center">
        <h1 className="text-3xl font-bold mb-2">FORM-C</h1>
        <p className="text-emerald-200">UN SDGs & Complex Problem Analysis</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-b-2xl shadow-lg border border-gray-200 -mt-6">
        {error && (
          <div className="m-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="m-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          {/* Section 1: UN SDGs */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <Globe className="h-6 w-6 text-emerald-600" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">United Nations Sustainable Development Goals</h2>
                <p className="text-sm text-gray-500">Select the relevant SDGs pertaining to your project</p>
              </div>
            </div>
            
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
              <p>The Sustainable Development Goals (SDGs) encompass crucial aspects outlined by the United Nations to foster a better and sustainable future for everyone. These goals address global challenges we encounter.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sdgGoals.map(sdg => (
                <label
                  key={sdg.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.selectedSDGs.includes(sdg.id)
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedSDGs.includes(sdg.id)}
                    onChange={() => handleSDGToggle(sdg.id)}
                    className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                  />
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-emerald-600 text-white rounded text-xs flex items-center justify-center font-bold">
                      {sdg.id}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{sdg.name}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 2: Complex Problem Solving */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <Lightbulb className="h-6 w-6 text-amber-600" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Range of Complex Problem Solving</h2>
                <p className="text-sm text-gray-500">Rate how your project addresses each attribute</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Attribute</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Complex Problem</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Applicable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {problemSolvingAttributes.map(attr => (
                    <tr key={attr.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{attr.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{attr.name}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{attr.description}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.problemSolvingRatings[attr.id] || false}
                          onChange={(e) => handleRatingChange('problem', attr.id, e.target.checked)}
                          className="w-5 h-5 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Complex Problem Activities */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <Target className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Range of Complex Problem Activities</h2>
                <p className="text-sm text-gray-500">Rate how your project activities address each attribute</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Attribute</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Complex Activities</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Applicable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activityAttributes.map(attr => (
                    <tr key={attr.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{attr.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{attr.name}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{attr.description}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={formData.activityRatings[attr.id] || false}
                          onChange={(e) => handleRatingChange('activity', attr.id, e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Justification */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Justification (Optional)
            </label>
            <textarea
              value={formData.justification}
              onChange={(e) => setFormData(prev => ({ ...prev, justification: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Briefly explain how your project relates to the selected SDGs and complex problem attributes..."
            />
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Submit Form-C
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentFormC;

