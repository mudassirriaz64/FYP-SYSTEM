import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Users,
  Award,
  CheckCircle2,
  AlertCircle,
  Filter,
  X,
} from "lucide-react";
import api, { API_BASE } from "../../utils/api";
import EvaluatorLayout from "../../components/layouts/EvaluatorLayout";

const EvaluatorDefenses = () => {
  const [loading, setLoading] = useState(true);
  const [defenses, setDefenses] = useState([]);
  const [filteredDefenses, setFilteredDefenses] = useState([]);
  const [error, setError] = useState("");
  const [selectedDefense, setSelectedDefense] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    fetchDefenses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [defenses, statusFilter, typeFilter]);

  const fetchDefenses = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`${API_BASE}/evaluator/defenses`);

      if (response.ok) {
        const data = await response.json();
        console.log("Defenses API response:", data);
        console.log("Defenses array:", data.defenses);
        console.log("First defense object:", data.defenses && data.defenses[0]);
        console.log(
          "First defense.Defense:",
          data.defenses && data.defenses[0] && data.defenses[0].Defense
        );
        console.log(
          "First defense.Group:",
          data.defenses && data.defenses[0] && data.defenses[0].Group
        );
        const normalized = (data.defenses || []).map((d, idx) => {
          const defenseRaw = d.Defense || d.defense || {};
          const groupRaw = d.Group || d.group || {};
          const roleRaw = d.MyRole || d.myRole || {};
          const evaluatorsRaw = d.OtherEvaluators || d.otherEvaluators || [];

          const defenseObj = {
            ...defenseRaw,
            Id: defenseRaw.Id ?? defenseRaw.id,
            Type: defenseRaw.Type ?? defenseRaw.type,
            Status: defenseRaw.Status ?? defenseRaw.status,
            DateTime: defenseRaw.DateTime ?? defenseRaw.dateTime,
            Venue: defenseRaw.Venue ?? defenseRaw.venue,
            Duration: defenseRaw.Duration ?? defenseRaw.duration,
            Result: defenseRaw.Result ?? defenseRaw.result,
            ResultRemarks: defenseRaw.ResultRemarks ?? defenseRaw.resultRemarks,
          };

          const groupObj = {
            ...groupRaw,
            Id: groupRaw.Id ?? groupRaw.id,
            GroupName: groupRaw.GroupName ?? groupRaw.groupName,
            ProjectTitle: groupRaw.ProjectTitle ?? groupRaw.projectTitle,
            ProjectDescription:
              groupRaw.ProjectDescription ?? groupRaw.projectDescription,
            SupervisorName: groupRaw.SupervisorName ?? groupRaw.supervisorName,
            Members: (groupRaw.Members || groupRaw.members || []).map((m) => ({
              ...m,
              Id: m.Id ?? m.id,
              FullName: m.FullName ?? m.fullName,
              EnrollmentId: m.EnrollmentId ?? m.enrollmentId,
              IsGroupManager: m.IsGroupManager ?? m.isGroupManager,
            })),
          };

          const myRoleObj = {
            ...roleRaw,
            Role: roleRaw.Role ?? roleRaw.role,
            IsExternal: roleRaw.IsExternal ?? roleRaw.isExternal,
            HasSubmittedMarks:
              roleRaw.HasSubmittedMarks ?? roleRaw.hasSubmittedMarks,
          };

          return {
            ...d,
            EvaluationId:
              d.EvaluationId ?? d.evaluationId ?? d.Id ?? d.id ?? idx,
            Defense: defenseObj,
            Group: groupObj,
            MyRole: myRoleObj,
            OtherEvaluators: evaluatorsRaw.map((e) => ({
              ...e,
              FullName: e.FullName ?? e.fullName,
              Designation: e.Designation ?? e.designation,
              Role: e.Role ?? e.role,
              IsExternal: e.IsExternal ?? e.isExternal,
              HasSubmittedMarks: e.HasSubmittedMarks ?? e.hasSubmittedMarks,
            })),
          };
        });

        setDefenses(normalized);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(
          errorData.message || `Failed to load defenses (${response.status})`
        );
        console.error("Defenses API error:", errorData);
      }
    } catch (err) {
      setError("Error loading defenses. Please check if backend is running.");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...defenses];

    if (statusFilter) {
      filtered = filtered.filter(
        (d) => d.Defense && d.Defense.Status === statusFilter
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(
        (d) => d.Defense && d.Defense.Type === typeFilter
      );
    }

    setFilteredDefenses(filtered);
  };

  const clearFilters = () => {
    setStatusFilter("");
    setTypeFilter("");
  };

  const getDefenseTypeLabel = (type) => {
    const labels = {
      Proposal: "Proposal Defense",
      Initial: "Initial Defense",
      MidTerm: "Mid-Term Defense",
      Final: "Final Defense",
    };
    return labels[type] || type;
  };

  const getDefenseTypeColor = (type) => {
    const colors = {
      Proposal: "bg-blue-100 text-blue-700",
      Initial: "bg-green-100 text-green-700",
      MidTerm: "bg-yellow-100 text-yellow-700",
      Final: "bg-purple-100 text-purple-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  const getStatusColor = (status) => {
    const colors = {
      Scheduled: "bg-blue-100 text-blue-800",
      InProgress: "bg-yellow-100 text-yellow-800",
      Completed: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewDetails = (defense) => {
    setSelectedDefense(defense);
    setShowModal(true);
  };

  if (loading) {
    return (
      <EvaluatorLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </EvaluatorLayout>
    );
  }

  return (
    <EvaluatorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Assigned Defenses
            </h1>
            <p className="text-gray-600 mt-1">
              View and manage your defense evaluations
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-purple-600" />
              Filters
            </h2>
            {(statusFilter || typeFilter) && (
              <button
                onClick={clearFilters}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="InProgress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Defense Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Types</option>
                <option value="Proposal">Proposal</option>
                <option value="Initial">Initial</option>
                <option value="MidTerm">Mid-Term</option>
                <option value="Final">Final</option>
              </select>
            </div>
          </div>
        </div>

        {/* Defenses List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {filteredDefenses.length} Defense
              {filteredDefenses.length !== 1 ? "s" : ""}
            </h2>
          </div>

          {filteredDefenses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No defenses found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredDefenses.map((defense, index) => (
                <div
                  key={
                    defense.EvaluationId ||
                    defense.Defense?.Id ||
                    defense.Group?.Id ||
                    index
                  }
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleViewDetails(defense)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        {defense.Defense && defense.Defense.Type && (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getDefenseTypeColor(
                              defense.Defense.Type
                            )}`}
                          >
                            {getDefenseTypeLabel(defense.Defense.Type)}
                          </span>
                        )}
                        {defense.Defense && defense.Defense.Status && (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              defense.Defense.Status
                            )}`}
                          >
                            {defense.Defense.Status}
                          </span>
                        )}
                        {defense.MyRole && defense.MyRole.IsExternal && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                            External Examiner
                          </span>
                        )}
                        {defense.MyRole && defense.MyRole.HasSubmittedMarks && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Marks Submitted
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-gray-900 text-xl mb-2">
                        {(defense.Group && defense.Group.GroupName) || "N/A"}
                      </h3>
                      <p className="text-gray-700 mb-3">
                        {(defense.Group && defense.Group.ProjectTitle) ||
                          "No title"}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {defense.Defense && defense.Defense.DateTime && (
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDateTime(defense.Defense.DateTime)}
                          </div>
                        )}
                        {defense.Defense && defense.Defense.Venue && (
                          <div className="flex items-center text-gray-600">
                            📍 {defense.Defense.Venue}
                          </div>
                        )}
                        {defense.Group && defense.Group.Members && (
                          <div className="flex items-center text-gray-600">
                            <Users className="w-4 h-4 mr-2" />
                            {defense.Group.Members.length} Member
                            {defense.Group.Members.length !== 1 ? "s" : ""}
                          </div>
                        )}
                      </div>

                      {defense.Group && defense.Group.SupervisorName && (
                        <div className="mt-3 text-sm text-gray-600">
                          <span className="font-medium">Supervisor:</span>{" "}
                          {defense.Group.SupervisorName}
                        </div>
                      )}
                    </div>

                    {defense.MyRole &&
                      !defense.MyRole.HasSubmittedMarks &&
                      defense.Defense &&
                      defense.Defense.Status !== "Cancelled" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = "/evaluator/marks";
                          }}
                          className="ml-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                        >
                          <Award className="w-4 h-4 mr-2" />
                          Submit Marks
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Defense Details Modal */}
      {showModal && selectedDefense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Defense Details
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Defense Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Defense Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getDefenseTypeColor(
                        selectedDefense.Defense.Type
                      )}`}
                    >
                      {getDefenseTypeLabel(selectedDefense.Defense.Type)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                        selectedDefense.Defense.Status
                      )}`}
                    >
                      {selectedDefense.Defense.Status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Date & Time:</span>
                    <span className="font-medium">
                      {formatDateTime(selectedDefense.Defense.DateTime)}
                    </span>
                  </div>
                  {selectedDefense.Defense.Venue && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Venue:</span>
                      <span className="font-medium">
                        {selectedDefense.Defense.Venue}
                      </span>
                    </div>
                  )}
                  {selectedDefense.Defense.Duration && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">
                        {selectedDefense.Defense.Duration}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Group Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Project Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div>
                    <span className="text-gray-600 block mb-1">
                      Group Name:
                    </span>
                    <span className="font-medium text-lg">
                      {selectedDefense.Group.GroupName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 block mb-1">
                      Project Title:
                    </span>
                    <span className="font-medium">
                      {selectedDefense.Group.ProjectTitle}
                    </span>
                  </div>
                  {selectedDefense.Group &&
                    selectedDefense.Group.ProjectDescription && (
                      <div>
                        <span className="text-gray-600 block mb-1">
                          Description:
                        </span>
                        <p className="text-gray-700 text-sm">
                          {selectedDefense.Group.ProjectDescription}
                        </p>
                      </div>
                    )}
                  {selectedDefense.Group &&
                    selectedDefense.Group.SupervisorName && (
                      <div>
                        <span className="text-gray-600 block mb-1">
                          Supervisor:
                        </span>
                        <span className="font-medium">
                          {selectedDefense.Group.SupervisorName}
                        </span>
                      </div>
                    )}
                </div>
              </div>

              {/* Members */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Group Members
                </h3>
                <div className="space-y-2">
                  {selectedDefense.Group &&
                    selectedDefense.Group.Members &&
                    selectedDefense.Group.Members.map((member) => (
                    <div
                      key={member.Id}
                      className="bg-gray-50 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.FullName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {member.EnrollmentId}
                        </p>
                      </div>
                      {member.IsGroupManager && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          Group Manager
                        </span>
                      )}
                    </div>
                    ))}
                </div>
              </div>

              {/* Other Evaluators */}
              {selectedDefense.OtherEvaluators &&
                selectedDefense.OtherEvaluators.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Other Evaluators
                    </h3>
                    <div className="space-y-2">
                      {selectedDefense.OtherEvaluators &&
                        selectedDefense.OtherEvaluators.map(
                          (evaluator, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 rounded-lg p-3 flex items-center justify-between"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {evaluator.FullName || "N/A"}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {evaluator.Designation || "N/A"}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {evaluator.IsExternal && (
                                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                                    External
                                  </span>
                                )}
                                {evaluator.HasSubmittedMarks && (
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                )}
                              </div>
                            </div>
                          )
                        )}
                    </div>
                  </div>
                )}

              {/* Notes */}
              {selectedDefense.Defense.Notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Notes
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">
                      {selectedDefense.Defense.Notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </EvaluatorLayout>
  );
};

export default EvaluatorDefenses;
