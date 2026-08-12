import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useIsAdmin } from "@/utils/permissions";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { settings } = useSettings();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const closeMenu = () => setMenuOpen(false);

  // The menu was previously hover-only, so keyboard users could never open it.
  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  // Guarded: a partially-populated user used to crash the whole shell here.
  const displayName = user?.name || user?.email?.split("@")[0] || "Account";

  return (
    <header className="sticky top-0 w-full z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <nav className="flex items-center justify-between px-6 lg:px-12 py-4 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-10">
          <Link
            to="/"
            className="text-xl md:text-2xl font-black uppercase tracking-widest text-black shrink-0"
          >
            {settings.appName || "App Template"}
          </Link>

          <div className="hidden md:flex items-center gap-8 uppercase text-[11px] font-bold tracking-widest">
            <Link to="/" className="text-black hover:text-gray-500 transition">
              Home
            </Link>
            {isAuthenticated && (
              <Link to="/account" className="text-black hover:text-gray-500 transition">
                Account
              </Link>
            )}
            {isAuthenticated && isAdmin && (
              <Link to="/admin" className="text-black hover:text-gray-500 transition">
                Administration
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-5 text-black">
          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 hover:text-gray-500 transition focus:outline-none focus:ring-2 focus:ring-black/20 rounded-full px-2 py-1"
              >
                <User size={20} strokeWidth={1.5} />
                <span className="hidden md:block text-[10px] font-bold uppercase tracking-widest truncate max-w-[120px]">
                  {displayName}
                </span>
                <ChevronDown
                  size={14}
                  strokeWidth={2.5}
                  className={`transition-transform ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-3 bg-white border border-gray-100 shadow-2xl rounded-xl py-3 min-w-[200px] overflow-hidden"
                >
                  <Link
                    to="/account/profile"
                    role="menuitem"
                    onClick={closeMenu}
                    className="block px-6 py-3 text-[10px] font-black uppercase tracking-widest text-black hover:bg-gray-50 transition"
                  >
                    Profile settings
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      role="menuitem"
                      onClick={closeMenu}
                      className="block px-6 py-3 text-[10px] font-black uppercase tracking-widest text-black hover:bg-gray-50 transition"
                    >
                      Admin portal
                    </Link>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-black text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
