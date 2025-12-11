import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  MapPin,
  Send,
  UserPlus,
  FileText,
  Award,
  RotateCcw,
  Check,
  XCircle,
  ClipboardCheck,
  Shield,
} from "lucide-react";
import api, { API_BASE } from "../../utils/api";
import CoordinatorLayout from "../../components/layouts/CoordinatorLayout";

const CoordinatorDefenses = () => {
  const [loading, setLoading] = useState(true);
  const [defenses, setDefenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingDefense, setEditingDefense] = useState(null);
  const [formData, setFormData] = useState({
    groupId: "",
    type: "Initial",
    date: "",
    time: "",
    venue: "",
    internalEvaluators: [],
    externalEvaluatorId: "",
    notifyParticipants: true,
    notes: "",
  });

  // Panel allocation modal
  const [showPanelModal, setShowPanelModal] = useState(false);
  const [selectedDefense, setSelectedDefense] = useState(null);

  // Results entry modal
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [defenseResults, setDefenseResults] = useState({
    groupResult: "Accepted", // Accepted, Deferred, Rejected
    remarks: "",
    memberMarks: {},
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [defensesRes, groupsRes, staffRes] = await Promise.all([
        api.get(`${API_BASE}/defenses`),
        api.get(`${API_BASE}/fypgroups?pageSize=100`),
        api.get(`${API_BASE}/staff?staffType=Teacher&pageSize=100`),
      ]);

      if (defensesRes.ok) {
        const data = await defensesRes.json();
        setDefenses(data.defenses || []);
      }

      if (groupsRes.ok) {
        const data = await groupsRes.json();
        setGroups(data.groups || []);
      }

      if (staffRes.ok) {
        const data = await staffRes.json();
        setStaff(data.staff || []);
      }
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        groupId: parseInt(formData.groupId),
        type: formData.type,
        dateTime: `${formData.date}T${formData.time}:00`,
        venue: formData.venue || null,
        notes: formData.notes || null,
        notifyParticipants: formData.notifyParticipants,
        internalEvaluatorIds: formData.internalEvaluators.map((id) =>
          parseInt(id)
        ),
        externalEvaluatorId: formData.externalEvaluatorId
          ? parseInt(formData.externalEvaluatorId)
          : null,
      };

      const url = editingDefense
        ? `${API_BASE}/defenses/${editingDefense.id}`
        : `${API_BASE}/defenses`;

      const response = editingDefense
        ? await api.put(url, payload)
        : await api.post(url, payload);

      if (response.ok) {
        setSuccess(editingDefense ? "Defense updated!" : "Defense scheduled!");
        setShowModal(false);
        resetForm();
        fetchData();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to save defense");
      }
    } catch (err) {
      setError("Failed to save defense");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this defense?")) return;

    try {
      const response = await api.delete(`${API_BASE}/defenses/${id}`);
      if (response.ok) {
        setSuccess("Defense deleted!");
        fetchData();
      }
    } catch (err) {
      setError("Failed to delete defense");
    }
  };

  const handleNotifyParticipants = async (defense) => {
    try {
      const response = await api.post(
        `${API_BASE}/defenses/${defense.id}/notify`
      );
      if (response.ok) {
        setSuccess("Notifications sent to all participants!");
      } else {
        setError("Failed to send notifications");
      }
    } catch (err) {
      setError("Failed to send notifications");
    }
  };

  const handleAllocatePanel = async () => {
    if (!selectedDefense) return;

    try {
      const response = await api.put(
        `${API_BASE}/defenses/${selectedDefense.id}/panel`,
        {
          internalEvaluatorIds: formData.internalEvaluators.map((id) =>
            parseInt(id)
          ),
          externalEvaluatorId: formData.externalEvaluatorId
            ? parseInt(formData.externalEvaluatorId)
            : null,
        }
      );

      if (response.ok) {
        setSuccess("Panel allocated successfully!");
        setShowPanelModal(false);
        fetchData();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to allocate panel");
      }
    } catch (err) {
      setError("Failed to allocate panel");
    }
  };

  // Enter defense results
  const handleEnterResults = async () => {
    if (!selectedDefense) return;

    try {
      const response = await api.post(
        `${API_BASE}/defenses/${selectedDefense.id}/results`,
        {
          result: defenseResults.groupResult,
          remarks: defenseResults.remarks,
          memberMarks: defenseResults.memberMarks,
        }
      );

      if (response.ok) {
        setSuccess(
          `Defense marked as ${defenseResults.groupResult}! Students have been notified.`
        );
        setShowResultsModal(false);
        setDefenseResults({
          groupResult: "Accepted",
          remarks: "",
          memberMarks: {},
        });
        fetchData();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to enter results");
      }
    } catch (err) {
      setError("Failed to enter results");
    }
  };

  // Mark defense as completed (quick action)
  const handleMarkCompleted = async (defense, result) => {
    try {
      const response = await api.post(
        `${API_BASE}/defenses/${defense.id}/results`,
        {
          result: result,
          remarks: "",
        }
      );

      if (response.ok) {
        setSuccess(`Defense marked as ${result}!`);
        fetchData();
      } else {
        setError("Failed to update defense");
      }
    } catch (err) {
      setError("Failed to update defense");
    }
  };

  const resetForm = () => {
    setFormData({
      groupId: "",
      type: "Proposal",
      date: "",
      time: "",
      venue: "",
      internalEvaluators: [],
      externalEvaluatorId: "",
      notifyParticipants: true,
      notes: "",
    });
    setEditingDefense(null);
  };

  const openEditModal = (defense) => {
    setEditingDefense(defense);
    const dateTime = new Date(defense.dateTime);
    setFormData({
      groupId: defense.groupId?.toString() || "",
      type: defense.type,
      date: dateTime.toISOString().split("T")[0],
      time: dateTime.toTimeString().slice(0, 5),
      venue: defense.venue || "",
      internalEvaluators:
        defense.internalEvaluators?.map((e) => e.staffId?.toString()) || [],
      externalEvaluatorId: defense.externalEvaluatorId?.toString() || "",
      notifyParticipants: true,
      notes: defense.notes || "",
    });
    setShowModal(true);
  };

  const openPanelModal = (defense) => {
    setSelectedDefense(defense);
    setFormData((prev) => ({
      ...prev,
      internalEvaluators:
        defense.internalEvaluators?.map((e) => e.staffId?.toString()) || [],
      externalEvaluatorId: defense.externalEvaluatorId?.toString() || "",
    }));
    setShowPanelModal(true);
  };

  const openResultsModal = (defense) => {
    setSelectedDefense(defense);
    // Find the group to get members
    const group = groups.find((g) => g.id === defense.groupId);
    const memberMarks = {};
    group?.members?.forEach((m) => {
      memberMarks[m.id] = { marks: "", comments: "" };
    });
    setDefenseResults({
      groupResult: "Accepted",
      remarks: "",
      memberMarks,
    });
    setShowResultsModal(true);
  };

  const handleInternalEvaluatorToggle = (staffId) => {
    const id = staffId.toString();
    setFormData((prev) => ({
      ...prev,
      internalEvaluators: prev.internalEvaluators.includes(id)
        ? prev.internalEvaluators.filter((i) => i !== id)
        : [...prev.internalEvaluators, id],
    }));
  };

  const getStatusColor = (defense) => {
    if (defense.result === "Accepted") return "green";
    if (defense.result === "Deferred") return "amber";
    if (defense.result === "Rejected") return "red";
    if (defense.status === "Completed") return "green";

    const now = new Date();
    const defenseDate = new Date(defense.dateTime);
    if (defenseDate < now && defense.status !== "Completed") return "purple"; // Needs results
    if (defense.internalEvaluators?.length < 2) return "amber";
    return "blue";
  };

  const getStatusLabel = (defense) => {
    if (defense.result === "Accepted") return "Accepted";
    if (defense.result === "Deferred") return "Deferred";
    if (defense.result === "Rejected") return "Rejected";
    if (defense.status === "Completed") return "Completed";

    const now = new Date();
    const defenseDate = new Date(defense.dateTime);
    if (defenseDate < now && defense.status !== "Completed")
      return "Needs Results";
    if (defense.internalEvaluators?.length < 2) return "Panel Needed";
    return "Scheduled";
  };

  const defenseTypes = [
    { value: "Proposal", label: "Proposal Defense" },
    { value: "Initial", label: "Initial Defense" },
    { value: "MidTerm", label: "Mid-Term Defense" },
    { value: "Final", label: "Final Defense" },
  ];

  const filteredDefenses = defenses.filter((d) => {
    if (typeFilter !== "all" && d.type !== typeFilter) return false;
    if (statusFilter !== "all") {
      const status = getStatusLabel(d);
      if (
        statusFilter === "pending" &&
        !["Scheduled", "Panel Needed"].includes(status)
      )
        return false;
      if (statusFilter === "needs-results" && status !== "Needs Results")
        return false;
      if (
        statusFilter === "completed" &&
        !["Completed", "Accepted", "Deferred", "Rejected"].includes(status)
      )
        return false;
    }
    return true;
  });

  // Group defenses by date
  const groupedDefenses = filteredDefenses.reduce((acc, defense) => {
    const date = new Date(defense.dateTime).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(defense);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedDefenses).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  // Stats
  const stats = {
    total: defenses.length,
    scheduled: defenses.filter((d) => getStatusLabel(d) === "Scheduled").length,
    needsResults: defenses.filter((d) => getStatusLabel(d) === "Needs Results")
      .length,
    accepted: defenses.filter((d) => d.result === "Accepted").length,
    deferred: defenses.filter((d) => d.result === "Deferred").length,
    rejected: defenses.filter((d) => d.result === "Rejected").length,
  };

  return (
    <CoordinatorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Defense Management
            </h1>
            <p className="text-gray-500 mt-1">
              Schedule defenses, allocate panels, and enter results
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Schedule Defense
          </button>
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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-gray-900 font-bold text-2xl">{stats.total}</p>
            <p className="text-gray-500 text-xs">Total</p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
            <p className="text-blue-900 font-bold text-2xl">
              {stats.scheduled}
            </p>
            <p className="text-blue-600 text-xs">Scheduled</p>
          </div>
          <div
            className="bg-purple-50 rounded-xl border border-purple-100 p-4 cursor-pointer hover:bg-purple-100"
            onClick={() => setStatusFilter("needs-results")}
          >
            <p className="text-purple-900 font-bold text-2xl">
              {stats.needsResults}
            </p>
            <p className="text-purple-600 text-xs">Needs Results</p>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-100 p-4">
            <p className="text-green-900 font-bold text-2xl">
              {stats.accepted}
            </p>
            <p className="text-green-600 text-xs">Accepted</p>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
            <p className="text-amber-900 font-bold text-2xl">
              {stats.deferred}
            </p>
            <p className="text-amber-600 text-xs">Deferred</p>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-100 p-4">
            <p className="text-red-900 font-bold text-2xl">{stats.rejected}</p>
            <p className="text-red-600 text-xs">Rejected</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="all">All Types</option>
            {defenseTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Scheduled</option>
            <option value="needs-results">Needs Results</option>
            <option value="completed">Completed</option>
          </select>

          {statusFilter !== "all" && (
            <button
              onClick={() => setStatusFilter("all")}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm flex items-center gap-1"
            >
              <X className="h-4 w-4" /> Clear
            </button>
          )}
        </div>

        {/* Defense List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : sortedDates.length > 0 ? (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date} className="space-y-3">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-teal-600" />
                  {new Date(date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                    {groupedDefenses[date].length} defense
                    {groupedDefenses[date].length > 1 ? "s" : ""}
                  </span>
                </h3>

                <div className="grid gap-4">
                  {groupedDefenses[date]
                    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
                    .map((defense) => {
                      const statusColor = getStatusColor(defense);
                      const statusLabel = getStatusLabel(defense);
                      const defenseTime = new Date(defense.dateTime);
                      const isPast = defenseTime < new Date();
                      const needsResults = statusLabel === "Needs Results";

                      return (
                        <div
                          key={defense.id}
                          className={`bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow
                            ${
                              statusColor === "green"
                                ? "border-l-4 border-l-green-500"
                                : statusColor === "amber"
                                ? "border-l-4 border-l-amber-500"
                                : statusColor === "red"
                                ? "border-l-4 border-l-red-500"
                                : statusColor === "purple"
                                ? "border-l-4 border-l-purple-500"
                                : "border-l-4 border-l-blue-500"
                            }
                          `}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span
                                  className={`px-3 py-1 rounded-full text-sm font-medium
                                  ${
                                    defense.type === "Proposal"
                                      ? "bg-indigo-100 text-indigo-700"
                                      : defense.type === "MidTerm"
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-teal-100 text-teal-700"
                                  }
                                `}
                                >
                                  {
                                    defenseTypes.find(
                                      (t) => t.value === defense.type
                                    )?.label
                                  }
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium
                                  ${
                                    statusColor === "green"
                                      ? "bg-green-100 text-green-700"
                                      : statusColor === "amber"
                                      ? "bg-amber-100 text-amber-700"
                                      : statusColor === "red"
                                      ? "bg-red-100 text-red-700"
                                      : statusColor === "purple"
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-blue-100 text-blue-700"
                                  }
                                `}
                                >
                                  {statusLabel}
                                </span>
                              </div>

                              <h4 className="font-semibold text-gray-900 mb-1">
                                {defense.groupName ||
                                  `Group #${defense.groupId}`}
                              </h4>
                              <p className="text-sm text-gray-500 mb-2">
                                {defense.projectTitle}
                              </p>

                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {defenseTime.toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {defense.venue && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {defense.venue}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {defense.type === "Proposal"
                                    ? "Committee Evaluation"
                                    : `${
                                        defense.internalEvaluators?.length || 0
                                      } Evaluators`}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-2">
                              {needsResults && (
                                <>
                                  <button
                                    onClick={() => openResultsModal(defense)}
                                    className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-1"
                                  >
                                    <ClipboardCheck className="h-4 w-4" />
                                    Enter Results
                                  </button>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() =>
                                        handleMarkCompleted(defense, "Accepted")
                                      }
                                      className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                                      title="Quick Accept"
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleMarkCompleted(defense, "Deferred")
                                      }
                                      className="p-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
                                      title="Quick Defer"
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleMarkCompleted(defense, "Rejected")
                                      }
                                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                                      title="Quick Reject"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </button>
                                  </div>
                                </>
                              )}

                              {!isPast && (
                                <>
                                  {defense.type === "Proposal" ? (
                                    <span
                                      className="px-3 py-2 text-gray-400 bg-gray-50 rounded-lg text-sm font-medium flex items-center gap-1 cursor-default"
                                      title="Evaluated by shared Proposal Committee"
                                    >
                                      <Shield className="h-4 w-4" />
                                      Committee
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => openPanelModal(defense)}
                                      className="px-3 py-2 text-teal-600 hover:bg-teal-50 rounded-lg text-sm font-medium flex items-center gap-1"
                                    >
                                      <UserPlus className="h-4 w-4" />
                                      Panel
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      handleNotifyParticipants(defense)
                                    }
                                    className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium flex items-center gap-1"
                                  >
                                    <Send className="h-4 w-4" />
                                    Notify
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => openEditModal(defense)}
                                className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(defense.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Defense Result Banner */}
                          {defense.result && (
                            <div
                              className={`mt-4 p-3 rounded-lg flex items-center gap-3
                              ${
                                defense.result === "Accepted"
                                  ? "bg-green-50 border border-green-200"
                                  : defense.result === "Deferred"
                                  ? "bg-amber-50 border border-amber-200"
                                  : "bg-red-50 border border-red-200"
                              }
                            `}
                            >
                              {defense.result === "Accepted" && (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              )}
                              {defense.result === "Deferred" && (
                                <RotateCcw className="h-5 w-5 text-amber-600" />
                              )}
                              {defense.result === "Rejected" && (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                              <div>
                                <p
                                  className={`font-medium
                                  ${
                                    defense.result === "Accepted"
                                      ? "text-green-800"
                                      : defense.result === "Deferred"
                                      ? "text-amber-800"
                                      : "text-red-800"
                                  }
                                `}
                                >
                                  {defense.result === "Accepted" &&
                                    "Proposal Accepted - Group can proceed"}
                                  {defense.result === "Deferred" &&
                                    "Deferred - Group must resubmit proposal"}
                                  {defense.result === "Rejected" &&
                                    "Rejected - Major revision required"}
                                </p>
                                {defense.resultRemarks && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {defense.resultRemarks}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Defenses Scheduled
            </h2>
            <p className="text-gray-500 mb-6">
              Start by scheduling defense sessions for your groups
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <Plus className="h-5 w-5" />
              Schedule First Defense
            </button>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingDefense ? "Edit Defense" : "Schedule New Defense"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group *
                </label>
                <select
                  value={formData.groupId}
                  onChange={(e) =>
                    setFormData({ ...formData, groupId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                  required
                >
                  <option value="">Select a group</option>
                  {groups
                    .filter(
                      (g) =>
                        g.status === "Active" || g.status === "PendingApproval"
                    )
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.groupName} - {g.projectTitle || "No title"}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Defense Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                  required
                >
                  {defenseTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venue
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) =>
                    setFormData({ ...formData, venue: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., Room 101, CS Building"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notifyParticipants}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notifyParticipants: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <span className="text-sm text-gray-700">
                  Send notifications to all participants
                </span>
              </label>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  {editingDefense ? "Update" : "Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Panel Allocation Modal */}
      {showPanelModal && selectedDefense && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Allocate Evaluation Panel
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {selectedDefense.groupName}
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Internal Evaluators
                </label>
                <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-3">
                  {staff
                    .filter((s) => s.isCommitteeMember)
                    .map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg"
                      >
                        <input
                          type="checkbox"
                          checked={formData.internalEvaluators.includes(
                            s.id.toString()
                          )}
                          onChange={() => handleInternalEvaluatorToggle(s.id)}
                          className="w-4 h-4 text-teal-600 rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {s.fullName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {s.designation}
                            {s.isHOD && " • HOD"}
                            {s.isFYPCoordinator && " • Coordinator"}
                          </p>
                        </div>
                      </label>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {formData.internalEvaluators.length} evaluator(s)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  External Evaluator (Optional)
                </label>
                <select
                  value={formData.externalEvaluatorId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      externalEvaluatorId: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="">-- No External Evaluator --</option>
                  {staff
                    .filter((s) => s.isCommitteeMember)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowPanelModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAllocatePanel}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Save Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Entry Modal */}
      {showResultsModal && selectedDefense && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Enter Defense Results
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {selectedDefense.groupName} -{" "}
                {
                  defenseTypes.find((t) => t.value === selectedDefense.type)
                    ?.label
                }
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Overall Result */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Defense Result *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["Accepted", "Deferred", "Rejected"].map((result) => (
                    <button
                      key={result}
                      type="button"
                      onClick={() =>
                        setDefenseResults((prev) => ({
                          ...prev,
                          groupResult: result,
                        }))
                      }
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        defenseResults.groupResult === result
                          ? result === "Accepted"
                            ? "border-green-500 bg-green-50"
                            : result === "Deferred"
                            ? "border-amber-500 bg-amber-50"
                            : "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {result === "Accepted" && (
                        <Check className="h-6 w-6 mx-auto mb-1 text-green-600" />
                      )}
                      {result === "Deferred" && (
                        <RotateCcw className="h-6 w-6 mx-auto mb-1 text-amber-600" />
                      )}
                      {result === "Rejected" && (
                        <XCircle className="h-6 w-6 mx-auto mb-1 text-red-600" />
                      )}
                      <p
                        className={`font-semibold ${
                          result === "Accepted"
                            ? "text-green-700"
                            : result === "Deferred"
                            ? "text-amber-700"
                            : "text-red-700"
                        }`}
                      >
                        {result}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {result === "Accepted" && "Proceed to next phase"}
                        {result === "Deferred" && "Must resubmit"}
                        {result === "Rejected" && "Major changes needed"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks / Feedback for Students
                </label>
                <textarea
                  value={defenseResults.remarks}
                  onChange={(e) =>
                    setDefenseResults((prev) => ({
                      ...prev,
                      remarks: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  rows={4}
                  placeholder="Enter feedback, suggestions, or reasons for the decision..."
                />
              </div>

              {/* Info based on result */}
              <div
                className={`p-4 rounded-lg ${
                  defenseResults.groupResult === "Accepted"
                    ? "bg-green-50 border border-green-200"
                    : defenseResults.groupResult === "Deferred"
                    ? "bg-amber-50 border border-amber-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    defenseResults.groupResult === "Accepted"
                      ? "text-green-800"
                      : defenseResults.groupResult === "Deferred"
                      ? "text-amber-800"
                      : "text-red-800"
                  }`}
                >
                  {defenseResults.groupResult === "Accepted" &&
                    "✓ Students will be notified that their proposal is accepted and they can proceed."}
                  {defenseResults.groupResult === "Deferred" &&
                    "⟳ Students will be asked to revise and resubmit their proposal."}
                  {defenseResults.groupResult === "Rejected" &&
                    "✕ Students will be notified to make major changes to their proposal."}
                </p>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowResultsModal(false);
                  setDefenseResults({
                    groupResult: "Accepted",
                    remarks: "",
                    memberMarks: {},
                  });
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleEnterResults}
                className={`px-5 py-2 text-white rounded-lg flex items-center gap-2 ${
                  defenseResults.groupResult === "Accepted"
                    ? "bg-green-600 hover:bg-green-700"
                    : defenseResults.groupResult === "Deferred"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                <Award className="h-4 w-4" />
                Save Results & Notify
              </button>
            </div>
          </div>
        </div>
      )}
    </CoordinatorLayout>
  );
};

export default CoordinatorDefenses;
