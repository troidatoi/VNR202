import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  getAllEventsApi,
  registerEventApi,
  getRegisteredEventsApi,
  unregisterEventApi,
} from "../api";
import { getEventFeedbacksApi } from "../api/index";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import eventBackground from "../assets/event-background.webp";

interface RegisteredUser {
  _id: string;
  fullName: string;
  email: string;
}

interface RegistrationConfirmation {
  userName: string;
  eventName: string;
  eventDate: string;
  qrCode: string;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  registeredUsers: RegisteredUser[];
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  image?: string;
  registeredCount?: number;
  isCancelled?: boolean;
  createdAt?: string;
  updatedAt?: string;
  sponsors?: {
    logo?: string;
    name: string;
    tier: string;
    donation: string;
  }[];
  registrationStartDate?: string;
  registrationEndDate?: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<Event[]>([]);
  const [cancelledEvents, setCancelledEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [registrationConfirmation, setRegistrationConfirmation] =
    useState<RegistrationConfirmation | null>(null);
  const [showUnregisterSuccess, setShowUnregisterSuccess] = useState(false);
  const [showUnregisterConfirm, setShowUnregisterConfirm] = useState(false);
  const [eventToUnregister, setEventToUnregister] = useState<string | null>(null);
  const [eventFeedbacks, setEventFeedbacks] = useState<Record<string, { avg: number, count: number }>>({});
  const navigate = useNavigate();
  const { user } = useAuth();

  const categories = [
    { id: "all", name: "Tất cả sự kiện" },
    { id: "upcoming", name: "Sắp diễn ra" },
    { id: "ongoing", name: "Đang diễn ra" },
    { id: "completed", name: "Đã kết thúc" },
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      console.log("Fetching events...");
      const data = await getAllEventsApi();
      console.log("Events data:", data);
      
      // Sắp xếp sự kiện theo thời gian mới nhất (createdAt hoặc startDate)
      const sortedEvents = data.sort((a: Event, b: Event) => {
        // Ưu tiên sắp xếp theo ngày tạo mới nhất
        const dateA = new Date(a.createdAt || a.startDate);
        const dateB = new Date(b.createdAt || b.startDate);
        return dateB.getTime() - dateA.getTime();
      });
      
      setEvents(sortedEvents);
      setFilteredEvents(sortedEvents);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = events;

    if (selectedCategory === "my_cancelled") {
      filtered = cancelledEvents;
    } else if (selectedCategory !== "all") {
      filtered = filtered.filter((event) => event.status === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sắp xếp sự kiện
    filtered.sort((a: Event, b: Event) => {
      let dateA, dateB, dateAOld, dateBOld;
      switch (sortBy) {
        case "newest":
          dateA = new Date(a.createdAt || a.startDate);
          dateB = new Date(b.createdAt || b.startDate);
          return dateB.getTime() - dateA.getTime();
        case "oldest":
          dateAOld = new Date(a.createdAt || a.startDate);
          dateBOld = new Date(b.createdAt || b.startDate);
          return dateAOld.getTime() - dateBOld.getTime();
        case "startDate":
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case "startDateDesc":
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        case "capacity":
          return b.capacity - a.capacity;
        case "registered":
          return (b.registeredCount || 0) - (a.registeredCount || 0);
        default:
          return 0;
      }
    });

    setFilteredEvents(filtered);
  }, [selectedCategory, searchTerm, events, cancelledEvents, sortBy]);

  const fetchRegisteredEvents = async () => {
    setRegisteredEvents([]);
    if (!user) return;
    try {
      const data = await getRegisteredEventsApi(user._id);
      setRegisteredEvents(data);
    } catch (err) {
      console.error("Error fetching registered events:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRegisteredEvents();
    }
  }, [user]);

  const handleRegister = async (eventId: string) => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!user.isVerified) {
      navigate("/verify-otp");
      return;
    }

    // Kiểm tra lại thời gian đăng ký trước khi submit
    const event = events.find(e => e._id === eventId);
    if (event && event.registrationStartDate && event.registrationEndDate) {
      const now = new Date();
      const regStart = new Date(event.registrationStartDate);
      const regEnd = new Date(event.registrationEndDate);
      if (now < regStart || now > regEnd) {
        alert("Chỉ được đăng ký trong thời gian đăng ký!");
        return;
      }
    }
    try {
      const response = await registerEventApi(eventId, user._id);
      setRegistrationConfirmation(response.data);
      setShowConfirmationModal(true);
      
      // Refresh events để cập nhật số người đăng ký
      await fetchEvents();
      await fetchRegisteredEvents();
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  const confirmUnregister = async () => {
    if (!user || !eventToUnregister) return;
    try {
      await unregisterEventApi(eventToUnregister, user._id);
      
      // Find the event that was cancelled
      const cancelledEvent = registeredEvents.find(event => event._id === eventToUnregister);
      if (cancelledEvent) {
        // Add to cancelled events
        setCancelledEvents(prev => [...prev, cancelledEvent]);
        // Remove from registered events
        setRegisteredEvents(prev => prev.filter(event => event._id !== eventToUnregister));
      }
      
      // Refresh events để cập nhật số người đăng ký
      await fetchEvents();
      setShowUnregisterSuccess(true);
      setShowUnregisterConfirm(false);
      setEventToUnregister(null);
    } catch (err) {
      console.error("Unregistration failed:", err);
      setShowUnregisterConfirm(false);
      setEventToUnregister(null);
    }
  };

  useEffect(() => {
    const cancelled = localStorage.getItem('cancelledEvents');
    if (cancelled) {
      setCancelledEvents(JSON.parse(cancelled));
    } else {
      setCancelledEvents([]);
    }
  }, [user]);

  useEffect(() => {
    if (filteredEvents.length === 0) return;
    // Lấy feedback cho từng event (chỉ lấy trung bình và số lượng)
    const fetchFeedbacks = async () => {
      const feedbackMap: Record<string, { avg: number, count: number }> = {};
      await Promise.all(filteredEvents.map(async (event) => {
        try {
          const feedbacks: { rating: number }[] = await getEventFeedbacksApi(event._id);
          if (feedbacks && feedbacks.length > 0) {
            const avg = Math.round((feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length) * 10) / 10;
            feedbackMap[event._id] = { avg, count: feedbacks.length };
          } else {
            feedbackMap[event._id] = { avg: 0, count: 0 };
          }
        } catch {
          feedbackMap[event._id] = { avg: 0, count: 0 };
        }
      }));
      setEventFeedbacks(feedbackMap);
    };
    fetchFeedbacks();
  }, [filteredEvents]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-[#f6f8fb]">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-[#f6f8fb]">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-red-500 text-xl">{error}</div>
        </div>
        <Footer />
      </div>
    );
  }

  const RegistrationConfirmationModal = () => {
    if (!showConfirmationModal || !registrationConfirmation) return null;

    const handleDownloadQR = () => {
      const link = document.createElement("a");
      link.href = registrationConfirmation.qrCode;
      link.download = `qr-code-${registrationConfirmation.eventName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Xác nhận đăng ký
            </h2>
            <button
              onClick={() => setShowConfirmationModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-green-600 text-lg font-medium mb-2">
                ✅ Đăng ký thành công!
              </p>
              <p className="text-sm text-gray-600">
                Số người đăng ký đã được cập nhật
              </p>
            </div>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Họ tên:</span>{" "}
                {registrationConfirmation.userName}
              </p>
              <p>
                <span className="font-medium">Sự kiện:</span>{" "}
                {registrationConfirmation.eventName}
              </p>
              <p>
                <span className="font-medium">Thời gian:</span>{" "}
                {format(
                  new Date(registrationConfirmation.eventDate),
                  "dd/MM/yyyy HH:mm"
                )}
              </p>
            </div>
            <div className="flex flex-col items-center mt-4">
              <p className="text-sm text-gray-600 mb-2">Mã QR Code của bạn:</p>
              <img
                src={registrationConfirmation.qrCode}
                alt="QR Code"
                className="w-48 h-48 mb-4"
              />
              <button
                onClick={handleDownloadQR}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Tải xuống mã QR
              </button>
              <p className="text-sm text-gray-500 mt-4 text-center">
                Vui lòng mang theo mã QR này đến sự kiện để được check-in
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const UnregisterSuccessModal = () => {
    if (!showUnregisterSuccess) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
          <div className="text-center">
            <div className="text-green-600 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Hủy đăng ký thành công!
            </h2>
            <p className="text-gray-600 mb-6">
              Sự kiện đã được chuyển vào danh mục "Đã hủy đăng ký" và không thể đăng ký lại.
            </p>
            <button
              onClick={() => setShowUnregisterSuccess(false)}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  };

  const UnregisterConfirmModal = () => {
    if (!showUnregisterConfirm) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Xác nhận hủy đăng ký
            </h2>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn hủy đăng ký sự kiện này không?
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setShowUnregisterConfirm(false);
                  setEventToUnregister(null);
                }}
                className="px-6 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmUnregister}
                className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Content Container */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 lg:p-12">
        {/* Background Image Section */}
        <div 
          className="relative mb-16 rounded-2xl overflow-hidden"
          style={{
            backgroundImage: `url(${eventBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            minHeight: '300px'
          }}
        >
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 text-center py-16 px-8"
          >
            <h1 className="text-4xl font-bold text-white mb-6">
              Sự kiện sắp tới
            </h1>
            <p className="text-white max-w-2xl mx-auto text-lg leading-relaxed">
              Tham gia các sự kiện của chúng tôi để học hỏi, chia sẻ và kết nối
              với cộng đồng
            </p>
          </motion.div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <div className="w-full lg:w-96">
              <input
                type="text"
                placeholder="Tìm kiếm sự kiện..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-sm text-slate-700"
              />
            </div>
            <div className="flex gap-4 items-center">
              {/* Filter Dropdown */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-6 py-3 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-sm bg-white text-slate-700 text-sm font-medium min-w-[180px] appearance-none"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-6 py-3 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-sm bg-white text-slate-700 text-sm font-medium min-w-[160px] appearance-none"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="startDate">Sắp diễn ra</option>
                  <option value="startDateDesc">Sắp diễn ra (ngược)</option>
                  <option value="capacity">Sức chứa cao</option>
                  <option value="registered">Đăng ký nhiều</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event) => {
            const now = new Date();
            const isInRegistrationPeriod = event.registrationStartDate && event.registrationEndDate
              ? now >= new Date(event.registrationStartDate) && now <= new Date(event.registrationEndDate)
              : true;

            return (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full min-h-[420px] cursor-pointer border border-slate-100"
                onClick={() => navigate(`/events/${event._id}`)}
              >
                <div className="relative h-48">
                  <img
                    src={
                      event.image ||
                      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                    }
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-sky-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                    {event.status === "upcoming"
                      ? "Sắp diễn ra"
                      : event.status === "ongoing"
                      ? "Đang diễn ra"
                      : event.status === "completed"
                      ? "Đã kết thúc"
                      : "Đã hủy"}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-3">
                    {event.title}
                  </h3>
                  {/* Feedback summary */}
                  {eventFeedbacks[event._id] && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex gap-0.5">
                        {Array(5).fill(0).map((_, i) => (
                          <svg key={i} className={`w-4 h-4 ${i < eventFeedbacks[event._id].avg ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.385 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.385-2.46a1 1 0 00-1.175 0l-3.385 2.46c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118l-3.385-2.46c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.967z" /></svg>
                        ))}
                      </span>
                      <span className="text-sm text-gray-600 font-medium">{eventFeedbacks[event._id].avg > 0 ? eventFeedbacks[event._id].avg : 'Chưa có đánh giá'} ({eventFeedbacks[event._id].count})</span>
                    </div>
                  )}
                  <p className="text-slate-600 mb-4 line-clamp-2 min-h-[48px] leading-relaxed">
                    {event.description}
                  </p>
                  {/* Thông tin nhà tài trợ */}
                  {event.sponsors && event.sponsors.length > 0 && event.sponsors.some(s => s.logo) && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-gray-500 font-medium">Nhà tài trợ:</span>
                      {event.sponsors.map((s, idx) =>
                        s.logo ? (
                          <img
                            key={idx}
                            src={s.logo}
                            alt="Sponsor logo"
                            className="w-9 h-9 rounded-full object-cover border bg-white shadow-sm"
                            style={{ maxWidth: 36, maxHeight: 36 }}
                          />
                        ) : null
                      )}
                    </div>
                  )}
                  <div className="text-slate-500 mb-4 text-sm font-medium">
                    {format(new Date(event.startDate), "dd/MM/yyyy HH:mm")}
                  </div>
                  {/* Thời gian đăng ký */}
                  {event.registrationStartDate && event.registrationEndDate && (
                    <div className="text-gray-500 mb-2 text-xs">
                      {`Đăng ký: ${new Date(event.registrationStartDate).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })} - ${new Date(event.registrationEndDate).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}`}
                    </div>
                  )}
                  <div className="text-slate-500 mb-4 text-sm font-medium">
                    {event.location}
                  </div>
                  <div className="flex-1"></div>
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-slate-600 font-medium">
                      <span className={event.registeredCount && event.registeredCount >= event.capacity ? "text-red-600 font-semibold" : ""}>
                        {event.registeredCount || 0}/{event.capacity} người tham gia
                      </span>
                      {event.registeredCount && event.registeredCount >= event.capacity && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                          Đã đầy
                        </span>
                      )}
                    </div>
                    {/* Progress bar cho mức độ đăng ký */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          event.registeredCount && event.registeredCount >= event.capacity 
                            ? 'bg-red-500' 
                            : event.registeredCount && event.registeredCount >= event.capacity * 0.8
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ 
                          width: `${Math.min(((event.registeredCount || 0) / event.capacity) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div></div>
                    <button
                      onClick={e => { e.stopPropagation(); handleRegister(event._id); }}
                      disabled={
                        (event.registeredCount || 0) >= event.capacity ||
                        event.status !== "upcoming" ||
                        !isInRegistrationPeriod ||
                        (registeredEvents.some(regEvent => regEvent._id === event._id && regEvent.isCancelled !== true) && !registeredEvents.some(regEvent => regEvent._id === event._id && regEvent.isCancelled === true))
                      }
                      className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 min-w-[120px] text-center
                        ${
                          (event.registeredCount || 0) >= event.capacity ||
                          event.status !== "upcoming" ||
                          !isInRegistrationPeriod
                            ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                            : registeredEvents.some(regEvent => regEvent._id === event._id && regEvent.isCancelled === true)
                            ? "bg-sky-600 text-white hover:bg-sky-700"
                            : registeredEvents.some(regEvent => regEvent._id === event._id && regEvent.isCancelled !== true)
                            ? "bg-green-600 text-white cursor-not-allowed"
                            : "bg-sky-600 text-white hover:bg-sky-700"
                        }`}
                    >
                      {(event.registeredCount || 0) >= event.capacity
                        ? "Đã đầy"
                        : event.status !== "upcoming"
                        ? "Không thể đăng ký"
                        : !isInRegistrationPeriod
                        ? "Ngoài thời gian đăng ký"
                        : registeredEvents.some(regEvent => regEvent._id === event._id && regEvent.isCancelled === true)
                        ? "Đăng ký lại"
                        : registeredEvents.some(regEvent => regEvent._id === event._id && regEvent.isCancelled !== true)
                        ? "Đã đăng ký"
                        : "Đăng ký"}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Không tìm thấy sự kiện nào phù hợp
            </p>
          </div>
        )}

        <RegistrationConfirmationModal />
        <UnregisterSuccessModal />
        <UnregisterConfirmModal />
        </div>
      </div>
      <Footer />
    </div>
  );
}
