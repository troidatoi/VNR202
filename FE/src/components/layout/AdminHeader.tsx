import { useState, useRef, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '/avarta.png';

interface AdminHeaderProps {
  isSidebarCollapsed?: boolean;
}

function AdminHeader({ isSidebarCollapsed = false }: AdminHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  
  const avatarUrl = user?.photoUrl || 'https://ui-avatars.com/api/?name=Admin&background=eee&color=555';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    return date.toLocaleDateString('vi-VN', options);
  };

  return (
    <header className={`relative z-30 transition-all duration-300`} style={{minHeight: 100}}>
      {/* SVG background sóng */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none" aria-hidden="true">
        <svg viewBox="0 0 1600 200" width="100%" height="100%" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,0 L1600,0 L1600,80 Q1200,120 900,80 Q600,40 0,120 Z" fill="#d97706" />
          <path d="M0,120 Q600,40 900,80 Q1200,120 1600,80 L1600,140 Q1200,180 900,140 Q600,100 0,180 Z" fill="#f59e0b" />
          <path d="M0,180 Q600,100 900,140 Q1200,180 1600,140 L1600,200 L0,200 Z" fill="#fff" />
        </svg>
      </div>
      {/* Nội dung header */}
      <div className={`relative flex items-center justify-between px-6 py-4`} style={{minHeight: 100}}>
        <div className="flex items-center">
          <img
            src={logo}
            alt="Logo"
            className="h-10 w-10 object-cover rounded-full mr-2 bg-white shadow"
          />
          <div className="ml-4 text-sm text-white font-medium drop-shadow">
            {formatDate(currentTime)}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 text-white hover:text-gray-200 focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          {/* User Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center space-x-2 focus:outline-none"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <img
                src={avatarUrl}
                alt="Admin"
                className="w-10 h-10 rounded-full border-2 border-white shadow"
              />
              <div className="text-left text-white drop-shadow">
                <p className="text-sm font-medium">{user?.fullName || 'Admin'}</p>
                <p className="text-xs opacity-80">{user?.role || 'Administrator'}</p>
              </div>
              <svg className="w-5 h-5 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-100">
                <button
                  className="w-full text-left px-4 py-2 hover:bg-amber-50 text-gray-700 flex items-center"
                  onClick={() => { setShowDropdown(false); navigate('/admin/profile'); }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Thông tin cá nhân
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-amber-50 text-gray-700 flex items-center"
                  onClick={handleLogout}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader; 