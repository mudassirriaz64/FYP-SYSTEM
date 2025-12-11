import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Briefcase,
  Eye,
  EyeOff,
  LogIn,
  BookOpen,
  Users,
  Shield,
  ArrowRight,
} from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Student form state - all parts are now editable
  const [enrollmentId, setEnrollmentId] = useState({
    part1: "",
    part2: "",
    part3: "",
  });

  // Staff form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Handle enrollment ID part changes
  const handleEnrollmentChange = (part, value) => {
    // Only allow numbers
    const numericValue = value.replace(/\D/g, "");

    if (part === "part1" && numericValue.length <= 2) {
      setEnrollmentId((prev) => ({ ...prev, part1: numericValue }));
      if (numericValue.length === 2) {
        document.getElementById("enrollment-part2")?.focus();
      }
    } else if (part === "part2" && numericValue.length <= 6) {
      setEnrollmentId((prev) => ({ ...prev, part2: numericValue }));
      if (numericValue.length === 6) {
        document.getElementById("enrollment-part3")?.focus();
      }
    } else if (part === "part3" && numericValue.length <= 3) {
      setEnrollmentId((prev) => ({ ...prev, part3: numericValue }));
    }
  };

  // Handle login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (activeTab === "student") {
        // Validate enrollment ID format
        if (
          enrollmentId.part1.length !== 2 ||
          enrollmentId.part2.length !== 6 ||
          enrollmentId.part3.length !== 3
        ) {
          setError("Please enter a valid Enrollment ID (XX-XXXXXX-XXX)");
          setIsLoading(false);
          return;
        }

        if (!password.trim()) {
          setError("Please enter your password");
          setIsLoading(false);
          return;
        }

        // Student login - use enrollment ID as username
        const studentUsername = `${enrollmentId.part1}-${enrollmentId.part2}-${enrollmentId.part3}`;

        // Call backend API with enrollment ID as username
        const response = await fetch("http://localhost:5073/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: studentUsername,
            password: password,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.message || "Login failed");
          setIsLoading(false);
          return;
        }

        // Store token and user info in localStorage
        // Ensure roles array is stored (handle both old and new format)
        const userData = {
          ...data.user,
          roles: Array.isArray(data.user.roles)
            ? data.user.roles
            : data.user.role
            ? [data.user.role]
            : ["Student"],
        };

        // Ensure role is set if not present
        if (!userData.role && userData.roles.length > 0) {
          userData.role = userData.roles[0];
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(userData));

        // Navigate based on role
        const roles = userData.roles || [userData.role || "Student"];
        const roleLower = roles.map((r) => r.toLowerCase());

        if (roleLower.includes("student")) {
          navigate("/student/dashboard", { replace: true });
        } else {
          setError("Invalid user role");
          setIsLoading(false);
        }
        return;
      } else {
        // Validate staff credentials
        if (!username.trim()) {
          setError("Please enter your username");
          setIsLoading(false);
          return;
        }

        if (!password.trim()) {
          setError("Please enter your password");
          setIsLoading(false);
          return;
        }

        // Call backend API
        const response = await fetch("http://localhost:5073/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
            password: password,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.message || "Login failed");
          setIsLoading(false);
          return;
        }

        // Store token and user info in localStorage
        // Ensure roles array is stored (handle both old and new format)
        const userData = {
          ...data.user,
          roles: data.user.roles || (data.user.role ? [data.user.role] : []),
        };
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(userData));

        // Check if there's a saved last location to restore
        const lastLocation = localStorage.getItem("lastLocation");
        const savedActiveRole = localStorage.getItem("activeRole");

        if (lastLocation && lastLocation !== "/login") {
          // Navigate to last location
          localStorage.removeItem("lastLocation"); // Clear it after use
          navigate(lastLocation, { replace: true });
          return;
        }

        // Navigate based on active role if saved, otherwise use role priority
        const roles = userData.roles || [userData.role];
        const roleLower = roles.map((r) => r.toLowerCase());

        // If user has a saved active role, use that
        if (savedActiveRole) {
          const activeRoleLower = savedActiveRole.toLowerCase();
          if (activeRoleLower === "admin" || activeRoleLower === "superadmin") {
            navigate("/admin/dashboard");
          } else if (activeRoleLower === "hod") {
            navigate("/hod/dashboard");
          } else if (
            activeRoleLower === "coordinator" ||
            activeRoleLower === "fypcoordinator"
          ) {
            navigate("/coordinator/dashboard");
          } else if (
            activeRoleLower === "supervisor" ||
            activeRoleLower === "teacher"
          ) {
            navigate("/supervisor/dashboard");
          } else if (activeRoleLower === "finance") {
            navigate("/finance/dashboard");
          } else if (activeRoleLower === "student") {
            navigate("/student/dashboard");
          } else if (
            activeRoleLower === "committee" ||
            activeRoleLower === "evaluator"
          ) {
            navigate("/evaluator/dashboard");
          } else {
            // Fallback to role priority
            navigateByRolePriority(roleLower);
          }
          return;
        }

        // Navigate based on role priority (highest priority first)
        navigateByRolePriority(roleLower);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Unable to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function for role priority navigation
  const navigateByRolePriority = (roleLower) => {
    if (roleLower.includes("admin") || roleLower.includes("superadmin")) {
      navigate("/admin/dashboard");
    } else if (roleLower.includes("hod")) {
      navigate("/hod/dashboard");
    } else if (
      roleLower.includes("coordinator") ||
      roleLower.includes("fypcoordinator")
    ) {
      navigate("/coordinator/dashboard");
    } else if (
      roleLower.includes("supervisor") ||
      roleLower.includes("teacher")
    ) {
      navigate("/supervisor/dashboard");
    } else if (roleLower.includes("finance")) {
      navigate("/finance/dashboard");
    } else if (roleLower.includes("student")) {
      navigate("/student/dashboard");
    } else if (
      roleLower.includes("proposalcommittee") ||
      roleLower.includes("proposal committee") ||
      roleLower.includes("proposalcommitteemember") ||
      roleLower.includes("proposal committee member")
    ) {
      navigate("/committee/dashboard");
    } else if (roleLower.includes("evaluator")) {
      navigate("/evaluator/dashboard");
    } else if (
      roleLower.includes("committee") ||
      roleLower.includes("committeemember")
    ) {
      // Internal committee members default to evaluator dashboard per earlier requirement
      navigate("/evaluator/dashboard");
    } else {
      // Default fallback
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] via-[#0f2744] to-[#0a1929]" />

        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="absolute top-0 left-0 w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Floating Shapes */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full filter blur-[100px]" />
        <div className="absolute bottom-32 right-16 w-64 h-64 bg-cyan-500/15 rounded-full filter blur-[80px]" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-indigo-500/10 rounded-full filter blur-[60px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo & Title */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                <BookOpen className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  FYP Portal
                </h1>
                <p className="text-white/50 text-xs font-medium">
                  Automation System
                </p>
              </div>
            </div>
          </div>

          {/* Main Hero Content */}
          <div className="space-y-10">
            <div>
              <h2 className="text-4xl xl:text-5xl font-bold leading-[1.1] tracking-tight">
                Streamline Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mt-1">
                  Final Year Project
                </span>
              </h2>
              <p className="text-base text-white/60 max-w-md mt-5 leading-relaxed">
                From proposal to completion — manage every step of your FYP
                journey in one unified platform.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <FeatureCard
                icon={<Users className="w-4 h-4" />}
                title="Group Formation"
                description="Form teams easily"
              />
              <FeatureCard
                icon={<BookOpen className="w-4 h-4" />}
                title="Progress Tracking"
                description="Monthly monitoring"
              />
              <FeatureCard
                icon={<Shield className="w-4 h-4" />}
                title="Digital Forms"
                description="Paperless workflow"
              />
              <FeatureCard
                icon={<GraduationCap className="w-4 h-4" />}
                title="Defense Scheduling"
                description="Automated panels"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="text-white/30 text-sm">
            © 2025 University FYP Management System
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-slate-50">
        <div className="w-full max-w-[400px]">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-slate-900">FYP Portal</h1>
          </div>

          {/* Login Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-slate-500 mt-2 text-sm">
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-8">
            <TabButton
              active={activeTab === "student"}
              onClick={() => {
                setActiveTab("student");
                setError("");
              }}
              icon={<GraduationCap className="w-4 h-4" />}
              label="Student"
            />
            <TabButton
              active={activeTab === "staff"}
              onClick={() => {
                setActiveTab("staff");
                setError("");
              }}
              icon={<Briefcase className="w-4 h-4" />}
              label="Staff"
            />
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {activeTab === "student" ? (
              /* Student Login Fields */
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Enrollment ID
                </label>
                <div className="flex items-center gap-1.5">
                  {/* Part 1 - 2 digits */}
                  <input
                    type="text"
                    id="enrollment-part1"
                    value={enrollmentId.part1}
                    onChange={(e) =>
                      handleEnrollmentChange("part1", e.target.value)
                    }
                    placeholder="01"
                    maxLength={2}
                    className="w-14 h-12 bg-white border border-slate-200 rounded-lg text-center font-mono text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                  <span className="text-slate-300 font-medium text-lg">-</span>
                  {/* Part 2 - 6 digits */}
                  <input
                    type="text"
                    id="enrollment-part2"
                    value={enrollmentId.part2}
                    onChange={(e) =>
                      handleEnrollmentChange("part2", e.target.value)
                    }
                    placeholder="131232"
                    maxLength={6}
                    className="flex-1 h-12 bg-white border border-slate-200 rounded-lg text-center font-mono text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                  <span className="text-slate-300 font-medium text-lg">-</span>
                  {/* Part 3 - 3 digits */}
                  <input
                    type="text"
                    id="enrollment-part3"
                    value={enrollmentId.part3}
                    onChange={(e) =>
                      handleEnrollmentChange("part3", e.target.value)
                    }
                    placeholder="001"
                    maxLength={3}
                    className="w-16 h-12 bg-white border border-slate-200 rounded-lg text-center font-mono text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Format: XX-XXXXXX-XXX (e.g., 01-131232-001)
                </p>
              </div>
            ) : (
              /* Staff Login Fields */
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
                <p className="text-xs text-slate-400 mt-2">
                  Username assigned by System Administrator
                </p>
              </div>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-12 px-4 pr-12 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* External Evaluator Link */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <button className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-blue-600 transition-colors group">
              <span className="text-sm">External Evaluator?</span>
              <span className="text-sm font-medium flex items-center gap-1">
                Access with Token
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          </div>

          {/* Role Info */}
          {activeTab === "staff" && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-700 font-medium mb-2">
                Staff Roles Supported:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Admin",
                  "Supervisor",
                  "Coordinator",
                  "HOD",
                  "Finance",
                  "Committee",
                ].map((role) => (
                  <span
                    key={role}
                    className="px-2 py-1 bg-white text-xs text-blue-600 rounded-md border border-blue-100"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Tab Button Component
const TabButton = ({ active, onClick, icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-lg font-medium text-sm transition-all ${
      active
        ? "bg-white text-slate-900 shadow-sm"
        : "text-slate-500 hover:text-slate-700"
    }`}
  >
    {icon}
    {label}
  </button>
);

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => (
  <div className="p-4 bg-white/[0.03] backdrop-blur-sm rounded-xl border border-white/[0.06] hover:bg-white/[0.05] transition-colors">
    <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center text-cyan-400 mb-3">
      {icon}
    </div>
    <h3 className="font-medium text-white text-sm">{title}</h3>
    <p className="text-white/40 text-xs mt-0.5">{description}</p>
  </div>
);

export default LoginPage;
