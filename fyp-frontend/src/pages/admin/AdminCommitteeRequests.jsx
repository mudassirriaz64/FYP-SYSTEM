import { useState, useEffect } from "react";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Users,
  Search,
  Filter,
  Check,
  X,
  Power,
  RefreshCw,
} from "lucide-react";
import api, { API_BASE } from "../../utils/api";
import AdminLayout from "../../components/layouts/AdminLayout";

const AdminCommitteeRequests = () => {
  const [loading, setLoading] = useState(true);
  const [committees, setCommittees] = useState([]);
  const [stats, setStats] = useState({ pending: 0, active: 0 });
  const [filter, setFilter] = useState("all"); // all, pending, active
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(false);

  // Form States
  const [submitting, setSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [creds, setCreds] = useState({ username: "", password: "", email: "" });
  const [generatedCreds, setGeneratedCreds] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_BASE}/admin/committee/requests`);
      if (response.ok) {
        const data = await response.json();
        setCommittees(data.committees || []);
        setStats({
          pending: data.pendingCount || 0,
          active: data.activeCount || 0,
        });
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      setSubmitting(true);
      setError("");

      const payload = {};
      if (creds.username) payload.username = creds.username;
      if (creds.password) payload.password = creds.password;
      if (creds.email) payload.email = creds.email;

      const response = await api.post(
        `${API_BASE}/admin/committee/requests/${selectedRequest.id}/approve`,
        payload
      );

      if (response.ok) {
        const data = await response.json();
        setGeneratedCreds(data.login);
        setShowApproveModal(false);
        setShowCredsModal(true);
        fetchRequests();
        setCreds({ username: "", password: "", email: "" });
      } else {
        const data = await response.json();
        setError(data.message || "Failed to approve request");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      setSubmitting(true);
      setError("");

      const response = await api.post(
        `${API_BASE}/admin/committee/requests/${selectedRequest.id}/reject`,
        { reason: rejectReason }
      );

      if (response.ok) {
        setSuccess("Request rejected successfully");
        setShowRejectModal(false);
        fetchRequests();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to reject request");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to deactivate this committee's login?"
      )
    )
      return;

    try {
      const response = await api.post(
        `${API_BASE}/admin/committee/requests/${id}/deactivate`
      );
      if (response.ok) {
        fetchRequests();
        setSuccess("Committee login deactivated");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Failed to deactivate:", err);
    }
  };

  const filteredCommittees = committees.filter((c) => {
    if (filter === "all") return true;
    if (filter === "pending") return c.status === "Pending";
    if (filter === "active") return c.status === "Active";
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Committee Requests
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage shared logins for department proposal committees
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Requests</p>
              <p className="text-2xl font-bold text-amber-600">
                {stats.pending}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Committees</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.active}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5" />
            {success}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {["all", "pending", "active"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                    filter === f
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left font-medium">
                    Committee info
                  </th>
                  <th className="px-6 py-4 text-left font-medium">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left font-medium">Status</th>
                  <th className="px-6 py-4 text-left font-medium">Members</th>
                  <th className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCommittees.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No committees found
                    </td>
                  </tr>
                ) : (
                  filteredCommittees.map((committee) => (
                    <tr key={committee.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {committee.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Req by: {committee.createdByName || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(committee.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {committee.departmentCode ||
                            committee.department ||
                            "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {committee.status === "Active" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : committee.status === "Pending" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {committee.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex -space-x-2 overflow-hidden">
                          {committee.members.slice(0, 3).map((m, i) => (
                            <div
                              key={m.id}
                              className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600"
                              title={m.staffFullName}
                            >
                              {m.staffFullName?.charAt(0)}
                            </div>
                          ))}
                          {committee.members.length > 3 && (
                            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                              +{committee.members.length - 3}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {committee.members.length} Staff
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {committee.status === "Pending" && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedRequest(committee);
                                  setShowApproveModal(true);
                                  // Pre-fill email
                                  setCreds((prev) => ({
                                    ...prev,
                                    email: `committee.${
                                      committee.departmentCode?.toLowerCase() ||
                                      "dept"
                                    }@fyp.edu`,
                                  }));
                                }}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Approve & Create Login"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequest(committee);
                                  setShowRejectModal(true);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          {committee.status === "Active" && (
                            <button
                              onClick={() => handleDeactivate(committee.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Deactivate Login"
                            >
                              <Power className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                Approve Committee
              </h3>
              <button
                onClick={() => setShowApproveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApprove} className="p-6 space-y-4">
              <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                This will create a shared user account for the committee.
                Credentials will be generated automatically if left blank.
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Username (Optional)
                </label>
                <input
                  type="text"
                  value={creds.username}
                  onChange={(e) =>
                    setCreds({ ...creds, username: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder={`e.g. committee_${
                    selectedRequest?.departmentCode?.toLowerCase() || "name"
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Password (Optional)
                </label>
                <input
                  type="text"
                  value={creds.password}
                  onChange={(e) =>
                    setCreds({ ...creds, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Leave blank to generate randomly"
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? "Approving..." : "Approve & Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredsModal && generatedCreds && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Login Created Successfully
            </h3>
            <p className="text-gray-500 mb-6">
              Please copy the credentials below and share them with the
              coordinator securely.
            </p>

            <div className="bg-gray-100 p-4 rounded-xl text-left space-y-3 mb-6 font-mono text-sm">
              <div>
                <span className="text-gray-500 block text-xs uppercase tracking-wider">
                  Username
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">
                    {generatedCreds.username}
                  </span>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <span className="text-gray-500 block text-xs uppercase tracking-wider">
                  Password
                </span>
                <span className="font-bold text-gray-900 break-all">
                  {generatedCreds.password}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowCredsModal(false)}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
            >
              Done, I have copied it
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                Reject Request
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleReject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Rejection
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  rows={3}
                  required
                  placeholder="e.g. Not enough senior members..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? "Rejecting..." : "Reject Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCommitteeRequests;
