import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronDown,
  Users,
  Award,
  UserCheck,
  Settings,
  DollarSign,
  GraduationCap,
  Shield,
} from "lucide-react";

const RoleSwitcher = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState("");
  const [availableRoles, setAvailableRoles] = useState([]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const activeRole = localStorage.getItem("activeRole");

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Get roles array, handle both string (comma-separated) and array formats
        let roles = [];
        if (Array.isArray(user.roles)) {
          roles = user.roles;
        } else if (typeof user.roles === "string") {
          roles = user.roles
            .split(",")
            .map((r) => r.trim())
            .filter((r) => r);
        } else if (user.role) {
          roles = [user.role];
        }

        // Remove duplicates and normalize role names
        const uniqueRoles = [];
        const seen = new Set();
        roles.forEach((role) => {
          const normalized = role.trim();
          const lower = normalized.toLowerCase();
          // Map aliases to primary role names
          let primaryRole = normalized;
          if (lower === "coordinator" || lower === "fypcoordinator") {
            primaryRole = "FYPCoordinator";
          } else if (lower === "teacher") {
            primaryRole = "Supervisor";
          } else if (lower === "superadmin") {
            primaryRole = "Admin";
          } else {
            // Keep original case for other roles (HOD, Supervisor, Finance, etc.)
            primaryRole = normalized;
          }

          if (!seen.has(primaryRole.toLowerCase())) {
            seen.add(primaryRole.toLowerCase());
            uniqueRoles.push(primaryRole);
          }
        });

        setAvailableRoles(uniqueRoles);

        // Determine current role: prioritize activeRole from localStorage, then path-based, then first role
        let currentRoleToSet = "";
        if (activeRole) {
          // Normalize activeRole to match our normalized roles
          const activeRoleLower = activeRole.toLowerCase();
          if (
            activeRoleLower === "coordinator" ||
            activeRoleLower === "fypcoordinator"
          ) {
            currentRoleToSet = "FYPCoordinator";
          } else if (activeRoleLower === "teacher") {
            currentRoleToSet = "Supervisor";
          } else if (activeRoleLower === "superadmin") {
            currentRoleToSet = "Admin";
          } else {
            // Find matching role in uniqueRoles (case-insensitive)
            const matchedRole = uniqueRoles.find(
              (r) => r.toLowerCase() === activeRoleLower
            );
            currentRoleToSet = matchedRole || activeRole;
          }
        } else {
          // Fallback to path-based detection
          const path = location.pathname;
          if (path.startsWith("/admin")) {
            currentRoleToSet = "Admin";
          } else if (path.startsWith("/hod")) {
            currentRoleToSet = "HOD";
          } else if (path.startsWith("/coordinator")) {
            currentRoleToSet = "FYPCoordinator";
          } else if (path.startsWith("/supervisor")) {
            currentRoleToSet = "Supervisor";
          } else if (path.startsWith("/finance")) {
            currentRoleToSet = "Finance";
          } else if (path.startsWith("/student")) {
            currentRoleToSet = "Student";
          } else if (
            path.startsWith("/evaluator") ||
            path.startsWith("/committee")
          ) {
            currentRoleToSet = "Committee";
          } else {
            currentRoleToSet = uniqueRoles[0] || "";
          }
        }

        setCurrentRole(currentRoleToSet);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, [location.pathname]);

  const getRoleIcon = (role) => {
    const roleLower = role.toLowerCase();
    if (roleLower.includes("hod")) return Award;
    if (roleLower.includes("coordinator")) return Settings;
    if (roleLower.includes("supervisor") || roleLower.includes("teacher"))
      return UserCheck;
    if (roleLower.includes("admin")) return Settings;
    if (roleLower.includes("finance")) return DollarSign;
    if (roleLower.includes("student")) return GraduationCap;
    if (roleLower.includes("committee")) return Shield;
    return Users;
  };

  const getRoleLabel = (role) => {
    const roleLower = role.toLowerCase();
    if (roleLower === "hod") return "Head of Department";
    if (roleLower === "fypcoordinator" || roleLower === "coordinator")
      return "FYP Coordinator";
    if (roleLower === "supervisor" || roleLower === "teacher")
      return "Supervisor";
    if (roleLower === "admin" || roleLower === "superadmin")
      return "Administrator";
    if (roleLower === "finance") return "Finance";
    if (roleLower === "committee") return "Internal Evaluator";
    return role;
  };

  const getRoleDashboard = (role) => {
    const roleLower = role.toLowerCase();
    if (roleLower === "hod") return "/hod/dashboard";
    if (roleLower === "fypcoordinator" || roleLower === "coordinator")
      return "/coordinator/dashboard";
    if (roleLower === "supervisor" || roleLower === "teacher")
      return "/supervisor/dashboard";
    if (roleLower === "admin" || roleLower === "superadmin")
      return "/admin/dashboard";
    if (roleLower === "finance") return "/finance/dashboard";
    if (roleLower === "student") return "/student/dashboard";
    if (roleLower === "committee") return "/evaluator/dashboard";
    return "/";
  };

  const handleRoleSwitch = (role) => {
    // Normalize role before storing
    const roleLower = role.toLowerCase();
    let normalizedRole = role;
    if (roleLower === "coordinator" || roleLower === "fypcoordinator") {
      normalizedRole = "FYPCoordinator";
    } else if (roleLower === "teacher") {
      normalizedRole = "Supervisor";
    } else if (roleLower === "superadmin") {
      normalizedRole = "Admin";
    }

    // Store active role in localStorage
    localStorage.setItem("activeRole", normalizedRole);
    setCurrentRole(normalizedRole);
    const dashboard = getRoleDashboard(normalizedRole);
    setIsOpen(false);
    // Navigate after a small delay to ensure state updates
    setTimeout(() => {
      navigate(dashboard, { replace: true });
    }, 100);
  };

  if (availableRoles.length <= 1) {
    return null; // Don't show switcher if user has only one role
  }

  const CurrentIcon = getRoleIcon(currentRole);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/50 hover:bg-white/80 rounded-lg border border-gray-200 transition-colors"
      >
        <CurrentIcon className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {getRoleLabel(currentRole)}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Switch Role
              </p>
              {availableRoles.map((role) => {
                const Icon = getRoleIcon(role);
                // Compare roles case-insensitively and handle aliases
                const roleLower = role.toLowerCase();
                const currentRoleLower = currentRole.toLowerCase();
                // Normalize both for comparison
                const normalizedRole =
                  roleLower === "coordinator" || roleLower === "fypcoordinator"
                    ? "fypcoordinator"
                    : roleLower === "teacher"
                    ? "supervisor"
                    : roleLower;
                const normalizedCurrent =
                  currentRoleLower === "coordinator" ||
                  currentRoleLower === "fypcoordinator"
                    ? "fypcoordinator"
                    : currentRoleLower === "teacher"
                    ? "supervisor"
                    : currentRoleLower;
                const isActive = normalizedRole === normalizedCurrent;
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleSwitch(role)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {getRoleLabel(role)}
                    </span>
                    {isActive && (
                      <span className="ml-auto text-xs text-blue-600">
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RoleSwitcher;
