import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
} from "lucide-react";
import api, { API_BASE } from "../../utils/api";
import CoordinatorLayout from "../../components/layouts/CoordinatorLayout";

const CoordinatorCommittee = () => {
  const [loading, setLoading] = useState(true);
  const [committee, setCommittee] = useState(null);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [committeeName, setCommitteeName] = useState(
    "Proposal Defense Committee"
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [committeeRes, staffRes] = await Promise.all([
        api.get(`${API_BASE}/coordinator/committee`),
        api.get(`${API_BASE}/coordinator/committee/available-staff`),
      ]);

      if (committeeRes.ok) {
        const data = await committeeRes.json();
        setCommittee(data.committee);
      }

      if (staffRes.ok) {
        const data = await staffRes.json();
        setAvailableStaff(data.staff || []);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load committee data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommittee = async (e) => {
    e.preventDefault();
    if (selectedStaffIds.length < 2) {
      setError("Please select at least 2 members");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await api.post(`${API_BASE}/coordinator/committee`, {
        name: committeeName,
        staffIds: selectedStaffIds,
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        setShowCreateModal(false);
        fetchData(); // Refresh data
        setTimeout(() => setSuccess(""), 5000);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to create committee");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStaffSelection = (staffId) => {
    if (selectedStaffIds.includes(staffId)) {
      setSelectedStaffIds(selectedStaffIds.filter((id) => id !== staffId));
    } else {
      setSelectedStaffIds([...selectedStaffIds, staffId]);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "Active")
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Active
        </span>
      );
    if (status === "Pending")
      return (
        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
          <Clock className="w-3 h-3" /> Pending Approval
        </span>
      );
    return (
      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
        {status}
      </span>
    );
  };

  return (
    <CoordinatorLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Proposal Committee
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage the shared committee for proposal defenses
            </p>
          </div>
          {!committee && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Form Committee
            </button>
          )}
          {committee && (
            <button
              onClick={() => {
                setSelectedStaffIds(committee.members.map((m) => m.staffId));
                setCommitteeName(committee.name);
                setShowCreateModal(true);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium"
            >
              <Users className="w-4 h-4" />
              Edit Members
            </button>
          )}
        </div>

        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5" />
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Current Committee Status */}
        {committee ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {committee.name}
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    {getStatusBadge(committee.status)}
                    <span className="text-sm text-gray-500">
                      Created{" "}
                      {new Date(committee.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {committee.hasLogin ? (
                    <div className="mt-3 bg-green-50 border border-green-100 rounded-lg p-3">
                      <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Shared Login Active
                      </p>
                      <p className="text-xs text-green-600 mt-1 ml-6">
                        Email:{" "}
                        <span className="font-mono">
                          {committee.loginEmail}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg p-3">
                      <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Awaiting SuperAdmin Approval
                      </p>
                      <p className="text-xs text-amber-600 mt-1 ml-6">
                        Login credentials will be generated once approved.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Committee Members
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {committee.members.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 border border-gray-200 rounded-xl flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold shrink-0">
                      {member.staffFullName?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {member.staffFullName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.staffDesignation || "Faculty Member"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No Committee Formed
            </h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              Create a proposal defense committee to manage and evaluate student
              proposals collectively. Once formed, you can request a shared
              login from the SuperAdmin.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              Get Started
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {committee ? "Update Committee" : "Form New Committee"}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Committee Name
                  </label>
                  <input
                    type="text"
                    value={committeeName}
                    onChange={(e) => setCommitteeName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g., Department Proposal Committee"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Members
                  </label>
                  {availableStaff.length === 0 ? (
                    <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm">
                      No available staff members found in your department.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availableStaff.map((staff) => (
                        <div
                          key={staff.id}
                          onClick={() => toggleStaffSelection(staff.id)}
                          className={`
                            p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3
                            ${
                              selectedStaffIds.includes(staff.id)
                                ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }
                          `}
                        >
                          <div
                            className={`
                            w-5 h-5 rounded border flex items-center justify-center
                            ${
                              selectedStaffIds.includes(staff.id)
                                ? "bg-teal-600 border-teal-600"
                                : "border-gray-300 bg-white"
                            }
                          `}
                          >
                            {selectedStaffIds.includes(staff.id) && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {staff.fullName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {staff.designation}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {selectedStaffIds.length} members
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCommittee}
                disabled={submitting || selectedStaffIds.length < 2}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {submitting
                  ? "Saving..."
                  : committee
                  ? "Update Committee"
                  : "Create & Request Login"}
              </button>
            </div>
          </div>
        </div>
      )}
    </CoordinatorLayout>
  );
};

export default CoordinatorCommittee;
