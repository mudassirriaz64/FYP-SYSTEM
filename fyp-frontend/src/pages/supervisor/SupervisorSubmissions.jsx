import { useEffect, useState } from "react";
import { Download, FolderOpen, FileText, AlertCircle, Loader2 } from "lucide-react";
import SupervisorLayout from "../../components/layouts/SupervisorLayout";
import api, { API_BASE } from "../../utils/api";

const SupervisorSubmissions = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`${API_BASE}/supervisor/submissions`);
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Failed to load submissions");
      }
    } catch (err) {
      setError("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      const response = await fetch(
        `${API_BASE}/supervisor/submissions/document/${documentId}/download`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        setError("Download failed. Please try again.");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Download failed. Please try again.");
    }
  };

  return (
    <SupervisorLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Group Submissions</h1>
            <p className="text-gray-500 mt-1">
              View and download documents submitted by your groups
            </p>
          </div>
          <button
            onClick={fetchSubmissions}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64 text-amber-700">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white border border-dashed border-amber-200 rounded-2xl p-10 text-center">
            <FolderOpen className="h-12 w-12 text-amber-400 mx-auto mb-3" />
            <p className="text-gray-600">No submissions found for your groups yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div
                key={group.groupId}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="px-6 py-4 border-b bg-amber-50/60 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {group.groupName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {group.projectTitle}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {group.departmentName || "Department"}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p className="font-medium text-gray-700">Members</p>
                    <p>
                      {group.members
                        ?.map((m) => `${m.studentName || ""} (${m.enrollmentId || ""})`)
                        .join(", ") || "-"}
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Documents
                    </h4>
                    {group.documents?.length ? (
                      <div className="space-y-3">
                        {group.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-amber-100 rounded-lg">
                                <FileText className="h-4 w-4 text-amber-700" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {doc.documentType}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {doc.fileName} • {new Date(doc.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                {doc.status || "Submitted"}
                              </span>
                              <button
                                onClick={() => handleDownload(doc.id, doc.fileName)}
                                className="p-2 text-amber-700 hover:bg-amber-50 rounded-lg"
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No documents submitted yet.</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Forms
                    </h4>
                    {group.proposals?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {group.proposals.map((p) => (
                          <span
                            key={p.id}
                            className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700"
                          >
                            {p.formType} • {p.status || "Submitted"}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No forms submitted yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SupervisorLayout>
  );
};

export default SupervisorSubmissions;
