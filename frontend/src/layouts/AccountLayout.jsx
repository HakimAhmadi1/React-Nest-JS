import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { User, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const AccountLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const navItems = [{ name: "Profile", path: "/account/profile", icon: User }];

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* Sidebar - Floating Architectural Design */}
          <aside className="w-full lg:w-60 shrink-0">
            <div className="lg:sticky lg:top-24">
              <div className="flex flex-col md:flex-row lg:flex-col justify-between items-start md:items-center lg:items-start gap-6 lg:gap-0">
                {/* Header Section */}
                <div className="mb-2 lg:mb-6">
                  <h1 className="text-xl lg:text-2xl font-black tracking-tighter text-black uppercase mb-1">
                    My Account
                  </h1>
                  <div className="h-1 w-10 lg:w-12 bg-black"></div>
                </div>

                {/* User Identity */}
                <div className="mb-0 lg:mb-6 lg:pb-6 lg:border-b border-gray-300 w-full">
                  <div className="flex items-center gap-3 lg:gap-4">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-black flex items-center justify-center text-white text-xl lg:text-2xl font-black ring-4 ring-white shadow-2xl shrink-0 overflow-hidden">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user?.name?.charAt(0) || "U"
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm lg:text-base font-black text-black leading-none mb-1 uppercase tracking-tight truncate">
                        {user?.name}
                      </h3>
                      <p className="text-[8px] lg:text-[9px] text-gray-500 font-bold uppercase tracking-widest truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="mt-8 lg:mt-0 flex lg:flex-col gap-2 flex-wrap lg:overflow-visible no-scrollbar pb-4 lg:pb-0 -mx-6 px-6 lg:mx-0 lg:px-0">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between py-3 lg:py-4 px-4 lg:px-2 rounded-2xl lg:rounded-xl transition-all duration-300 group shrink-0 border lg:border-none ${
                        isActive
                          ? "bg-black text-white lg:bg-transparent lg:text-black lg:translate-x-1 border-black"
                          : "bg-white text-gray-400 border-gray-200 lg:bg-transparent lg:text-gray-400 hover:text-black lg:hover:translate-x-1"
                      }`
                    }
                  >
                    <div className="flex items-center gap-3 lg:gap-5 font-black uppercase text-[10px] lg:text-[11px] tracking-[0.2em] whitespace-nowrap">
                      <item.icon
                        size={16}
                        lg={18}
                        strokeWidth={2.5}
                        className="group-hover:scale-110 transition-transform duration-300"
                      />
                      {item.name}
                    </div>
                    <ChevronRight
                      size={14}
                      strokeWidth={3}
                      className="hidden lg:block opacity-0 group-hover:opacity-100 transition-all duration-300"
                    />
                  </NavLink>
                ))}

                <button
                  onClick={handleLogout}
                  className=" mt-10 flex items-center gap-3 lg:gap-5 py-3 lg:py-4 px-4 lg:px-2 bg-white lg:bg-transparent border border-gray-200 lg:border-none rounded-2xl lg:rounded-none text-red-500 font-black uppercase text-[10px] lg:text-[11px] tracking-[0.2em] lg:hover:translate-x-1 transition-all group shrink-0"
                >
                  <LogOut
                    size={16}
                    lg={18}
                    strokeWidth={2.5}
                    className="group-hover:rotate-12 transition-transform"
                  />
                  <span className="whitespace-nowrap">Logout</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Content Area */}
          <main className="flex-1 min-w-0">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AccountLayout;
