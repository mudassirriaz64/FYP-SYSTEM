import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api, { API_BASE } from "../../utils/api";
import SupervisorLayout from "../../components/layouts/SupervisorLayout";

const SupervisorMeetings = () => {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedMonths, setExpandedMonths] = useState(new Set([1]));

  // Mark attendance form
  const [showMarkForm, setShowMarkForm] = useState(false);
  const [markForm, setMarkForm] = useState({
    weekNumber: 1,
    meetingDate: new Date().toISOString().split("T")[0],
    topicsDiscussed: "",
    agenda: "",
    supervisorNotes: "",
    studentAttendance: [],
  });

  // Submit monthly report form
  const [showSubmitReportModal, setShowSubmitReportModal] = useState(false);
  const [selectedMonthForSubmit, setSelectedMonthForSubmit] = useState(null);
  const [reportForm, setReportForm] = useState({
    summary: "",
    challenges: "",
    nextMonthPlan: "",
    progressPercentage: 0,
    file: null,
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      // Auto-select all students by default
      setMarkForm((prev) => ({
        ...prev,
        studentAttendance: selectedGroup.members?.map((m) => m.id) || [],
      }));
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_BASE}/supervisormeeting/my-groups`);

      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
        if (data.groups && data.groups.length > 0) {
          setSelectedGroup(data.groups[0]);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || "Failed to load groups");
      }
    } catch (err) {
      setError("Failed to load groups");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMonthlyReport = async () => {
    if (!selectedGroup || !selectedMonthForSubmit) return;

    if (!reportForm.summary || !reportForm.file) {
      setError("Summary and file upload are required");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("GroupId", selectedGroup.id);
      formData.append("MonthNumber", selectedMonthForSubmit);
      formData.append("Summary", reportForm.summary);
      formData.append("Challenges", reportForm.challenges || "");
      formData.append("NextMonthPlan", reportForm.nextMonthPlan || "");
      formData.append("ProgressPercentage", reportForm.progressPercentage);
      formData.append("File", reportForm.file);

      const response = await fetch(`${API_BASE}/supervisormeeting/monthly-reports/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (response.ok) {
        setSuccess("Monthly report submitted successfully to coordinator");
        setShowSubmitReportModal(false);
        setReportForm({
          summary: "",
          challenges: "",
          nextMonthPlan: "",
          progressPercentage: 0,
          file: null,
        });
        fetchGroups(); // Refresh to update status
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || "Failed to submit monthly report");
      }
    } catch (err) {
      setError("Failed to submit monthly report");
      console.error(err);
    }
  };

  const handleMarkAttendance = async () => {
    if (!selectedGroup) return;

    try {
      setError("");
      setSuccess("");

      const response = await api.post(
        `${API_BASE}/supervisormeeting/mark-attendance`,
        {
          groupId: selectedGroup.id,
          monthNumber: currentMonth,
          weekNumber: markForm.weekNumber,
          meetingDate: markForm.meetingDate,
          topicsDiscussed: markForm.topicsDiscussed,
          agenda: markForm.agenda,
          supervisorNotes: markForm.supervisorNotes,
          studentAttendance: markForm.studentAttendance,
        }
      );

      if (response.ok) {
        setSuccess("Attendance marked successfully");
        setShowMarkForm(false);
        setMarkForm({
          weekNumber: 1,
          meetingDate: new Date().toISOString().split("T")[0],
          topicsDiscussed: "",
          agenda: "",
          supervisorNotes: "",
          studentAttendance: selectedGroup.members?.map((m) => m.id) || [],
        });
        await fetchGroups();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to mark attendance");
      }
    } catch (err) {
      setError("Failed to mark attendance");
    }
  };

  const toggleStudentAttendance = (studentId) => {
    setMarkForm((prev) => ({
      ...prev,
      studentAttendance: prev.studentAttendance.includes(studentId)
        ? prev.studentAttendance.filter((id) => id !== studentId)
        : [...prev.studentAttendance, studentId],
    }));
  };

  const toggleMonth = (monthNum) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthNum)) {
      newExpanded.delete(monthNum);
    } else {
      newExpanded.add(monthNum);
    }
    setExpandedMonths(newExpanded);
  };

  const getMonthProgress = (monthData) => {
    if (!monthData) return { completed: 0, canSubmit: false };
    return {
      completed: monthData.meetingsCompleted || 0,
      canSubmit: monthData.canSubmitReport || false,
    };
  };

  return (
    <SupervisorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Weekly Meeting Attendance
          </h1>
          <p className="text-gray-500 mt-1">
            Mark attendance for your supervised groups
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

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Groups Assigned
            </h2>
            <p className="text-gray-500">
              You don't have any supervised groups yet
            </p>
          </div>
        ) : (
          <>
            {/* Group Selector */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Group
              </label>
              <select
                value={selectedGroup?.id || ""}
                onChange={(e) => {
                  const group = groups.find(
                    (g) => g.id === parseInt(e.target.value)
                  );
                  setSelectedGroup(group);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.groupName} - {group.projectTitle}
                  </option>
                ))}
              </select>
            </div>

            {selectedGroup && (
              <>
                {/* Group Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {selectedGroup.groupName}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {selectedGroup.projectTitle}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {selectedGroup.members?.map((member) => (
                      <span
                        key={member.id}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                      >
                        {member.fullName} ({member.enrollmentId})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Monthly Progress */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Monthly Meeting Progress
                    </h2>
                    <button
                      onClick={() => setShowMarkForm(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Mark Attendance
                    </button>
                  </div>

                  <div className="divide-y">
                    {selectedGroup.monthlyProgress?.map((month) => {
                      const isExpanded = expandedMonths.has(month.monthNumber);
                      const progress = getMonthProgress(month);

                      return (
                        <div key={month.monthNumber}>
                          <div
                            className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                            onClick={() => toggleMonth(month.monthNumber)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-indigo-600" />
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  Month {month.monthNumber}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {progress.completed}/4 meetings completed
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {progress.canSubmit ? (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedMonthForSubmit(month.monthNumber);
                                      setShowSubmitReportModal(true);
                                    }}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-2"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Submit Report
                                  </button>
                                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Ready
                                  </span>
                                </>
                              ) : (
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {4 - progress.completed} more needed
                                </span>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="px-4 pb-4 bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[1, 2, 3, 4].map((weekNum) => (
                                  <div
                                    key={weekNum}
                                    className={`p-3 rounded-lg border ${
                                      weekNum <= progress.completed
                                        ? "bg-green-50 border-green-200"
                                        : "bg-white border-gray-200"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {weekNum <= progress.completed ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                      ) : (
                                        <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                      )}
                                      <span className="font-medium text-gray-900">
                                        Week {weekNum}
                                      </span>
                                    </div>
                                    {weekNum <= progress.completed && (
                                      <p className="text-xs text-gray-600 mt-1">
                                        Completed
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Mark Attendance Modal */}
      {showMarkForm && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                Mark Weekly Attendance
              </h3>
              <button
                onClick={() => setShowMarkForm(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Month
                  </label>
                  <select
                    value={currentMonth}
                    onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((m) => (
                      <option key={m} value={m}>
                        Month {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Week
                  </label>
                  <select
                    value={markForm.weekNumber}
                    onChange={(e) =>
                      setMarkForm({
                        ...markForm,
                        weekNumber: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {[1, 2, 3, 4].map((w) => (
                      <option key={w} value={w}>
                        Week {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Date
                </label>
                <input
                  type="date"
                  value={markForm.meetingDate}
                  onChange={(e) =>
                    setMarkForm({ ...markForm, meetingDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topics Discussed
                </label>
                <textarea
                  value={markForm.topicsDiscussed}
                  onChange={(e) =>
                    setMarkForm({
                      ...markForm,
                      topicsDiscussed: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="What was discussed in this meeting?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agenda (Optional)
                </label>
                <textarea
                  value={markForm.agenda}
                  onChange={(e) =>
                    setMarkForm({ ...markForm, agenda: e.target.value })
                  }
                  rows={2}
                  placeholder="Meeting agenda"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supervisor Notes (Optional)
                </label>
                <textarea
                  value={markForm.supervisorNotes}
                  onChange={(e) =>
                    setMarkForm({
                      ...markForm,
                      supervisorNotes: e.target.value,
                    })
                  }
                  rows={2}
                  placeholder="Your notes about the meeting"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Attendance
                </label>
                <div className="space-y-2">
                  {selectedGroup.members?.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={markForm.studentAttendance.includes(member.id)}
                        onChange={() => toggleStudentAttendance(member.id)}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.fullName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {member.enrollmentId}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowMarkForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkAttendance}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Mark Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Monthly Report Modal */}
      {showSubmitReportModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                Submit Monthly Report - Month {selectedMonthForSubmit}
              </h3>
              <button
                onClick={() => {
                  setShowSubmitReportModal(false);
                  setReportForm({
                    summary: "",
                    challenges: "",
                    nextMonthPlan: "",
                    progressPercentage: 0,
                    file: null,
                  });
                }}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Group:</strong> {selectedGroup.groupName} -{" "}
                  {selectedGroup.projectTitle}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Summary <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reportForm.summary}
                  onChange={(e) =>
                    setReportForm({ ...reportForm, summary: e.target.value })
                  }
                  rows={4}
                  placeholder="Summarize the month's progress and achievements..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Challenges Faced (Optional)
                </label>
                <textarea
                  value={reportForm.challenges}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      challenges: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Any challenges or obstacles encountered..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Month Plan (Optional)
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
                  placeholder="Plans and goals for next month..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progress Percentage
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={reportForm.progressPercentage}
                    onChange={(e) =>
                      setReportForm({
                        ...reportForm,
                        progressPercentage: parseInt(e.target.value),
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-lg font-semibold text-indigo-600 w-16 text-center">
                    {reportForm.progressPercentage}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Report File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    setReportForm({ ...reportForm, file: e.target.files[0] })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
                {reportForm.file && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {reportForm.file.name}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Accepted formats: PDF, DOC, DOCX (Max 50MB)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowSubmitReportModal(false);
                    setReportForm({
                      summary: "",
                      challenges: "",
                      nextMonthPlan: "",
                      progressPercentage: 0,
                      file: null,
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitMonthlyReport}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Submit to Coordinator
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SupervisorLayout>
  );
};

export default SupervisorMeetings;
