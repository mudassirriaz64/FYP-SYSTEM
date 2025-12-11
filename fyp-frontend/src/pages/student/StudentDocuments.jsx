import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  File,
  FileCheck,
  BookOpen,
  ClipboardList,
  Calendar,
  Lock,
  Unlock,
  Users,
} from "lucide-react";
import api, { API_BASE } from "../../utils/api";

const StudentDocuments = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [documents, setDocuments] = useState([]);
  const [availableUploads, setAvailableUploads] = useState([]);
  const [unlockedDocuments, setUnlockedDocuments] = useState([]);
  const [monthlyReports, setMonthlyReports] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [showMonthlyReportModal, setShowMonthlyReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const fileInputRef = useRef(null);

  // Monthly report form
  const [reportForm, setReportForm] = useState({
    summary: "",
    challengesFaced: "",
    nextMonthPlan: "",
    progressPercentage: 0,
  });

  const documentTypes = [
    {
      type: "SRS",
      name: "Software Requirements Specification",
      icon: BookOpen,
      color: "green",
    },
    {
      type: "SDS",
      name: "System Design Specification",
      icon: FileText,
      color: "blue",
    },
    {
      type: "LogForm1",
      name: "Log Form 1 (Week 1-2)",
      icon: ClipboardList,
      color: "purple",
    },
    {
      type: "LogForm2",
      name: "Log Form 2 (Week 3-4)",
      icon: ClipboardList,
      color: "purple",
    },
    {
      type: "LogForm3",
      name: "Log Form 3 (Week 5-6)",
      icon: ClipboardList,
      color: "purple",
    },
    {
      type: "LogForm4",
      name: "Log Form 4 (Week 7-8)",
      icon: ClipboardList,
      color: "purple",
    },
    {
      type: "LogForm5",
      name: "Log Form 5 (Week 9-10)",
      icon: ClipboardList,
      color: "purple",
    },
    {
      type: "LogForm6",
      name: "Log Form 6 (Week 11-12)",
      icon: ClipboardList,
      color: "purple",
    },
    {
      type: "LogForm7",
      name: "Log Form 7 (Week 13-14)",
      icon: ClipboardList,
      color: "purple",
    },
    {
      type: "LogForm8",
      name: "Log Form 8 (Week 15-16)",
      icon: ClipboardList,
      color: "purple",
    },
    {
      type: "MidTermReport",
      name: "Mid-Term Report",
      icon: FileText,
      color: "indigo",
    },
    {
      type: "FinalReport",
      name: "Final Report",
      icon: FileText,
      color: "teal",
    },
    { type: "Thesis", name: "Final Thesis", icon: BookOpen, color: "rose" },
    {
      type: "PlagiarismReport",
      name: "Plagiarism Report",
      icon: FileCheck,
      color: "red",
    },
    {
      type: "SourceCode",
      name: "Source Code (ZIP)",
      icon: File,
      color: "gray",
    },
  ];

  useEffect(() => {
    fetchAvailableDocuments();
    fetchUploadedDocuments();
    fetchMonthlyReports();
  }, []);

  const fetchAvailableDocuments = async () => {
    try {
      setLoading(true);

      // Fetch all available documents (both locked and unlocked)
      const response = await api.get(`${API_BASE}/student-docs/documents/available`);
      if (response.ok) {
        const data = await response.json();
        // Normalize keys to ensure consistent rendering
        const docs = (data.documents || []).map((d) => ({
          Type: d.Type ?? d.type ?? d.DocumentType ?? d.documentType ?? "",
          Name:
            d.Name ?? d.name ??
            (d.Type === "SRS"
              ? "Software Requirement Specification (SRS)"
              : d.Type === "SDS"
              ? "System Design Specification (SDS)"
              : d.Type || "Document"),
          Description: d.Description ?? d.description ?? "",
          IsUnlocked: d.IsUnlocked ?? d.isUnlocked ?? true,
          DeadlineDate: d.DeadlineDate ?? d.deadlineDate ?? null,
          Instructions: d.Instructions ?? d.instructions ?? "",
          RequiresSupervisorApproval:
            d.RequiresSupervisorApproval ?? d.requiresSupervisorApproval ?? false,
          IsSubmitted: d.IsSubmitted ?? d.isSubmitted ?? false,
          SubmissionStatus: d.SubmissionStatus ?? d.submissionStatus ?? "Not Submitted",
        }));
        console.log("Available documents (normalized):", docs);
        setAvailableUploads(docs);
      } else {
        console.error("Failed to fetch documents:", response.status);
        setAvailableUploads([]);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUploadedDocuments = async () => {
    try {
      // Fetch uploaded documents
      const response = await api.get(`${API_BASE}/student/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Failed to load uploaded documents:", err);
    }
  };

  const fetchMonthlyReports = async () => {
    try {
      const reports = [];
      for (let month = 1; month <= 8; month++) {
        const response = await api.get(
          `${API_BASE}/student-docs/monthly-reports/${month}/status`
        );
        if (response.ok) {
          const data = await response.json();
          reports.push(data);
        }
      }
      setMonthlyReports(reports);
    } catch (err) {
      console.error("Failed to load monthly reports:", err);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDocType) return;

    // Validate file
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError("File size must be less than 50MB");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
      "application/x-zip-compressed",
    ];

    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".zip")) {
      setError("Only PDF, DOC, DOCX, and ZIP files are allowed");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", selectedDocType);

      const response = await fetch(`${API_BASE}/student/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (response.ok) {
        setSuccess("Document uploaded successfully!");
        fetchAvailableDocuments();
        fetchUploadedDocuments();
        setSelectedDocType(null);
      } else {
        const data = await response.json().catch(() => ({ message: "Failed to upload document" }));
        console.error("Upload failed:", data);
        setError(data.message || "Failed to upload document");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload document: " + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmitMonthlyReport = async () => {
    if (!selectedReport) return;

    try {
      setError("");
      const response = await api.post(
        `${API_BASE}/student-docs/monthly-reports/${selectedReport.monthNumber}/submit`,
        reportForm
      );

      if (response.ok) {
        setSuccess(
          `Monthly Report ${selectedReport.monthNumber} submitted successfully!`
        );
        setShowMonthlyReportModal(false);
        setSelectedReport(null);
        setReportForm({
          summary: "",
          challengesFaced: "",
          nextMonthPlan: "",
          progressPercentage: 0,
        });
        await fetchMonthlyReports();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to submit report");
      }
    } catch (err) {
      setError("Failed to submit report");
    }
  };

  const handleDelete = async (documentId) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await api.delete(
        `${API_BASE}/student/documents/${documentId}`
      );

      if (response.ok) {
        setSuccess("Document deleted");
        fetchAvailableDocuments();
        fetchUploadedDocuments();
      } else {
        setError("Failed to delete document");
      }
    } catch (err) {
      setError("Failed to delete document");
    }
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      const response = await fetch(
        `${API_BASE}/student/documents/${documentId}/download`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        setError("Failed to download document");
      }
    } catch (err) {
      setError("Failed to download document");
    }
  };

  const getDocTypeInfo = (type) => {
    return (
      documentTypes.find((d) => d.type === type) || {
        type,
        name: type,
        icon: FileText,
        color: "gray",
      }
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      Pending: "bg-amber-100 text-amber-700",
      Approved: "bg-green-100 text-green-700",
      Rejected: "bg-red-100 text-red-700",
      Submitted: "bg-blue-100 text-blue-700",
      Graded: "bg-green-100 text-green-700",
      UnderReview: "bg-blue-100 text-blue-700",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Group documents by category
  const uploadedTypes = new Set(documents.map((d) => d.documentType));
  const unlockedTypes = new Set(availableUploads);

  // Get unlocked document info
  const getUnlockedInfo = (docType) => {
    return unlockedDocuments.find((u) => u.documentType === docType);
  };

  // Check if document is unlocked
  const isUnlocked = (docType) => {
    return unlockedTypes.has(docType);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
        <p className="text-gray-500 mt-1">
          Upload and manage your FYP documents
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

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept=".pdf,.doc,.docx,.zip"
        className="hidden"
      />

      {/* Monthly Reports Section */}
      {monthlyReports.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-purple-50 border-b">
            <h3 className="font-semibold text-gray-900">
              Monthly Progress Reports
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Each report requires 4 weekly supervisor meetings
            </p>
          </div>

          <div className="divide-y">
            {monthlyReports.map((report) => (
              <div key={report.monthNumber} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">
                          Monthly Report {report.monthNumber}
                        </h4>
                        {report.isUnlocked ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
                            <Unlock className="h-3 w-3" />
                            Unlocked
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Locked
                          </span>
                        )}
                      </div>

                      {report.isUnlocked && (
                        <>
                          {/* Meeting Progress */}
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">
                                Weekly Meetings:{" "}
                                {report.weeklyMeetingsCompleted}/
                                {report.requiredMeetings}
                              </span>
                              {report.canSubmit ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <Clock className="h-4 w-4 text-amber-600" />
                              )}
                            </div>

                            {/* Progress Bar */}
                            <div className="flex gap-1">
                              {[1, 2, 3, 4].map((week) => (
                                <div
                                  key={week}
                                  className={`flex-1 h-2 rounded-full ${
                                    week <= report.weeklyMeetingsCompleted
                                      ? "bg-green-500"
                                      : "bg-gray-200"
                                  }`}
                                />
                              ))}
                            </div>

                            {/* Meeting Details */}
                            {report.meetings && report.meetings.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {report.meetings.map((meeting) => (
                                  <div
                                    key={meeting.weekNumber}
                                    className="text-xs text-gray-600 flex items-center gap-2"
                                  >
                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                    <span>
                                      Week {meeting.weekNumber} -{" "}
                                      {new Date(
                                        meeting.meetingDate
                                      ).toLocaleDateString()}
                                    </span>
                                    {meeting.topicsDiscussed && (
                                      <span className="text-gray-500">
                                        •{" "}
                                        {meeting.topicsDiscussed.substring(
                                          0,
                                          40
                                        )}
                                        ...
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Report Status */}
                          {report.report && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                                      report.report.status
                                    )}`}
                                  >
                                    {report.report.status}
                                  </span>
                                  {report.report.submittedAt && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Submitted:{" "}
                                      {new Date(
                                        report.report.submittedAt
                                      ).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                                {report.report.supervisorMarks && (
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900">
                                      {report.report.supervisorMarks}/10
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Marks
                                    </p>
                                  </div>
                                )}
                              </div>
                              {report.report.supervisorRemarks && (
                                <p className="text-xs text-gray-600 mt-2 italic">
                                  "{report.report.supervisorRemarks}"
                                </p>
                              )}
                            </div>
                          )}

                          {/* Deadline */}
                          {report.deadlineDate && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Due:{" "}
                                {new Date(
                                  report.deadlineDate
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </>
                      )}

                      {!report.isUnlocked && (
                        <p className="text-sm text-gray-500">
                          This report will be unlocked by your coordinator
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  {report.isUnlocked && (
                    <div className="shrink-0">
                      {report.canSubmit && !report.report ? (
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setShowMonthlyReportModal(true);
                          }}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Submit
                        </button>
                      ) : !report.canSubmit ? (
                        <div className="text-right">
                          <p className="text-xs text-amber-600 font-medium">
                            {4 - report.weeklyMeetingsCompleted} more meetings
                          </p>
                          <p className="text-xs text-gray-500">needed</p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Documents Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Document Submissions
        </h3>

        {availableUploads.filter((doc) => !doc.Type?.startsWith("MonthlyReport") && !doc.Type?.startsWith("Monthly"))
          .length > 0 ? (
          <div className="space-y-4">
            {availableUploads
              .filter((doc) => !doc.Type?.startsWith("MonthlyReport") && !doc.Type?.startsWith("Monthly"))
              .map((doc) => {
                const isUploaded = doc.IsSubmitted || false;
                const uploadedDoc = documents.find((d) => d.documentType === doc.Type);

                return (
                  <div
                    key={doc.Type}
                    className={`p-4 border-2 rounded-xl ${
                      isUploaded
                        ? "border-green-200 bg-green-50"
                        : "border-indigo-200 bg-indigo-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-indigo-100">
                          <FileText className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">
                              {doc.Name || doc.Type || "Document"}
                            </h4>
                            <Unlock className="h-4 w-4 text-green-600" />
                          </div>

                          {doc.Description && (
                            <p className="text-xs text-gray-600 mb-2">
                              {doc.Description}
                            </p>
                          )}

                          {doc.DeadlineDate && (
                            <div className="flex items-center gap-1 text-xs text-amber-600 mb-2">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Due:{" "}
                                {new Date(
                                  doc.DeadlineDate
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}

                          {isUploaded && uploadedDoc && (
                            <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {uploadedDoc.fileName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Uploaded: {new Date(uploadedDoc.uploadedAt).toLocaleDateString()}
                                  </p>
                                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(uploadedDoc.status)}`}>
                                    {uploadedDoc.status || "Submitted"}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleDownload(uploadedDoc.id, uploadedDoc.fileName)}
                                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                  title="Download"
                                >
                                  <Download className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {!isUploaded && (
                          <button
                            onClick={() => {
                              setSelectedDocType(doc.Type);
                              fileInputRef.current?.click();
                            }}
                            disabled={uploading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            Upload
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Lock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              No documents unlocked yet. Your coordinator will unlock documents
              for submission.
            </p>
          </div>
        )}

        {uploading && (
          <div className="flex items-center justify-center gap-2 py-4 mt-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            <span className="text-gray-600">Uploading...</span>
          </div>
        )}
      </div>

      {/* Uploaded Documents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Uploaded Documents</h3>

        {documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc) => {
              const docInfo = getDocTypeInfo(doc.documentType);
              const Icon = docInfo.icon;

              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 bg-${docInfo.color}-100 rounded-lg`}>
                      <Icon className={`h-5 w-5 text-${docInfo.color}-600`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {docInfo.name}
                      </h4>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span>{doc.fileName}</span>
                        <span>•</span>
                        <span>
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {doc.workflowStatus && (
                        <div className="mt-2">
                          {(() => {
                            const isLogForm = doc.documentType?.startsWith("LogForm");
                            if (doc.workflowStatus === "StudentSubmitted") {
                              return (
                                <p className="text-xs text-blue-600">
                                  ⏳ {isLogForm ? "Awaiting supervisor review" : "Awaiting coordinator review"}
                                </p>
                              );
                            }
                            if (doc.workflowStatus === "SupervisorReviewed") {
                              return (
                                <p className="text-xs text-purple-600">
                                  ✓ {isLogForm ? "Reviewed by supervisor • Awaiting coordinator" : "Pending coordinator finalization"}
                                </p>
                              );
                            }
                            if (doc.workflowStatus === "SupervisorRejected") {
                              return isLogForm ? (
                                <p className="text-xs text-red-600">
                                  ✗ Rejected by supervisor. Please resubmit.
                                  {doc.supervisorRemarks && (
                                    <span className="block mt-1 italic">
                                      "{doc.supervisorRemarks}"
                                    </span>
                                  )}
                                </p>
                              ) : (
                                <p className="text-xs text-red-600">
                                  ✗ Changes requested. Please resubmit.
                                </p>
                              );
                            }
                            if (doc.workflowStatus === "CoordinatorFinalized") {
                              return (
                                <p className="text-xs text-green-600">
                                  ✓ Finalized by {doc.coordinatorName || "Coordinator"}
                                </p>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                        doc.status
                      )}`}
                    >
                      {doc.status || "Submitted"}
                    </span>
                    <button
                      onClick={() => handleDownload(doc.id, doc.fileName)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    {(doc.workflowStatus === "StudentSubmitted" ||
                      doc.workflowStatus === "SupervisorRejected") && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No documents uploaded yet</p>
          </div>
        )}
      </div>

      {/* Monthly Report Submit Modal */}
      {showMonthlyReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                Submit Monthly Report {selectedReport.monthNumber}
              </h3>
              <button
                onClick={() => setShowMonthlyReportModal(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Summary *
                </label>
                <textarea
                  value={reportForm.summary}
                  onChange={(e) =>
                    setReportForm({ ...reportForm, summary: e.target.value })
                  }
                  rows={4}
                  placeholder="Summarize your progress this month..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Challenges Faced
                </label>
                <textarea
                  value={reportForm.challengesFaced}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      challengesFaced: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="What challenges did you encounter?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Month Plan
                </label>
                <textarea
                  value={reportForm.nextMonthPlan}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      nextMonthPlan: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="What do you plan to accomplish next month?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progress Percentage (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={reportForm.progressPercentage}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      progressPercentage: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowMonthlyReportModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitMonthlyReport}
                  disabled={!reportForm.summary}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDocuments;
