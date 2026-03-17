import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import serverHealthMonitor from "./utils/serverHealth";

// Lazy load all page components
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Profile = lazy(() => import("./pages/Profile"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const AdminLayout = lazy(() => import("./components/layout/AdminLayout"));
const EventManagement = lazy(() => import("./pages/admin/EventManagement"));
const Home = lazy(() => import("./pages/Home"));
const QuizzPage = lazy(() => import("./pages/QuizzPage"));
const ConsultingPage = lazy(() => import("./pages/ConsultingPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogDetailPage = lazy(() => import("./pages/BlogDetailPage"));
const AccountList = lazy(() => import("./pages/admin/AccountList"));
const ConsultantDetailPage = lazy(() => import("./pages/ConsultantDetailPage"));
const Service = lazy(() => import("./pages/admin/Service"));
const Consultant = lazy(() => import("./pages/admin/Consultant"));
const AboutUsPage = lazy(() => import("./pages/AboutUsPage"));
const ServicePage = lazy(() => import("./pages/ServicePage"));
const AppointmentsPage = lazy(() => import("./pages/Appointments"));
const PaymentHistory = lazy(() => import("./pages/PaymentHistory"));
const BlogManagement = lazy(() => import("./pages/admin/BlogManagement"));
const ConsultantLayout = lazy(
  () => import("./components/layout/ConsultantLayout")
);
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
// const ConsultantDashboard = lazy(
//   () => import("./pages/consultant/ConsultantDashboard")
// );
const ScheduleManagement = lazy(
  () => import("./pages/consultant/ScheduleManagement")
);
const ReportsAndUpdates = lazy(
  () => import("./pages/consultant/Reports&Updates")
);
const ConsultantProfile = lazy(
  () => import("./pages/consultant/ConsultantProfile")
);
const ReportsDetails = lazy(() => import("./pages/consultant/ReportsDetails"));
const PaymentResultPage = lazy(() => import("./pages/PaymentResultPage"));
const AppointmentManagement = lazy(
  () => import("./pages/admin/AppointmentManagement")
);
const QuizManagement = lazy(() => import("./pages/admin/QuizManagement"));
const QuizResultsManagement = lazy(
  () => import("./pages/admin/QuizResultsManagement")
);
const EventDetailPage = lazy(() => import("./pages/EventDetailPage"));
const VerifyOTP = lazy(() => import("./pages/VerifyOTP"));
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));
const TransactionManagement = lazy(() => import("./pages/admin/TransactionManagement"));
const MagazinePage = lazy(() => import("./pages/Magazine/MagazinePage"));
import AIChatBox from "./components/chat/AIChatBox";

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return user.role === "admin" ? <>{children}</> : <Navigate to="/" replace />;
}

function ConsultantRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect consultant to home page instead of showing consultant dashboard
  return user.role === "consultant" ? (
    <Navigate to="/" replace />
  ) : (
    <Navigate to="/" replace />
  );
}

function AppContent() {
  const { loading } = useAuth();

  // Start server health monitoring when app loads
  useEffect(() => {
    console.log("🚀 Starting server health monitoring...");
    serverHealthMonitor.startMonitoring();

    // Pre-wake server on app load
    serverHealthMonitor.preWakeServer();

    return () => {
      serverHealthMonitor.stopMonitoring();
    };
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} />
          <Route path="/quizz" element={<QuizzPage />} />
          <Route path="/consulting" element={<ConsultingPage />} />
          <Route path="/consultant/:id" element={<ConsultantDetailPage />} />
          <Route path="/blogs" element={<BlogPage />} />
          <Route path="/blogs/:id" element={<BlogDetailPage />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/service" element={<ServicePage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/magazine" element={<MagazinePage />} />

          {/* Protected Routes */}
          <Route
            path="/events"
            element={
              <PrivateRoute>
                <EventsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <PrivateRoute>
                <AppointmentsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/payment-history"
            element={
              <PrivateRoute>
                <PaymentHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/payment/result"
            element={
              <PrivateRoute>
                <PaymentResultPage />
              </PrivateRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminLayout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      <Route index element={<AdminDashboard />} />
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="users" element={<AccountList />} />
                      <Route path="services" element={<Service />} />
                      <Route path="events" element={<EventManagement />} />
                      <Route path="consultants" element={<Consultant />} />
                      <Route path="blogs" element={<BlogManagement />} />
                      <Route
                        path="appointments"
                        element={<AppointmentManagement />}
                      />
                      <Route path="quizzes" element={<QuizManagement />} />
                      <Route
                        path="quiz-results"
                        element={<QuizResultsManagement />}
                      />
                      <Route path="profile" element={<AdminProfile />} />
                      <Route path="transactions" element={<TransactionManagement />} />
                    </Routes>
                  </Suspense>
                </AdminLayout>
              </AdminRoute>
            }
          />

          {/* Consultant Routes - Hidden */}
          {/* <Route
            path="/consultants/*"
            element={
              <ConsultantRoute>
                <ConsultantLayout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      <Route index element={<ConsultantDashboard />} />
                      <Route
                        path="dashboard"
                        element={<ConsultantDashboard />}
                      />
                      <Route path="events" element={<EventManagement />} />
                      <Route path="schedule" element={<ScheduleManagement />} />
                      <Route path="reports" element={<ReportsAndUpdates />} />
                      <Route
                        path="reports/:appointmentId"
                        element={<ReportsDetails />}
                      />
                      <Route
                        path="consultant-profile"
                        element={<ConsultantProfile />}
                      />
                    </Routes>
                  </Suspense>
                </ConsultantLayout>
              </ConsultantRoute>
            }
          /> */}
        </Routes>
      </Suspense>
      <AIChatBox />
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
