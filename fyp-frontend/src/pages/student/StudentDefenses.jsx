import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertCircle,
  Award,
  FileText,
  ChevronRight,
  Bell
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';

const StudentDefenses = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [defenses, setDefenses] = useState([]);
  const [groupStatus, setGroupStatus] = useState(null);

  useEffect(() => {
    fetchDefenses();
  }, []);

  const fetchDefenses = async () => {
    try {
      setLoading(true);

      // Fetch student's defenses
      const response = await api.get(`${API_BASE}/student/defenses`);
      if (response.ok) {
        const data = await response.json();
        setDefenses(data.defenses || []);
        setGroupStatus(data.groupStatus);
      } else {
        // Try to get group info for status
        const dashResponse = await api.get(`${API_BASE}/student/dashboard`);
        if (dashResponse.ok) {
          const dashData = await dashResponse.json();
          setGroupStatus(dashData.currentGroup?.status);
        }
      }
    } catch (err) {
      setError('Failed to load defense schedule');
    } finally {
      setLoading(false);
    }
  };

  const getResultIcon = (result) => {
    switch (result) {
      case 'Accepted':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case 'Deferred':
        return <RotateCcw className="h-6 w-6 text-amber-600" />;
      case 'Rejected':
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Clock className="h-6 w-6 text-blue-600" />;
    }
  };

  const getResultBadge = (result, defense) => {
    if (!result) {
      const defenseDate = new Date(defense.dateTime);
      const now = new Date();
      if (defenseDate > now) {
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            Upcoming
          </span>
        );
      } else {
        return (
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
            Awaiting Results
          </span>
        );
      }
    }

    const styles = {
      Accepted: 'bg-green-100 text-green-700',
      Deferred: 'bg-amber-100 text-amber-700',
      Rejected: 'bg-red-100 text-red-700'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[result]}`}>
        {result}
      </span>
    );
  };

  const getDefenseTypeName = (type) => {
    const types = {
      Proposal: 'Proposal Defense',
      MidTerm: 'Mid-Term Defense',
      Final: 'Final Defense'
    };
    return types[type] || type;
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
        <h1 className="text-2xl font-bold text-gray-900">Defense Schedule & Results</h1>
        <p className="text-gray-500 mt-1">View your scheduled defenses and results</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Group Status Banner */}
      {groupStatus && (groupStatus === 'Deferred' || groupStatus === 'Rejected') && (
        <div className={`rounded-xl p-5 ${groupStatus === 'Deferred' ? 'bg-amber-50 border border-amber-200' :
            'bg-red-50 border border-red-200'
          }`}>
          <div className="flex items-start gap-4">
            {groupStatus === 'Deferred' ? (
              <RotateCcw className="h-6 w-6 text-amber-600 flex-shrink-0" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
            )}
            <div>
              <h3 className={`font-semibold ${groupStatus === 'Deferred' ? 'text-amber-800' : 'text-red-800'
                }`}>
                {groupStatus === 'Deferred'
                  ? 'Proposal Deferred - Resubmission Required'
                  : 'Proposal Needs Major Revision'
                }
              </h3>
              <p className={`mt-1 text-sm ${groupStatus === 'Deferred' ? 'text-amber-700' : 'text-red-700'
                }`}>
                {groupStatus === 'Deferred'
                  ? 'Your proposal has been deferred. Please review the feedback and resubmit your proposal form.'
                  : 'Your proposal requires significant changes. Please review the feedback carefully and make necessary revisions.'
                }
              </p>
              <button
                onClick={() => navigate('/student/forms')}
                className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium ${groupStatus === 'Deferred'
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
              >
                Go to Forms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Defense List */}
      {defenses.length > 0 ? (
        <div className="space-y-4">
          {defenses.map((defense) => {
            const defenseDate = new Date(defense.dateTime);
            const isPast = defenseDate < new Date();
            const hasResult = !!defense.result;

            return (
              <div
                key={defense.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden
                  ${hasResult && defense.result === 'Accepted' ? 'border-l-4 border-l-green-500' :
                    hasResult && defense.result === 'Deferred' ? 'border-l-4 border-l-amber-500' :
                      hasResult && defense.result === 'Rejected' ? 'border-l-4 border-l-red-500' :
                        isPast ? 'border-l-4 border-l-purple-500' :
                          'border-l-4 border-l-blue-500'}
                `}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${hasResult && defense.result === 'Accepted' ? 'bg-green-100' :
                          hasResult && defense.result === 'Deferred' ? 'bg-amber-100' :
                            hasResult && defense.result === 'Rejected' ? 'bg-red-100' :
                              isPast ? 'bg-purple-100' : 'bg-blue-100'
                        }`}>
                        {getResultIcon(defense.result)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {getDefenseTypeName(defense.type)}
                          </h3>
                          {getResultBadge(defense.result, defense)}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {defenseDate.toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {defenseDate.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {defense.venue && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {defense.venue}
                            </span>
                          )}
                        </div>

                        {/* Evaluators */}
                        {defense.internalEvaluators?.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-1">Evaluation Panel</p>
                            <div className="flex flex-wrap gap-2">
                              {defense.internalEvaluators.map((evaluator, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                >
                                  {evaluator.fullName}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Result Banner */}
                  {hasResult && (
                    <div className={`mt-4 p-4 rounded-lg ${defense.result === 'Accepted' ? 'bg-green-50 border border-green-200' :
                        defense.result === 'Deferred' ? 'bg-amber-50 border border-amber-200' :
                          'bg-red-50 border border-red-200'
                      }`}>
                      <div className="flex items-start gap-3">
                        {defense.result === 'Accepted' && <Award className="h-5 w-5 text-green-600 flex-shrink-0" />}
                        {defense.result === 'Deferred' && <RotateCcw className="h-5 w-5 text-amber-600 flex-shrink-0" />}
                        {defense.result === 'Rejected' && <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />}

                        <div>
                          <p className={`font-medium ${defense.result === 'Accepted' ? 'text-green-800' :
                              defense.result === 'Deferred' ? 'text-amber-800' : 'text-red-800'
                            }`}>
                            {defense.result === 'Accepted' && 'Congratulations! Your proposal has been accepted.'}
                            {defense.result === 'Deferred' && 'Your proposal has been deferred. Please revise and resubmit.'}
                            {defense.result === 'Rejected' && 'Your proposal requires major revision.'}
                          </p>
                          {defense.resultRemarks && (
                            <div className="mt-2 p-3 bg-white rounded border">
                              <p className="text-xs text-gray-500 mb-1">Feedback</p>
                              <p className="text-sm text-gray-700">{defense.resultRemarks}</p>
                            </div>
                          )}

                          {defense.result === 'Deferred' && (
                            <button
                              onClick={() => navigate('/student/forms')}
                              className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 flex items-center gap-1"
                            >
                              <FileText className="h-4 w-4" />
                              Resubmit Proposal
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upcoming Defense Info */}
                  {!isPast && !hasResult && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800">
                        <Bell className="h-5 w-5" />
                        <span className="font-medium">
                          Defense scheduled in {Math.ceil((defenseDate - new Date()) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-blue-700">
                        Please ensure all group members are prepared for the presentation.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Defenses Scheduled</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            You don't have any defense sessions scheduled yet.
            The coordinator will notify you when your defense is scheduled.
          </p>
        </div>
      )}

      {/* Defense Tips */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Defense Preparation Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-indigo-50 rounded-lg">
            <h4 className="font-medium text-indigo-900 mb-1">Proposal Defense</h4>
            <p className="text-sm text-indigo-700">
              Present your project idea, objectives, methodology, and expected outcomes clearly.
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-1">Mid-Term Defense</h4>
            <p className="text-sm text-purple-700">
              Demonstrate 50-60% progress with working prototypes or implementations.
            </p>
          </div>
          <div className="p-4 bg-teal-50 rounded-lg">
            <h4 className="font-medium text-teal-900 mb-1">Final Defense</h4>
            <p className="text-sm text-teal-700">
              Showcase your complete project with all features and documentation.
            </p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <h4 className="font-medium text-amber-900 mb-1">General Tips</h4>
            <p className="text-sm text-amber-700">
              Practice your presentation, prepare for Q&A, and arrive early.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDefenses;

