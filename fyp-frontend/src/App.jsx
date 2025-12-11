import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
// Admin imports
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminDepartments from "./pages/admin/AdminDepartments";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminDepartmentStaff from "./pages/admin/AdminDepartmentStaff";
import AdminCommitteeRequests from "./pages/admin/AdminCommitteeRequests";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
// Coordinator imports
import CoordinatorDashboard from "./pages/coordinator/CoordinatorDashboard";
import CoordinatorGroups from "./pages/coordinator/CoordinatorGroups";
import CoordinatorSubmissions from "./pages/coordinator/CoordinatorSubmissions";
import ViewSubmissions from "./pages/coordinator/ViewSubmissions";
import CoordinatorDeadlines from "./pages/coordinator/CoordinatorDeadlines";
import CoordinatorDefenses from "./pages/coordinator/CoordinatorDefenses";
import CoordinatorResults from "./pages/coordinator/CoordinatorResults";
import CoordinatorCommittee from "./pages/coordinator/CoordinatorCommittee";
import CoordinatorDocuments from "./pages/coordinator/CoordinatorDocuments";
// Student imports
import StudentLayout from "./components/layouts/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentMyGroup from "./pages/student/StudentMyGroup";
import StudentForms from "./pages/student/StudentForms";
import StudentFormA from "./pages/student/StudentFormA";
import StudentFormB from "./pages/student/StudentFormB";
import StudentFormC from "./pages/student/StudentFormC";
import StudentSubmissions from "./pages/student/StudentSubmissions";
import StudentNotifications from "./pages/student/StudentNotifications";
import StudentDefenses from "./pages/student/StudentDefenses";
import StudentProgress from "./pages/student/StudentProgress";
import StudentDocuments from "./pages/student/StudentDocuments";
import StudentProfileSettings from "./pages/student/StudentProfileSettings";
// Supervisor imports
import SupervisorDashboard from "./pages/supervisor/SupervisorDashboard";
import SupervisorRequests from "./pages/supervisor/SupervisorRequests";
import SupervisorGroups from "./pages/supervisor/SupervisorGroups";
import SupervisorFormD from "./pages/supervisor/SupervisorFormD";
import SupervisorGrading from "./pages/supervisor/SupervisorGrading";
// Logs & Meeting Notes now use SupervisorLogForms
import SupervisorLogForms from "./pages/supervisor/SupervisorLogForms";
import SupervisorMeetings from "./pages/supervisor/SupervisorMeetings";
import SupervisorNotifications from "./pages/supervisor/SupervisorNotifications";
import SupervisorSubmissions from "./pages/supervisor/SupervisorSubmissions";
// HOD imports
import HODDashboard from "./pages/hod/HODDashboard";
import HODEscalations from "./pages/hod/HODEscalations";
import HODBudgets from "./pages/hod/HODBudgets";
import HODMarks from "./pages/hod/HODMarks";
import HODGroups from "./pages/hod/HODGroups";
import HODReports from "./pages/hod/HODReports";
import HODNotifications from "./pages/hod/HODNotifications";
// Committee imports
import CommitteeDashboard from "./pages/committee/CommitteeDashboard";
import CommitteeNotifications from "./pages/committee/CommitteeNotifications";
import CommitteeEvaluate from "./pages/committee/CommitteeEvaluate";
// Evaluator imports
import EvaluatorDashboard from "./pages/evaluator/EvaluatorDashboard";
import EvaluatorDefenses from "./pages/evaluator/EvaluatorDefenses";
import EvaluatorMarks from "./pages/evaluator/EvaluatorMarks";
import EvaluatorNotifications from "./pages/evaluator/EvaluatorNotifications";
import CoordinatorNotifications from "./pages/coordinator/CoordinatorNotifications";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin", "Admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin", "Admin"]}>
              <AdminDepartments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments/:departmentId/staff"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin", "Admin"]}>
              <AdminDepartmentStaff />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/staff"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin", "Admin"]}>
              <AdminStaff />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin", "Admin"]}>
              <AdminStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/committee-requests"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin", "Admin"]}>
              <AdminCommitteeRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin", "Admin"]}>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin", "Admin"]}>
              <AdminAuditLogs />
            </ProtectedRoute>
          }
        />

        {/* Protected Coordinator Routes */}
        <Route
          path="/coordinator/dashboard"
          element={
            <ProtectedRoute allowedRoles={["FYPCoordinator", "Coordinator"]}>
              <CoordinatorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/groups"
          element={
            <ProtectedRoute allowedRoles={["FYPCoordinator", "Coordinator"]}>
              <CoordinatorGroups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/submissions"
          element={
            <ProtectedRoute allowedRoles={["FYPCoordinator", "Coordinator"]}>
              <CoordinatorSubmissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/view-submissions"
          element={
            <ProtectedRoute allowedRoles={["FYPCoordinator", "Coordinator"]}>
              <ViewSubmissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/deadlines"
          element={
            <ProtectedRoute allowedRoles={["FYPCoordinator", "Coordinator"]}>
              <CoordinatorDeadlines />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/defenses"
          element={
            <ProtectedRoute allowedRoles={["FYPCoordinator", "Coordinator"]}>
              <CoordinatorDefenses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/documents"
          element={
            <ProtectedRoute allowedRoles={["FYPCoordinator", "Coordinator"]}>
              <CoordinatorDocuments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/results"
          element={
            <ProtectedRoute allowedRoles={["FYPCoordinator", "Coordinator"]}>
              <CoordinatorResults />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/committee"
          element={
            <ProtectedRoute allowedRoles={["FYPCoordinator", "Coordinator"]}>
              <CoordinatorCommittee />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/settings"
          element={
            <ProtectedRoute allowedRoles={["FYPCoordinator", "Coordinator"]}>
              <CoordinatorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/notifications"
          element={
            <ProtectedRoute allowedRoles={["FYPCoordinator", "Coordinator"]}>
              <CoordinatorNotifications />
            </ProtectedRoute>
          }
        />

        {/* Protected Student Routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Student"]}>
              <StudentLayout>
                <StudentDashboard />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/my-group"
          element={
            <ProtectedRoute allowedRoles={["Student"]}>
              <StudentLayout>
                <StudentMyGroup />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/forms"
          element={
            <ProtectedRoute allowedRoles={["Student"]}>
              <StudentLayout>
                <StudentForms />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/forms/FormA"
          element={
            <ProtectedRoute allowedRoles={["Student"]}>
              <StudentLayout>
                <StudentFormA />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/forms/FormB"
          element={
            <ProtectedRoute allowedRoles={["Student"]}>
              <StudentLayout>
                <StudentFormB />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/forms/FormC"
          element={
            <ProtectedRoute allowedRoles={["Student"]}>
              <StudentLayout>
                <StudentFormC />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/forms/:formType"
          element={
            <ProtectedRoute allowedRoles={["Student"]}>
              <StudentLayout>
                <StudentFormA />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/submissions"
          element={
            <ProtectedRoute allowedRoles={["Student"]}>
              <StudentLayout>
                <StudentSubmissions />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/defenses"
          element={
            <ProtectedRoute allowedRoles={["Student"]}>
              <StudentLayout>
                <StudentDefenses />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/progress"
          element={
            <ProtectedRoute allowedRoles={["Student"]}>
              <StudentLayout>
                <StudentProgress />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/documents"
          element={
            <ProtectedRoute allowedRoles={["Student"]}>
              <StudentLayout>
                <StudentDocuments />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/notifications"
          element={
            <ProtectedRoute allowedRoles={["Student"]}>
              <StudentLayout>
                <StudentNotifications />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/settings"
          element={
            <ProtectedRoute allowedRoles={["Student"]}>
              <StudentLayout>
                <StudentProfileSettings />
              </StudentLayout>
            </ProtectedRoute>
          }
        />

        {/* Protected Supervisor Routes */}
        <Route
          path="/supervisor/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Supervisor", "Teacher"]}>
              <SupervisorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/requests"
          element={
            <ProtectedRoute allowedRoles={["Supervisor", "Teacher"]}>
              <SupervisorRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/groups"
          element={
            <ProtectedRoute allowedRoles={["Supervisor", "Teacher"]}>
              <SupervisorGroups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/groups/:groupId"
          element={
            <ProtectedRoute allowedRoles={["Supervisor", "Teacher"]}>
              <SupervisorGroups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/form-d"
          element={
            <ProtectedRoute allowedRoles={["Supervisor", "Teacher"]}>
              <SupervisorFormD />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/grading"
          element={
            <ProtectedRoute allowedRoles={["Supervisor", "Teacher"]}>
              <SupervisorGrading />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/meetings"
          element={
            <ProtectedRoute allowedRoles={["Supervisor", "Teacher"]}>
              <SupervisorMeetings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/logs"
          element={
            <ProtectedRoute allowedRoles={["Supervisor", "Teacher"]}>
              <SupervisorLogForms />
            </ProtectedRoute>
          }
        />
        {/* Backward compatibility: keep /supervisor/log-forms route pointing to the merged view */}
        <Route
          path="/supervisor/log-forms"
          element={
            <ProtectedRoute allowedRoles={["Supervisor", "Teacher"]}>
              <SupervisorLogForms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/submissions"
          element={
            <ProtectedRoute allowedRoles={["Supervisor", "Teacher"]}>
              <SupervisorSubmissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/settings"
          element={
            <ProtectedRoute allowedRoles={["Supervisor", "Teacher"]}>
              <SupervisorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/notifications"
          element={
            <ProtectedRoute allowedRoles={["Supervisor", "Teacher"]}>
              <SupervisorNotifications />
            </ProtectedRoute>
          }
        />

        {/* Protected HOD Routes */}
        <Route
          path="/hod/dashboard"
          element={
            <ProtectedRoute allowedRoles={["HOD", "SuperAdmin"]}>
              <HODDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/escalations"
          element={
            <ProtectedRoute allowedRoles={["HOD", "SuperAdmin"]}>
              <HODEscalations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/escalations/:id"
          element={
            <ProtectedRoute allowedRoles={["HOD", "SuperAdmin"]}>
              <HODEscalations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/budgets"
          element={
            <ProtectedRoute allowedRoles={["HOD", "SuperAdmin"]}>
              <HODBudgets />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/marks"
          element={
            <ProtectedRoute allowedRoles={["HOD", "SuperAdmin"]}>
              <HODMarks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/groups"
          element={
            <ProtectedRoute allowedRoles={["HOD", "SuperAdmin"]}>
              <HODGroups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/reports"
          element={
            <ProtectedRoute allowedRoles={["HOD", "SuperAdmin"]}>
              <HODReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/settings"
          element={
            <ProtectedRoute allowedRoles={["HOD", "SuperAdmin"]}>
              <HODDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/notifications"
          element={
            <ProtectedRoute allowedRoles={["HOD", "SuperAdmin"]}>
              <HODNotifications />
            </ProtectedRoute>
          }
        />

        {/* Protected Evaluator Routes */}
        <Route
          path="/evaluator/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Supervisor",
                "Faculty",
                "Staff",
                "Evaluator",
                "Committee",
                "CommitteeMember",
              ]}
            >
              <EvaluatorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/evaluator/defenses"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Supervisor",
                "Faculty",
                "Staff",
                "Evaluator",
                "Committee",
                "CommitteeMember",
              ]}
            >
              <EvaluatorDefenses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/evaluator/marks"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Supervisor",
                "Faculty",
                "Staff",
                "Evaluator",
                "Committee",
                "CommitteeMember",
              ]}
            >
              <EvaluatorMarks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/evaluator/notifications"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Supervisor",
                "Faculty",
                "Staff",
                "Evaluator",
                "Committee",
                "CommitteeMember",
              ]}
            >
              <EvaluatorNotifications />
            </ProtectedRoute>
          }
        />

        {/* Placeholder routes for other roles - to be implemented later */}
        {/* Protected Committee Routes */}
        <Route
          path="/committee/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Committee", "ProposalCommittee", "Proposal Committee", "ProposalCommitteeMember", "Proposal Committee Member"]}>
              <CommitteeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/committee/notifications"
          element={
            <ProtectedRoute allowedRoles={["Committee", "ProposalCommittee", "Proposal Committee", "ProposalCommitteeMember", "Proposal Committee Member"]}>
              <CommitteeNotifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/committee/evaluate"
          element={
            <ProtectedRoute allowedRoles={["Committee", "ProposalCommittee", "Proposal Committee", "ProposalCommitteeMember", "Proposal Committee Member"]}>
              <CommitteeEvaluate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/committee/evaluate/:id"
          element={
            <ProtectedRoute allowedRoles={["Committee", "ProposalCommittee", "Proposal Committee", "ProposalCommitteeMember", "Proposal Committee Member"]}>
              <CommitteeEvaluate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/committee/settings"
          element={
            <ProtectedRoute allowedRoles={["Committee"]}>
              <CommitteeDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Evaluator Routes */}
        <Route
          path="/evaluator/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Evaluator", "Committee", "Supervisor"]}>
              <EvaluatorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/evaluator/defenses"
          element={
            <ProtectedRoute allowedRoles={["Evaluator", "Committee", "Supervisor"]}>
              <EvaluatorDefenses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/evaluator/marks"
          element={
            <ProtectedRoute allowedRoles={["Evaluator", "Committee", "Supervisor"]}>
              <EvaluatorMarks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/evaluator/notifications"
          element={
            <ProtectedRoute allowedRoles={["Evaluator", "Committee", "Supervisor"]}>
              <EvaluatorNotifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/finance/*"
          element={<div className="p-8">Finance Dashboard - Coming Soon</div>}
        />

        {/* 404 */}
        <Route path="*" element={<div className="p-8">Page Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;
