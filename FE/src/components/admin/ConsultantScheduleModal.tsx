import React, { useEffect, useState } from "react";
import {
  getSlotTimeByConsultantIdApi,
  createSlotTimeApi,
  updateSlotTimeApi,
  deleteSlotTimeApi,
} from "../../api";
import {
  addDays,
  startOfWeek,
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
} from "date-fns";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const timeSlots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];

interface SlotTime {
  _id: string;
  consultant_id: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface AppointmentDetail {
  user_id?: {
    fullName?: string;
    username?: string;
    email?: string;
  };
  service_id?: {
    name?: string;
    title?: string;
  };
  slotTime_id?: {
    start_time?: string;
    end_time?: string;
  };
  status?: string;
  reason?: string;
  dateBooking?: string;
}

interface ConsultantScheduleModalProps {
  consultantId: string;
  open: boolean;
  onClose: () => void;
}

const ConsultantScheduleModal: React.FC<ConsultantScheduleModalProps> = ({
  consultantId,
  open,
  onClose,
}) => {
  const [slotTimes, setSlotTimes] = useState<SlotTime[]>([]);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    day: string;
    time: string;
    slot?: SlotTime;
  } | null>(null);
  const [status, setStatus] = useState("available");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<{
    [key: string]: boolean;
  }>({}); // key: `${day}-${slot}`
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectMode, setSelectMode] = useState<"select" | "deselect" | null>(
    null
  );
  const [appointmentDetail, setAppointmentDetail] =
    useState<AppointmentDetail | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  const today = new Date();
  const weekStart = startOfWeek(addDays(today, currentWeek * 7), {
    weekStartsOn: 1,
  });
  const weekEnd = endOfWeek(addDays(today, currentWeek * 7), {
    weekStartsOn: 1,
  });

  useEffect(() => {
    if (open) fetchSlotTimes();
    // eslint-disable-next-line
  }, [consultantId, open, currentWeek]);

  const fetchSlotTimes = async () => {
    setLoading(true);
    try {
      const data = await getSlotTimeByConsultantIdApi(consultantId);
      setSlotTimes(Array.isArray(data) ? data : []);
      setError(null);
    } catch {
      setSlotTimes([]);
      setError("Không thể tải lịch làm việc.");
      toast.error("Không thể tải lịch làm việc!");
    } finally {
      setLoading(false);
    }
  };

  const slotTimesOfWeek = slotTimes.filter((st) => {
    const d = parseISO(st.start_time);
    return isWithinInterval(d, { start: weekStart, end: weekEnd });
  });

  const handleMouseDown = (day: string, slot: string) => {
    const key = `${day}-${slot}`;
    const isSelected = !!selectedSlots[key];

    setIsSelecting(true);
    setSelectMode(isSelected ? "deselect" : "select");

    setSelectedSlots((prev) => {
      const newSelected = { ...prev };
      if (isSelected) {
        delete newSelected[key];
      } else {
        newSelected[key] = true;
      }
      return newSelected;
    });
  };

  const handleMouseEnter = (day: string, slot: string) => {
    if (!isSelecting) return;

    const key = `${day}-${slot}`;
    setSelectedSlots((prev) => {
      const newSelected = { ...prev };
      if (selectMode === "select") {
        newSelected[key] = true;
      } else if (selectMode === "deselect") {
        delete newSelected[key];
      }
      return newSelected;
    });
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    setSelectMode(null);
  };

  // Chọn/bỏ chọn cả ngày
  const toggleFullDay = (day: string) => {
    const allSelected = timeSlots.every(
      (slot) => selectedSlots[`${day}-${slot}`]
    );
    const newSelected = { ...selectedSlots };
    timeSlots.forEach((slot) => {
      newSelected[`${day}-${slot}`] = !allSelected;
    });
    setSelectedSlots(newSelected);
  };

  // Lưu tất cả các slot đã chọn để tạo mới
  const handleSaveAllSelectedSlots = async () => {
    setIsSaving(true);
    const newSlots: { start_time: string; end_time: string }[] = [];
    try {
      for (const day of weekDays) {
        for (const slot of timeSlots) {
          const key = `${day}-${slot}`;
          if (selectedSlots[key]) {
            const slotHour = parseInt(slot.split(":")[0], 10);
            const dayIdx = weekDays.indexOf(day);
            const start = addDays(weekStart, dayIdx);
            start.setHours(slotHour, 0, 0, 0);
            const end = addDays(weekStart, dayIdx);
            end.setHours(slotHour + 1, 0, 0, 0);

            // Sửa lại logic kiểm tra slot đã tồn tại, so sánh cả ngày/tháng/năm
            const existingSlot = slotTimes.some((st) => {
              try {
                const stDate = parseISO(st.start_time);
                return (
                  stDate.getFullYear() === start.getFullYear() &&
                  stDate.getMonth() === start.getMonth() &&
                  stDate.getDate() === start.getDate() &&
                  stDate.getHours() === start.getHours()
                );
              } catch {
                // Fallback nếu parseISO lỗi
                const d = new Date(st.start_time);
                return (
                  d.getFullYear() === start.getFullYear() &&
                  d.getMonth() === start.getMonth() &&
                  d.getDate() === start.getDate() &&
                  d.getHours() === start.getHours()
                );
              }
            });

            if (!existingSlot) {
              newSlots.push({
                start_time: start.toISOString(),
                end_time: end.toISOString(),
              });
            }
          }
        }
      }

      if (newSlots.length > 0) {
        const slotData = {
          consultant_id: consultantId,
          slots: newSlots,
        };
        console.log("Đang gửi dữ liệu đăng ký các slot:", slotData);
        await createSlotTimeApi(slotData);
        toast.success(
          `Đã tạo thành công ${newSlots.length} lịch làm việc mới!`
        );
      } else {
        toast.info(
          "Tất cả các vị trí được chọn đã tồn tại hoặc không có gì để lưu."
        );
      }

      setSelectedSlots({});
      await fetchSlotTimes();
    } catch (err: unknown) {
      console.error("Lỗi khi lưu lịch:", err);
      toast.error("Có lỗi khi lưu lịch!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAllSelectedSlots = async () => {
    setIsSaving(true);
    try {
      for (const day of weekDays) {
        for (const slot of timeSlots) {
          const key = `${day}-${slot}`;
          if (selectedSlots[key]) {
            // Tìm slotObj
            const slotObj = slotTimesOfWeek.find((st) => {
              let dayOfWeek, hour;
              try {
                dayOfWeek = format(parseISO(st.start_time), "EEE");
                hour = format(parseISO(st.start_time), "HH:00");
              } catch {
                const d = new Date(st.start_time);
                dayOfWeek = format(d, "EEE");
                hour = format(d, "HH:00");
              }
              return dayOfWeek === day && hour === slot;
            });
            if (slotObj) {
              await deleteSlotTimeApi(slotObj._id);
            }
          }
        }
      }
      setSelectedSlots({});
      await fetchSlotTimes();
      toast.success("Đã xóa tất cả slot đã chọn!");
    } catch {
      toast.error("Có lỗi khi xóa lịch!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selectedSlot) return;
    const dayIdx = weekDays.indexOf(selectedSlot.day);
    const slotHour = parseInt(selectedSlot.time.split(":")[0], 10);
    const start = addDays(weekStart, dayIdx);
    start.setHours(slotHour, 0, 0, 0);
    const end = addDays(weekStart, dayIdx);
    end.setHours(slotHour + 1, 0, 0, 0);
    try {
      if (selectedSlot.slot) {
        await updateSlotTimeApi(selectedSlot.slot._id, {
          start_time: start.toISOString(),
          end_time: end.toISOString(),
        });
        // Mặc định status vẫn giữ nguyên giá trị cũ
        toast.success("Cập nhật ca làm việc thành công!");
      } else {
        await createSlotTimeApi({
          consultant_id: consultantId,
          slots: [
            { start_time: start.toISOString(), end_time: end.toISOString() },
          ],
        });
        toast.success("Tạo ca làm việc thành công!");
      }
      await fetchSlotTimes();
      setSelectedSlot(null);
    } catch {
      toast.error("Có lỗi khi lưu ca làm việc!");
    }
  };

  const handleDelete = async () => {
    if (selectedSlot?.slot) {
      try {
        await deleteSlotTimeApi(selectedSlot.slot._id);
        await fetchSlotTimes();
        setSelectedSlot(null);
        toast.success("Xóa ca làm việc thành công!");
      } catch {
        toast.error("Có lỗi khi xóa ca làm việc!");
      }
    }
  };

  const handleBookedSlotClick = async (slotTimeId: string) => {
    try {
      const response = await axios.get(
        `https://mln111-1.onrender.com/api/appointments/slotTime/${slotTimeId}`
      );
      if (response.data && response.data.length > 0) {
        setAppointmentDetail(response.data[0]);
        setShowAppointmentModal(true);
      } else {
        toast.error("Không tìm thấy thông tin cuộc hẹn!");
      }
    } catch {
      toast.error("Lỗi khi lấy thông tin cuộc hẹn!");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-4 w-full max-w-xl max-h-[80vh] overflow-y-auto shadow-xl relative transform transition-all duration-300 ease-in-out">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-blue-600 text-2xl transition-colors duration-200 z-10"
          onClick={onClose}
        >
          &times;
        </button>
        <h4 className="text-xl font-bold text-blue-700 mb-4">
          Quản lý lịch làm việc
        </h4>
        <div className="mb-3 flex justify-between items-center">
          <button
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2 text-sm"
            onClick={() => setCurrentWeek((w) => w - 1)}
            disabled={currentWeek === 0}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Tuần trước
          </button>
          <span className="font-semibold text-blue-600 text-base">
            {format(weekStart, "dd/MM/yyyy")} - {format(weekEnd, "dd/MM/yyyy")}
          </span>
          <button
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2 text-sm"
            onClick={() => setCurrentWeek((w) => w + 1)}
          >
            Tuần sau
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
        <div className="mb-2 flex justify-end gap-2">
          <button
            className={`px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-all duration-200 text-sm ${Object.values(selectedSlots).every((v) => !v) || isSaving
                ? "opacity-50 cursor-not-allowed"
                : ""
              }`}
            onClick={handleSaveAllSelectedSlots}
            disabled={Object.values(selectedSlots).every((v) => !v) || isSaving}
          >
            {isSaving ? "Đang tạo..." : "Tạo lịch"}
          </button>
          <button
            className={`px-4 py-2 rounded-lg bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition-all duration-200 text-sm ${Object.values(selectedSlots).every((v) => !v) || isSaving
                ? "opacity-50 cursor-not-allowed"
                : ""
              }`}
            onClick={handleDeleteAllSelectedSlots}
            disabled={Object.values(selectedSlots).every((v) => !v) || isSaving}
          >
            {isSaving ? "Đang xóa..." : "Xóa"}
          </button>
        </div>

        <div className="bg-blue-50 p-2 rounded-lg mb-4 text-sm text-blue-700">
          <p>
            <span className="font-semibold">Hướng dẫn:</span> Nhấp vào ô trống
            để tạo ca làm việc mới, nhấp vào ca đã tạo để chỉnh sửa. Ca màu đỏ
            đã được đặt và không thể xóa.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 py-8 bg-red-50 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>{error}</p>
          </div>
        ) : (
          <div
            className="overflow-x-auto"
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div className="grid grid-cols-8 gap-1">
              <div></div>
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center font-bold text-gray-600 py-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-base">{day}</span>
                    <button
                      onClick={() => toggleFullDay(day)}
                      className={`px-2 py-1 text-xs rounded-full transition-all duration-200 border ${timeSlots.every(
                        (slot) => selectedSlots[`${day}-${slot}`]
                      )
                          ? "bg-green-100 text-green-700 border-green-300"
                          : "bg-white text-gray-500 border-gray-200 hover:bg-green-50"
                        }`}
                    >
                      {timeSlots.every(
                        (slot) => selectedSlots[`${day}-${slot}`]
                      )
                        ? "Đã chọn"
                        : "Chọn cả ngày"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {timeSlots.map((slot) => (
              <div key={slot} className="grid grid-cols-8 gap-1 mt-1">
                <div className="text-right pr-2 font-semibold text-gray-400 py-1 text-xs bg-white flex items-center justify-end">
                  {slot}
                </div>
                {weekDays.map((day) => {
                  const slotObj = slotTimesOfWeek.find((st) => {
                    let dayOfWeek, hour;
                    try {
                      dayOfWeek = format(parseISO(st.start_time), "EEE");
                      hour = format(parseISO(st.start_time), "HH:00");
                    } catch {
                      const d = new Date(st.start_time);
                      dayOfWeek = format(d, "EEE");
                      hour = format(d, "HH:00");
                    }
                    return dayOfWeek === day && hour === slot;
                  });
                  const isBooked = slotObj?.status === "booked";
                  const key = `${day}-${slot}`;
                  const isSelected = selectedSlots[key];
                  return (
                    <div
                      key={day + slot}
                      className={`h-10 w-full flex items-center justify-center rounded-lg transition-all duration-200 text-xs border ${isBooked
                          ? "bg-red-100 text-red-700 cursor-pointer border-red-100"
                          : isSelected
                            ? "bg-green-200 text-green-800 border-green-400"
                            : slotObj
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-100"
                              : "bg-white hover:bg-blue-50 border-gray-100"
                        }`}
                      onMouseDown={() => {
                        if (isBooked) {
                          handleBookedSlotClick(slotObj._id);
                        } else {
                          handleMouseDown(day, slot);
                        }
                      }}
                      onMouseEnter={() =>
                        !isBooked && handleMouseEnter(day, slot)
                      }
                    >
                      {isBooked ? (
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Đã đặt
                        </span>
                      ) : isSelected ? (
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3 text-green-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Đã chọn
                        </span>
                      ) : slotObj ? (
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Đã tạo
                        </span>
                      ) : (
                        <span className="text-gray-400">Trống</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Modal chỉnh sửa slot */}
        {selectedSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-4 w-full max-w-xs shadow-xl relative transform transition-all duration-300 ease-in-out">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-blue-600 text-2xl transition-colors duration-200"
                onClick={() => setSelectedSlot(null)}
              >
                &times;
              </button>
              <h5 className="text-base font-bold mb-2">
                {selectedSlot.slot ? "Chỉnh sửa" : "Tạo"} ca làm việc
              </h5>
              <div className="mb-2 text-gray-500 text-xs">
                {selectedSlot.day} - {selectedSlot.time}
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium mb-1">
                  Trạng thái
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-xs"
                >
                  <option value="available">Có thể đặt</option>
                  <option value="booked">Đã đặt</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                {selectedSlot.slot && (
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-200 text-xs"
                  >
                    Xóa
                  </button>
                )}
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-xs"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal hiển thị chi tiết appointment */}
        {showAppointmentModal && appointmentDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-blue-600 text-2xl"
                onClick={() => setShowAppointmentModal(false)}
              >
                &times;
              </button>
              <h3 className="text-lg font-bold mb-4 text-blue-700">
                Chi tiết cuộc hẹn
              </h3>
              <div className="mb-2">
                <b>Khách hàng:</b>{" "}
                {appointmentDetail?.user_id?.fullName ||
                  appointmentDetail?.user_id?.username ||
                  appointmentDetail?.user_id?.email ||
                  "Ẩn danh"}
              </div>
              <div className="mb-2">
                <b>Dịch vụ:</b>{" "}
                {appointmentDetail?.service_id?.name ||
                  appointmentDetail?.service_id?.title ||
                  "--"}
              </div>

              <div className="mb-2">
                <b>Thời gian:</b>{" "}
                {appointmentDetail?.slotTime_id?.start_time &&
                  appointmentDetail?.slotTime_id?.end_time
                  ? `${new Date(
                    appointmentDetail.slotTime_id.start_time
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} - ${new Date(
                    appointmentDetail.slotTime_id.end_time
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} ${new Date(
                    appointmentDetail.slotTime_id.start_time
                  ).toLocaleDateString()}`
                  : "--"}
              </div>
              <div className="mb-2">
                <b>Trạng thái:</b> {appointmentDetail?.status || "--"}
              </div>

              <div className="mb-2">
                <b>Lí do khách ghi: </b> {appointmentDetail?.reason || "--"}
              </div>
              <div className="mb-2">
                <b>Được đặt vào ngày :</b>{" "}
                {appointmentDetail?.dateBooking
                  ? new Date(appointmentDetail.dateBooking).toLocaleDateString()
                  : "--"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultantScheduleModal;
