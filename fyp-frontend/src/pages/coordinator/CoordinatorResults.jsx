import { useState, useEffect } from "react";
import {
  Award,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  RefreshCw,
  Send,
  Users,
  FileText,
  Calculator,
  Eye,
  ChevronDown,
  ChevronRight,
  Filter,
  Check,
  XCircle,
  Clock,
  Percent,
} from "lucide-react";
import api, { API_BASE } from "../../utils/api";
import CoordinatorLayout from "../../components/layouts/CoordinatorLayout";

const CoordinatorResults = () => {
  const [loading, setLoading] = useState(true);
  const [compiling, setCompiling] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");

  // Selected group for detail view
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Expanded rows
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);

      const response = await api.get(`${API_BASE}/results`);
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (err) {
      setError("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const handleCompileResults = async () => {
    try {
      setCompiling(true);
      setError("");

      const response = await api.post(`${API_BASE}/results/compile`);
      if (response.ok) {
        setSuccess("Results compiled successfully!");
        fetchResults();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to compile results");
      }
    } catch (err) {
      setError("Failed to compile results");
    } finally {
      setCompiling(false);
    }
  };

  const handlePublishResults = async () => {
    if (
      !confirm(
        "Are you sure you want to publish the results? This will notify all students and supervisors."
      )
    )
      return;

    try {
      setPublishing(true);
      setError("");

      const response = await api.post(`${API_BASE}/results/publish`);
      if (response.ok) {
        setSuccess(
          "Results published successfully! All participants have been notified."
        );
        fetchResults();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to publish results");
      }
    } catch (err) {
      setError("Failed to publish results");
    } finally {
      setPublishing(false);
    }
  };

  const handleExportResults = async () => {
    try {
      const response = await api.get(`${API_BASE}/results/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `FYP_Results_${
          new Date().toISOString().split("T")[0]
        }.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      setError("Failed to export results");
    }
  };

  const handleUpdateMemberResult = async (groupId, memberId, result) => {
    try {
      const response = await api.put(`${API_BASE}/results/member/${memberId}`, {
        finalResult: result,
      });

      if (response.ok) {
        setSuccess("Result updated!");
        fetchResults();
      } else {
        setError("Failed to update result");
      }
    } catch (err) {
      setError("Failed to update result");
    }
  };

  const toggleExpand = (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const getResultBadge = (result) => {
    switch (result) {
      case "Approved":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            Approved
          </span>
        );
      case "Deferred":
        return (
          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
            Deferred
          </span>
        );
      case "Failed":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
            Pending
          </span>
        );
    }
  };

  const getGradeColor = (grade) => {
    if (!grade) return "text-gray-400";
    if (grade.startsWith("A")) return "text-green-600";
    if (grade.startsWith("B")) return "text-blue-600";
    if (grade.startsWith("C")) return "text-amber-600";
    if (grade.startsWith("D")) return "text-orange-600";
    return "text-red-600";
  };

  const filteredGroups = groups.filter((g) => {
    if (statusFilter !== "all" && g.status !== statusFilter) return false;
    if (resultFilter !== "all") {
      if (
        resultFilter === "approved" &&
        !g.members?.some((m) => m.finalResult === "Approved")
      )
        return false;
      if (
        resultFilter === "deferred" &&
        !g.members?.some((m) => m.finalResult === "Deferred")
      )
        return false;
      if (
        resultFilter === "failed" &&
        !g.members?.some((m) => m.finalResult === "Failed")
      )
        return false;
      if (resultFilter === "pending" && !g.members?.some((m) => !m.finalResult))
        return false;
    }
    return true;
  });

  const stats = {
    total: groups.length,
    compiled: groups.filter((g) => g.isCompiled).length,
    published: groups.filter((g) => g.isPublished).length,
    approved: groups
      .flatMap((g) => g.members || [])
      .filter((m) => m.finalResult === "Approved").length,
    deferred: groups
      .flatMap((g) => g.members || [])
      .filter((m) => m.finalResult === "Deferred").length,
    failed: groups
      .flatMap((g) => g.members || [])
      .filter((m) => m.finalResult === "Failed").length,
  };

  return (
    <CoordinatorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Result Compilation
            </h1>
            <p className="text-gray-500 mt-1">
              Compile marks and publish final results
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportResults}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <Download className="h-5 w-5" />
              Export
            </button>
            <button
              onClick={handleCompileResults}
              disabled={compiling}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {compiling ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Compiling...
                </>
              ) : (
                <>
                  <Calculator className="h-5 w-5" />
                  Compile Results
                </>
              )}
            </button>
            <button
              onClick={handlePublishResults}
              disabled={publishing || stats.compiled === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {publishing ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Publish Results
                </>
              )}
            </button>
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-gray-900 font-bold text-2xl">{stats.total}</p>
            <p className="text-gray-500 text-sm">Total Groups</p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
            <p className="text-blue-900 font-bold text-2xl">{stats.compiled}</p>
            <p className="text-blue-600 text-sm">Compiled</p>
          </div>
          <div className="bg-purple-50 rounded-xl border border-purple-100 p-4">
            <p className="text-purple-900 font-bold text-2xl">
              {stats.published}
            </p>
            <p className="text-purple-600 text-sm">Published</p>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-100 p-4">
            <p className="text-green-900 font-bold text-2xl">
              {stats.approved}
            </p>
            <p className="text-green-600 text-sm">Approved</p>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
            <p className="text-amber-900 font-bold text-2xl">
              {stats.deferred}
            </p>
            <p className="text-amber-600 text-sm">Deferred</p>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-100 p-4">
            <p className="text-red-900 font-bold text-2xl">{stats.failed}</p>
            <p className="text-red-600 text-sm">Failed</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="all">All Groups</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="all">All Results</option>
            <option value="approved">Approved</option>
            <option value="deferred">Deferred</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Results Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase w-8"></th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Group
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                      Members
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                      Initial
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                      Mid-Term
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                      Final
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                      Supervisor
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                      Total
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredGroups.map((group) => (
                    <>
                      <tr
                        key={group.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <button
                            onClick={() => toggleExpand(group.id)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            {expandedGroups.has(group.id) ? (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {group.groupName}
                            </p>
                            <p className="text-sm text-gray-500 truncate max-w-[200px]">
                              {group.projectTitle || "No title"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm font-medium">
                            {group.memberCount || group.members?.length || 0}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm font-medium">
                            {group.avgProposalMarks?.toFixed(1) || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm font-medium">
                            {group.avgMidEvalMarks?.toFixed(1) || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm font-medium">
                            {group.avgFinalEvalMarks?.toFixed(1) || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm font-medium">
                            {group.avgSupervisorMarks?.toFixed(1) || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-lg font-bold text-teal-600">
                            {group.avgTotalMarks?.toFixed(1) || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {group.isPublished ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Published
                              </span>
                            ) : group.isCompiled ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                                <Calculator className="h-3 w-3" />
                                Compiled
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Pending
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row - Individual Members */}
                      {expandedGroups.has(group.id) && (
                        <tr>
                          <td colSpan={9} className="px-4 py-4 bg-gray-50">
                            <div className="space-y-4">
                              <h4 className="font-semibold text-gray-700 text-sm">
                                Individual Member Results
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-white">
                                    <tr>
                                      <th className="px-3 py-2 text-left font-medium text-gray-600">
                                        Name
                                      </th>
                                      <th className="px-3 py-2 text-left font-medium text-gray-600">
                                        Enrollment
                                      </th>
                                      <th className="px-3 py-2 text-center font-medium text-gray-600">
                                        Initial
                                      </th>
                                      <th className="px-3 py-2 text-center font-medium text-gray-600">
                                        Mid
                                      </th>
                                      <th className="px-3 py-2 text-center font-medium text-gray-600">
                                        Final
                                      </th>
                                      <th className="px-3 py-2 text-center font-medium text-gray-600">
                                        Sup.
                                      </th>
                                      <th className="px-3 py-2 text-center font-medium text-gray-600">
                                        Total
                                      </th>
                                      <th className="px-3 py-2 text-center font-medium text-gray-600">
                                        Grade
                                      </th>
                                      <th className="px-3 py-2 text-center font-medium text-gray-600">
                                        Result
                                      </th>
                                      <th className="px-3 py-2 text-center font-medium text-gray-600">
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {group.members?.map((member) => (
                                      <tr
                                        key={member.id}
                                        className="bg-white hover:bg-gray-50"
                                      >
                                        <td className="px-3 py-2 font-medium">
                                          {member.studentName}
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          {member.enrollmentId}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          {member.proposalMarks?.toFixed(1) ||
                                            "—"}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          {member.midEvalMarks?.toFixed(1) ||
                                            "—"}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          {member.finalEvalMarks?.toFixed(1) ||
                                            "—"}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          {member.supervisorMarks?.toFixed(1) ||
                                            "—"}
                                        </td>
                                        <td className="px-3 py-2 text-center font-bold text-teal-600">
                                          {member.totalMarks?.toFixed(1) || "—"}
                                        </td>
                                        <td
                                          className={`px-3 py-2 text-center font-bold ${getGradeColor(
                                            member.grade
                                          )}`}
                                        >
                                          {member.grade || "—"}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          {getResultBadge(member.finalResult)}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          <div className="flex items-center justify-center gap-1">
                                            <button
                                              onClick={() =>
                                                handleUpdateMemberResult(
                                                  group.id,
                                                  member.id,
                                                  "Approved"
                                                )
                                              }
                                              className={`p-1 rounded hover:bg-green-100 ${
                                                member.finalResult ===
                                                "Approved"
                                                  ? "bg-green-100 text-green-700"
                                                  : "text-gray-400"
                                              }`}
                                              title="Mark as Approved"
                                            >
                                              <Check className="h-4 w-4" />
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleUpdateMemberResult(
                                                  group.id,
                                                  member.id,
                                                  "Deferred"
                                                )
                                              }
                                              className={`p-1 rounded hover:bg-amber-100 ${
                                                member.finalResult ===
                                                "Deferred"
                                                  ? "bg-amber-100 text-amber-700"
                                                  : "text-gray-400"
                                              }`}
                                              title="Mark as Deferred"
                                            >
                                              <Clock className="h-4 w-4" />
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleUpdateMemberResult(
                                                  group.id,
                                                  member.id,
                                                  "Failed"
                                                )
                                              }
                                              className={`p-1 rounded hover:bg-red-100 ${
                                                member.finalResult === "Failed"
                                                  ? "bg-red-100 text-red-700"
                                                  : "text-gray-400"
                                              }`}
                                              title="Mark as Failed"
                                            >
                                              <XCircle className="h-4 w-4" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Results Available
            </h2>
            <p className="text-gray-500 mb-6">
              Click "Compile Results" to aggregate marks from all evaluations
            </p>
            <button
              onClick={handleCompileResults}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <Calculator className="h-5 w-5" />
              Compile Results
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-gray-700 text-sm mb-3">
            Result Status Legend
          </h4>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                Approved
              </span>
              <span className="text-gray-600">Successfully completed FYP</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                Deferred
              </span>
              <span className="text-gray-600">Needs to resubmit/redefend</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                Failed
              </span>
              <span className="text-gray-600">Did not meet requirements</span>
            </div>
          </div>
        </div>
      </div>
    </CoordinatorLayout>
  );
};

export default CoordinatorResults;
