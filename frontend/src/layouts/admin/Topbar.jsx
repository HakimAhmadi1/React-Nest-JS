import { Bell, Menu, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/uiStore";

const Topbar = () => {
  // Goes through useAuth so signing out also revokes the refresh-token family
  // server-side. Calling the store's local teardown alone left the session
  // alive on the server — and, previously, in the other localStorage key too.
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const avatarText = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  return (
    <header
      className={`
        fixed top-0 right-0 z-30 flex items-center justify-between h-16
        bg-gray-900/80 backdrop-blur border-b border-gray-800 px-4
        transition-all duration-300
        ${sidebarOpen ? "left-60" : "left-16"}
      `}
    >
      {/* Left: Sidebar toggle + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
          id="sidebar-toggle-btn"
        >
          <Menu size={18} />
        </button>
        <div className="h-5 w-px bg-gray-700" />
        <span className="text-sm text-gray-400">Management Console</span>
      </div>

      {/* Right: Notifications + User Avatar */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary-500 rounded-full" />
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3 ml-1">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-200 leading-tight">
              {user?.name ?? "Admin"}
            </p>
            <p className="text-xs text-gray-500">{user?.email ?? ""}</p>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
              {avatarText}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            id="logout-btn"
            className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
