import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import {
  getAllConsultantsApi,
  getAllServicesApi,
  getAllSlotTimeApi,
  getAvailableConsultantsByDayApi,
  createAppointmentApi,
  getAppointmentByUserIdApi,
  getFeedbackByServiceIdApi,
  getServiceRatingApi,
  createMomoPaymentApi,
  updateStatusSlotTimeApi,
} from "../api";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Sparkles,
  Calendar,
  Banknote,
  Star,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { addDays, startOfWeek, isSameWeek } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { useAuth } from "../contexts/AuthContext";
import consultingImage from "../assets/images/consulting-intro.png"; // Import the consulting image
import { motion, AnimatePresence } from "framer-motion"; // Import for animations
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const steps = [
  { title: "Chọn dịch vụ", desc: "Chọn gói dịch vụ phù hợp" },
  { title: "Chọn thời gian", desc: "Chọn lịch khám có sẵn" },
  { title: "Chọn chuyên gia", desc: "Chọn chuyên gia tư vấn" },
  { title: "Thông tin cá nhân", desc: "Điền thông tin liên hệ" },
  { title: "Thanh toán", desc: "Xác nhận & thanh toán" },
];

interface User {
  _id: string;
  fullName: string;
  photoUrl: string;
  email: string;
  phoneNumber: string;
}

interface Consultant {
  _id: string;
  userId: string;
  introduction: string;
  contactLink: string;
  licenseNumber: string;
  startDate: string;
  googleMeetLink: string;
  accountId: User;
  experience?: number;
  specialty?: string;
}

interface Service {
  _id: string;
  name: string;
  price: number;
  description: string;
  category?: string;
  image?: string;
  duration?: string;
  status?: "active" | "inactive";
  level?: string;
}

interface SlotTime {
  _id: string;
  consultant_id: string;
  start_time: string;
  end_time: string;
  status: string;
  holdedBy?: string;
}

interface AvailableConsultant {
  _id: string;
  fullName: string;
  photoUrl?: string;
  email?: string;
  phoneNumber?: string;
  gender?: string;
  introduction?: string;
  experience?: number;
  contact?: string;
}

// Interface cho feedback và rating
interface Feedback {
  _id: string;
  account_id: {
    fullName?: string;
    photoUrl?: string;
  };
  service_id: string;
  rating: number;
  comment: string;
  feedback_date: string;
  status: string;
}

// Component hiển thị đánh giá sao
/* const RatingStars = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 ${
            star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
}; */

