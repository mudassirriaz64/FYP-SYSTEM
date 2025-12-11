import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Search,
  Filter,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import api, { API_BASE } from "../../utils/api";
import CommitteeLayout from "../../components/layouts/CommitteeLayout";

const CommitteeDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [defenses, setDefenses] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    deferred: 0,
    rejected: 0,
  });
  const [filter, setFilter] = useState("today"); // today, upcoming, completed
  const [selectedDefense, setSelectedDefense] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState({
    result: "Accepted",
    remarks: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchDefenses();
  }, [filter]);

  const fetchDefenses = async () => {
    try {
      setLoading(true);
      setError(""); // Clear previous errors
      const response = await api.get(
        `${API_BASE}/committee/defenses?filter=${filter}`
      );
      if (response.ok) {
        const data = await response.json();
        setDefenses(data.defenses || []);
        setStats(data.stats || stats);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Failed to fetch defenses:", err);
      setError(
        "Failed to load dashboard data. Please check if backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const openResultModal = (defense) => {
    setSelectedDefense(defense);
    setResultData({ result: "Accepted", remarks: "" });
    setShowResultModal(true);
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
        setShowResultModal(false);
        fetchDefenses(); // Refresh list
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

  if (loading && defenses.length === 0) {
    return (
      <CommitteeLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </CommitteeLayout>
    );
  }

  return (
    <CommitteeLayout>
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-600">
                Total Defenses
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-600">Accepted</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.accepted}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-50 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-sm font-medium text-gray-600">
                Rejected/Deferred
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.rejected + stats.deferred}
            </p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Filters & Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Proposal Evaluations
              </h2>
              <p className="text-sm text-gray-500">
                Manage and evaluate proposal defenses
              </p>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setFilter("today")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  filter === "today"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setFilter("upcoming")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  filter === "upcoming"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  filter === "completed"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                History
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {defenses.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  No defenses found
                </h3>
                <p className="text-gray-500 mt-1">
                  No proposal defenses scheduled for this view.
                </p>
              </div>
            ) : (
              defenses.map((defense) => (
                <div
                  key={defense.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Time & Venue */}
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
                      <div className="hidden lg:block w-px h-8 bg-gray-200 my-2"></div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                        <MapPin className="w-3 h-3" />
                        {defense.venue || "TBA"}
                      </div>
                    </div>

                    {/* Group Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
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
                          {defense.result || defense.status}
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
                            Supervisor: {defense.group?.supervisorName || "N/A"}
                          </span>
                        </div>
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

                    {/* Action Button */}
                    <div className="flex items-center">
                      {!defense.result ? (
                        <button
                          onClick={() => openResultModal(defense)}
                          className="w-full lg:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-blue-200 flex items-center justify-center gap-2"
                        >
                          Evaluate
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
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
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Evaluation Modal */}
      {showResultModal && selectedDefense && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg transform transition-all animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                Evaluate Defense
              </h3>
              <button
                onClick={() => setShowResultModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitResult}>
              <div className="p-6 space-y-6">
                <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                      Group
                    </span>
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                      Time
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">
                      {selectedDefense.group?.groupName}
                    </span>
                    <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {new Date(selectedDefense.dateTime).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 border-t border-gray-200 pt-2 mt-2">
                    {selectedDefense.group?.projectTitle}
                  </p>
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
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
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
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
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
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
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
                    required={resultData.result !== "Accepted"} // Require remarks if not accepted
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
                  onClick={() => setShowResultModal(false)}
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

export default CommitteeDashboard;
