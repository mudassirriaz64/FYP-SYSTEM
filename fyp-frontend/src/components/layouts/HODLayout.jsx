import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Shield,
  ChevronDown,
  AlertTriangle,
  DollarSign,
  Award,
  Users,
  FileText,
} from "lucide-react";
import RoleSwitcher from "../RoleSwitcher";
import RoleNotificationPanel from "../RoleNotificationPanel";

const HODLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isExpanded = mobileMenuOpen || isSidebarHovered;

  const navigation = [
    { name: "Dashboard", href: "/hod/dashboard", icon: LayoutDashboard },
    { name: "Escalations", href: "/hod/escalations", icon: AlertTriangle },
    { name: "Budget Approvals", href: "/hod/budgets", icon: DollarSign },
    { name: "Mark Review", href: "/hod/marks", icon: Award },
    { name: "Department Groups", href: "/hod/groups", icon: Users },
    { name: "Reports", href: "/hod/reports", icon: FileText },
    { name: "Announcements", href: "/hod/notifications", icon: Bell },
    { name: "Settings", href: "/hod/settings", icon: Settings },
  ];

  const isActive = (href) =>
    location.pathname === href || location.pathname.startsWith(href + "/");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeRole");
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "H";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const sidebarWidth = isExpanded ? 256 : 80;

  return (
    <div className="min-h-screen bg-rose-50/30 font-sans">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Rose/Red Theme for HOD */}
      <aside
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        style={{
          width: window.innerWidth >= 768 ? `${sidebarWidth}px` : "256px",
        }}
        className={`
          fixed top-0 left-0 z-50 h-screen bg-gradient-to-b from-rose-800 to-red-900
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          border-r border-rose-700
          shadow-xl
        `}
      >
        {/* Header Section (Logo) */}
        <div
          className={`
          h-20 flex items-center border-b border-rose-700/50
          transition-all duration-300
          ${isExpanded ? "px-6" : "justify-center"} 
        `}
        >
          <Link
            to="/hod/dashboard"
            className="flex items-center overflow-hidden whitespace-nowrap"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-500/30">
              <Shield className="w-5 h-5 text-white" />
            </div>

            <div
              className={`
              flex flex-col min-w-0 transition-all duration-300 origin-left
              ${
                isExpanded
                  ? "opacity-100 translate-x-0 w-auto ml-3"
                  : "opacity-0 -translate-x-4 w-0 ml-0 overflow-hidden"
              }
            `}
            >
              <p className="font-bold text-white text-base leading-tight">
                FYP Portal
              </p>
              <p className="text-rose-300 text-xs">HOD Panel</p>
            </div>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden ml-auto p-2 text-rose-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="p-4 space-y-1.5 mt-2 overflow-y-auto max-h-[calc(100vh-180px)]">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group whitespace-nowrap
                  ${
                    active
                      ? "bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-md shadow-rose-900/30"
                      : "text-rose-200 hover:bg-rose-800/50 hover:text-white"
                  }
                  ${!isExpanded ? "justify-center" : ""}
                `}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    active
                      ? "text-white"
                      : "text-rose-300 group-hover:text-white"
                  }`}
                />

                <span
                  className={`
                  transition-all duration-300 origin-left
                  ${
                    isExpanded
                      ? "opacity-100 translate-x-0 w-auto ml-3"
                      : "opacity-0 -translate-x-2 w-0 ml-0 overflow-hidden"
                  }
                `}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-rose-700/50 bg-red-900/50">
          <button
            onClick={handleLogout}
            title="Sign Out"
            className={`
              flex items-center w-full px-3 py-3 text-rose-300 
              hover:bg-red-500/20 hover:text-red-300 rounded-xl text-sm font-medium transition-colors whitespace-nowrap
              ${!isExpanded ? "justify-center" : ""}
            `}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />

            <span
              className={`
              transition-all duration-300 origin-left
              ${
                isExpanded
                  ? "opacity-100 translate-x-0 w-auto ml-3"
                  : "opacity-0 -translate-x-2 w-0 ml-0 overflow-hidden"
              }
            `}
            >
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        style={{ marginLeft: `${sidebarWidth}px` }}
        className="min-h-screen transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hidden md:block"
      >
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="h-full px-8 flex items-center justify-between">
            {/* Search */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5 w-72 border border-gray-100 focus-within:border-rose-500/50 focus-within:ring-2 focus-within:ring-rose-500/20 transition-all">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search groups, escalations..."
                className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-400 w-full"
              />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <RoleSwitcher />
              <RoleNotificationPanel role="HOD" accentColor="rose" />

              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-3 p-1.5 pr-3 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-red-500 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-xs font-bold text-white">
                      {getInitials(user.fullName)}
                    </span>
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-semibold text-gray-900 leading-none">
                      {user.fullName || "Head of Department"}
                    </p>
                    <p className="text-xs text-rose-600 mt-1 leading-none">
                      HOD
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      profileDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {profileDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20">
                      <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-sm font-semibold text-gray-900">
                          {user.fullName || "Head of Department"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email || "hod@university.edu"}
                        </p>
                      </div>
                      <div className="p-1">
                        <Link
                          to="/hod/settings"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-8">{children}</main>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden min-h-screen">
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200">
          <div className="h-full px-4 flex items-center justify-between">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {getInitials(user.fullName)}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4">{children}</main>
      </div>
    </div>
  );
};

export default HODLayout;