// Component đánh giá dịch vụ tách riêng
const ServiceRatings = ({ services }: { services: Service[] }) => {
  const [topRatedServices, setTopRatedServices] = useState<
    { service: Service; rating: number; count: number; feedbacks: Feedback[] }[]
  >([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    const fetchTopRatedServices = async () => {
      try {
        setLoadingServices(true);

        // Lấy rating cho tất cả dịch vụ
        const ratingPromises = services.map(async (service) => {
          try {
            const [ratingData, feedbacksData] = await Promise.all([
              getServiceRatingApi(service._id),
              getFeedbackByServiceIdApi(service._id),
            ]);

            // Chỉ lấy feedback đã được phê duyệt
            const approvedFeedbacks = feedbacksData.filter(
              (feedback: Feedback) => feedback.status === "approved"
            );

            return {
              service,
              rating: ratingData.averageRating || 0,
              count: ratingData.feedbackCount || 0,
              feedbacks: approvedFeedbacks,
            };
          } catch (error) {
            console.error(
              `Error fetching data for service ${service._id}:`,
              error
            );
            return {
              service,
              rating: 0,
              count: 0,
              feedbacks: [],
            };
          }
        });

        const servicesWithRatings = await Promise.all(ratingPromises);

        // Sắp xếp theo rating cao nhất
        const sortedServices = servicesWithRatings
          .sort((a, b) => {
            // Sắp xếp theo rating trước
            if (b.rating !== a.rating) {
              return b.rating - a.rating;
            }
            // Nếu rating bằng nhau thì sắp xếp theo số lượng đánh giá
            return b.count - a.count;
          })
          .slice(0, 3); // Lấy 3 dịch vụ cao nhất

        setTopRatedServices(sortedServices);
      } catch (error) {
        console.error("Error fetching top rated services:", error);
      } finally {
        setLoadingServices(false);
      }
    };

    if (services.length > 0) {
      fetchTopRatedServices();
    }
  }, [services]);

  // Component hiển thị một đánh giá dịch vụ
  const ServiceRatingCard = ({
    serviceData,
  }: {
    serviceData: {
      service: Service;
      rating: number;
      count: number;
      feedbacks: Feedback[];
    };
  }) => {
    const { service, rating, count, feedbacks } = serviceData;
    const [showFullDescription, setShowFullDescription] = useState(false);

    return (
      <div className="bg-white rounded-xl shadow-md border border-sky-100 hover:shadow-lg transition-all duration-300 hover:border-sky-200 overflow-hidden flex flex-col h-full">
        {/* Phần hình ảnh dịch vụ */}
        <div className="w-full h-48 overflow-hidden relative">
          {service.image ? (
            <img
              src={service.image}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-sky-400" />
            </div>
          )}
          <div className="absolute top-0 right-0 bg-sky-500 text-white px-3 py-1 rounded-bl-lg font-medium shadow-md flex items-center gap-1">
            <Star className="w-4 h-4 fill-white" />
            <span>{rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Phần nội dung */}
        <div className="p-6 flex-grow flex flex-col">
          <div className="mb-4">
            <h4
              className="font-semibold text-gray-800 text-lg mb-2"
              title={service.name}
            >
              {service.name}
            </h4>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= rating
                        ? "text-sky-500 fill-sky-500"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">({count} đánh giá)</span>
            </div>
          </div>

          {/* Phần mô tả dịch vụ */}
          {service.description && (
            <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p
                className={`text-sm text-gray-600 ${
                  showFullDescription ? "" : "line-clamp-3"
                }`}
              >
                {service.description}
              </p>
              {service.description.length > 150 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-xs text-sky-600 font-medium mt-1 hover:text-sky-800 flex items-center"
                >
                  {showFullDescription ? "Thu gọn" : "Xem thêm"}
                  <ChevronDown
                    className={`w-3 h-3 ml-0.5 transition-transform ${
                      showFullDescription ? "rotate-180" : ""
                    }`}
                  />
                </button>
              )}
            </div>
          )}

          <div className="flex-grow">
            {feedbacks.length > 0 ? (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-sky-500" />
                  Đánh giá gần đây
                </h5>
                <div className="space-y-4">
                  {feedbacks.slice(0, 2).map((feedback) => (
                    <div
                      key={feedback._id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                    >
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 rounded-full bg-sky-50 flex-shrink-0 overflow-hidden border border-sky-100">
                          {feedback.account_id.photoUrl ? (
                            <img
                              src={feedback.account_id.photoUrl}
                              alt={feedback.account_id.fullName || "Người dùng"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-sky-700 mx-auto mt-2" />
                          )}
                        </div>
                        <div className="ml-2">
                          <div className="font-medium text-xs text-gray-800">
                            {feedback.account_id.fullName || "Người dùng"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(
                              feedback.feedback_date
                            ).toLocaleDateString("vi-VN")}
                          </div>
                        </div>
                        <div className="ml-auto">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= feedback.rating
                                    ? "text-sky-500 fill-sky-500"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                        {feedback.comment}
                      </p>
                    </div>
                  ))}
                </div>

                {feedbacks.length > 2 && (
                  <div className="text-center mt-4">
                    <button className="px-4 py-1.5 text-sm text-sky-600 font-medium hover:text-sky-800 transition-colors flex items-center mx-auto border border-sky-200 rounded-lg hover:bg-sky-50">
                      Xem thêm
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center">
                <MessageCircle className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">Chưa có đánh giá</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-50/80 to-blue-50/50 border-t border-sky-100">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {service.duration || "Thời gian: 60 phút"}
            </div>
            <div className="text-sky-600 font-semibold">
              {service.price?.toLocaleString("vi-VN")}đ
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loadingServices) {
    return (
      <motion.div
        key="ratings-loading"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="max-w-7xl w-full mx-auto mt-8 bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-amber-100 shadow-[0_10px_40px_rgba(251,191,36,0.08)]"
      >
        <div className="flex items-center mb-8">
          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500 mr-2" />
          <h3 className="text-xl font-bold text-gray-800">
            Dịch vụ được đánh giá cao
          </h3>
        </div>
        <div className="flex justify-center py-8">
          <div className="w-10 h-10 border-t-2 border-b-2 border-amber-500 rounded-full animate-spin"></div>
        </div>
      </motion.div>
    );
  }

  if (topRatedServices.length === 0) {
    return null;
  }

  return (
    <motion.div
      key="ratings"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5 }}
      className="max-w-7xl w-full mx-auto mt-8 bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-amber-100 shadow-[0_10px_40px_rgba(251,191,36,0.08)]"
    >
      <div className="mb-8">
        <div className="flex items-center">
          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500 mr-2" />
          <h3 className="text-xl font-bold text-gray-800">
            Dịch vụ được đánh giá cao
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topRatedServices.map((serviceData) => (
          <ServiceRatingCard
            key={serviceData.service._id}
            serviceData={serviceData}
          />
        ))}
      </div>
    </motion.div>
  );
};

interface Appointment {
  dateBooking: string;
  status?: string;
}

type SlotStatus = "available" | "booked" | "past" | "no-consultant";

// Update PayPal error type to match actual PayPal error structure
type PayPalError = Record<string, unknown>;

export default function ServicePage() {
  const navigate = useNavigate();
  const [showIntro, setShowIntro] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedConsultant, setSelectedConsultant] = useState("");
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{
    day: string;
    time: string;
  } | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    gender: "male",
    reason: "",
    serviceId: "",
    paymentMethod: "momo",
    note: "",
  });

  const [formErrors, setFormErrors] = useState({
    phone: "",
    reason: "",
  });
  const [timeFilter, setTimeFilter] = useState<"morning" | "afternoon">(
    "morning"
  );
  const [showConsultantDrawer, setShowConsultantDrawer] = useState(false);
  const [pendingConsultant, setPendingConsultant] = useState("");
  const MAX_VISIBLE_CONSULTANTS = 6;
  const [expandConsultants, setExpandConsultants] = useState(false);
  const MAX_VISIBLE_SERVICES = 5;
  const [expandServices, setExpandServices] = useState(false);
  const [allSlotTimes, setAllSlotTimes] = useState<SlotTime[]>([]);
  const [availableConsultants, setAvailableConsultants] = useState<
    AvailableConsultant[]
  >([]);
  const [showError, setShowError] = useState<string | null>(null);
  const { user } = useAuth();
  const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);
  const [weekSchedule, setWeekSchedule] = useState<
    Record<
      string,
      { time: string; availableConsultants: AvailableConsultant[] }[]
    >
  >({});
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [slotHoldTime, setSlotHoldTime] = useState<number | null>(null);
  const [heldSlotId, setHeldSlotId] = useState<string | null>(null);
  const slotHoldInterval = useRef<NodeJS.Timeout | null>(null);

  const handleStartConsulting = () => {
    if (!user) {
      navigate("/login");
    } else if (!user.isVerified) {
      navigate("/verify-otp");
    } else {
      setShowIntro(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [consultantsData, servicesData, slotTimesData] =
          await Promise.all([
            getAllConsultantsApi(),
            getAllServicesApi(),
            getAllSlotTimeApi(),
          ]);
        setConsultants(consultantsData);

        const activeServices = servicesData.filter(
          (service: Service) => service.status === "active"
        );
        setServices(activeServices);

        setAllSlotTimes(slotTimesData);

        if (user?._id) {
          const appointments = await getAppointmentByUserIdApi(user._id);
          setUserAppointments(appointments);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    const fetchWeekSchedule = async () => {
      if (!user?._id) return;
      setIsLoadingSchedule(true);
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const promises = [];
      const daysToFetch = 7;

      for (let i = 0; i < daysToFetch; i++) {
        const day = addDays(weekStart, i);
        const dayStr = formatInTimeZone(day, "Asia/Ho_Chi_Minh", "yyyy-MM-dd");
        promises.push(getAvailableConsultantsByDayApi(dayStr));
      }

      try {
        const results = await Promise.all(promises);
        const newWeekSchedule: Record<
          string,
          { time: string; availableConsultants: AvailableConsultant[] }[]
        > = {};

        results.forEach((dayResult, index) => {
          const day = addDays(weekStart, index);
          const dayStr = formatInTimeZone(
            day,
            "Asia/Ho_Chi_Minh",
            "yyyy-MM-dd"
          );

          if (dayResult && dayResult.slots) {
            newWeekSchedule[dayStr] = dayResult.slots;
          } else {
            newWeekSchedule[dayStr] = [];
          }
        });

        setWeekSchedule(newWeekSchedule);
      } catch (error) {
        console.error("Error fetching week schedule:", error);
        setShowError("Không thể tải lịch trình tuần. Vui lòng thử lại.");
      } finally {
        setIsLoadingSchedule(false);
      }
    };

    fetchWeekSchedule();
  }, [currentWeek, user?._id]);

  useEffect(() => {
    if (currentStep === 3 && user) {
      setForm((prev) => ({
        ...prev,
        name: user.fullName || "",
        phone: user.phoneNumber || "",
        gender: user.gender || "male",
      }));
    }
    // eslint-disable-next-line
  }, [currentStep, user]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Validate on change
    validateField(name, value);
  };

  const validateField = (name: string, value: string) => {
    let error = "";

    switch (name) {
      case "phone":
        if (!value.trim()) {
          error = "Số điện thoại không được để trống";
        } else if (
          !/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(value.replace(/\s/g, ""))
        ) {
          error = "Số điện thoại không hợp lệ (VD: 0912345678)";
        }
        break;

      case "reason":
        if (!value.trim()) {
          error = "Lý do tư vấn không được để trống";
        } else if (value.trim().length < 10) {
          error = "Lý do tư vấn phải có ít nhất 10 ký tự";
        } else if (value.trim().length > 500) {
          error = "Lý do tư vấn không được vượt quá 500 ký tự";
        }
        break;

      default:
        break;
    }

    setFormErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  };

  const validateForm = () => {
    const phoneError = user?.phoneNumber
      ? ""
      : validateField("phone", form.phone);
    const reasonError = validateField("reason", form.reason);

    return !phoneError && !reasonError;
  };

  const handleNext = async () => {
    // Validate form if on the personal information step
    if (currentStep === 3) {
      if (validateForm()) {
        // Kiểm tra slot còn available không trước khi chuyển sang bước thanh toán
        if (selectedSlot && selectedConsultant) {
          try {
            const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
            const dayIdx = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].indexOf(
              selectedSlot.day
            );
            const slotDate = addDays(weekStart, dayIdx);
            const slotDateStr = formatInTimeZone(
              slotDate,
              "Asia/Ho_Chi_Minh",
              "yyyy-MM-dd"
            );
            const slotHour = selectedSlot.time;

            // Tìm slot time object
            const slotTimeObj = allSlotTimes.find((st) => {
              if (st.status !== "available") return false;
              const stDateStr = formatInTimeZone(
                st.start_time,
                "Asia/Ho_Chi_Minh",
                "yyyy-MM-dd"
              );
              const stHour = formatInTimeZone(
                st.start_time,
                "Asia/Ho_Chi_Minh",
                "HH:00"
              );
              return (
                stDateStr === slotDateStr &&
                stHour === slotHour &&
                st.consultant_id === selectedConsultant
              );
            });

            if (!slotTimeObj) {
              setShowError(
                "Slot này không còn khả dụng. Vui lòng chọn slot khác!"
              );
              return;
            }

            // Cập nhật trạng thái slot thành "booked" để giữ slot
            await updateStatusSlotTimeApi(slotTimeObj._id, "booked", user!._id);
            // Lưu thông tin slot đang được giữ
            setHeldSlotId(slotTimeObj._id);
            setSlotHoldTime(120); // 2 phút = 120 giây

            // Cập nhật lại danh sách slot times
            const updatedSlotTimes = allSlotTimes.map((st) =>
              st._id === slotTimeObj._id ? { ...st, status: "booked" } : st
            );
            setAllSlotTimes(updatedSlotTimes);

            setCurrentStep(currentStep + 1);
          } catch (error) {
            console.error("Error holding slot:", error);
            setShowError("Slot đã có người giữ. Vui lòng chọn lại slot!");
            return;
          }
        } else {
          setCurrentStep(currentStep + 1);
        }
      }
    } else if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };
  const handleBack = async () => {
    if (currentStep > 0) {
      // Nếu đang ở bước thanh toán và quay lại, giải phóng slot
      if (currentStep === 4 && heldSlotId && slotHoldTime !== null) {
        try {
          await updateStatusSlotTimeApi(heldSlotId, "available");

          // Cập nhật lại danh sách slot times
          const updatedSlotTimes = allSlotTimes.map((st) =>
            st._id === heldSlotId ? { ...st, status: "available" } : st
          );
          setAllSlotTimes(updatedSlotTimes);

          // Reset slot hold state
          setHeldSlotId(null);
          setSlotHoldTime(null);
          if (slotHoldInterval.current) {
            clearInterval(slotHoldInterval.current);
          }
        } catch (error) {
          console.error("Error releasing slot on back:", error);
        }
      }
      setCurrentStep(currentStep - 1);
    }
  };

  const today = new Date();
  const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
  const startOfNextWeek = addDays(startOfThisWeek, 7);

  const handleWeekChange = (direction: "next" | "prev") => {
    // Reset selected slot when changing week
    setSelectedSlot(null);

    setCurrentWeek((prev) => {
      const newWeek = addDays(prev, direction === "next" ? 7 : -7);
      // Giới hạn trong tuần hiện tại và tuần sau
      if (
        direction === "prev" &&
        isSameWeek(newWeek, startOfThisWeek, { weekStartsOn: 1 })
      ) {
        return startOfThisWeek;
      }
      if (
        direction === "next" &&
        isSameWeek(newWeek, startOfNextWeek, { weekStartsOn: 1 })
      ) {
        return startOfNextWeek;
      }
      return newWeek;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate form before submission
    if (!validateForm()) {
      setShowError("Vui lòng điền đầy đủ và chính xác thông tin cá nhân!");
      return;
    }
    const userInfo = localStorage.getItem("userInfo");
    const user = userInfo ? JSON.parse(userInfo) : null;
    if (!user || !selectedConsultant || !selectedSlot || !form.serviceId) {
      setShowError("Thiếu thông tin đặt lịch!");
      return;
    }

    // Kiểm tra xem slot có đang được user hiện tại hold không
    if (!heldSlotId || slotHoldTime === null) {
      setShowError("Slot đã hết thời gian giữ. Vui lòng chọn lại slot!");
      return;
    }

    try {
      // Sử dụng slot đang được hold thay vì tìm trong danh sách
      const slotTimeObj = allSlotTimes.find((st) => st._id === heldSlotId);
      if (!slotTimeObj || slotTimeObj.status !== "booked") {
        setShowError(
          "Không tìm thấy slot time phù hợp hoặc slot không còn được giữ!"
        );
        return;
      }
      const payload = {
        slotTime_id: slotTimeObj._id,
        user_id: user._id,
        consultant_id: selectedConsultant,
        service_id: form.serviceId,
        dateBooking: slotTimeObj.start_time,
        reason: form.reason,
        note: form.note,
      };
      const service = services.find((s) => s._id === form.serviceId);
      if (!service || !service.price) {
        setShowError("Dịch vụ không hợp lệ hoặc không có giá!");
        return;
      }
      // Tạo appointment (status mặc định là pending)
      const newAppointment = await createAppointmentApi(payload);
      // Lưu thông tin vào localStorage để PaymentResultPage xử lý tiếp
      const paymentData = {
        ...payload,
        appointmentId: newAppointment._id,
        user_id: user._id,
        service: service,
        consultant: consultants.find((c) => c._id === selectedConsultant),
        slot: selectedSlot,
        dateStr: getSelectedSlotDateStr(),
        price: service.price,
        fullName: form.name,
        phone: form.phone,
        gender: form.gender,
        paymentMethod: form.paymentMethod,
      };
      localStorage.setItem("pendingBill", JSON.stringify(paymentData));
      // Điều hướng sang trang kết quả/thanh toán (PaymentResultPage)
      navigate("/payment/result");
    } catch (error) {
      console.error("=== [FE] Error creating appointment ===", error);
      setShowError("Đặt lịch thất bại! Vui lòng thử lại hoặc liên hệ hỗ trợ.");
    }
  };

  const handleOpenConsultantDrawer = async (
    slotDay: string,
    slotTime: string
  ) => {
    // Nếu đang giữ slot khác, giải phóng trước
    if (heldSlotId && slotHoldTime !== null) {
      try {
        await updateStatusSlotTimeApi(heldSlotId, "available");

        // Cập nhật lại danh sách slot times
        const updatedSlotTimes = allSlotTimes.map((st) =>
          st._id === heldSlotId ? { ...st, status: "available" } : st
        );
        setAllSlotTimes(updatedSlotTimes);

        setHeldSlotId(null);
        setSlotHoldTime(null);
        if (slotHoldInterval.current) {
          clearInterval(slotHoldInterval.current);
        }
      } catch (error) {
        console.error("Error releasing previous slot:", error);
      }
    }

    setSelectedSlot({ day: slotDay, time: slotTime });

    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const dayIdx = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].indexOf(slotDay);
    const slotDate = addDays(weekStart, dayIdx);
    const slotDateStr = formatInTimeZone(
      slotDate,
      "Asia/Ho_Chi_Minh",
      "yyyy-MM-dd"
    );

    const daySchedule = weekSchedule[slotDateStr];
    if (daySchedule) {
      const slotInfo = daySchedule.find((s) => s.time === slotTime);
      if (slotInfo) {
        setAvailableConsultants(slotInfo.availableConsultants || []);
        handleNext(); // Automatically go to next step
        return;
      }
    }

    setAvailableConsultants([]);
    setShowError("Không thể tải danh sách chuyên gia. Vui lòng thử lại sau.");
  };

  // Helper để lấy ngày yyyy-MM-dd từ slot đang chọn
  const getSelectedSlotDateStr = () => {
    if (!selectedSlot) return "";
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const dayIdx = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].indexOf(
      selectedSlot.day
    );
    const slotDate = addDays(weekStart, dayIdx);
    return formatInTimeZone(slotDate, "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
  };

  const getEndTime = (startTime: string): string => {
    const [hourStr, minuteStr] = startTime.split(":");
    const hour = parseInt(hourStr, 10);
    // Assuming 1-hour slots
    const endHour = hour + 1;
    return `${String(endHour).padStart(2, "0")}:${minuteStr}`;
  };

  const getSlotStatus = (day: string, time: string): SlotStatus => {
    const dayIndex = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].indexOf(day);
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const slotDate = addDays(weekStart, dayIndex);
    const slotDateStr = formatInTimeZone(
      slotDate,
      "Asia/Ho_Chi_Minh",
      "yyyy-MM-dd"
    );

    // 1. Check if the slot is in the past
    const now = new Date();
    const [hour, minute] = time.split(":").map(Number);
    const slotDateTime = new Date(slotDate);
    slotDateTime.setHours(hour, minute, 0, 0);

    if (slotDateTime < now) {
      return "past";
    }

    // 2. Check if the slot is already booked by the user
    for (const app of userAppointments) {
      if (!app.dateBooking) continue; // Skip if no booking date

      const appDate = new Date(app.dateBooking);
      if (isNaN(appDate.getTime())) {
        console.warn("Skipping invalid appointment date:", app.dateBooking);
        continue; // Skip if date is invalid
      }

      // Bỏ qua appointment có status 'rescheduled' vì đã được đổi lịch
      if (app.status === "rescheduled") {
        continue;
      }

      const appDayFormatted = formatInTimeZone(
        appDate,
        "Asia/Ho_Chi_Minh",
        "yyyy-MM-dd"
      );
      const slotDayFormatted = formatInTimeZone(
        slotDate,
        "Asia/Ho_Chi_Minh",
        "yyyy-MM-dd"
      );
      const appTimeFormatted = formatInTimeZone(
        appDate,
        "Asia/Ho_Chi_Minh",
        "HH:mm"
      );

      if (appDayFormatted === slotDayFormatted && appTimeFormatted === time) {
        return "booked";
      }
    }

    // 3. Check for consultant availability from the pre-fetched schedule
    const daySchedule = weekSchedule[slotDateStr];
    if (daySchedule) {
      const slotInfo = daySchedule.find((s) => s.time === time);
      if (slotInfo) {
        return slotInfo.availableConsultants.length > 0
          ? "available"
          : "no-consultant";
      }
    }

    // Default to no-consultant if data isn't loaded yet for this slot
    return "no-consultant";
  };

  // Function to release held slot
  const releaseSlot = async () => {
    if (heldSlotId) {
      try {
        await updateStatusSlotTimeApi(heldSlotId, "available");

        // Cập nhật lại danh sách slot times
        const updatedSlotTimes = allSlotTimes.map((st) =>
          st._id === heldSlotId ? { ...st, status: "available" } : st
        );
        setAllSlotTimes(updatedSlotTimes);

        console.log("Slot released successfully");
      } catch (error) {
        console.error("Error releasing slot:", error);
      }
    }
  };

  // Handle slot hold countdown timer
  useEffect(() => {
    if (slotHoldTime === null) return;

    if (slotHoldTime > 0) {
      slotHoldInterval.current = setInterval(() => {
        setSlotHoldTime((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (slotHoldTime === 0) {
      // Hết thời gian giữ slot, trả về available và quay lại step 2
      void releaseSlot();
      setSlotHoldTime(null);
      setHeldSlotId(null);
      setCurrentStep(2); // Quay lại step chọn thời gian
      setShowError("Hết thời gian giữ slot. Vui lòng chọn lại thời gian!");
    }

    return () => {
      if (slotHoldInterval.current) {
        clearInterval(slotHoldInterval.current);
      }
    };
  }, [slotHoldTime]);

  // Cleanup khi component unmount - giải phóng slot nếu đang giữ
  useEffect(() => {
    // Xử lý khi user đóng tab hoặc thoát trang
    const handleBeforeUnload = () => {
      if (heldSlotId) {
        void releaseSlot();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (heldSlotId) {
        void releaseSlot();
      }
    };
  }, [heldSlotId]);

  const handleStartPayment = async () => {
    if (!validateForm()) {
      setShowError("Vui lòng điền đầy đủ và chính xác thông tin cá nhân!");
      return;
    }

    const userInfo = localStorage.getItem("userInfo");
    const user = userInfo ? JSON.parse(userInfo) : null;
    if (!user || !selectedConsultant || !selectedSlot || !form.serviceId) {
      setShowError("Thiếu thông tin đặt lịch!");
      return;
    }

    // Kiểm tra xem slot có còn được giữ không
    if (!heldSlotId || slotHoldTime === null) {
      setShowError("Slot đã hết thời gian giữ. Vui lòng chọn lại slot!");
      return;
    }

    try {
      const slotTimeObj = allSlotTimes.find((st) => st._id === heldSlotId);

      if (!slotTimeObj || slotTimeObj.status !== "booked") {
        setShowError("Slot không còn khả dụng. Vui lòng chọn slot khác!");
        return;
      }

      const payload = {
        slotTime_id: slotTimeObj._id,
        user_id: user._id,
        consultant_id: selectedConsultant,
        service_id: form.serviceId,
        dateBooking: slotTimeObj.start_time,
        reason: form.reason,
        note: form.note,
      };

      const service = services.find((s) => s._id === form.serviceId);
      if (!service || !service.price) {
        setShowError("Dịch vụ không hợp lệ hoặc không có giá!");
        return;
      }

      // Tạo appointment (status mặc định là pending)
      const newAppointment = await createAppointmentApi(payload);

      // Store payment data
      const paymentData = {
        ...payload,
        appointmentId: newAppointment._id,
        service: service,
        consultant: consultants.find((c) => c._id === selectedConsultant),
        slot: selectedSlot,
        dateStr: getSelectedSlotDateStr(),
        price: service.price,
        fullName: form.name,
        phone: form.phone,
        gender: form.gender,
        paymentMethod: form.paymentMethod,
        heldSlotId: heldSlotId, // Lưu thông tin slot đang được giữ
      };
      localStorage.setItem("pendingBill", JSON.stringify(paymentData));

      // Nếu chọn MoMo thì gọi API tạo link thanh toán và redirect
      if (form.paymentMethod === "momo") {
        const momoRes = await createMomoPaymentApi({
          amount: service.price,
          orderInfo: `Thanh toán cho lịch hẹn ${newAppointment._id}`,
        });
        if (momoRes && momoRes.payUrl) {
          // Không giải phóng slot khi redirect - slot sẽ được xử lý ở PaymentResultPage
          window.location.href = momoRes.payUrl;
          return;
        } else {
          setShowError(
            "Không tạo được link thanh toán MoMo. Vui lòng thử lại!"
          );
          return;
        }
      }

      // Các phương thức khác (card) giữ nguyên flow cũ
      if (form.paymentMethod === "card") {
        // Không giải phóng slot khi navigate - slot sẽ được xử lý ở PaymentResultPage
        navigate("/payment/result");
      }
      // PayPal đã xử lý riêng
    } catch (error) {
      console.error("=== [FE] Error creating appointment ===", error);
      setShowError("Đặt lịch thất bại! Vui lòng thử lại hoặc liên hệ hỗ trợ.");
    }
  };

  // Thêm mapping cho level:
  const LEVEL_LABELS: Record<
    string,
    { label: string; color: string; icon: JSX.Element }
  > = {
    low: {
      label: "Thấp",
      color: "bg-green-100 text-green-700 border-green-300",
      icon: (
        <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />
      ),
    },
    moderate: {
      label: "Trung bình",
      color: "bg-yellow-100 text-yellow-700 border-yellow-300",
      icon: (
        <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1" />
      ),
    },
    high: {
      label: "Cao",
      color: "bg-orange-100 text-orange-700 border-orange-300",
      icon: (
        <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1" />
      ),
    },
    critical: {
      label: "Nghiêm trọng",
      color: "bg-red-100 text-red-700 border-red-300",
      icon: (
        <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />
      ),
    },
  };

  return (
    <div className="bg-gradient-to-b from-sky-50 to-[#f0f7fa] min-h-screen flex flex-col">
      {/* Slot hold countdown timer */}
      {slotHoldTime !== null && (
        <div className="fixed top-6 left-6 z-[9999] bg-amber-100 text-amber-800 px-6 py-3 rounded-xl font-semibold shadow-lg text-lg">
          Thời gian giữ slot còn: {Math.floor(slotHoldTime / 60)}:
          {(slotHoldTime % 60).toString().padStart(2, "0")}
        </div>
      )}
      <Header />
      <div className="flex-1 w-full px-4 py-8 flex flex-col justify-center items-center">
        <AnimatePresence mode="wait">
          {showIntro ? (
            <>
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="max-w-7xl w-full mx-auto flex flex-col items-center justify-center"
              >
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-cyan-100 shadow-[0_10px_40px_rgba(14,165,233,0.08)] w-full">
                  <div className="flex flex-col-reverse md:flex-row items-center gap-12">
                    {/* Content - Left side */}
                    <div className="w-full md:w-1/2 text-left space-y-8">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                      >
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
                          Dịch vụ tư vấn tâm lý <br />
                          <span className="text-cyan-600">chuyên nghiệp</span>
                        </h1>
                        <p className="text-xl text-gray-600">
                          Chúng tôi cung cấp dịch vụ tư vấn tâm lý chuyên
                          nghiệp, giúp bạn giải quyết các vấn đề về tâm lý và
                          cải thiện sức khỏe tinh thần.
                        </p>
                      </motion.div>

                      <div className="space-y-6">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                          className="flex items-center gap-4 bg-white/80 p-4 rounded-2xl shadow-sm"
                        >
                          <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-6 h-6 text-cyan-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-800">
                              Chuyên gia tận tâm
                            </h3>
                            <p className="text-gray-600">
                              Đội ngũ chuyên gia giàu kinh nghiệm, tận tâm hỗ
                              trợ
                            </p>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4, duration: 0.5 }}
                          className="flex items-center gap-4 bg-white/80 p-4 rounded-2xl shadow-sm"
                        >
                          <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-6 h-6 text-cyan-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-800">
                              Linh hoạt thời gian
                            </h3>
                            <p className="text-gray-600">
                              Đặt lịch linh hoạt theo thời gian phù hợp với bạn
                            </p>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5, duration: 0.5 }}
                          className="flex items-center gap-4 bg-white/80 p-4 rounded-2xl shadow-sm"
                        >
                          <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0">
                            <Banknote className="w-6 h-6 text-cyan-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-800">
                              Chi phí hợp lý
                            </h3>
                            <p className="text-gray-600">
                              Nhiều gói dịch vụ với mức giá phù hợp nhu cầu
                            </p>
                          </div>
                        </motion.div>
                      </div>

                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{
                          scale: 1.05,
                          boxShadow: "0 10px 25px -5px rgba(14,165,233,0.4)",
                        }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ delay: 0.6, duration: 0.3 }}
                        onClick={handleStartConsulting}
                        className="mt-8 px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-lg rounded-2xl font-semibold shadow-lg transition-all duration-300 w-full md:w-auto"
                      >
                        Bắt đầu tư vấn ngay
                      </motion.button>
                    </div>

                    {/* Image - Right side */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6 }}
                      className="w-full md:w-1/2 relative"
                    >
                      <div className="relative aspect-[4/3] w-full">
                        <img
                          src={consultingImage}
                          alt="Tư vấn tâm lý"
                          className="w-full h-full object-cover rounded-3xl shadow-2xl"
                        />
                        {/* Decorative elements */}
                        <motion.div
                          animate={{
                            opacity: [0.4, 0.6, 0.4],
                            scale: [1, 1.1, 1],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 4,
                            ease: "easeInOut",
                          }}
                          className="absolute -top-4 -right-4 w-24 h-24 bg-cyan-100 rounded-full opacity-50 blur-2xl"
                        />
                        <motion.div
                          animate={{
                            opacity: [0.4, 0.7, 0.4],
                            scale: [1, 1.2, 1],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 5,
                            ease: "easeInOut",
                            delay: 1,
                          }}
                          className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-100 rounded-full opacity-50 blur-2xl"
                        />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Phần đánh giá dịch vụ - tách riêng và sử dụng component mới */}
              {services.length > 0 && <ServiceRatings services={services} />}
            </>
          ) : (
            <motion.div
              key="booking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-row gap-8 max-w-6xl w-full mx-auto min-h-[600px] pb-8"
            >
              {/* Stepper dọc */}
              <div className="w-[90px] flex flex-col items-center pt-8">
                <div className="flex flex-col gap-0">
                  {steps.map((step, idx) => (
                    <div
                      key={step.title}
                      className="flex flex-col items-center"
                    >
                      <motion.div
                        whileHover={currentStep > idx ? { scale: 1.1 } : {}}
                        whileTap={currentStep > idx ? { scale: 0.95 } : {}}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all ${
                          currentStep === idx
                            ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-cyan-500 scale-110 shadow-lg"
                            : currentStep > idx
                            ? "bg-cyan-100 text-cyan-600 border-cyan-400 cursor-pointer hover:scale-105"
                            : "bg-white text-gray-400 border-gray-300"
                        }`}
                        onClick={() => {
                          // Chỉ cho phép quay lại các bước đã hoàn thành
                          if (currentStep > idx) {
                            setCurrentStep(idx);
                          }
                        }}
                      >
                        {idx + 1}
                      </motion.div>
                      {idx < steps.length - 1 && (
                        <div
                          className={`w-1 h-16 ${
                            currentStep > idx
                              ? "bg-gradient-to-b from-cyan-400 to-blue-400"
                              : idx === currentStep
                              ? "bg-gradient-to-b from-cyan-400 to-gray-200"
                              : "bg-gray-200"
                          } rounded-full`}
                        ></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Nội dung các bước */}
              <div className="flex-1 flex flex-col items-center">
                {/* Step 1: Chọn dịch vụ */}
                {currentStep === 0 && (
                  <div className="w-full animate-fadeIn">
                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-cyan-100 shadow-[0_10px_40px_rgba(14,165,233,0.08)]">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 bg-gradient-to-br from-cyan-100 to-sky-200 rounded-2xl flex items-center justify-center shadow-sm">
                          <Sparkles className="w-6 h-6 text-cyan-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">
                            Dịch vụ tư vấn
                          </h3>
                          <p className="text-sm text-gray-500">
                            Chọn gói phù hợp với nhu cầu
                          </p>
                        </div>
                      </div>

                      <div className="mb-6 flex justify-center">
                        <div className="bg-white/80 border border-sky-100 rounded-xl shadow px-4 py-3 w-full max-w-xl">
                          <div className="font-medium text-gray-700 mb-2 text-center text-base">
                            Chú thích mức độ khuyến nghị
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-3 h-3 rounded-full bg-green-300 border border-green-400" />
                              <span className="font-semibold text-green-700">
                                Thấp:
                              </span>
                              <span className="text-gray-600">
                                Phù hợp với các vấn đề nhẹ, cần tư vấn cơ bản.
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-3 h-3 rounded-full bg-yellow-200 border border-yellow-400" />
                              <span className="font-semibold text-yellow-700">
                                Trung bình:
                              </span>
                              <span className="text-gray-600">
                                Dành cho các vấn đề cần sự hỗ trợ chuyên sâu
                                hơn.
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-3 h-3 rounded-full bg-orange-200 border border-orange-400" />
                              <span className="font-semibold text-orange-700">
                                Cao:
                              </span>
                              <span className="text-gray-600">
                                Dành cho trường hợp có dấu hiệu căng thẳng, lo
                                âu, cần chuyên gia hỗ trợ.
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-3 h-3 rounded-full bg-red-200 border border-red-400" />
                              <span className="font-semibold text-red-700">
                                Nghiêm trọng:
                              </span>
                              <span className="text-gray-600">
                                Khuyến nghị liên hệ chuyên gia ngay, có thể có
                                nguy cơ cao.
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-3 h-3 rounded-full bg-gray-300 border border-gray-400" />
                              <span className="font-semibold text-gray-700">
                                Phù hợp với tất cả mọi người.
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 mb-8">
                        {(expandServices
                          ? services
                          : services.slice(0, MAX_VISIBLE_SERVICES)
                        ).map((service) => (
                          <div
                            key={service._id}
                            className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer group ${
                              form.serviceId === service._id
                                ? "bg-gradient-to-r from-sky-50 to-cyan-50 border-sky-200 shadow-md"
                                : "bg-white/90 border-gray-100 hover:border-sky-200 hover:shadow-sm"
                            }`}
                            onClick={() =>
                              setForm((f) => ({ ...f, serviceId: service._id }))
                            }
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                                {service.image ? (
                                  <img
                                    src={service.image}
                                    alt={service.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div
                                    className={`w-full h-full flex items-center justify-center ${
                                      service.category === "vip"
                                        ? "bg-gradient-to-br from-amber-100 to-orange-100"
                                        : service.category === "premium"
                                        ? "bg-gradient-to-br from-sky-100 to-cyan-100"
                                        : "bg-gradient-to-br from-gray-100 to-blue-50"
                                    }`}
                                  >
                                    <Sparkles
                                      className={`w-8 h-8 ${
                                        service.category === "vip"
                                          ? "text-amber-500"
                                          : service.category === "premium"
                                          ? "text-sky-500"
                                          : "text-blue-400"
                                      }`}
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="mb-2 flex items-center gap-2">
                                  <span
                                    className="font-medium text-gray-800"
                                    title={service.name}
                                  >
                                    {service.name}
                                  </span>
                                  {/* Hiển thị mức độ */}
                                  {service.level ? (
                                    <span
                                      className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                        LEVEL_LABELS[service.level]?.color ||
                                        "bg-gray-100 text-gray-600 border-gray-200"
                                      }`}
                                      title={`Mức độ khuyến nghị: ${
                                        LEVEL_LABELS[service.level]?.label
                                      }`}
                                    >
                                      {LEVEL_LABELS[service.level]?.icon}
                                      {LEVEL_LABELS[service.level]?.label}
                                    </span>
                                  ) : (
                                    <span
                                      className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200"
                                      title="Phù hợp với tất cả mọi người"
                                    >
                                      <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-1" />
                                      Phù hợp với tất cả mọi người
                                    </span>
                                  )}
                                </div>
                                {service.description && (
                                  <div className="text-sm text-gray-500 mb-2 line-clamp-2">
                                    {service.description}
                                  </div>
                                )}
                                <div className="text-cyan-600 font-semibold text-lg">
                                  {service.price?.toLocaleString("vi-VN")}đ
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {!expandServices &&
                          services.length > MAX_VISIBLE_SERVICES && (
                            <div
                              className="h-12 rounded-2xl border border-dashed border-sky-200 bg-white/80 flex items-center justify-center text-sky-500 text-2xl font-bold cursor-pointer hover:bg-sky-50 transition-all select-none"
                              onClick={() => setExpandServices(true)}
                            >
                              + Xem thêm dịch vụ
                            </div>
                          )}
                      </div>

                      <div className="flex justify-end">
                        <button
                          className="bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white px-10 py-4 rounded-2xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                          disabled={!form.serviceId}
                          onClick={handleNext}
                        >
                          Tiếp tục
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Step 2: Chọn thời gian */}
                {currentStep === 1 && (
                  <div className="w-full animate-fadeIn">
                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-cyan-100 shadow-[0_10px_40px_rgba(14,165,233,0.08)]">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 bg-gradient-to-br from-sky-100 to-blue-200 rounded-2xl flex items-center justify-center shadow-sm">
                          <Calendar className="w-6 h-6 text-sky-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">
                            Chọn thời gian
                          </h3>
                          <p className="text-sm text-gray-500">
                            Lịch khám có sẵn cho bạn
                          </p>
                        </div>
                      </div>

                      {/* Calendar Navigation */}
                      <div className="flex items-center justify-between mb-8">
                        <button
                          className="w-14 h-14 rounded-2xl bg-white border border-sky-100 flex items-center justify-center text-sky-500 hover:text-sky-600 hover:border-sky-200 hover:bg-sky-50 transition-all disabled:opacity-30"
                          disabled={isSameWeek(currentWeek, startOfThisWeek, {
                            weekStartsOn: 1,
                          })}
                          onClick={() => handleWeekChange("prev")}
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div className="text-lg font-semibold text-sky-900">
                          {(() => {
                            const monday = startOfWeek(currentWeek, {
                              weekStartsOn: 1,
                            });
                            const sunday = addDays(monday, 6);
                            const mondayMonth = formatInTimeZone(
                              monday,
                              "Asia/Ho_Chi_Minh",
                              "MM/yyyy"
                            );
                            const sundayMonth = formatInTimeZone(
                              sunday,
                              "Asia/Ho_Chi_Minh",
                              "MM/yyyy"
                            );
                            const isCurrentWeek = isSameWeek(
                              currentWeek,
                              startOfThisWeek,
                              { weekStartsOn: 1 }
                            );

                            const weekLabel = isCurrentWeek
                              ? "Tuần này"
                              : "Tuần sau";

                            const dateRange =
                              mondayMonth === sundayMonth
                                ? `${formatInTimeZone(
                                    monday,
                                    "Asia/Ho_Chi_Minh",
                                    "dd"
                                  )} - ${formatInTimeZone(
                                    sunday,
                                    "Asia/Ho_Chi_Minh",
                                    "dd/MM/yyyy"
                                  )}`
                                : `${formatInTimeZone(
                                    monday,
                                    "Asia/Ho_Chi_Minh",
                                    "dd/MM"
                                  )} - ${formatInTimeZone(
                                    sunday,
                                    "Asia/Ho_Chi_Minh",
                                    "dd/MM/yyyy"
                                  )}`;

                            return (
                              <div className="flex flex-col items-center">
                                <span
                                  className={`text-sm font-medium mb-1 ${
                                    isCurrentWeek
                                      ? "text-cyan-600"
                                      : "text-sky-500"
                                  }`}
                                >
                                  {weekLabel}
                                </span>
                                <span>{dateRange}</span>
                              </div>
                            );
                          })()}
                        </div>
                        <button
                          className="w-14 h-14 rounded-2xl bg-white border border-sky-100 flex items-center justify-center text-sky-500 hover:text-sky-600 hover:border-sky-200 hover:bg-sky-50 transition-all disabled:opacity-30"
                          disabled={isSameWeek(currentWeek, startOfNextWeek, {
                            weekStartsOn: 1,
                          })}
                          onClick={() => handleWeekChange("next")}
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </div>

                      {/* Time Filter */}
                      <div className="flex justify-center mb-8">
                        <div className="bg-sky-50/80 rounded-2xl p-1.5 inline-flex shadow-sm">
                          <button
                            className={`px-8 py-2.5 rounded-xl font-medium transition-all text-base ${
                              timeFilter === "morning"
                                ? "bg-white text-sky-700 shadow-md"
                                : "text-gray-600 hover:text-sky-700"
                            }`}
                            onClick={() => setTimeFilter("morning")}
                          >
                            Buổi sáng
                          </button>
                          <button
                            className={`px-8 py-2.5 rounded-xl font-medium transition-all text-base ${
                              timeFilter === "afternoon"
                                ? "bg-white text-sky-700 shadow-md"
                                : "text-gray-600 hover:text-sky-700"
                            }`}
                            onClick={() => setTimeFilter("afternoon")}
                          >
                            Buổi chiều
                          </button>
                        </div>
                      </div>

                      {/* Calendar Grid */}
                      <div className="bg-white/80 rounded-2xl p-6 shadow-sm border border-sky-50">
                        <div className="grid grid-cols-8 gap-3 mb-4 text-center">
                          <div className="font-medium text-gray-500 py-2">
                            Giờ
                          </div>
                          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(
                            (day, dayIdx) => {
                              const dayDate = addDays(
                                startOfWeek(currentWeek, { weekStartsOn: 1 }),
                                dayIdx
                              );
                              return (
                                <div key={day} className="rounded-lg py-2">
                                  <div
                                    className={`font-semibold text-sm ${
                                      dayIdx === 6
                                        ? "text-red-500"
                                        : "text-sky-800"
                                    }`}
                                  >
                                    {day}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {formatInTimeZone(
                                      dayDate,
                                      "Asia/Ho_Chi_Minh",
                                      "d/M"
                                    )}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>

                        {isLoadingSchedule ? (
                          <div className="flex justify-center items-center h-48">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(timeFilter === "morning"
                              ? ["08:00", "09:00", "10:00", "11:00"]
                              : ["13:00", "14:00", "15:00", "16:00"]
                            ).map((slot) => {
                              const displayTime = `${slot}-${getEndTime(slot)}`;
                              return (
                                <div
                                  key={slot}
                                  className="grid grid-cols-8 gap-3 items-center border-t border-gray-100"
                                >
                                  {/* Time Label */}
                                  <div className="text-center text-sm font-semibold text-gray-700 py-4">
                                    {displayTime}
                                  </div>
                                  {/* Day Buttons */}
                                  {[
                                    "T2",
                                    "T3",
                                    "T4",
                                    "T5",
                                    "T6",
                                    "T7",
                                    "CN",
                                  ].map((day) => {
                                    const status = getSlotStatus(day, slot);

                                    const statusClasses: Record<
                                      SlotStatus,
                                      string
                                    > = {
                                      booked:
                                        "bg-slot-booked-bg cursor-not-allowed",
                                      past: "bg-slot-past-bg cursor-not-allowed",
                                      "no-consultant":
                                        "bg-slot-unavailable-bg cursor-not-allowed",
                                      available:
                                        "bg-slot-available-bg hover:bg-slot-available-hover-bg border border-gray-300",
                                    };

                                    const titleText: Record<
                                      SlotStatus,
                                      string
                                    > = {
                                      booked: "Bạn đã đặt lịch này",
                                      past: "Thời gian đã qua",
                                      "no-consultant":
                                        "Không có chuyên gia trong khung giờ này",
                                      available: `Chọn lịch ${displayTime} ${day}`,
                                    };

                                    return (
                                      <div
                                        key={day + slot}
                                        className="p-1 h-full"
                                      >
                                        <button
                                          className={`w-full h-12 rounded-xl text-center transition-all duration-200 backdrop-blur-sm
                                          ${statusClasses[status]}
                                          ${
                                            selectedSlot?.day === day &&
                                            selectedSlot?.time === slot
                                              ? "ring-2 ring-slot-available-ring ring-offset-1"
                                              : ""
                                          }
                                          `}
                                          onClick={() =>
                                            handleOpenConsultantDrawer(
                                              day,
                                              slot
                                            )
                                          }
                                          disabled={status !== "available"}
                                          title={titleText[status]}
                                        ></button>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Color Legend */}
                      <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 mt-6 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-slot-available-bg border border-gray-300 backdrop-blur-sm"></div>
                          <span>Còn trống</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-slot-unavailable-bg border border-rose-300 backdrop-blur-sm"></div>
                          <span>Hết chuyên gia</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-slot-past-bg border border-gray-400 backdrop-blur-sm"></div>
                          <span>Đã qua</span>
                        </div>
                      </div>

                      {/* Summary & Navigation */}
                      <div className="mt-8 p-6 bg-gradient-to-r from-sky-50 to-cyan-50 rounded-2xl border border-sky-100 shadow-md">
                        <div className="flex justify-between items-center">
                          <div className="space-y-2">
                            {form.serviceId && (
                              <div className="text-base text-gray-700">
                                <span className="font-medium">
                                  {
                                    services.find(
                                      (s) => s._id === form.serviceId
                                    )?.name
                                  }
                                </span>{" "}
                                •{" "}
                                {services.find((s) => s._id === form.serviceId)
                                  ?.duration || ""}
                              </div>
                            )}
                            {selectedSlot && (
                              <div className="text-base text-gray-700">
                                {selectedSlot.day}, {getSelectedSlotDateStr()},{" "}
                                {selectedSlot.time}
                                {selectedConsultant && (
                                  <>
                                    <span className="mx-2">|</span>
                                    <span>
                                      Chuyên viên:{" "}
                                      <span className="font-semibold">
                                        {consultants.find(
                                          (c) => c._id === selectedConsultant
                                        )?.accountId?.fullName ||
                                          "Không xác định"}
                                      </span>
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                            {form.serviceId && (
                              <div className="text-xl font-semibold text-sky-700">
                                {services
                                  .find((s) => s._id === form.serviceId)
                                  ?.price?.toLocaleString("vi-VN")}
                                đ
                              </div>
                            )}
                          </div>
                          <div className="flex gap-4">
                            <button
                              className="bg-gray-100 text-gray-700 py-3 px-8 rounded-xl font-semibold hover:bg-gray-200 transition-colors shadow-sm text-base border border-gray-200"
                              onClick={handleBack}
                            >
                              Quay lại
                            </button>
                            <button
                              className="bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white py-3 px-10 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-base"
                              onClick={handleNext}
                              disabled={!form.serviceId}
                            >
                              Tiếp tục
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Chọn chuyên gia tư vấn */}
                {currentStep === 2 && (
                  <div className="w-full animate-fadeIn">
                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-cyan-100 shadow-[0_10px_40px_rgba(14,165,233,0.08)]">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 bg-gradient-to-br from-sky-100 to-indigo-200 rounded-2xl flex items-center justify-center shadow-sm">
                          <User className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">
                            Chọn chuyên gia tư vấn
                          </h3>
                          <p className="text-sm text-gray-500">
                            Chọn chuyên gia phù hợp với nhu cầu của bạn
                          </p>
                        </div>
                      </div>

                      {selectedSlot ? (
                        <>
                          <div className="mb-6 p-4 bg-sky-50/80 rounded-xl border border-sky-100">
                            <div className="flex items-center gap-3 text-gray-700">
                              <Calendar className="w-5 h-5 text-sky-600" />
                              <span>
                                Thời gian đã chọn:{" "}
                                <span className="font-medium">
                                  {selectedSlot.day}, {getSelectedSlotDateStr()}
                                  , {selectedSlot.time}
                                </span>
                              </span>
                            </div>
                          </div>

                          <div className="mb-8">
                            <h4 className="text-lg font-medium text-gray-700 mb-4">
                              Chuyên gia có sẵn:
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {availableConsultants.length > 0 ? (
                                availableConsultants.map((consultant) => (
                                  <div
                                    key={consultant._id}
                                    className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                                      selectedConsultant === consultant._id
                                        ? "bg-gradient-to-r from-sky-50 to-indigo-50 border-sky-200 shadow-md"
                                        : "bg-white border-gray-100 hover:border-sky-200 hover:shadow-sm"
                                    }`}
                                    onClick={() => {
                                      setPendingConsultant(consultant._id);
                                      setSelectedConsultant(consultant._id);
                                      setShowConsultantDrawer(false);
                                      setExpandConsultants(false);
                                    }}
                                  >
                                    <div className="flex items-center gap-4">
                                      {consultant.photoUrl ? (
                                        <img
                                          src={consultant.photoUrl}
                                          alt={consultant.fullName}
                                          className="w-16 h-16 rounded-full object-cover object-center border border-gray-200 shadow"
                                          onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = "/avarta.png";
                                          }}
                                        />
                                      ) : (
                                        <User className="w-7 h-7 text-gray-400" />
                                      )}
                                      <div>
                                        <div className="font-medium text-gray-800 text-lg">
                                          {consultant.fullName}
                                        </div>
                                        {consultant.experience && (
                                          <div className="text-sm text-gray-600">
                                            Kinh nghiệm: {consultant.experience}{" "}
                                            năm
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-2 p-8 text-center text-gray-500 bg-gray-50/50 rounded-xl border border-gray-100">
                                  Không có chuyên gia nào khả dụng cho khung giờ
                                  này. Vui lòng chọn thời gian khác.
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-8 p-6 bg-gradient-to-r from-sky-50 to-indigo-50 rounded-2xl border border-sky-100 shadow-md">
                            <div className="flex justify-between items-center">
                              <div className="space-y-2">
                                {form.serviceId && (
                                  <div className="text-base text-gray-700">
                                    <span className="font-medium">
                                      {
                                        services.find(
                                          (s) => s._id === form.serviceId
                                        )?.name
                                      }
                                    </span>
                                  </div>
                                )}
                                <div className="text-base text-gray-700">
                                  {selectedSlot.day}, {getSelectedSlotDateStr()}
                                  , {selectedSlot.time}
                                </div>
                                {selectedConsultant && (
                                  <div className="text-base text-gray-700">
                                    Chuyên viên:{" "}
                                    <span className="font-semibold">
                                      {availableConsultants.find(
                                        (c) => c._id === selectedConsultant
                                      )?.fullName || "Không xác định"}
                                    </span>
                                  </div>
                                )}
                                {form.serviceId && (
                                  <div className="text-xl font-semibold text-sky-700">
                                    {services
                                      .find((s) => s._id === form.serviceId)
                                      ?.price?.toLocaleString("vi-VN")}
                                    đ
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-4">
                                <button
                                  className="bg-gray-100 text-gray-700 py-3 px-8 rounded-xl font-semibold hover:bg-gray-200 transition-colors shadow-sm text-base border border-gray-200"
                                  onClick={handleBack}
                                >
                                  Quay lại
                                </button>
                                <button
                                  className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white py-3 px-10 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-base"
                                  onClick={handleNext}
                                  disabled={!selectedConsultant}
                                >
                                  Tiếp tục
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="p-10 text-center">
                          <div className="text-gray-500 mb-4">
                            Vui lòng chọn thời gian trước khi chọn chuyên gia
                          </div>
                          <button
                            className="bg-gray-100 text-gray-700 py-3 px-8 rounded-xl font-semibold hover:bg-gray-200 transition-colors shadow-sm text-base border border-gray-200"
                            onClick={handleBack}
                          >
                            Quay lại chọn thời gian
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 4: Điền thông tin cá nhân */}
                {currentStep === 3 && (
                  <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-2xl bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg p-10 border border-cyan-100 flex flex-col gap-8 animate-fadeIn"
                  >
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                        <span className="text-sm font-medium text-sky-600 tracking-wide uppercase">
                          Bước 4
                        </span>
                        <div className="w-8 h-px bg-gradient-to-r from-sky-500 to-transparent"></div>
                      </div>
                      <h2 className="text-3xl font-semibold text-gray-800 mb-2 tracking-tight">
                        Điền thông tin cá nhân
                      </h2>
                      <p className="text-gray-600 text-lg">
                        Vui lòng nhập thông tin liên hệ để xác nhận đặt lịch
                      </p>
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-amber-800 text-sm">
                          <strong>Lưu ý:</strong> Khi bạn nhấn "Tiếp tục", slot
                          sẽ được giữ trong 5 phút để bạn hoàn tất thanh toán.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-5">
                      <div>
                        <label className="block text-gray-700 mb-2 text-base font-medium">
                          Họ và tên
                        </label>
                        <input
                          type="text"
                          name="name"
                          placeholder="Nhập họ và tên"
                          className="w-full border border-sky-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm hover:border-sky-300 text-base disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                          value={form.name}
                          onChange={handleChange}
                          disabled={!!user?.fullName}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2 text-base font-medium">
                          Số điện thoại
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          required
                          placeholder="Nhập số điện thoại"
                          className={`w-full border ${
                            formErrors.phone
                              ? "border-red-300"
                              : "border-sky-100"
                          } rounded-lg px-4 py-3 focus:outline-none focus:ring-2 ${
                            formErrors.phone
                              ? "focus:ring-red-500"
                              : "focus:ring-sky-500"
                          } shadow-sm hover:border-sky-300 text-base disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed`}
                          value={form.phone}
                          onChange={handleChange}
                          onBlur={(e) => validateField("phone", e.target.value)}
                          disabled={!!user?.phoneNumber}
                        />
                        {formErrors.phone && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors.phone}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2 text-base font-medium">
                          Giới tính
                        </label>
                        <select
                          name="gender"
                          className="w-full border border-sky-100 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm hover:border-sky-300 text-base"
                          value={form.gender}
                          onChange={handleChange}
                        >
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2 text-base font-medium">
                          Lý do cần tư vấn
                        </label>
                        <textarea
                          name="reason"
                          required
                          placeholder="Mô tả ngắn gọn lý do bạn cần tư vấn"
                          className={`w-full border ${
                            formErrors.reason
                              ? "border-red-300"
                              : "border-sky-100"
                          } rounded-lg px-4 py-3 focus:outline-none focus:ring-2 ${
                            formErrors.reason
                              ? "focus:ring-red-500"
                              : "focus:ring-sky-500"
                          } shadow-sm hover:border-sky-300 text-base resize-none`}
                          rows={3}
                          value={form.reason}
                          onChange={handleChange}
                          onBlur={(e) =>
                            validateField("reason", e.target.value)
                          }
                        />
                        {formErrors.reason && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors.reason}
                          </p>
                        )}
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Tối thiểu 10 ký tự</span>
                          <span>{form.reason.length}/500</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2 text-base font-medium">
                          Ghi chú (tuỳ chọn)
                        </label>
                        <textarea
                          name="note"
                          placeholder="Ghi chú cho chuyên viên (nếu có)"
                          className="w-full border border-sky-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm hover:border-sky-300 text-base resize-none"
                          rows={3}
                          value={form.note}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between gap-4 mt-4">
                      <button
                        type="button"
                        className="bg-gray-100 text-gray-700 py-3 px-8 rounded-xl font-semibold hover:bg-gray-200 transition-colors shadow-sm text-base border border-gray-200"
                        onClick={handleBack}
                      >
                        Quay lại
                      </button>
                      <button
                        type="button"
                        className="bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white py-3 px-10 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-base"
                        onClick={handleNext}
                        disabled={
                          !form.phone ||
                          !form.reason ||
                          !!formErrors.phone ||
                          !!formErrors.reason
                        }
                      >
                        Tiếp tục
                      </button>
                    </div>
                  </form>
                )}
                {/* Step 5: Thanh toán */}
                {currentStep === 4 && (
                  <form
                    onSubmit={(e: React.FormEvent) => {
                      e.preventDefault();
                      handleStartPayment();
                    }}
                    className="w-full max-w-2xl bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg p-10 border border-cyan-100 flex flex-col gap-8 animate-fadeIn"
                  >
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                        <span className="text-sm font-medium text-sky-600 tracking-wide uppercase">
                          Bước 5
                        </span>
                        <div className="w-8 h-px bg-gradient-to-r from-sky-500 to-transparent"></div>
                      </div>
                      <h2 className="text-3xl font-semibold text-gray-800 mb-2 tracking-tight">
                        Thanh toán & xác nhận
                      </h2>
                      <p className="text-gray-600 text-lg">
                        Kiểm tra lại thông tin và chọn phương thức thanh toán
                      </p>
                    </div>

                    <div className="flex flex-col gap-5">
                      <div className="flex justify-between items-center bg-sky-50/80 rounded-xl px-6 py-4 shadow-sm">
                        <span className="text-gray-600">Dịch vụ:</span>
                        <span className="font-medium text-gray-800">
                          {form.serviceId
                            ? services.find((s) => s._id === form.serviceId)
                                ?.name
                            : "--"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-sky-50/80 rounded-xl px-6 py-4 shadow-sm">
                        <span className="text-gray-600">Giá:</span>
                        <span className="font-medium text-sky-700">
                          {form.serviceId
                            ? services
                                .find((s) => s._id === form.serviceId)
                                ?.price?.toLocaleString("vi-VN") + "đ"
                            : "--"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-sky-50/80 rounded-xl px-6 py-4 shadow-sm">
                        <span className="text-gray-600">Tư vấn viên:</span>
                        <span className="font-medium text-gray-800">
                          {selectedConsultant
                            ? consultants.find(
                                (c) => c._id === selectedConsultant
                              )?.accountId?.fullName || "Không xác định"
                            : "--"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-sky-50/80 rounded-xl px-6 py-4 shadow-sm">
                        <span className="text-gray-600">Thời gian:</span>
                        <span className="font-medium text-gray-800">
                          {selectedSlot
                            ? `${
                                selectedSlot.day
                              }, ${getSelectedSlotDateStr()}, ${
                                selectedSlot.time
                              } - ${getEndTime(selectedSlot.time)}`
                            : "--"}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-4 mb-2">
                        <div className="flex justify-between font-semibold text-xl">
                          <span>Tổng cộng:</span>
                          <span className="text-sky-700">
                            {form.serviceId
                              ? services
                                  .find((s) => s._id === form.serviceId)
                                  ?.price?.toLocaleString("vi-VN") + "đ"
                              : "0đ"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-3 text-base font-medium">
                          Phương thức thanh toán
                        </label>
                        <div className="space-y-4">
                          <label
                            className={`flex items-center p-4 border rounded-xl cursor-pointer hover:bg-fuchsia-50/30 transition-all text-base hover:border-fuchsia-300 ${
                              form.paymentMethod === "momo"
                                ? "border-fuchsia-300"
                                : "border-sky-100"
                            }`}
                          >
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="momo"
                              checked={form.paymentMethod === "momo"}
                              onChange={handleChange}
                              className="mr-3 w-5 h-5 text-fuchsia-600 focus:ring-fuchsia-500"
                            />
                            <img
                              src="/logo-momo-png-2.png"
                              alt="Ví MoMo"
                              className="h-6 object-contain mr-2"
                            />
                            <span>Ví điện tử MoMo</span>
                          </label>
                          <div
                            className={`p-4 border rounded-xl transition-all ${
                              form.paymentMethod === "paypal"
                                ? "border-blue-400 bg-blue-50/10"
                                : "border-sky-100"
                            }`}
                          >
                            <label className="flex items-center cursor-pointer mb-4">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value="paypal"
                                checked={form.paymentMethod === "paypal"}
                                onChange={handleChange}
                                className="mr-3 w-5 h-5 text-blue-600 focus:ring-blue-500"
                              />
                              <img
                                src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg"
                                alt="PayPal"
                                className="h-6 mr-2"
                              />
                              <span>PayPal</span>
                            </label>
                            {form.paymentMethod === "paypal" &&
                              form.serviceId && (
                                <div className="mt-4 border-t border-gray-200 pt-4">
                                  <PayPalScriptProvider
                                    options={{
                                      clientId:
                                        "Abu4SuFm2mL_XJskEZvPW3lstIPs9Bi4Ufb8FzxK1Mt4BVM13KPewpyEMDU_M_la4oQUJnHNy6vqV3pz",
                                      currency: "USD",
                                    }}
                                  >
                                    <PayPalButtons
                                      style={{ layout: "vertical" }}
                                      forceReRender={[form.serviceId, services]}
                                      createOrder={(data, actions) => {
                                        const priceUSD =
                                          (services.find(
                                            (s) => s._id === form.serviceId
                                          )?.price || 0) / 23000;
                                        return actions.order.create({
                                          intent: "CAPTURE",
                                          purchase_units: [
                                            {
                                              amount: {
                                                value: priceUSD.toFixed(2),
                                                currency_code: "USD",
                                              },
                                            },
                                          ],
                                        });
                                      }}
                                      onApprove={async (data, actions) => {
                                        if (!actions.order) {
                                          setShowError(
                                            "Lỗi thanh toán PayPal. Vui lòng thử lại."
                                          );
                                          return;
                                        }
                                        try {
                                          await actions.order.capture();
                                          // Lưu pendingBill vào localStorage và điều hướng sang PaymentResultPage
                                          const userInfo =
                                            localStorage.getItem("userInfo");
                                          const currentUser = userInfo
                                            ? JSON.parse(userInfo)
                                            : null;
                                          if (!selectedSlot || !currentUser) {
                                            setShowError(
                                              "Thiếu thông tin đặt lịch!"
                                            );
                                            return;
                                          }

                                          // Kiểm tra slot đang được hold
                                          if (
                                            !heldSlotId ||
                                            slotHoldTime === null
                                          ) {
                                            setShowError(
                                              "Slot đã hết thời gian giữ. Vui lòng chọn lại slot!"
                                            );
                                            return;
                                          }

                                          const slotTimeObj = allSlotTimes.find(
                                            (st) => st._id === heldSlotId
                                          );
                                          if (
                                            !slotTimeObj ||
                                            slotTimeObj.status !== "booked"
                                          ) {
                                            setShowError(
                                              "Không tìm thấy slot time phù hợp hoặc slot không còn được giữ!"
                                            );
                                            return;
                                          }
                                          const service = services.find(
                                            (s) => s._id === form.serviceId
                                          );
                                          if (!service || !service.price) {
                                            setShowError(
                                              "Dịch vụ không hợp lệ hoặc không có giá!"
                                            );
                                            return;
                                          }
                                          const billData = {
                                            slotTime_id: slotTimeObj._id,
                                            user_id: currentUser._id,
                                            consultant_id: selectedConsultant,
                                            service_id: form.serviceId,
                                            dateBooking: slotTimeObj.start_time,
                                            reason: form.reason,
                                            note: form.note,
                                            service: service,
                                            consultant: consultants.find(
                                              (c) =>
                                                c._id === selectedConsultant
                                            ),
                                            slot: selectedSlot,
                                            dateStr: getSelectedSlotDateStr(),
                                            price: service.price,
                                            fullName: form.name,
                                            phone: form.phone,
                                            gender: form.gender,
                                            paymentMethod: form.paymentMethod,
                                            paypalStatus: "COMPLETED",
                                          };
                                          localStorage.setItem(
                                            "pendingBill",
                                            JSON.stringify(billData)
                                          );
                                          // Không giải phóng slot khi thanh toán thành công - slot sẽ được xử lý ở PaymentResultPage
                                          navigate("/payment/result");
                                        } catch {
                                          setShowError(
                                            "Thanh toán thất bại. Vui lòng thử lại."
                                          );
                                        }
                                      }}
                                      onError={(err: PayPalError) => {
                                        console.error("PayPal Error:", err);
                                        setShowError(
                                          "Có lỗi xảy ra trong quá trình thanh toán PayPal. Vui lòng thử lại."
                                        );
                                      }}
                                    />
                                  </PayPalScriptProvider>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between gap-4 mt-4">
                        <button
                          type="button"
                          className="bg-gray-100 text-gray-700 py-3 px-8 rounded-xl font-semibold hover:bg-gray-200 transition-colors shadow-sm text-base border border-gray-200"
                          onClick={handleBack}
                        >
                          Quay lại
                        </button>
                        {form.paymentMethod !== "paypal" && (
                          <button
                            type="submit"
                            className="bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white py-3 px-10 rounded-xl font-semibold transition-colors shadow-md text-base"
                          >
                            Xác nhận & Thanh toán
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        Bằng cách nhấn nút xác nhận, bạn đồng ý với các điều
                        khoản và điều kiện của chúng tôi
                      </p>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
      {/* Drawer chọn chuyên viên tư vấn */}
      {showConsultantDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={() => setShowConsultantDrawer(false)}
          ></div>
          <div className="relative h-full w-1/4 min-w-[350px] bg-white/95 shadow-2xl flex flex-col animate-slideInRight border-l border-sky-100">
            <div className="flex items-center justify-between px-8 py-6 border-b border-sky-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-100 to-cyan-200 rounded-xl flex items-center justify-center shadow-sm">
                  <User className="w-5 h-5 text-sky-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">
                  Chọn chuyên gia tư vấn
                </h3>
              </div>
              <button
                className="text-gray-400 hover:text-sky-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-sky-50 transition-all"
                onClick={() => setShowConsultantDrawer(false)}
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {(expandConsultants
                ? availableConsultants
                : availableConsultants.slice(0, MAX_VISIBLE_CONSULTANTS)
              ).map((consultant) => (
                <div
                  key={consultant._id}
                  className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    pendingConsultant === consultant._id
                      ? "bg-gradient-to-r from-sky-50 to-cyan-50 border-sky-200 shadow-md"
                      : "bg-white border-gray-100 hover:border-sky-200 hover:shadow-sm"
                  }`}
                  onClick={() => {
                    setPendingConsultant(consultant._id);
                    setSelectedConsultant(consultant._id);
                    setShowConsultantDrawer(false);
                    setExpandConsultants(false);
                  }}
                >
                  <div className="flex items-center gap-4">
                    {consultant.photoUrl ? (
                      <img
                        src={consultant.photoUrl}
                        alt={consultant.fullName}
                        className="w-16 h-16 rounded-full object-cover object-center border border-gray-200 shadow"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/avarta.png";
                        }}
                      />
                    ) : (
                      <User className="w-7 h-7 text-gray-400" />
                    )}
                    <div>
                      <div className="font-medium text-gray-800 text-lg">
                        {consultant.fullName}
                      </div>
                      {consultant.experience && (
                        <div className="text-sm text-gray-600">
                          Kinh nghiệm: {consultant.experience} năm
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!expandConsultants &&
                availableConsultants.length > MAX_VISIBLE_CONSULTANTS && (
                  <div
                    className="h-12 rounded-2xl border border-dashed border-sky-200 bg-white/80 flex items-center justify-center text-sky-500 text-base font-medium cursor-pointer hover:bg-sky-50 transition-all select-none p-4"
                    onClick={() => setExpandConsultants(true)}
                  >
                    + Xem thêm chuyên viên tư vấn
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
      {/* Modal/cửa sổ thông báo lỗi */}
      {showError && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white/95 rounded-3xl shadow-xl p-8 max-w-md w-full flex flex-col items-center animate-fadeIn border border-red-100">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <div className="text-3xl text-red-500">&#9888;</div>
            </div>
            <div className="text-xl font-semibold text-red-700 mb-4 text-center">
              {showError}
            </div>
            <button
              className="mt-4 px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold hover:from-red-700 hover:to-red-600 transition-all shadow-md"
              onClick={() => setShowError(null)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
