// src/components/layout/Header.tsx

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function Header() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };


  // Hàm kiểm tra đường dẫn hiện tại để xác định mục đang được chọn
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') {
      return true;
    }
    return path !== '/' && location.pathname.startsWith(path);
  };

  // Style cho mục đang được chọn
  const activeStyle = "text-gray-900 font-semibold";
  const defaultStyle = "text-gray-600 hover:text-gray-900";

  return (
    <header className="sticky top-0 z-50 bg-light shadow-sm w-full">
      <div className="mx-auto max-w-7xl px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-lg sm:text-xl font-semibold text-amber-800">
                MLN131
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-lg font-medium">
            <Link to="/" className={isActive('/') ? activeStyle : defaultStyle}>
              Trang chủ
            </Link>
            <Link to="/blogs" className={isActive('/blogs') ? activeStyle : defaultStyle}>
              Blog
            </Link>
            <Link to="/magazine" className={isActive('/magazine') ? activeStyle : defaultStyle}>
              Tạp chí
            </Link>
            <Link to="/about-us" className={isActive('/about-us') ? activeStyle : defaultStyle}>
              About Us
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center gap-1 p-2.5 rounded-full bg-white hover:bg-gray-50 transition focus:outline-none"
                onClick={() => setShowDropdown((v) => !v)}
              >
                <span className="font-medium text-gray-700">{user.fullName || user.username}</span>
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 z-50 border border-gray-100 animate-fade-in">
                  {user.role === "admin" && (
                    <>
                      <button
                        className="w-full text-left px-5 py-3 hover:bg-gray-100 text-gray-800 text-base rounded-t-xl"
                        onClick={() => {
                          setShowDropdown(false);
                          navigate("/admin/dashboard");
                        }}
                      >
                        Bảng điều khiển
                      </button>
                      <div className="border-t border-gray-100"></div>
                    </>
                  )}
                  <button
                    className="w-full text-left px-5 py-3 hover:bg-gray-100 text-gray-800 text-base"
                    onClick={() => {
                      setShowDropdown(false);
                      navigate("/profile");
                    }}
                  >
                    Hồ sơ cá nhân
                  </button>
                  <button
                    className="w-full text-left px-5 py-3 hover:bg-gray-100 text-gray-800 text-base rounded-b-xl"
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="px-8 py-3 rounded-full border-2 border-primary text-xl font-medium text-primary bg-light hover:bg-primary-50 transition"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-2 space-y-1">
            <Link
              to="/"
              className={`block px-3 py-2 text-base font-medium rounded-md ${isActive('/') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              onClick={() => setShowMobileMenu(false)}
            >
              Trang chủ
            </Link>
            <Link
              to="/blogs"
              className={`block px-3 py-2 text-base font-medium rounded-md ${isActive('/blogs') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              onClick={() => setShowMobileMenu(false)}
            >
              Blog
            </Link>
            <Link
              to="/magazine"
              className={`block px-3 py-2 text-base font-medium rounded-md ${isActive('/magazine') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              onClick={() => setShowMobileMenu(false)}
            >
              Tạp chí
            </Link>
            <Link
              to="/about-us"
              className={`block px-3 py-2 text-base font-medium rounded-md ${isActive('/about-us') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              onClick={() => setShowMobileMenu(false)}
            >
              About Us
            </Link>
            {!user && (
              <Link
                to="/login"
                className="block px-3 py-2 text-base font-medium rounded-md text-primary hover:text-primary-600 hover:bg-gray-50"
                onClick={() => setShowMobileMenu(false)}
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
