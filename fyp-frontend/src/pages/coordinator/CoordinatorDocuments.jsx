import { useState, useEffect } from "react";
import {
  FileText,
  Lock,
  Unlock,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Eye,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import api, { API_BASE } from "../../utils/api";
import CoordinatorLayout from "../../components/layouts/CoordinatorLayout";

const CoordinatorDocuments = () => {
  const [loading, setLoading] = useState(true);
  const [controls, setControls] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedDocs, setExpandedDocs] = useState(new Set());

  // Modal states
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [unlockForm, setUnlockForm] = useState({
    deadlineDate: "",
    message: "",
    instructions: "",
  });

  useEffect(() => {
    fetchControls();
  }, []);

  const fetchControls = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `${API_BASE}/coordinator/documents/controls`
      );

      if (response.ok) {
        const data = await response.json();
        setControls(data.controls || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || "Failed to load document controls");
      }
    } catch (err) {
      setError("Failed to load document controls");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!selectedDoc) return;

    if (!unlockForm.deadlineDate) {
      setError("Deadline is required to unlock a document.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await api.post(
        `${API_BASE}/coordinator/documents/unlock/${selectedDoc.documentType}`,
        {
          ...unlockForm,
          // Normalize to match backend expectations
          deadlineDate: unlockForm.deadlineDate,
        }
      );

      if (response.ok) {
        setSuccess(`${selectedDoc.documentType} unlocked successfully`);
        setShowUnlockModal(false);
        setSelectedDoc(null);
        setUnlockForm({ deadlineDate: "", message: "", instructions: "" });
        await fetchControls();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to unlock document");
      }
    } catch (err) {
      setError("Failed to unlock document");
    }
  };

  const handleLock = async (documentType) => {
    if (
      !confirm(
        `Are you sure you want to lock ${documentType}? Students will no longer be able to submit.`
      )
    ) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await api.post(
        `${API_BASE}/coordinator/documents/lock/${documentType}`
      );

      if (response.ok) {
        setSuccess(`${documentType} locked successfully`);
        await fetchControls();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to lock document");
      }
    } catch (err) {
      setError("Failed to lock document");
    }
  };

  const toggleExpand = (docType) => {
    const newExpanded = new Set(expandedDocs);
    if (newExpanded.has(docType)) {
      newExpanded.delete(docType);
    } else {
      newExpanded.add(docType);
    }
    setExpandedDocs(newExpanded);
  };

  const getDocumentIcon = (type) => {
    if (type.startsWith("Form")) return FileText;
    if (type.startsWith("MonthlyReport")) return ClipboardList;
    return BookOpen;
  };

  const getDocumentColor = (type) => {
    if (type === "FormA") return "blue";
    if (type === "FormB") return "indigo";
    if (type.startsWith("MonthlyReport")) return "purple";
    if (type === "SRS" || type === "SDS") return "green";
    return "gray";
  };

  const getDocumentName = (type) => {
    if (type.startsWith("MonthlyReport")) {
      const num = type.replace("MonthlyReport", "");
      return `Monthly Report ${num}`;
    }
    return type;
  };

  // Group documents by category
  const documentCategories = [
    {
      name: "Forms",
      types: ["FormA", "FormB", "FormC", "FormD"],
    },
    {
      name: "Documentation",
      types: ["SRS", "SDS"],
    },
    {
      name: "Monthly Reports",
      types: Array.from({ length: 8 }, (_, i) => `MonthlyReport${i + 1}`),
    },
    {
      name: "Final Deliverables",
      types: [
        "FinalReport",
        "Thesis",
        "PlagiarismReport",
        "Poster",
        "DemoVideo",
      ],
    },
  ];

  const stats = {
    totalDocuments: controls.length,
    unlocked: controls.filter((c) => c.isUnlocked).length,
    locked: controls.filter((c) => !c.isUnlocked).length,
    pendingReview: controls.reduce(
      (sum, c) => sum + (c.pendingApprovalCount || 0),
      0
    ),
  };

  return (
    <CoordinatorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Document Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage document releases and view submissions
          </p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalDocuments}
                </p>
                <p className="text-xs text-gray-500">Total Documents</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Unlock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.unlocked}
                </p>
                <p className="text-xs text-gray-500">Unlocked</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Lock className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.locked}
                </p>
                <p className="text-xs text-gray-500">Locked</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pendingReview}
                </p>
                <p className="text-xs text-gray-500">Pending Review</p>
              </div>
            </div>
          </div>
        </div>

        {/* Document Categories */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {documentCategories.map((category) => {
              const categoryControls = controls.filter((c) =>
                category.types.includes(c.documentType)
              );

              // Also show if no controls exist yet for this category
              const allDocsInCategory = category.types.map((type) => {
                const existing = categoryControls.find(
                  (c) => c.documentType === type
                );
                return (
                  existing || {
                    documentType: type,
                    isUnlocked: false,
                    totalGroups: 0,
                    submittedCount: 0,
                    pendingApprovalCount: 0,
                  }
                );
              });

              return (
                <div
                  key={category.name}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="px-6 py-4 bg-gray-50 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {category.name}
                    </h2>
                  </div>
                  <div className="divide-y">
                    {allDocsInCategory.map((control) => {
                      const Icon = getDocumentIcon(control.documentType);
                      const color = getDocumentColor(control.documentType);
                      const isExpanded = expandedDocs.has(control.documentType);
                      const isMonthlyReport =
                        control.documentType.startsWith("MonthlyReport");

                      return (
                        <div key={control.documentType}>
                          <div className="p-4 hover:bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div
                                className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center`}
                              >
                                <Icon className={`h-5 w-5 text-${color}-600`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-gray-900">
                                    {getDocumentName(control.documentType)}
                                  </h3>
                                  {isMonthlyReport && (
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                      Requires 4 Weekly Meetings
                                    </span>
                                  )}
                                </div>
                                {control.isUnlocked && (
                                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                    <span>
                                      {control.submittedCount || 0}/
                                      {control.totalGroups || 0} submitted
                                    </span>
                                    {control.pendingApprovalCount > 0 && (
                                      <span className="text-amber-600">
                                        {control.pendingApprovalCount} pending
                                        approval
                                      </span>
                                    )}
                                    {control.deadlineDate && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        Due:{" "}
                                        {new Date(
                                          control.deadlineDate
                                        ).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {control.isUnlocked ? (
                                <>
                                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                                    <Unlock className="h-4 w-4" />
                                    Unlocked
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleLock(control.documentType)
                                    }
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors"
                                  >
                                    Lock
                                  </button>
                                  {(control.submittedCount > 0 ||
                                    control.pendingApprovalCount > 0) && (
                                    <button
                                      onClick={() =>
                                        toggleExpand(control.documentType)
                                      }
                                      className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="h-5 w-5" />
                                      ) : (
                                        <ChevronDown className="h-5 w-5" />
                                      )}
                                    </button>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium flex items-center gap-1">
                                    <Lock className="h-4 w-4" />
                                    Locked
                                  </span>
                                  <button
                                    onClick={() => {
                                      setSelectedDoc(control);
                                      setShowUnlockModal(true);
                                    }}
                                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors"
                                  >
                                    Unlock
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Expanded Submissions View */}
                          {isExpanded && control.isUnlocked && (
                            <div className="px-4 pb-4 bg-gray-50">
                              <div className="bg-white rounded-lg border p-4">
                                <p className="text-sm text-gray-600 mb-2">
                                  Viewing submissions for{" "}
                                  {getDocumentName(control.documentType)}
                                </p>
                                <a
                                  href={`/coordinator/submissions?filter=${control.documentType}`}
                                  className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1"
                                >
                                  <Eye className="h-4 w-4" />
                                  View All Submissions
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unlock Modal */}
      {showUnlockModal && selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                Unlock {getDocumentName(selectedDoc.documentType)}
              </h3>
              <button
                onClick={() => {
                  setShowUnlockModal(false);
                  setSelectedDoc(null);
                }}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={unlockForm.deadlineDate}
                  onChange={(e) =>
                    setUnlockForm({
                      ...unlockForm,
                      deadlineDate: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message to Students (Optional)
                </label>
                <textarea
                  value={unlockForm.message}
                  onChange={(e) =>
                    setUnlockForm({ ...unlockForm, message: e.target.value })
                  }
                  rows={3}
                  placeholder="e.g., Please submit your document by the deadline"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructions (Optional)
                </label>
                <textarea
                  value={unlockForm.instructions}
                  onChange={(e) =>
                    setUnlockForm({
                      ...unlockForm,
                      instructions: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="e.g., Ensure all sections are filled completely"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowUnlockModal(false);
                    setSelectedDoc(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnlock}
                  disabled={!unlockForm.deadlineDate}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Unlock Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CoordinatorLayout>
  );
};

export default CoordinatorDocuments;
