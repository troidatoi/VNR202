import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { useAuth } from "../contexts/AuthContext";
import { registerEventApi, getRegisteredEventsApi } from "../api";
import { getEventFeedbacksApi } from "../api/index";

interface Sponsor {
  logo?: string;
  name: string;
  tier: string;
  donation: string;
}

interface EventRegistered {
  _id: string;
  isCancelled?: boolean;
}

interface EventDetail {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  image?: string;
  sponsors?: Sponsor[];
  registeredCount?: number;
  registrationStartDate?: string;
  registrationEndDate?: string;
}

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [registeredEvents, setRegisteredEvents] = useState<EventRegistered[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  useEffect(() => {
    fetchEventDetail();
    const fetchRegistered = async () => {
      if (user) {
        try {
          const data = await getRegisteredEventsApi(user._id);
          setRegisteredEvents(data);
        } catch {
          // ignore
        }
      }
    };
    fetchRegistered();
    // Lấy feedback event
    const fetchFeedbacks = async () => {
      if (!id) return;
      try {
        const data = await getEventFeedbacksApi(id);
        setFeedbacks(data);
      } catch {
        setFeedbacks([]);
      }
    };
    fetchFeedbacks();
    // eslint-disable-next-line
  }, [id, user]);

  const fetchEventDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events/${id}`);
      if (!res.ok) throw new Error("Không tìm thấy sự kiện");
      const data = await res.json();
      setEvent(data);
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải chi tiết sự kiện");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    if (!user.isVerified) {
      navigate("/verify-otp");
      return;
    }

    if (!event?._id) return;
    setIsRegistering(true);
    setRegisterError(null);
    setRegisterSuccess(null);
    try {
      await registerEventApi(event._id, user._id);
      setRegisterSuccess("Đăng ký thành công!");
      fetchEventDetail(); // refresh event info
      // refresh registered events
      if (user) {
        const data = await getRegisteredEventsApi(user._id);
        setRegisteredEvents(data);
      }
    } catch (err) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: unknown }).response === 'object' &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
      ) {
        setRegisterError((err as { response: { data: { message: string } } }).response.data.message);
      } else {
        setRegisterError("Đăng ký thất bại");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  useEffect(() => {
    if (error || !event) {
      const timeout = setTimeout(() => {
        navigate('/events');
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [error, event, navigate]);

  // Xác định trạng thái đăng ký
  const reg = event ? registeredEvents.find(ev => ev._id === event._id) : undefined;
  const isCancelled = reg?.isCancelled;
  const isRegistered = reg && !isCancelled;

  // Thêm biến kiểm tra thời gian đăng ký
  const now = new Date();
  const isInRegistrationPeriod = event && event.registrationStartDate && event.registrationEndDate
    ? now >= new Date(event.registrationStartDate) && now <= new Date(event.registrationEndDate)
    : true;

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

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-[#f6f8fb]">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-red-500 text-xl">{error || "Không tìm thấy sự kiện"}</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-[#f6f8fb]">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/events")}
          className="mb-6 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
        >
          ← Quay lại danh sách sự kiện
        </button>
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0 w-full md:w-1/2">
            <img
              src={event.image || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"}
              alt={event.title}
              className="w-full h-80 object-cover rounded-xl mb-4"
            />
            <div className="flex gap-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                event.status === "upcoming"
                  ? "bg-sky-600 text-white"
                  : event.status === "ongoing"
                  ? "bg-green-500 text-white"
                  : event.status === "completed"
                  ? "bg-gray-400 text-white"
                  : "bg-red-500 text-white"
              }`}>
                {event.status === "upcoming"
                  ? "Sắp diễn ra"
                  : event.status === "ongoing"
                  ? "Đang diễn ra"
                  : event.status === "completed"
                  ? "Đã kết thúc"
                  : "Đã hủy"}
              </span>
              <span className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                {event.registeredCount || 0}/{event.capacity} người tham gia
              </span>
            </div>
            {/* Nút đăng ký */}
            {event.status === "upcoming" && (event.registeredCount || 0) < event.capacity && (
              <button
                className={
                  "mt-6 w-full px-4 py-2 rounded-lg text-white text-base font-semibold transition" +
                  ((event.registeredCount || 0) >= event.capacity || event.status !== "upcoming" || !isInRegistrationPeriod
                    ? " bg-gray-300 text-gray-500 cursor-not-allowed"
                    : isCancelled
                    ? " bg-blue-600 hover:bg-blue-700"
                    : isRegistered
                    ? " bg-green-600 cursor-not-allowed"
                    : " bg-blue-600 hover:bg-blue-700"
                  )
                }
                onClick={handleRegister}
                disabled={
                  (event.registeredCount || 0) >= event.capacity ||
                  event.status !== "upcoming" ||
                  !isInRegistrationPeriod ||
                  (isRegistered && !isCancelled) ||
                  isRegistering
                }
              >
                {(event.registeredCount || 0) >= event.capacity
                  ? "Đã đầy"
                  : event.status !== "upcoming"
                  ? "Không thể đăng ký"
                  : !isInRegistrationPeriod
                  ? "Ngoài thời gian đăng ký"
                  : isCancelled
                  ? "Đăng ký lại"
                  : isRegistered
                  ? "Đã đăng ký"
                  : isRegistering
                  ? "Đang đăng ký..."
                  : "Đăng ký"}
              </button>
            )}
            {registerError && <div className="mt-2 text-red-500 text-sm">{registerError}</div>}
            {registerSuccess && <div className="mt-2 text-green-600 text-sm">{registerSuccess}</div>}
          </div>
          <div className="flex-1 flex flex-col">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">{event.title}</h2>
            <div className="mb-4 text-gray-600 whitespace-pre-line">{event.description}</div>
            <div className="mb-4 flex flex-col gap-2 text-gray-700">
              <div>
                <span className="font-semibold">Thời gian bắt đầu:</span> {format(new Date(event.startDate), "dd/MM/yyyy HH:mm")}
              </div>
              <div>
                <span className="font-semibold">Thời gian kết thúc:</span> {format(new Date(event.endDate), "dd/MM/yyyy HH:mm")}
              </div>
              <div>
                <span className="font-semibold">Địa điểm:</span> {event.location}
              </div>
            </div>
            {/* Danh sách nhà tài trợ */}
            {event.sponsors && event.sponsors.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Nhà tài trợ</h3>
                <div className="flex flex-wrap gap-4">
                  {event.sponsors.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border">
                      {s.logo && <img src={s.logo} alt={s.name} className="w-10 h-10 rounded-full object-cover" />}
                      <div>
                        <div className="font-semibold text-gray-800">{s.name}</div>
                        <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                          s.tier === 'Platinum' ? 'bg-purple-100 text-purple-800' :
                          s.tier === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                          s.tier === 'Silver' ? 'bg-gray-100 text-gray-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {s.tier}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{s.donation}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Sau phần thông tin event, thêm section feedback */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-sky-700 mb-4 flex items-center gap-2">📝 Feedback từ người tham gia</h3>
          {feedbacks.length === 0 ? (
            <div className="text-gray-400 italic">Chưa có feedback nào cho sự kiện này.</div>
          ) : (
            <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {feedbacks.map((fb, idx) => (
                <li key={idx} className="py-4 flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-xl">
                    {fb.userId?.fullName ? fb.userId.fullName[0] : 'A'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800">{fb.userId?.fullName || 'Ẩn danh'}</span>
                      <span className="flex gap-0.5">
                        {Array(5).fill(0).map((_, i) => (
                          <svg key={i} className={`w-5 h-5 ${i < fb.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.385 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.385-2.46a1 1 0 00-1.175 0l-3.385 2.46c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118l-3.385-2.46c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.967z" /></svg>
                        ))}
                      </span>
                    </div>
                    <div className="text-gray-700 text-base">{fb.content}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
} 