import { useState, useEffect } from "react";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Save,
  Edit,
  Eye,
} from "lucide-react";
import api, { API_BASE } from "../../utils/api";
import EvaluatorLayout from "../../components/layouts/EvaluatorLayout";

const EvaluatorMarks = () => {
  const [loading, setLoading] = useState(true);
  const [defenses, setDefenses] = useState([]);
  const [selectedDefense, setSelectedDefense] = useState(null);
  const [showMarkingForm, setShowMarkingForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [marks, setMarks] = useState({
    presentationMarks: "",
    technicalMarks: "",
    documentationMarks: "",
    qaMarks: "",
    comments: "",
    feedback: "",
  });

  const [existingMarks, setExistingMarks] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchDefenses();
  }, []);

  const fetchDefenses = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`${API_BASE}/evaluator/defenses`);

      if (response.ok) {
        const data = await response.json();
        const normalized = (data.defenses || []).map((d, idx) => {
          const defenseRaw = d.Defense || d.defense || {};
          const groupRaw = d.Group || d.group || {};
          const roleRaw = d.MyRole || d.myRole || {};

          const defenseObj = {
            ...defenseRaw,
            Id: defenseRaw.Id ?? defenseRaw.id,
            Type: defenseRaw.Type ?? defenseRaw.type,
            Status: defenseRaw.Status ?? defenseRaw.status,
            DateTime: defenseRaw.DateTime ?? defenseRaw.dateTime,
            Venue: defenseRaw.Venue ?? defenseRaw.venue,
            Duration: defenseRaw.Duration ?? defenseRaw.duration,
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
            DefenseId: d.DefenseId ?? d.defenseId ?? defenseRaw.Id ?? idx,
            EvaluationId:
              d.EvaluationId ?? d.evaluationId ?? d.Id ?? d.id ?? idx,
            Defense: defenseObj,
            Group: groupObj,
            MyRole: myRoleObj,
          };
        });

        // Keep evaluatable statuses only
        const validDefenses = normalized.filter(
          (d) =>
            d &&
            d.Defense &&
            d.Defense.Status &&
            (d.Defense.Status === "Completed" ||
              d.Defense.Status === "InProgress" ||
              d.Defense.Status === "Scheduled")
        );
        setDefenses(validDefenses);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || "Failed to load defenses");
      }
    } catch (err) {
      setError("Error loading defenses");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDefense = async (defense) => {
    setSelectedDefense(defense);
    setError("");
    setSuccess("");

    // Check if marks already submitted
    if (defense.MyRole && defense.MyRole.HasSubmittedMarks) {
      await fetchExistingMarks(defense.DefenseId);
      setIsEditing(false);
    } else {
      setExistingMarks(null);
      setIsEditing(false);
      resetForm();
    }

    setShowMarkingForm(true);
  };

  const fetchExistingMarks = async (defenseId) => {
    try {
      const response = await api.get(
        `${API_BASE}/evaluator/defenses/${defenseId}/marks`
      );
      if (response.ok) {
        const data = await response.json();
        const myMarks = data.marks.find((m) => m.IsMySubmission);
        if (myMarks) {
          setExistingMarks(myMarks);
          setMarks({
            presentationMarks: myMarks.PresentationMarks || "",
            technicalMarks: myMarks.TechnicalMarks || "",
            documentationMarks: myMarks.DocumentationMarks || "",
            qaMarks: myMarks.QAMarks || "",
            comments: myMarks.Comments || "",
            feedback: myMarks.Feedback || "",
          });
        }
      }
    } catch (err) {
      console.error("Error fetching marks:", err);
    }
  };

  const resetForm = () => {
    setMarks({
      presentationMarks: "",
      technicalMarks: "",
      documentationMarks: "",
      qaMarks: "",
      comments: "",
      feedback: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMarks((prev) => ({ ...prev, [name]: value }));
  };

  const calculateTotal = () => {
    const presentation = parseFloat(marks.presentationMarks) || 0;
    const technical = parseFloat(marks.technicalMarks) || 0;
    const documentation = parseFloat(marks.documentationMarks) || 0;
    const qa = parseFloat(marks.qaMarks) || 0;
    return presentation + technical + documentation + qa;
  };

  const getMaxMarks = (defenseType) => {
    const maxMarks = {
      Initial: 15,
      MidTerm: 15,
      Final: 30,
    };
    return maxMarks[defenseType] || 100;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const payload = {
        presentationMarks: parseFloat(marks.presentationMarks) || null,
        technicalMarks: parseFloat(marks.technicalMarks) || null,
        documentationMarks: parseFloat(marks.documentationMarks) || null,
        qaMarks: parseFloat(marks.qaMarks) || null,
        comments: marks.comments || null,
        feedback: marks.feedback || null,
      };

      const maxMarks = getMaxMarks(selectedDefense.Defense.Type);
      const total = calculateTotal();

      if (total > maxMarks) {
        setError(`Total marks (${total}) cannot exceed ${maxMarks}`);
        setSubmitting(false);
        return;
      }

      let response;
      if (existingMarks) {
        // Update existing marks
        response = await api.put(
          `${API_BASE}/evaluator/defenses/${selectedDefense.DefenseId}/marks`,
          payload
        );
      } else {
        // Submit new marks
        response = await api.post(
          `${API_BASE}/evaluator/defenses/${selectedDefense.DefenseId}/marks`,
          payload
        );
      }

      if (response.ok) {
        setSuccess(
          existingMarks
            ? "Marks updated successfully!"
            : "Marks submitted successfully!"
        );
        setIsEditing(false);
        await fetchDefenses();
        await fetchExistingMarks(selectedDefense.DefenseId);

        // Update selectedDefense to reflect new status
        const updatedDefense = defenses.find(
          (d) => d.DefenseId === selectedDefense.DefenseId
        );
        if (updatedDefense) {
          updatedDefense.MyRole.HasSubmittedMarks = true;
          setSelectedDefense(updatedDefense);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to submit marks");
      }
    } catch (err) {
      setError("Error submitting marks");
      console.error("Submit error:", err);
    } finally {
      setSubmitting(false);
    }
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Submit Evaluation Marks
          </h1>
          <p className="text-gray-600 mt-1">
            Select a defense to submit or update evaluation marks
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Defenses List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <h2 className="font-semibold">Select Defense</h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {defenses.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No defenses available</p>
                  </div>
                ) : (
                  defenses.map((defense, index) => (
                    <button
                      key={
                        defense.EvaluationId ||
                        defense.DefenseId ||
                        defense.Defense?.Id ||
                        defense.Group?.Id ||
                        index
                      }
                      onClick={() => handleSelectDefense(defense)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                        selectedDefense?.DefenseId === defense.DefenseId
                          ? "bg-purple-50"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {(defense.Group && defense.Group.GroupName) || "N/A"}
                        </h3>
                        {defense.MyRole && defense.MyRole.HasSubmittedMarks && (
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {(defense.Group && defense.Group.ProjectTitle) ||
                          "No title"}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        {defense.Defense && defense.Defense.Type && (
                          <span className="text-purple-600 font-medium">
                            {getDefenseTypeLabel(defense.Defense.Type)}
                          </span>
                        )}
                        {defense.Defense && defense.Defense.DateTime && (
                          <span className="text-gray-500">
                            {new Date(
                              defense.Defense.DateTime
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Marking Form */}
          <div className="lg:col-span-2">
            {!showMarkingForm ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <Award className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Select a Defense
                </h3>
                <p className="text-gray-600">
                  Choose a defense from the list to submit or view marks
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                  <h2 className="text-lg font-semibold">
                    {selectedDefense.Group?.GroupName || "N/A"}
                  </h2>
                  <p className="text-sm text-purple-100 mt-1">
                    {selectedDefense.Group?.ProjectTitle || ""}
                  </p>
                </div>

                <div className="p-6">
                  {/* Defense Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Defense Type:</span>
                        <p className="font-semibold text-gray-900">
                          {selectedDefense.Defense &&
                          selectedDefense.Defense.Type
                            ? getDefenseTypeLabel(selectedDefense.Defense.Type)
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Date & Time:</span>
                        <p className="font-semibold text-gray-900">
                          {selectedDefense.Defense &&
                          selectedDefense.Defense.DateTime
                            ? formatDateTime(selectedDefense.Defense.DateTime)
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Max Marks:</span>
                        <p className="font-semibold text-gray-900">
                          {selectedDefense.Defense &&
                          selectedDefense.Defense.Type
                            ? getMaxMarks(selectedDefense.Defense.Type)
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Your Role:</span>
                        <p className="font-semibold text-gray-900">
                          {selectedDefense.MyRole &&
                          selectedDefense.MyRole.IsExternal
                            ? "External Examiner"
                            : "Internal Evaluator"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* View/Edit Mode Toggle */}
                  {existingMarks && (
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center text-green-600">
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        <span className="font-medium">
                          Marks already submitted
                        </span>
                      </div>
                      {!isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Marks
                        </button>
                      )}
                    </div>
                  )}

                  {/* Marks Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Presentation & Communication
                        </label>
                        <input
                          type="number"
                          name="presentationMarks"
                          value={marks.presentationMarks}
                          onChange={handleInputChange}
                          disabled={existingMarks && !isEditing}
                          step="0.5"
                          min="0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                          placeholder="0.0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Technical Content
                        </label>
                        <input
                          type="number"
                          name="technicalMarks"
                          value={marks.technicalMarks}
                          onChange={handleInputChange}
                          disabled={existingMarks && !isEditing}
                          step="0.5"
                          min="0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                          placeholder="0.0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Documentation Quality
                        </label>
                        <input
                          type="number"
                          name="documentationMarks"
                          value={marks.documentationMarks}
                          onChange={handleInputChange}
                          disabled={existingMarks && !isEditing}
                          step="0.5"
                          min="0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                          placeholder="0.0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Q&A / Defense Performance
                        </label>
                        <input
                          type="number"
                          name="qaMarks"
                          value={marks.qaMarks}
                          onChange={handleInputChange}
                          disabled={existingMarks && !isEditing}
                          step="0.5"
                          min="0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                          placeholder="0.0"
                        />
                      </div>
                    </div>

                    {/* Total Marks Display */}
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-gray-900">
                          Total Marks:
                        </span>
                        <span
                          className={`text-2xl font-bold ${
                            calculateTotal() >
                            getMaxMarks(selectedDefense.Defense.Type)
                              ? "text-red-600"
                              : "text-purple-600"
                          }`}
                        >
                          {calculateTotal().toFixed(1)} /{" "}
                          {getMaxMarks(selectedDefense.Defense.Type)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comments (For Committee)
                      </label>
                      <textarea
                        name="comments"
                        value={marks.comments}
                        onChange={handleInputChange}
                        disabled={existingMarks && !isEditing}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                        placeholder="Internal comments for evaluation committee..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Feedback (For Students)
                      </label>
                      <textarea
                        name="feedback"
                        value={marks.feedback}
                        onChange={handleInputChange}
                        disabled={existingMarks && !isEditing}
                        rows="4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                        placeholder="Constructive feedback for students..."
                      />
                    </div>

                    {/* Action Buttons */}
                    {(!existingMarks || isEditing) && (
                      <div className="flex items-center space-x-4">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center disabled:opacity-50"
                        >
                          {submitting ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              {existingMarks ? "Updating..." : "Submitting..."}
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5 mr-2" />
                              {existingMarks ? "Update Marks" : "Submit Marks"}
                            </>
                          )}
                        </button>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditing(false);
                              fetchExistingMarks(selectedDefense.DefenseId);
                            }}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </EvaluatorLayout>
  );
};

export default EvaluatorMarks;
