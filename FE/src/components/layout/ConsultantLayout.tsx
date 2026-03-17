import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import avatarSample from "../../assets/images/admin-avatar.jpg";

interface ConsultantLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    path: "/consultants/dashboard",
    name: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    path: "/consultants/schedule",
    name: "Schedule Management",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    path: "/consultants/reports",
    name: "Reports & Updates",
    icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export default function ConsultantLayout({ children }: ConsultantLayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
    setTimeout(logout, 50);
  };

  const isActive = (path: string) => {
    if (path === "/consultants/dashboard") {
      return location.pathname === "/consultants" || location.pathname === path;
    }
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="fixed top-0 left-0 flex flex-col justify-between items-center py-4 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 shadow transition-all duration-300 h-screen w-16 z-30">
        {/* Logout button at the top */}
        <div className="flex flex-col items-center w-full">
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-gray-300 bg-white hover:bg-gray-100 transition text-gray-500"
            onClick={handleLogout}
            title="Đăng xuất"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              ></path>
            </svg>
          </button>
        </div>

        {/* Menu icons in the middle */}
        <div className="flex flex-1 flex-col items-center justify-center gap-5 w-full">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`w-10 h-10 flex items-center justify-center rounded-full border-2 border-gray-100 bg-white hover:bg-gray-100 transition
                ${isActive(item.path) ? "ring-2 ring-black" : ""}`}
              title={item.name}
            >
              {React.cloneElement(item.icon, {
                className: "w-5 h-5 text-gray-500",
              })}
            </Link>
          ))}
        </div>

        {/* Avatar at the bottom */}
        <div className="flex flex-col items-center w-full">
          <Link to="/consultants/consultant-profile">
            <img
              src={user?.photoUrl || avatarSample}
              alt="avatar"
              className="w-10 h-10 rounded-full border-2 border-gray-100 object-cover hover:ring-2 hover:ring-blue-400 transition"
              title="Hồ sơ cá nhân"
            />
          </Link>
        </div>
      </div>
      {/* Main content */}
      <main className="flex-1 ml-16 overflow-y-auto h-screen">{children}</main>
    </div>
  );
}
