import { useState, useEffect } from "react";
import {
  Award,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Users,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import api, { API_BASE } from "../../utils/api";
import HODLayout from "../../components/layouts/HODLayout";

const HODMarks = () => {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("PendingReview");
  const [expandedGroup, setExpandedGroup] = useState(null);

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [filterStatus]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== "All") params.append("reviewStatus", filterStatus);

      const response = await api.get(
        `${API_BASE}/hod/marks?${params.toString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (err) {
      setError("Failed to load marks");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (approved) => {
    if (!selectedGroup) return;

    try {
      setProcessing(true);

      const response = await api.post(
        `${API_BASE}/hod/groups/${selectedGroup.id}/review-marks`,
        {
          approved,
          remarks: reviewRemarks,
        }
      );

      if (response.ok) {
        setSuccess(
          `Marks ${
            approved ? "approved" : "flagged for revision"
          } successfully!`
        );
        setShowReviewModal(false);
        setReviewRemarks("");
        fetchGroups();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to process review");
      }
    } catch (err) {
      setError("Failed to process review");
    } finally {
      setProcessing(false);
    }
  };

  const openReviewModal = (group) => {
    setSelectedGroup(group);
    setReviewRemarks("");
    setShowReviewModal(true);
  };

  const getVarianceClass = (variance) => {
    if (!variance) return "text-gray-600";
    const v = Math.abs(variance);
    if (v > 20) return "text-red-600 font-bold";
    if (v > 10) return "text-amber-600";
    return "text-green-600";
  };

  const hasHighVariance = (group) => {
    return group.members?.some((m) => Math.abs(m.variance || 0) > 15);
  };

  const filteredGroups = groups.filter(
    (g) =>
      g.groupName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <HODLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mark Review</h1>
            <p className="text-gray-500 mt-1">
              Review compiled marks for fairness before publication
            </p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
            <button onClick={() => setError("")}>
              <X className="h-4 w-4 text-red-600" />
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-green-700">{success}</p>
            </div>
            <button onClick={() => setSuccess("")}>
              <X className="h-4 w-4 text-green-600" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            >
              <option value="All">All Groups</option>
              <option value="PendingReview">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="NeedsRevision">Needs Revision</option>
            </select>
            <div className="text-right text-sm text-gray-500 flex items-center justify-end">
              {filteredGroups.length} group(s)
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">
                Mark Variance Analysis
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Groups with variance &gt; 15% between evaluators are highlighted
                for review. This helps ensure fair grading across all
                evaluators.
              </p>
            </div>
          </div>
        </div>

        {/* Groups List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                  hasHighVariance(group)
                    ? "border-l-4 border-l-amber-500"
                    : "border-gray-100"
                }`}
              >
                {/* Header */}
                <div
                  className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() =>
                    setExpandedGroup(
                      expandedGroup === group.id ? null : group.id
                    )
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`p-2 rounded-lg ${
                            hasHighVariance(group)
                              ? "bg-amber-100"
                              : "bg-purple-100"
                          }`}
                        >
                          {hasHighVariance(group) ? (
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                          ) : (
                            <Award className="h-5 w-5 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {group.groupName}
                            </h3>
                            {hasHighVariance(group) && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                                High Variance
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {group.projectTitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Users className="h-4 w-4" />
                          {group.memberCount} members
                        </span>
                        <span className="text-gray-500">
                          Supervisor: {group.supervisorName}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            group.hodReviewStatus === "Approved"
                              ? "bg-green-100 text-green-700"
                              : group.hodReviewStatus === "NeedsRevision"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {group.hodReviewStatus || "Pending Review"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {group.hodReviewStatus !== "Approved" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openReviewModal(group);
                          }}
                          className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200"
                        >
                          Review Marks
                        </button>
                      )}
                      {expandedGroup === group.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedGroup === group.id && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50">
                    {/* Members Marks Table */}
                    <div className="bg-white rounded-lg border overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Student
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                              Initial
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                              Mid-Term
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                              Supervisor
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                              Final
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                              Total
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                              Grade
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                              Variance
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {group.members?.map((member) => (
                            <tr
                              key={member.id}
                              className={
                                Math.abs(member.variance || 0) > 15
                                  ? "bg-amber-50"
                                  : ""
                              }
                            >
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {member.studentName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {member.enrollmentId}
                                  </p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center text-sm">
                                {member.initialMarks ?? "-"}
                              </td>
                              <td className="px-4 py-3 text-center text-sm">
                                {member.midEvalMarks ?? "-"}
                              </td>
                              <td className="px-4 py-3 text-center text-sm">
                                {member.supervisorMarks ?? "-"}
                              </td>
                              <td className="px-4 py-3 text-center text-sm">
                                {member.finalEvalMarks ?? "-"}
                              </td>
                              <td className="px-4 py-3 text-center text-sm font-semibold">
                                {member.totalMarks ?? "-"}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`px-2 py-1 rounded text-sm font-medium ${
                                    member.grade === "A" ||
                                    member.grade === "A+"
                                      ? "bg-green-100 text-green-700"
                                      : member.grade === "B" ||
                                        member.grade === "B+"
                                      ? "bg-blue-100 text-blue-700"
                                      : member.grade === "C" ||
                                        member.grade === "C+"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {member.grade || "-"}
                                </span>
                              </td>
                              <td
                                className={`px-4 py-3 text-center text-sm ${getVarianceClass(
                                  member.variance
                                )}`}
                              >
                                {member.variance
                                  ? `${member.variance > 0 ? "+" : ""}${
                                      member.variance
                                    }%`
                                  : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="p-4 bg-white rounded-lg border text-center">
                        <p className="text-2xl font-bold text-gray-900">
                          {group.averageMarks?.toFixed(1) || "-"}
                        </p>
                        <p className="text-xs text-gray-500">Group Average</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {group.highestMarks || "-"}
                        </p>
                        <p className="text-xs text-gray-500">Highest</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border text-center">
                        <p className="text-2xl font-bold text-amber-600">
                          {group.lowestMarks || "-"}
                        </p>
                        <p className="text-xs text-gray-500">Lowest</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border text-center">
                        <p
                          className={`text-2xl font-bold ${getVarianceClass(
                            group.maxVariance
                          )}`}
                        >
                          {group.maxVariance ? `${group.maxVariance}%` : "-"}
                        </p>
                        <p className="text-xs text-gray-500">Max Variance</p>
                      </div>
                    </div>

                    {/* HOD Review Status */}
                    {group.hodReviewRemarks && (
                      <div
                        className={`mt-4 p-4 rounded-lg border ${
                          group.hodReviewStatus === "Approved"
                            ? "bg-green-50 border-green-200"
                            : "bg-amber-50 border-amber-200"
                        }`}
                      >
                        <h4
                          className={`text-sm font-medium ${
                            group.hodReviewStatus === "Approved"
                              ? "text-green-800"
                              : "text-amber-800"
                          } mb-1`}
                        >
                          HOD Review
                        </h4>
                        <p
                          className={`text-sm ${
                            group.hodReviewStatus === "Approved"
                              ? "text-green-700"
                              : "text-amber-700"
                          }`}
                        >
                          {group.hodReviewRemarks}
                        </p>
                        {group.hodReviewedAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            Reviewed on{" "}
                            {new Date(group.hodReviewedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Marks to Review
            </h3>
            <p className="text-gray-500">
              {filterStatus !== "All"
                ? "Try adjusting your filters"
                : "No compiled marks ready for review at this time."}
            </p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Review Marks
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {selectedGroup.groupName}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {hasHighVariance(selectedGroup) && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-800 mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">High Variance Detected</span>
                  </div>
                  <p className="text-sm text-amber-700">
                    This group has significant mark variance between evaluators.
                    Please review carefully before approval.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Remarks
                </label>
                <textarea
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  placeholder="Add your review comments..."
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReview(false)}
                disabled={processing}
                className="px-5 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 flex items-center gap-2"
              >
                Flag for Revision
              </button>
              <button
                onClick={() => handleReview(true)}
                disabled={processing}
                className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Approve Marks
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </HODLayout>
  );
};

export default HODMarks;
