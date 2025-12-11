import { useState, useEffect } from "react";
import {
  Users,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  X,
  Calendar,
  CheckCircle2,
  Clock,
} from "lucide-react";
import api, { API_BASE } from "../../utils/api";
import CoordinatorLayout from "../../components/layouts/CoordinatorLayout";

const ViewSubmissions = () => {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [error, setError] = useState("");
  const [selectedDocType, setSelectedDocType] = useState("All");
  const [documentTypes, setDocumentTypes] = useState(["All"]);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_BASE}/coordinator/submissions/all`);

      if (response.ok) {
        const data = await response.json();
        const groupsData = data.groups || [];
        setGroups(groupsData);

        // Extract unique document types
        const types = new Set(["All"]);
        groupsData.forEach((group) => {
          group.documents?.forEach((doc) => {
            const docType = doc.documentType || doc.DocumentType;
            if (docType) types.add(docType);
          });
        });
        setDocumentTypes([...types]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || "Failed to load submissions");
      }
    } catch (err) {
      setError("Failed to load submissions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      const response = await fetch(
        `${API_BASE}/coordinator/submissions/document/${documentId}/download`,
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
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError("Failed to download document");
      }
    } catch (err) {
      console.error("Download error:", err);
      setError("Failed to download document");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      Pending: "bg-amber-100 text-amber-700",
      Approved: "bg-green-100 text-green-700",
      Rejected: "bg-red-100 text-red-700",
      Submitted: "bg-blue-100 text-blue-700",
      StudentSubmitted: "bg-blue-100 text-blue-700",
      SupervisorReviewed: "bg-purple-100 text-purple-700",
      CoordinatorFinalized: "bg-green-100 text-green-700",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
  };

  const filteredGroups =
    selectedDocType === "All"
      ? groups
      : groups
          .map((group) => ({
            ...group,
            documents: (group.documents || []).filter(
              (doc) =>
                (doc.documentType || doc.DocumentType) === selectedDocType
            ),
          }))
          .filter((group) => group.documents.length > 0);

  if (loading) {
    return (
      <CoordinatorLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </CoordinatorLayout>
    );
  }

  return (
    <CoordinatorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            View Document Submissions
          </h1>
          <p className="text-gray-500 mt-1">
            View and download all document submissions from FYP groups
          </p>
        </div>

        {/* Error Message */}
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

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Document Type
          </label>
          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Submissions by Group */}
        {filteredGroups.length > 0 ? (
          <div className="space-y-4">
            {filteredGroups.map((group) => {
              const groupId = group.groupId || group.GroupId;
              const isExpanded = expandedGroups.has(groupId);
              const documents = group.documents || [];

              return (
                <div
                  key={groupId}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div
                    className="p-4 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleGroup(groupId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <Users className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {group.groupName || group.GroupName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {group.projectTitle || group.ProjectTitle}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Supervisor:{" "}
                            {group.supervisorName || group.SupervisorName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                          {documents.length} document(s)
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4">
                      {/* Group Members */}
                      <div className="mb-4 pb-4 border-b">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Group Members
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(group.members || group.Members || []).map(
                            (member) => (
                              <span
                                key={member.id || member.Id}
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                              >
                                {member.studentName || member.StudentName} (
                                {member.enrollmentId || member.EnrollmentId})
                              </span>
                            )
                          )}
                        </div>
                      </div>

                      {/* Documents */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-700">
                          Submitted Documents
                        </h4>
                        {documents.length > 0 ? (
                          documents.map((doc) => {
                            const docId = doc.id || doc.Id;
                            const docType =
                              doc.documentType || doc.DocumentType;
                            const fileName = doc.fileName || doc.FileName;
                            const status =
                              doc.status ||
                              doc.Status ||
                              doc.workflowStatus ||
                              doc.WorkflowStatus;
                            const studentName =
                              doc.submittedByName || doc.SubmittedByName;
                            const uploadedAt =
                              doc.submittedAt ||
                              doc.SubmittedAt ||
                              doc.uploadedAt ||
                              doc.UploadedAt;

                            return (
                              <div
                                key={docId}
                                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <FileText className="h-5 w-5 text-indigo-500 mt-0.5" />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium text-gray-900">
                                          {docType}
                                        </p>
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                                            status
                                          )}`}
                                        >
                                          {status || "Submitted"}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-600">
                                        {fileName}
                                      </p>
                                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                        {studentName && (
                                          <>
                                            <span>By: {studentName}</span>
                                            <span>•</span>
                                          </>
                                        )}
                                        {uploadedAt && (
                                          <span>
                                            {new Date(
                                              uploadedAt
                                            ).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleDownload(docId, fileName)
                                    }
                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Download"
                                  >
                                    <Download className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No documents submitted yet
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Submissions Found
            </h2>
            <p className="text-gray-500">
              {selectedDocType === "All"
                ? "No document submissions yet"
                : `No submissions for ${selectedDocType}`}
            </p>
          </div>
        )}
      </div>
    </CoordinatorLayout>
  );
};

export default ViewSubmissions;
