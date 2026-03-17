import React, { useState, useEffect, useRef } from "react";
import {
  checkInEventApi,
  getAllEventsApi,
  createEventApi,
  updateEventApi,
} from "../../api";
import { getEventFeedbacksApi } from "../../api/index";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import {
  FiSearch,
  FiUsers,
  FiMapPin,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
} from "react-icons/fi";

// Dynamic imports for heavy dependencies
const Html5Qrcode = React.lazy(() =>
  import("html5-qrcode").then((module) => ({ default: module.Html5Qrcode }))
);
const Pie = React.lazy(() =>
  import("react-chartjs-2").then((module) => ({ default: module.Pie }))
);

// Thêm type definitions cho BarcodeDetector API
declare global {
  interface Window {
    BarcodeDetector: {
      new (options?: { formats: string[] }): BarcodeDetector;
    };
  }
}

interface BarcodeDetector {
  detect(image: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
}

interface Sponsor {
  _id: string;
  name: string;
  email: string;
  status: "active" | "inactive" | "isDeleted";
  logo?: string;
}

interface EventSponsor {
  sponsorId: string;
  donation: string;
  tier: "Platinum" | "Gold" | "Silver" | "Bronze";
  logo?: string;
  name?: string;
  _id?: string;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  location: string;
  capacity: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  image?: string;
  participants?: number;
  registeredCount?: number;
  sponsors?: EventSponsor[];
  createdAt?: string;
  updatedAt?: string;
}

// Add interface for check-in history
interface CheckInRecord {
  userName: string;
  eventName: string;
  timestamp: string;
  status: "success" | "error";
}

interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  registrationStartDate: string;
  registrationEndDate: string;
  location: string;
  capacity: number;
  image?: string;
  sponsors: EventSponsor[];
}

