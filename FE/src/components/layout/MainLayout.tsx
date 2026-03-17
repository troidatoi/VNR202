// src/components/layout/MainLayout.tsx

import { useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../../contexts/AuthContext';
import VerificationAlert from '../VerificationAlert';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const isAdminPage = location.pathname.startsWith('/admin');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      {isAdminPage ? <AdminHeader isSidebarCollapsed={isSidebarCollapsed} /> : <Header />}

      {/* Verification Alert */}
      <VerificationAlert />

      {/* Main Content */}
      <div className="flex flex-grow">
        {/* Sidebar - chỉ hiển thị ở trang admin */}
        {isAdminPage && user && (
          <Sidebar 
            isCollapsed={isSidebarCollapsed} 
            setIsCollapsed={setIsSidebarCollapsed} 
          />
        )}

        {/* Content */}
        <main className={`flex-1 ${isAdminPage ? (isSidebarCollapsed ? 'ml-20' : 'ml-64') : ''} p-6 pt-16 transition-all duration-300`}>
          {children}
        </main>
      </div>
      
      {/* Footer - không hiển thị ở trang admin */}
      {!isAdminPage && <Footer />}
    </div>
  );
};

export default MainLayout;
