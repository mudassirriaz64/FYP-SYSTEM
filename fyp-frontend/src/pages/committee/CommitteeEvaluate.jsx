import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api, { API_BASE } from "../../utils/api";
import CommitteeLayout from "../../components/layouts/CommitteeLayout";

const CommitteeEvaluate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [defenses, setDefenses] = useState([]);
  const [selectedDefense, setSelectedDefense] = useState(null);
  const [showEvaluateModal, setShowEvaluateModal] = useState(false);
  const [resultData, setResultData] = useState({
    result: "Accepted",
    remarks: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [committeeMembers, setCommitteeMembers] = useState([]);

  useEffect(() => {
    fetchDefenses();
    fetchCommitteeMembers();
  }, []);

  useEffect(() => {
    if (id && defenses.length > 0) {
      const defense = defenses.find((d) => d.id === parseInt(id));
      if (defense) {
        setSelectedDefense(defense);
        setShowEvaluateModal(true);
      }
    }
  }, [id, defenses]);

  const fetchDefenses = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `${API_BASE}/committee/defenses?filter=all`
      );
      if (response.ok) {
        const data = await response.json();
        setDefenses(data.defenses || []);
      }
    } catch (err) {
      console.error("Failed to fetch defenses:", err);
      setError("Failed to load defenses");
    } finally {
      setLoading(false);
    }
  };

  const fetchCommitteeMembers = async () => {
    try {
      const response = await api.get(`${API_BASE}/committee/members`);
      if (response.ok) {
        const data = await response.json();
        setCommitteeMembers(data.members || []);
      }
    } catch (err) {
      console.error("Failed to fetch committee members:", err);
    }
  };

  const handleEvaluate = (defense) => {
    setSelectedDefense(defense);
    setResultData({ result: "Accepted", remarks: "" });
    setShowEvaluateModal(true);
    navigate(`/committee/evaluate/${defense.id}`);
  };

  const handleSubmitResult = async (e) => {
    e.preventDefault();
    if (!selectedDefense) return;

    try {
      setSubmitting(true);
      setError("");

      const response = await api.post(
        `${API_BASE}/committee/defenses/${selectedDefense.id}/result`,
        resultData
      );

      if (response.ok) {
        setSuccess(
          `Result submitted successfully for ${selectedDefense.group.groupName}`
        );
        setShowEvaluateModal(false);
        navigate("/committee/evaluate");
        fetchDefenses();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to submit result");
      }
    } catch (err) {
      setError("An error occurred while submitting result");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status, result) => {
    if (result === "Accepted")
      return "text-green-600 bg-green-50 border-green-200";
    if (result === "Deferred")
      return "text-amber-600 bg-amber-50 border-amber-200";
    if (result === "Rejected") return "text-red-600 bg-red-50 border-red-200";
    if (status === "Scheduled")
      return "text-blue-600 bg-blue-50 border-blue-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const pendingDefenses = defenses.filter((d) => !d.result);
  const evaluatedDefenses = defenses.filter((d) => d.result);

  if (loading) {
    return (
      <CommitteeLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </CommitteeLayout>
    );
  }

  return (
    <CommitteeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Evaluate Defenses
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Review and evaluate proposal defenses
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Evaluation</p>
                <p className="text-3xl font-bold text-gray-900">
                  {pendingDefenses.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Evaluated</p>
                <p className="text-3xl font-bold text-gray-900">
                  {evaluatedDefenses.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Committee Members */}
        {committeeMembers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                Committee Members
              </h2>
              <p className="text-sm text-gray-500">
                Current proposal defense committee members
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {committeeMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">
                        {member.fullName
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "CM"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-gray-900">
                        {member.fullName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {member.designation || "Faculty Member"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {member.email}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {member.roles && member.roles.length > 0 ? (
                        member.roles.map((role, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              role === "Supervisor"
                                ? "bg-green-100 text-green-700"
                                : role === "HOD"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {role}
                          </span>
                        ))
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                          Member
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Defenses */}
        {pendingDefenses.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                Pending Evaluation
              </h2>
              <p className="text-sm text-gray-500">
                Defenses awaiting your evaluation
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {pendingDefenses.map((defense) => (
                <div
                  key={defense.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col gap-6">
                    {/* Header Section */}
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex lg:flex-col items-center lg:items-center gap-4 lg:w-32 lg:border-r lg:border-gray-200 lg:pr-6">
                        <div className="text-center">
                          <p className="text-sm font-bold text-gray-900">
                            {new Date(defense.dateTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(defense.dateTime).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                          <MapPin className="w-3 h-3" />
                          {defense.venue || "TBA"}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {defense.group?.groupName}
                            </h3>
                            <p className="text-sm font-medium text-gray-700 mt-0.5">
                              {defense.group?.projectTitle || "No Title"}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                              defense.status,
                              defense.result
                            )}`}
                          >
                            {defense.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-4 mt-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span>
                              {defense.group?.members
                                ?.map((m) => m.student?.fullName)
                                .join(", ") || "No members"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">
                              S
                            </div>
                            <span>
                              Supervisor:{" "}
                              {defense.group?.supervisorName || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <button
                          onClick={() => handleEvaluate(defense)}
                          className="w-full lg:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-blue-200 flex items-center justify-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Evaluate
                        </button>
                      </div>
                    </div>

                    {/* Progress Tracker - All Defense Stages */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Defense Progress
                        </h4>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all"
                              style={{ width: "25%" }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            25%
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {/* Proposal Defense */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-blue-900">
                              Proposal
                            </span>
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                              Pending
                            </span>
                          </div>
                          <p className="text-xs text-blue-700">
                            Awaiting evaluation
                          </p>
                        </div>

                        {/* Initial Defense */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 opacity-60">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-700">
                              Initial
                            </span>
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-semibold rounded-full">
                              Not Started
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">Locked</p>
                        </div>

                        {/* Mid-Term Defense */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 opacity-60">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-700">
                              Mid-Term
                            </span>
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-semibold rounded-full">
                              Not Started
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">Locked</p>
                        </div>

                        {/* Final Defense */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 opacity-60">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-700">
                              Final
                            </span>
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-semibold rounded-full">
                              Not Started
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">Locked</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evaluated Defenses */}
        {evaluatedDefenses.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                Evaluated Defenses
              </h2>
              <p className="text-sm text-gray-500">
                Previously evaluated defenses
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {evaluatedDefenses.map((defense) => (
                <div
                  key={defense.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex lg:flex-col items-center lg:items-center gap-4 lg:w-32 lg:border-r lg:border-gray-200 lg:pr-6">
                      <div className="text-center">
                        <p className="text-sm font-bold text-gray-900">
                          {new Date(defense.dateTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(defense.dateTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {defense.group?.groupName}
                          </h3>
                          <p className="text-sm font-medium text-gray-700 mt-0.5">
                            {defense.group?.projectTitle || "No Title"}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                            defense.status,
                            defense.result
                          )}`}
                        >
                          {defense.result}
                        </span>
                      </div>

                      {defense.resultRemarks && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                          <span className="font-semibold text-gray-700">
                            Remarks:{" "}
                          </span>
                          <span className="text-gray-600">
                            {defense.resultRemarks}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center">
                      <div className="text-right">
                        <span className="text-xs text-gray-400">
                          Evaluated on
                        </span>
                        <p className="text-sm font-medium text-gray-600">
                          {new Date(
                            defense.resultEnteredAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Defenses */}
        {defenses.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No defenses found
            </h3>
            <p className="text-gray-500 mt-1">
              No proposal defenses scheduled yet.
            </p>
          </div>
        )}
      </div>

      {/* Evaluation Modal */}
      {showEvaluateModal && selectedDefense && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl transform transition-all animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                Evaluate Defense
              </h3>
              <button
                onClick={() => {
                  setShowEvaluateModal(false);
                  navigate("/committee/evaluate");
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitResult}>
              <div className="p-6 space-y-6">
                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                        Group
                      </span>
                      <p className="font-bold text-gray-900 text-lg">
                        {selectedDefense.group?.groupName}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                      Time
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium border-t border-gray-200 pt-3">
                    {selectedDefense.group?.projectTitle}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-600 border-t border-gray-200 pt-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(selectedDefense.dateTime).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {new Date(selectedDefense.dateTime).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {selectedDefense.venue || "TBA"}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Decision *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setResultData({ ...resultData, result: "Accepted" })
                      }
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        resultData.result === "Accepted"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 hover:border-green-200 hover:bg-green-50/50 text-gray-600"
                      }`}
                    >
                      <CheckCircle2
                        className={`w-6 h-6 ${
                          resultData.result === "Accepted" ? "fill-current" : ""
                        }`}
                      />
                      <span className="font-bold text-sm">Accept</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setResultData({ ...resultData, result: "Deferred" })
                      }
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        resultData.result === "Deferred"
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-gray-200 hover:border-amber-200 hover:bg-amber-50/50 text-gray-600"
                      }`}
                    >
                      <Clock
                        className={`w-6 h-6 ${
                          resultData.result === "Deferred" ? "fill-current" : ""
                        }`}
                      />
                      <span className="font-bold text-sm">Defer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setResultData({ ...resultData, result: "Rejected" })
                      }
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        resultData.result === "Rejected"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-gray-200 hover:border-red-200 hover:bg-red-50/50 text-gray-600"
                      }`}
                    >
                      <XCircle
                        className={`w-6 h-6 ${
                          resultData.result === "Rejected" ? "fill-current" : ""
                        }`}
                      />
                      <span className="font-bold text-sm">Reject</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks / Feedback
                  </label>
                  <textarea
                    rows={4}
                    value={resultData.remarks}
                    onChange={(e) =>
                      setResultData({ ...resultData, remarks: e.target.value })
                    }
                    placeholder="Enter any feedback or conditions for the students..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 bg-gray-50 focus:bg-white resize-none"
                    required={resultData.result !== "Accepted"}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/50 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setShowEvaluateModal(false);
                    navigate("/committee/evaluate");
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "Submit Result"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CommitteeLayout>
  );
};

export default CommitteeEvaluate;