// Event Card Component
const EventCard = ({
  event,
  onSelect,
  onEdit,
  onDelete,
  onCancel,
  onReport,
}: {
  event: Event;
  onSelect: (e: Event) => void;
  onEdit: (e: Event) => void;
  onDelete: (e: Event) => void;
  onCancel: (e: Event) => void;
  onReport?: (e: Event) => void;
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow duration-200">
      <div className="relative h-48">
        <img
          src={
            event.image ||
            "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80"
          }
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div
          className={`absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-medium ${
            event.status === "upcoming"
              ? "bg-amber-100 text-amber-800"
              : event.status === "ongoing"
              ? "bg-green-100 text-green-800"
              : event.status === "completed"
              ? "bg-gray-100 text-gray-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {event.status === "upcoming"
            ? "Sắp diễn ra"
            : event.status === "ongoing"
            ? "Đang diễn ra"
            : event.status === "completed"
            ? "Đã kết thúc"
            : "Đã hủy"}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 line-clamp-1">
          {event.title}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {event.description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-500 text-sm">
            <FiCalendar className="mr-2 text-gray-400" />
            {new Date(event.startDate).toLocaleString("vi-VN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <div className="flex items-center text-gray-500 text-sm">
            <FiMapPin className="mr-2 text-gray-400" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          <div className="flex items-center text-gray-500 text-sm">
            <FiUsers className="mr-2 text-gray-400" />
            Sức chứa: {event.capacity} người
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Đăng ký:</span>
            <span
              className={`font-medium ${
                event.registeredCount && event.registeredCount >= event.capacity
                  ? "text-red-600"
                  : "text-gray-900"
              }`}
            >
              {event.registeredCount ?? 0}/{event.capacity}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                event.registeredCount && event.registeredCount >= event.capacity
                  ? "bg-red-500"
                  : event.registeredCount &&
                    event.registeredCount >= event.capacity * 0.8
                  ? "bg-yellow-500"
                  : "bg-amber-500"
              }`}
              style={{
                width: `${Math.min(
                  ((event.registeredCount ?? 0) / event.capacity) * 100,
                  100
                )}%`,
              }}
            ></div>
          </div>
          {event.registeredCount && event.registeredCount >= event.capacity && (
            <span className="text-xs text-red-600 font-medium mt-1 block">
              Đã đầy
            </span>
          )}
        </div>

        <div className="flex-1"></div>
        <div className="flex gap-2 mt-4">
          {event.status === "completed" ? (
            <button
              onClick={() => onReport && onReport(event)}
              className="flex-1 py-2 px-3 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              Xem báo cáo
            </button>
          ) : (
            <button
              onClick={() => onSelect(event)}
              className="flex-1 py-2 px-3 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
              disabled={event.status === "cancelled"}
            >
              Quét QR
            </button>
          )}
          <button
            onClick={() => onEdit(event)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Chỉnh sửa"
          >
            <FiEdit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(event)}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-md transition-colors"
            title="Xóa sự kiện"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
          {event.status !== "cancelled" && (
            <button
              onClick={() => onCancel(event)}
              className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-100 rounded-md transition-colors"
              title="Hủy sự kiện"
            >
              <FiXCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Event Form Modal
const EventFormModal = ({
  open,
  onClose,
  onSubmit,
  event,
  isEditing,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormData) => void;
  event?: Event | null;
  isEditing: boolean;
}) => {
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    registrationStartDate: "",
    registrationEndDate: "",
    location: "",
    capacity: 50,
    image: "",
    sponsors: [],
  });

  // Sponsor management states
  const [availableSponsors, setAvailableSponsors] = useState<Sponsor[]>([]);
  const [showNewSponsorForm, setShowNewSponsorForm] = useState(false);
  const [newSponsor, setNewSponsor] = useState({
    name: "",
    email: "",
    logo: "",
  });
  const [selectedSponsorId, setSelectedSponsorId] = useState("");
  const [sponsorDonation, setSponsorDonation] = useState("");
  const [sponsorTier, setSponsorTier] = useState<
    "Platinum" | "Gold" | "Silver" | "Bronze"
  >("Bronze");

  // Fetch available sponsors
  const fetchSponsors = async () => {
    try {
      const response = await fetch("/api/sponsors");
      const data = await response.json();
      setAvailableSponsors(data);
    } catch (error) {
      console.error("Error fetching sponsors:", error);
    }
  };

  // Create new sponsor
  const handleCreateSponsor = async () => {
    if (!newSponsor.name || !newSponsor.email) {
      toast.error("Vui lòng điền đầy đủ thông tin nhà tài trợ");
      return;
    }

    try {
      const response = await fetch("/api/sponsors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newSponsor),
      });

      if (response.ok) {
        const createdSponsor = await response.json();
        setAvailableSponsors((prev) => [...prev, createdSponsor]);
        setNewSponsor({ name: "", email: "", logo: "" });
        setShowNewSponsorForm(false);
        toast.success("Tạo nhà tài trợ thành công!");
        fetchSponsors(); // Luôn refetch lại danh sách sponsor sau khi tạo mới
        // Tự động chọn sponsor vừa tạo
        setSelectedSponsorId(createdSponsor._id);
      } else {
        // Lấy lỗi message từ BE
        const errorData = await response.json();
        const errorMessage =
          errorData.message || errorData.error || "Không thể tạo nhà tài trợ";
        toast.error(errorMessage);
        console.error("BE Error:", errorData); // Debug log
      }
    } catch (error) {
      console.error("FE Error:", error); // Debug log
      toast.error("Lỗi khi tạo nhà tài trợ");
    }
  };

  // Add sponsor to event
  const handleAddSponsor = () => {
    if (!selectedSponsorId) {
      toast.error("Vui lòng chọn nhà tài trợ!");
      return;
    }
    if (!sponsorDonation.trim()) {
      toast.error("Vui lòng nhập nội dung tài trợ");
      return;
    }
    const existingSponsor = formData.sponsors.find(
      (s) => s.sponsorId === selectedSponsorId
    );
    if (existingSponsor) {
      toast.error("Nhà tài trợ này đã được thêm vào sự kiện");
      return;
    }
    // Lấy thông tin sponsor từ danh sách availableSponsors
    const sponsorObj = availableSponsors.find(
      (sp) => sp._id === selectedSponsorId
    );
    const newEventSponsor: EventSponsor = {
      sponsorId: selectedSponsorId,
      donation: sponsorDonation.trim(),
      tier: sponsorTier,
      name: sponsorObj?.name || "",
      logo: sponsorObj?.logo || "",
    };
    setFormData((prev) => ({
      ...prev,
      sponsors: [...prev.sponsors, newEventSponsor],
    }));
    setSelectedSponsorId("");
    setSponsorDonation("");
    setSponsorTier("Bronze");
  };

  // Remove sponsor from event (xóa theo index)
  const handleRemoveSponsor = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sponsors: prev.sponsors.filter((_, i) => i !== index),
    }));
  };

  // Thêm hàm format về local datetime-local string
  function toLocalDatetimeString(dateString: string) {
    const d = new Date(dateString);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  useEffect(() => {
    if (open) {
      fetchSponsors();
    }
  }, [open]);

  useEffect(() => {
    if (event && isEditing) {
      // Map lại sponsor để bổ sung name/logo
      const sponsorsWithName = (event.sponsors || []).map((s) => {
        const sponsorObj = availableSponsors.find(
          (sp) => sp._id === s.sponsorId
        );
        return {
          ...s,
          name: sponsorObj?.name || "",
          logo: sponsorObj?.logo || "",
        };
      });
      setFormData({
        title: event.title,
        description: event.description,
        startDate: toLocalDatetimeString(event.startDate),
        endDate: toLocalDatetimeString(event.endDate),
        registrationStartDate: event.registrationStartDate
          ? toLocalDatetimeString(event.registrationStartDate)
          : toLocalDatetimeString(new Date().toISOString()),
        registrationEndDate: event.registrationEndDate
          ? toLocalDatetimeString(event.registrationEndDate)
          : toLocalDatetimeString(new Date().toISOString()),
        location: event.location,
        capacity: event.capacity,
        image: event.image || "",
        sponsors: sponsorsWithName,
      });
    } else {
      // Set default times for new events
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData({
        title: "",
        description: "",
        startDate: toLocalDatetimeString(tomorrow.toISOString()),
        endDate: toLocalDatetimeString(tomorrow.toISOString()),
        registrationStartDate: toLocalDatetimeString(now.toISOString()),
        registrationEndDate: toLocalDatetimeString(tomorrow.toISOString()),
        location: "",
        capacity: 50,
        image: "",
        sponsors: [],
      });
    }
  }, [event, isEditing, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.startDate ||
      !formData.endDate ||
      !formData.registrationStartDate ||
      !formData.registrationEndDate ||
      !formData.location.trim()
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    if (formData.title.trim().length < 5) {
      toast.error("Tiêu đề phải có ít nhất 5 ký tự");
      return;
    }

    if (formData.title.trim().length > 100) {
      toast.error("Tiêu đề không được vượt quá 100 ký tự");
      return;
    }

    if (formData.description.trim().length < 10) {
      toast.error("Mô tả phải có ít nhất 10 ký tự");
      return;
    }

    if (formData.description.trim().length > 1000) {
      toast.error("Mô tả không được vượt quá 1000 ký tự");
      return;
    }

    if (formData.location.trim().length < 3) {
      toast.error("Địa điểm phải có ít nhất 3 ký tự");
      return;
    }

    if (formData.capacity <= 0) {
      toast.error("Sức chứa phải lớn hơn 0");
      return;
    }

    if (formData.capacity > 10000) {
      toast.error("Sức chứa không được vượt quá 10,000 người");
      return;
    }

    // Kiểm tra sức chứa khi cập nhật event
    if (isEditing && event) {
      const currentRegisteredCount = event.registeredCount || 0;
      if (formData.capacity < currentRegisteredCount) {
        toast.error(
          `Không thể giảm sức chứa xuống ${formData.capacity} vì đã có ${currentRegisteredCount} người đăng ký`
        );
        return;
      }
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const regStartDate = new Date(formData.registrationStartDate);
    const regEndDate = new Date(formData.registrationEndDate);

    if (endDate <= startDate) {
      toast.error("Thời gian kết thúc sự kiện phải sau thời gian bắt đầu");
      return;
    }

    if (regEndDate <= regStartDate) {
      toast.error(
        "Thời gian kết thúc đăng ký phải sau thời gian bắt đầu đăng ký"
      );
      return;
    }

    if (regEndDate > startDate) {
      toast.error("Thời gian kết thúc đăng ký phải trước khi sự kiện bắt đầu");
      return;
    }

    if (!isEditing && regStartDate < new Date()) {
      toast.error("Thời gian bắt đầu đăng ký phải trong tương lai");
      return;
    }
    if (isEditing && regStartDate < new Date()) {
      toast.warn("Lưu ý: Thời gian bắt đầu đăng ký đã ở trong quá khứ.");
    }

    onSubmit(formData);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            {isEditing ? "Chỉnh sửa sự kiện" : "Tạo sự kiện mới"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Nhập tiêu đề sự kiện"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 h-24"
              placeholder="Nhập mô tả sự kiện"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian bắt đầu đăng ký *
              </label>
              <input
                type="datetime-local"
                value={formData.registrationStartDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    registrationStartDate: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian kết thúc đăng ký *
              </label>
              <input
                type="datetime-local"
                value={formData.registrationEndDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    registrationEndDate: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian bắt đầu sự kiện *
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian kết thúc sự kiện *
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa điểm *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Nhập địa điểm tổ chức"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sức chứa *
            </label>
            <input
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  capacity: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Số lượng người tham gia tối đa"
              required
            />
            {isEditing && event && event.registeredCount && (
              <div className="mt-2 text-sm">
                <span className="text-gray-600">
                  Hiện tại đã có{" "}
                  <span className="font-semibold">{event.registeredCount}</span>{" "}
                  người đăng ký
                </span>
                {event.registeredCount >= event.capacity && (
                  <div className="mt-1 text-red-600 font-medium">
                    ⚠️ Sự kiện đã đầy! Không thể giảm sức chứa.
                  </div>
                )}
                {event.registeredCount >= event.capacity * 0.8 &&
                  event.registeredCount < event.capacity && (
                    <div className="mt-1 text-yellow-600 font-medium">
                      ⚠️ Sự kiện gần đầy! (
                      {Math.round(
                        (event.registeredCount / event.capacity) * 100
                      )}
                      % đã đăng ký)
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Sponsor Management Section */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              Nhà tài trợ
            </h4>

            {/* Add Sponsor Form */}
            <div className="bg-gray-50 p-4 rounded-xl mb-4">
              <div className="flex flex-col md:flex-row gap-3 mb-3 items-end">
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chọn nhà tài trợ
                  </label>
                  <select
                    value={selectedSponsorId}
                    onChange={(e) => setSelectedSponsorId(e.target.value)}
                    className="w-full h-11 px-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="">-- Chọn nhà tài trợ --</option>
                    {availableSponsors.map((sponsor) => (
                      <option key={sponsor._id} value={sponsor._id}>
                        {sponsor.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tài trợ (tiền, sản phẩm, dịch vụ...)
                  </label>
                  <input
                    type="text"
                    value={sponsorDonation}
                    onChange={(e) => setSponsorDonation(e.target.value)}
                    className="w-full h-11 px-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="10.000.000 VNĐ, 100 áo thun, ..."
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cấp độ
                  </label>
                  <select
                    value={sponsorTier}
                    onChange={(e) =>
                      setSponsorTier(
                        e.target.value as
                          | "Platinum"
                          | "Gold"
                          | "Silver"
                          | "Bronze"
                      )
                    }
                    className="w-full h-11 px-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="Bronze">Bronze</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleAddSponsor}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
                >
                  Thêm nhà tài trợ
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewSponsorForm(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Tạo nhà tài trợ mới
                </button>
              </div>
            </div>

            {/* Selected Sponsors List */}
            {formData.sponsors.length === 0 ? (
              <div className="text-gray-500 italic">
                Chưa có nhà tài trợ nào
              </div>
            ) : availableSponsors.length === 0 ? (
              <div className="text-gray-500 italic">Đang tải...</div>
            ) : (
              formData.sponsors.map((s, index) => {
                // Ép kiểu sponsorId và _id về string để so sánh
                const sponsorIdStr = s.sponsorId ? s.sponsorId.toString() : "";
                const sponsorObj = availableSponsors.find(
                  (sp) => sp._id.toString() === sponsorIdStr
                );
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white p-3 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      {(s.logo || sponsorObj?.logo) && (
                        <img
                          src={s.logo || sponsorObj?.logo}
                          alt={s.name || sponsorObj?.name || "Unknown Sponsor"}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">
                          {s.name || sponsorObj?.name || "Unknown Sponsor"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-medium">{s.donation}</div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full ${
                            s.tier === "Platinum"
                              ? "bg-purple-100 text-purple-800"
                              : s.tier === "Gold"
                              ? "bg-yellow-100 text-yellow-800"
                              : s.tier === "Silver"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {s.tier}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSponsor(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Hình ảnh sự kiện */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hình ảnh sự kiện
            </label>
            <div className="flex items-center gap-3">
              {formData.image && (
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-24 h-24 object-cover border rounded-lg"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const form = new FormData();
                  form.append("image", file);
                  try {
                    const res = await fetch("/api/uploads/upload", {
                      method: "POST",
                      body: form,
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                          "token"
                        )}`,
                      },
                    });
                    if (!res.ok) throw new Error("Upload thất bại");
                    const data = await res.json();
                    setFormData((prev) => ({ ...prev, image: data.imageUrl }));
                    toast.success("Tải ảnh lên thành công!");
                  } catch (error) {
                    toast.error("Tải ảnh lên thất bại!");
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-700 transition-all"
            >
              {isEditing ? "Cập nhật" : "Tạo sự kiện"}
            </button>
          </div>
        </form>

        {/* New Sponsor Modal */}
        {showNewSponsorForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800">
                  Tạo nhà tài trợ mới
                </h4>
                <button
                  onClick={() => setShowNewSponsorForm(false)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên nhà tài trợ *
                  </label>
                  <input
                    type="text"
                    value={newSponsor.name}
                    onChange={(e) =>
                      setNewSponsor({ ...newSponsor, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Nhập tên nhà tài trợ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newSponsor.email}
                    onChange={(e) =>
                      setNewSponsor({ ...newSponsor, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="sponsor@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo nhà tài trợ
                  </label>
                  <div className="flex items-center gap-3">
                    {newSponsor.logo && (
                      <img
                        src={newSponsor.logo}
                        alt="Logo preview"
                        className="w-24 h-24 object-cover border rounded-lg"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const form = new FormData();
                        form.append("image", file);
                        try {
                          const res = await fetch("/api/uploads/upload", {
                            method: "POST",
                            body: form,
                            headers: {
                              Authorization: `Bearer ${localStorage.getItem(
                                "token"
                              )}`,
                            },
                          });
                          if (!res.ok) throw new Error("Upload thất bại");
                          const data = await res.json();
                          setNewSponsor((prev) => ({
                            ...prev,
                            logo: data.imageUrl,
                          }));
                          toast.success("Tải logo lên thành công!");
                        } catch (error) {
                          toast.error("Tải logo lên thất bại!");
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewSponsorForm(false)}
                    className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateSponsor}
                    className="flex-1 py-2 px-4 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-all"
                  >
                    Tạo nhà tài trợ
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal = ({
  open,
  onClose,
  onConfirm,
  eventTitle,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eventTitle: string;
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Xác nhận xóa sự kiện
        </h3>
        <p className="text-gray-600 mb-6">
          Bạn có chắc chắn muốn xóa sự kiện{" "}
          <span className="font-semibold">"{eventTitle}"</span>?
          <br />
          <span className="text-red-500 text-sm">
            Hành động này không thể hoàn tác.
          </span>
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-4 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all"
          >
            Xóa
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Cancel Confirmation Modal
const CancelConfirmModal = ({
  open,
  onClose,
  onConfirm,
  eventTitle,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eventTitle: string;
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="text-center">
          <div className="text-orange-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Xác nhận hủy sự kiện
          </h2>
          <p className="text-gray-600 mb-6">
            Bạn có chắc chắn muốn hủy sự kiện <strong>"{eventTitle}"</strong>{" "}
            không?
            <br />
            <span className="text-sm text-orange-600">
              Sự kiện sẽ được chuyển sang trạng thái "Đã hủy" và không thể hoàn
              tác.
            </span>
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
            >
              Xác nhận hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Pagination Component
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) => (
  <div className="flex justify-center items-center gap-2 mt-8">
    <button
      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
    >
      <FiChevronLeft />
    </button>
    <span className="font-semibold text-gray-700">
      Trang {currentPage} / {totalPages}
    </span>
    <button
      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
    >
      <FiChevronRight />
    </button>
  </div>
);

// Check-in History Component
const CheckInHistory = ({ history }: { history: CheckInRecord[] }) => (
  <div className="mt-6 bg-white rounded-xl shadow p-4 max-w-lg mx-auto">
    <h4 className="font-bold text-gray-700 mb-2 text-center">
      Lịch sử check-in gần đây
    </h4>
    <ul className="divide-y divide-gray-100">
      {history.length === 0 && (
        <li className="text-gray-400 text-center py-2">Chưa có check-in nào</li>
      )}
      {history.map((rec, idx) => (
        <li key={idx} className="flex items-center py-2 text-sm">
          {rec.status === "success" ? (
            <FiCheckCircle className="text-green-500 mr-2" />
          ) : (
            <FiXCircle className="text-red-500 mr-2" />
          )}
          <span className="font-medium text-gray-700 mr-2">{rec.userName}</span>
          <span className="text-gray-500">- {rec.eventName}</span>
          <span className="ml-auto text-gray-400">{rec.timestamp}</span>
        </li>
      ))}
    </ul>
  </div>
);

// QR Scanner Modal
const QRScannerModal = ({
  open,
  onClose,
  onScan,
  eventTitle,
  checkInHistory,
  checkInHistoryError,
  eventCapacity,
}: {
  open: boolean;
  onClose: () => void;
  onScan: (data: string | null, opts?: { success?: boolean }) => void;
  eventTitle: string;
  checkInHistory: CheckInRecord[];
  checkInHistoryError?: string | null;
  eventCapacity?: number;
}) => {
  const qrRegionId = "qr-reader-html5";
  const html5QrcodeRef = useRef<any | null>(null);
  const scanningRef = useRef(false);
  const isScanningCamera = useRef(true); // Quản lý trạng thái camera
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const html5Qr = html5QrcodeRef.current || new Html5Qrcode(qrRegionId);
      // Chỉ stop nếu đang quét camera
      if (isScanningCamera.current) {
        try {
          await html5Qr.stop();
          isScanningCamera.current = false;
        } catch (err) {
          console.warn("Stop camera error (ignore if not running):", err);
        }
      }
      // Scan file
      const result = await html5Qr.scanFile(file, true);
      onScan(result, { success: true });
      setTimeout(() => onClose(), 500);
    } catch (err) {
      console.error("Scan file error:", err);
      toast.error("Không nhận diện được mã QR trong ảnh!");
      // Nếu scan file thất bại, khởi động lại camera
      try {
        await html5QrcodeRef.current?.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 300, height: 300 } },
          (decodedText) => {
            if (scanningRef.current) {
              scanningRef.current = false;
              onScan(decodedText, { success: true });
              setTimeout(() => onClose(), 500);
            }
          },
          (errorMessage) => {}
        );
        isScanningCamera.current = true;
      } catch (e) {
        console.warn("Restart camera error:", e);
      }
    }
  };

  useEffect(() => {
    if (!open) return;
    scanningRef.current = true;
    const html5Qr = new Html5Qrcode(qrRegionId);
    html5QrcodeRef.current = html5Qr;
    isScanningCamera.current = true;
    html5Qr
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 300, height: 300 } },
        (decodedText) => {
          if (scanningRef.current) {
            scanningRef.current = false;
            onScan(decodedText, { success: true });
            setTimeout(() => onClose(), 500);
          }
        },
        (errorMessage) => {}
      )
      .catch(() => {});
    return () => {
      scanningRef.current = false;
      isScanningCamera.current = false;
      try {
        html5Qr
          .stop()
          .then(() => html5Qr.clear())
          .catch(() => {});
      } catch (e) {}
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
        >
          <FiXCircle size={24} />
        </button>
        <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
          Quét mã QR check-in
        </h3>
        <p className="text-gray-500 text-center mb-4">
          Sự kiện:{" "}
          <span className="font-semibold text-amber-600">{eventTitle}</span>
        </p>
        <div className="rounded-xl overflow-hidden border border-gray-200 mb-4 flex justify-center">
          <div id={qrRegionId} style={{ width: 300, height: 300 }} />
        </div>
        <div className="flex flex-col items-center mb-2">
          <button
            className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-semibold hover:bg-amber-200 mb-1"
            onClick={() => fileInputRef.current?.click()}
          >
            Tải ảnh QR từ máy tính
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
        <p className="text-xs text-gray-400 text-center">
          Đưa mã QR của người tham gia vào khung camera hoặc tải ảnh QR để
          check-in
        </p>
        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2">
            Danh sách check-in gần nhất:
          </h4>
          {checkInHistoryError ? (
            <div className="text-red-500 text-xs mb-2">
              {checkInHistoryError}
            </div>
          ) : (
            <ul className="max-h-32 overflow-y-auto text-xs">
              {checkInHistory.length === 0 && (
                <li className="text-gray-400">Chưa có ai check-in</li>
              )}
              {checkInHistory.map((item, idx) => (
                <li key={idx} className="text-green-600">
                  {item.userName} -{" "}
                  {item.timestamp
                    ? new Date(item.timestamp).toLocaleString("vi-VN")
                    : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-2 text-center text-sm text-gray-600 font-medium">
          Đã check-in: {checkInHistory.length}/{eventCapacity || "--"} người
        </div>
      </motion.div>
    </div>
  );
};

// Modal báo cáo sự kiện
const EventReportModal = ({
  open,
  onClose,
  event,
}: {
  open: boolean;
  onClose: () => void;
  event: Event | null;
}) => {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [checkInCount, setCheckInCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!event || !open) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const feedbackData = await getEventFeedbacksApi(event._id);
        setFeedbacks(feedbackData);
        const res = await fetch(`/api/events/${event._id}/check-in-history`);
        const checkInData = await res.json();
        setCheckInCount(Array.isArray(checkInData) ? checkInData.length : 0);
      } catch {
        setFeedbacks([]);
        setCheckInCount(0);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [event, open]);

  if (!event) return null;
  const registered = event.registeredCount ?? 0;
  const percent =
    registered > 0 ? Math.round((checkInCount / registered) * 100) : 0;

  // Pie chart data
  const pieData = {
    labels: ["Check-in", "Chưa check-in"],
    datasets: [
      {
        data: [checkInCount, Math.max(registered - checkInCount, 0)],
        backgroundColor: ["#22c55e", "#e5e7eb"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 ${
        open ? "" : "hidden"
      }`}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-8 relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-6 text-amber-700 flex items-center gap-2">
          <span>📊 Báo cáo sự kiện:</span>{" "}
          <span className="truncate">{event.title}</span>
        </h2>
        {loading ? (
          <div className="text-center py-12 text-lg text-amber-600 font-semibold">
            Đang tải dữ liệu...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Tổng quan & biểu đồ */}
            <div>
              <div className="mb-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                  <span className="inline-block w-3 h-3 rounded-full bg-amber-500"></span>
                  Tổng đăng ký:{" "}
                  <span className="text-amber-700">{registered}</span>
                </div>
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                  Đã check-in:{" "}
                  <span className="text-green-600">{checkInCount}</span>
                </div>
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                  <span className="inline-block w-3 h-3 rounded-full bg-yellow-400"></span>
                  Tỉ lệ tham gia:
                  <span className="text-yellow-600">{percent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                  <div
                    className="h-3 rounded-full bg-green-500 transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex justify-center items-center mt-6">
                {/* Biểu đồ tròn */}
                <Pie
                  data={pieData}
                  options={{ plugins: { legend: { display: false } } }}
                  width={120}
                  height={120}
                />
              </div>
            </div>
            {/* Feedback */}
            <div>
              <h3 className="font-semibold mb-3 text-amber-700 text-lg flex items-center gap-2">
                📝 Feedback của sự kiện
              </h3>
              {feedbacks.length === 0 ? (
                <div className="text-gray-400 text-base italic">
                  Chưa có feedback nào.
                </div>
              ) : (
                <ul className="max-h-64 overflow-y-auto divide-y divide-gray-200">
                  {feedbacks.map((fb, idx) => (
                    <li key={idx} className="py-3 flex gap-3 items-start">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-lg">
                        {fb.userId?.fullName ? fb.userId.fullName[0] : "A"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-800">
                            {fb.userId?.fullName || "Ẩn danh"}
                          </span>
                          <span className="flex gap-0.5">
                            {Array(5)
                              .fill(0)
                              .map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < fb.rating
                                      ? "text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.385 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.385-2.46a1 1 0 00-1.175 0l-3.385 2.46c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118l-3.385-2.46c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.967z" />
                                </svg>
                              ))}
                          </span>
                        </div>
                        <div className="text-gray-700 text-base">
                          {fb.content}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Admin Event Management Page
const AdminEventManagement = () => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [checkInHistory, setCheckInHistory] = useState<CheckInRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(6);
  const [sortBy, setSortBy] = useState("newest");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancellingEvent, setCancellingEvent] = useState<Event | null>(null);
  const [allSponsors, setAllSponsors] = useState<Sponsor[]>([]);
  const [checkInHistoryError, setCheckInHistoryError] = useState<string | null>(
    null
  );
  // Thêm state cho modal báo cáo
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportEvent, setReportEvent] = useState<Event | null>(null);

  const handleReportEvent = (event: Event) => {
    setReportEvent(event);
    setShowReportModal(true);
  };

  useEffect(() => {
    fetchEvents();
    fetchAllSponsors();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await getAllEventsApi();

      // Sắp xếp sự kiện theo thời gian mới nhất (createdAt hoặc startDate)
      const sortedEvents = (Array.isArray(data) ? data : []).sort(
        (a: Event, b: Event) => {
          // Ưu tiên sắp xếp theo ngày tạo mới nhất
          const dateA = new Date(a.createdAt || a.startDate);
          const dateB = new Date(b.createdAt || b.startDate);
          return dateB.getTime() - dateA.getTime();
        }
      );

      setEvents(sortedEvents);
    } catch (error) {
      toast.error("Không thể tải danh sách sự kiện");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSponsors = async () => {
    try {
      const res = await fetch("/api/sponsors");
      const data = await res.json();
      setAllSponsors(data);
    } catch (err) {
      // ignore
    }
  };

  const handleCreateEvent = async (formData: EventFormData) => {
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        registrationStartDate: new Date(formData.registrationStartDate),
        registrationEndDate: new Date(formData.registrationEndDate),
        location: formData.location,
        capacity: formData.capacity,
        image: formData.image,
        sponsors: formData.sponsors.map((s) => ({
          sponsorId: s.sponsorId,
          donation: s.donation,
          tier: s.tier,
        })),
      };

      await createEventApi(payload);
      toast.success("Tạo sự kiện thành công!");
      setShowEventForm(false);
      fetchEvents();
    } catch {
      toast.error("Không thể tạo sự kiện");
    }
  };

  const handleUpdateEvent = async (formData: EventFormData) => {
    if (!editingEvent) return;
    try {
      await updateEventApi(editingEvent._id, {
        title: formData.title,
        description: formData.description,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        registrationStartDate: new Date(formData.registrationStartDate),
        registrationEndDate: new Date(formData.registrationEndDate),
        location: formData.location,
        capacity: formData.capacity,
        ...(formData.image ? { image: formData.image } : {}),
        sponsors: formData.sponsors.map((s) => ({
          sponsorId: s.sponsorId,
          donation: s.donation,
          tier: s.tier,
        })),
      });
      toast.success("Cập nhật sự kiện thành công!");
      setShowEventForm(false);
      setEditingEvent(null);
      fetchEvents();
    } catch {
      toast.error("Không thể cập nhật sự kiện");
    }
  };

  const handleDeleteEvent = async () => {
    if (!deletingEvent) return;
    try {
      const response = await fetch(`/api/events/${deletingEvent._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Không thể xóa sự kiện");
        setShowDeleteConfirm(false);
        setDeletingEvent(null);
        return;
      }

      toast.success(data.message || "Xóa sự kiện thành công!");
      setShowDeleteConfirm(false);
      setDeletingEvent(null);
      fetchEvents();
    } catch {
      toast.error("Lỗi khi xóa sự kiện");
      setShowDeleteConfirm(false);
      setDeletingEvent(null);
    }
  };

  const handleCancelEvent = async (event: Event) => {
    setCancellingEvent(event);
    setShowCancelConfirm(true);
  };

  const confirmCancelEvent = async () => {
    if (!cancellingEvent) return;
    try {
      const response = await fetch(
        `/api/events/${cancellingEvent._id}/cancel`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || "Không thể hủy sự kiện");
        return;
      }

      const data = await response.json();
      toast.success(data.message || "Hủy sự kiện thành công!");
      setShowCancelConfirm(false);
      setCancellingEvent(null);
      fetchEvents();
    } catch {
      toast.error("Không thể hủy sự kiện");
      setShowCancelConfirm(false);
      setCancellingEvent(null);
    }
  };

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    setShowQRScanner(true);
    fetchCheckInHistory(event._id); // Gọi API khi mở modal
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleDeleteClick = (event: Event) => {
    setDeletingEvent(event);
    setShowDeleteConfirm(true);
  };

  const fetchCheckInHistory = async (eventId: string) => {
    try {
      setCheckInHistoryError(null);
      const res = await fetch(`/api/events/${eventId}/check-in-history`); // Sửa endpoint
      if (res.ok) {
        const data = await res.json();
        setCheckInHistory(data);
      } else if (res.status === 404) {
        setCheckInHistory([]);
        setCheckInHistoryError("Chưa có lịch sử check-in cho sự kiện này.");
      } else {
        setCheckInHistoryError("Không lấy được lịch sử check-in.");
      }
    } catch {
      setCheckInHistoryError("Không lấy được lịch sử check-in.");
    }
  };

  // 1. Sửa handleScan để không crash khi check-in trùng
  const handleScan = async (
    data: string | null,
    opts?: { success?: boolean }
  ) => {
    if (!data || !selectedEvent) return;
    try {
      await checkInEventApi(selectedEvent._id, data);
      setCheckInHistory((prev) =>
        [
          {
            userName: "(QR)",
            eventName: selectedEvent.title,
            timestamp: new Date().toISOString(),
            status: "success" as const,
          },
          ...prev,
        ].slice(0, 10)
      );
      toast.success("Check-in thành công!");
      setShowQRScanner(false); // Chỉ đóng khi thành công
      fetchEvents();
      fetchCheckInHistory(selectedEvent._id);
    } catch (err: any) {
      // Lấy đúng message từ backend khi lỗi
      const msg =
        err?.response?.data?.message || err?.message || "Check-in thất bại!";
      toast.error(msg);
      setCheckInHistory((prev) =>
        [
          {
            userName: "(QR)",
            eventName: selectedEvent.title,
            timestamp: new Date().toISOString(),
            status: "error" as const,
          },
          ...prev,
        ].slice(0, 10)
      );
      fetchCheckInHistory(selectedEvent._id);
      // KHÔNG đóng modal khi lỗi
    }
  };

  // Filter + search + sort
  const filteredEvents = events.filter((event) => {
    if (filter !== "all" && event.status !== filter) return false;
    if (search && !event.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  // Sắp xếp sự kiện
  const sortedEvents = [...filteredEvents].sort((a: Event, b: Event) => {
    switch (sortBy) {
      case "newest": {
        const dateA = new Date(a.createdAt || a.startDate);
        const dateB = new Date(b.createdAt || b.startDate);
        return dateB.getTime() - dateA.getTime();
      }
      case "oldest": {
        const dateAOld = new Date(a.createdAt || a.startDate);
        const dateBOld = new Date(b.createdAt || b.startDate);
        return dateAOld.getTime() - dateBOld.getTime();
      }
      case "startDate":
        return (
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
      case "startDateDesc":
        return (
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
      case "capacity":
        return b.capacity - a.capacity;
      case "registered":
        return (b.registeredCount || 0) - (a.registeredCount || 0);
      case "status":
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sortedEvents.length / rowsPerPage);
  const paginatedFilteredEvents = sortedEvents.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 w-full flex flex-col justify-center items-center">
        <div className="w-full max-w-7xl mx-auto bg-white rounded-lg shadow-sm p-6 mb-8">
          <ToastContainer position="top-right" autoClose={2000} />

          {/* Header */}
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-2xl font-semibold text-gray-800">
              Quản lý sự kiện
            </h1>
            {events.length > 0 && (
              <div className="flex gap-4 text-sm text-gray-600 mt-2">
                <span>Tổng cộng: {events.length} sự kiện</span>
              </div>
            )}
          </div>

          {/* Filter & Search Section */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">
              Tìm kiếm và Lọc
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tìm kiếm
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm sự kiện..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="focus:ring-amber-500 focus:border-amber-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md"
                >
                  <option value="all">Tất cả</option>
                  <option value="upcoming">Sắp diễn ra</option>
                  <option value="ongoing">Đang diễn ra</option>
                  <option value="completed">Đã kết thúc</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sắp xếp
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="startDate">Ngày bắt đầu (tăng dần)</option>
                  <option value="startDateDesc">Ngày bắt đầu (giảm dần)</option>
                  <option value="capacity">Sức chứa</option>
                  <option value="registered">Số đăng ký</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-500">
                  Kết quả: {filteredEvents.length} sự kiện
                </span>
              </div>
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setShowEventForm(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                <FiPlus className="mr-2 h-4 w-4" />
                Tạo sự kiện mới
              </button>
            </div>
          </div>

          {/* Hiển thị tất cả nhà tài trợ */}
          {allSponsors.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">
                Tất cả nhà tài trợ
              </h2>
              <div className="flex flex-wrap gap-4">
                {allSponsors.map((s) => (
                  <div
                    key={s._id}
                    className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200"
                  >
                    {s.logo && (
                      <img
                        src={s.logo}
                        alt={s.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <div className="font-semibold text-gray-800">
                        {s.name}
                      </div>
                      <div className="text-xs text-gray-500">{s.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events Grid */}
          <div className="bg-white shadow rounded-lg w-full mb-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {paginatedFilteredEvents.map((event) => (
                    <EventCard
                      key={event._id}
                      event={event}
                      onSelect={handleEventSelect}
                      onEdit={handleEditEvent}
                      onDelete={handleDeleteClick}
                      onCancel={handleCancelEvent}
                      onReport={handleReportEvent}
                    />
                  ))}
                </div>

                {filteredEvents.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                      Không có sự kiện nào phù hợp
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white shadow rounded-lg p-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <EventFormModal
        open={showEventForm}
        onClose={() => {
          setShowEventForm(false);
          setEditingEvent(null);
        }}
        onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
        event={editingEvent}
        isEditing={!!editingEvent}
      />

      <DeleteConfirmModal
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingEvent(null);
        }}
        onConfirm={handleDeleteEvent}
        eventTitle={deletingEvent?.title || ""}
      />

      <CancelConfirmModal
        open={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={confirmCancelEvent}
        eventTitle={cancellingEvent?.title || ""}
      />

      <QRScannerModal
        open={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleScan}
        eventTitle={selectedEvent?.title || ""}
        checkInHistory={checkInHistory}
        checkInHistoryError={checkInHistoryError}
        eventCapacity={selectedEvent?.capacity}
      />

      {/* Check-in History */}
      {showQRScanner && <CheckInHistory history={checkInHistory} />}

      {/* Modal báo cáo sự kiện */}
      <EventReportModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        event={reportEvent}
      />
    </div>
  );
};

export default AdminEventManagement;
