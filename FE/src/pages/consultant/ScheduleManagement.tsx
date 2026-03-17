import React, { useState, useEffect } from "react";
import { Clock, ChevronLeft, ChevronRight, MoreHorizontal, Plus, X, Edit, Trash2, FileText, Eye } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link, useNavigate } from 'react-router-dom';
import { createSlotTimeApi, getAllSlotTimeApi, deleteSlotTimeApi, getConsultantByAccountIdApi, getAppointmentByConsultantIdApi, getSlotTimeByConsultantIdApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

// Dữ liệu mẫu cho bệnh nhân
const patientData = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    appointmentType: "Khám định kỳ",
    time: "09:00 - 09:30",
    status: "đang tiến hành",
    room: "Phòng 101"
  },
  {
    id: 2,
    name: "Trần Thị B",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    appointmentType: "Khám trực tuyến",
    time: "10:00 - 10:30",
    status: "chờ khám",
    room: "Trực tuyến"
  },
  {
    id: 3,
    name: "Lê Văn C",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    appointmentType: "Khám khẩn cấp",
    time: "11:00 - 11:30",
    status: "hoàn thành",
    room: "Phòng 102"
  },
  {
    id: 4,
    name: "Phạm Thị D",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    appointmentType: "Theo dõi sức khỏe",
    time: "13:00 - 13:30",
    status: "chờ khám",
    room: "Phòng 103"
  },
  {
    id: 5,
    name: "Hoàng Văn E",
    avatar: "https://randomuser.me/api/portraits/men/67.jpg",
    appointmentType: "Chẩn đoán xét nghiệm",
    time: "14:00 - 14:30",
    status: "chờ khám",
    room: "Phòng xét nghiệm"
  },
  {
    id: 6,
    name: "Ngô Thị F",
    avatar: "https://randomuser.me/api/portraits/women/70.jpg",
    appointmentType: "Khám trực tuyến",
    time: "15:00 - 15:30",
    status: "chờ khám",
    room: "Trực tuyến"
  }
];

// Tạo dữ liệu cho các ngày trong tuần
const daysOfWeek = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
const currentDate = new Date();

// Tạo dữ liệu cho 4 tuần (2 tuần hiện tại và 2 tuần kế tiếp)
const generateWeekData = (startOffset = 0) => {
  const result = [];
  const startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate() + startOffset * 7);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() - startDate.getDay() + i + 1);
    
    // Phân bố ngẫu nhiên các cuộc hẹn cho mỗi ngày
    const appointments = patientData
      .filter(() => Math.random() > 0.5) // Chọn ngẫu nhiên các bệnh nhân
      .map(patient => ({
        ...patient,
        id: `${patient.id}-${date.getDate()}`
      }));
    
    result.push({
      dayName: daysOfWeek[i],
      date: date,
      dateString: `${date.getDate()}/${date.getMonth() + 1}`,
      appointments
    });
  }
  
  return result;
};

const weekData = [
  { weekName: "Tuần này", days: generateWeekData(0) },
  { weekName: "Tuần sau", days: generateWeekData(1) },
  { weekName: "Tuần sau nữa", days: generateWeekData(2) },
  { weekName: "Tuần thứ 4", days: generateWeekData(3) }
];

// Tạo dữ liệu cho 2 tuần kế tiếp (dùng cho modal đăng ký ca làm)
const generateFutureWeekData = (startOffset = 2) => {
  const result = [];
  const startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate() + startOffset * 7);
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() - startDate.getDay() + i + 1);
    result.push({
      dayName: daysOfWeek[i],
      date: date,
      dateString: `${date.getDate()}/${date.getMonth() + 1}`
    });
  }
  return result;
};

const modalWeekData = [
  { weekName: "Tuần kế tiếp", days: generateFutureWeekData(2) },
  { weekName: "Tuần sau nữa", days: generateFutureWeekData(3) }
];

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"
];

const shiftOptions = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Ca sáng', value: 'morning' },
  { label: 'Ca chiều', value: 'afternoon' }
];

// Định nghĩa interface cho slot time
interface SlotTime {
  _id: string;
  consultant_id: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface SlotTimeRef {
  start_time?: string;
}

interface Consultant {
  _id: string;
  accountId: string;
  // thêm các trường khác nếu cần
}

interface Appointment {
  _id: string;
  slotTime_id?: SlotTimeRef;
  start_time?: string;
  user_id?: {
    fullName?: string;
    name?: string;
    username?: string;
    displayName?: string;
    photoUrl?: string;
  };
  service_id?: { name?: string };
  status?: string;
  dateBooking?: string;
}

// Hàm lấy ngày đầu tuần (thứ 2)
function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
}

// Helper lấy start time từ appointment
const getAppointmentStartTime = (app: Appointment) => {
  if (app.dateBooking) return new Date(app.dateBooking);
  if (app.slotTime_id && app.slotTime_id.start_time) return new Date(app.slotTime_id.start_time);
  if (app.start_time) return new Date(app.start_time);
  return null;
};

// Component chính
export default function ScheduleManagement() {
  const [weekIndex, setWeekIndex] = useState(0);
  const [shift, setShift] = useState<'all' | 'morning' | 'afternoon'>('all');
  const statusOptions = ['Tất cả', 'đang tiến hành', 'chờ khám', 'hoàn thành', 'Chưa có người đặt'];
  const [selectedStatus, setSelectedStatus] = useState('Tất cả');
  // State cho modal đăng ký ca làm
  const [moDangKy, setMoDangKy] = useState(false);
  const [modalWeekIndex, setModalWeekIndex] = useState(0);
  const [selectedSlots, setSelectedSlots] = useState<{[key: string]: boolean}>({});
  const { user } = useAuth();
  const navigate = useNavigate();
  const [consultant, setConsultant] = useState<Consultant | null>(null);
  // Thêm state cho popup sửa/xóa slot trong modal đăng ký ca làm
  const [selectedSlotEdit, setSelectedSlotEdit] = useState<{dayIdx: number, slotIdx: number} | null>(null);
  const [allSlotTimes, setAllSlotTimes] = useState<SlotTime[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  // Thêm state cho chọn nhiều ô bằng kéo chuột
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectMode, setSelectMode] = useState<'select' | 'deselect' | null>(null);
  // Thêm state cho kéo xóa nhiều slot đã chọn
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState<{ dayIdx: number, slotIdx: number, slotTimeId: string }[]>([]);
  // Sửa lại logic chọn slot: tick 1 ô khi click, tick nhiều ô khi kéo, tick cả ô đầu tiên khi kéo
  const [mouseDownSlot, setMouseDownSlot] = useState<{dayIdx: number, slotIdx: number} | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slotTimes, setSlotTimes] = useState<SlotTime[]>([]);

  useEffect(() => {
    if (user?._id) {
      const fetchConsultantData = async () => {
        try {
          const consultantData = await getConsultantByAccountIdApi(user._id);
          setConsultant(consultantData);
        } catch (error) {
          console.error("Failed to fetch consultant data", error);
          toast.error("Không thể tải dữ liệu tư vấn viên.");
        }
      };
      fetchConsultantData();
    }
  }, [user]);

  useEffect(() => {
    if (consultant?._id) {
      getAppointmentByConsultantIdApi(consultant._id)
        .then(data => {
          console.log('[APPOINTMENTS API]', data);
          setAppointments(data);
        })
        .catch(() => setAppointments([]));
      // Lấy slot time của consultant
      getSlotTimeByConsultantIdApi(consultant._id)
        .then(data => {
          console.log('[SLOT TIMES API]', data);
          setSlotTimes(Array.isArray(data) ? data : []);
        })
        .catch(() => setSlotTimes([]));
    }
  }, [consultant?._id]);

  const handleSlotMouseDown = (dayIdx: number, slotIdx: number) => {
    const key = `${modalWeekIndex}-${dayIdx}-${slotIdx}`;
    const isSelected = !!selectedSlots[key];
    setIsSelecting(true);
    setSelectMode(isSelected ? 'deselect' : 'select');
    setMouseDownSlot({ dayIdx, slotIdx });
    // Tick luôn ô đầu tiên khi bắt đầu kéo
    setSelectedSlots(prev => {
      if (isSelected) {
        const n = { ...prev };
        delete n[key];
        return n;
      } else {
        return { ...prev, [key]: true };
      }
    });
  };

  const handleSlotMouseUp = (dayIdx: number, slotIdx: number) => {
    // Nếu chỉ click 1 ô (không kéo), mouseDownSlot trùng mouseUp
    if (mouseDownSlot && mouseDownSlot.dayIdx === dayIdx && mouseDownSlot.slotIdx === slotIdx) {
      const key = `${modalWeekIndex}-${dayIdx}-${slotIdx}`;
      setSelectedSlots(prev => {
        if (prev[key]) {
          const n = { ...prev };
          delete n[key];
          return n;
        } else {
          return { ...prev, [key]: true };
        }
      });
    }
    setIsSelecting(false);
    setSelectMode(null);
    setMouseDownSlot(null);
  };

  const handleSlotMouseEnter = (dayIdx: number, slotIdx: number) => {
    if (!isSelecting || !selectMode) return;
    const key = `${modalWeekIndex}-${dayIdx}-${slotIdx}`;
    setSelectedSlots(prev => {
      if (selectMode === 'select' && !prev[key]) {
        return { ...prev, [key]: true };
      }
      if (selectMode === 'deselect' && prev[key]) {
        const n = { ...prev };
        delete n[key];
        return n;
      }
      return prev;
    });
  };

  // Hàm xử lý khi bắt đầu kéo xóa slot đã chọn
  const handleDeleteMouseDown = (dayIdx: number, slotIdx: number, slotTimeId: string) => {
    setIsDeleting(true);
    setDeleteTargets([{ dayIdx, slotIdx, slotTimeId }]);
  };

  // Hàm xử lý khi rê chuột qua các ô đã chọn để xóa
  const handleDeleteMouseEnter = (dayIdx: number, slotIdx: number, slotTimeId: string) => {
    if (!isDeleting) return;
    setDeleteTargets(prev => {
      // Tránh trùng lặp
      if (prev.some(t => t.dayIdx === dayIdx && t.slotIdx === slotIdx)) return prev;
      return [...prev, { dayIdx, slotIdx, slotTimeId }];
    });
  };

  // Sửa lại: Đặt handleDeleteMouseUp thành function declaration để không bị unused khi chỉ dùng trong useEffect
  function handleDeleteMouseUp() {
    if (isDeleting && deleteTargets.length > 0) {
      (async () => {
        await fetchAllSlotTimes();
        const weekStart = getStartOfWeek(modalWeekData[modalWeekIndex].days[0].date);
        weekStart.setUTCHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
        weekEnd.setUTCHours(23, 59, 59, 999);
        const weekSlots = allSlotTimes.filter(st => {
          if (!consultant?._id) return false;
          const stDate = new Date(st.start_time);
          return (
            st.consultant_id === consultant._id &&
            stDate.getTime() >= weekStart.getTime() &&
            stDate.getTime() <= weekEnd.getTime()
          );
        });
        const slotIdsToDelete = deleteTargets.map(t => t.slotTimeId);
        const remain = weekSlots.filter(st => !slotIdsToDelete.includes(st._id));
        let countSelected = 0;
        for (let dayIdx = 0; dayIdx < modalWeekData[modalWeekIndex].days.length; dayIdx++) {
          for (let slotIdx = 0; slotIdx < timeSlots.length; slotIdx++) {
            const key = `${modalWeekIndex}-${dayIdx}-${slotIdx}`;
            if (selectedSlots[key]) {
              const dayObj = modalWeekData[modalWeekIndex].days[dayIdx];
              const slotHour = parseInt(timeSlots[slotIdx]);
              const exists = weekSlots.some(st => {
                const stDate = new Date(st.start_time);
                return (
                  stDate.getFullYear() === dayObj.date.getFullYear() &&
                  stDate.getMonth() === dayObj.date.getMonth() &&
                  stDate.getDate() === dayObj.date.getDate() &&
                  stDate.getHours() === slotHour
                );
              });
              if (!exists) countSelected++;
            }
          }
        }
        if (remain.length + countSelected < 20) {
          toast.error('Bạn phải có ít nhất 20 ca làm trong 1 tuần, không thể xóa thêm!');
          setIsDeleting(false);
          setDeleteTargets([]);
          return;
        }
        for (const t of deleteTargets) {
          try {
            await deleteSlotTimeApi(t.slotTimeId);
            setSelectedSlots(prev => {
              const n = { ...prev };
              const key = `${modalWeekIndex}-${t.dayIdx}-${t.slotIdx}`;
              delete n[key];
              return n;
            });
            toast.success('Đã xóa ca làm!');
          } catch {
            toast.error('Xóa ca làm thất bại!');
          }
        }
        fetchAllSlotTimes();
        setIsDeleting(false);
        setDeleteTargets([]);
      })();
    } else {
      setIsDeleting(false);
      setDeleteTargets([]);
    }
  }

  const handleDangKy = async () => {
    if (!user?._id || !consultant?._id) {
      toast.error('Không tìm thấy thông tin tư vấn viên!');
      return;
    }
    setLoadingSlots(true); // Bắt đầu loading nội dung bảng slot
    try {
      // Luôn fetch lại slot times và đợi cập nhật xong
      const data = await getAllSlotTimeApi();
      setAllSlotTimes(Array.isArray(data) ? data : []);
      // Lấy ngày đầu tuần của tuần đang đăng ký
      const weekStart = getStartOfWeek(modalWeekData[modalWeekIndex].days[0].date);
      weekStart.setUTCHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
      weekEnd.setUTCHours(23, 59, 59, 999);
      // Lấy tất cả slot đã đăng ký trong tuần này
      const weekSlots = (Array.isArray(data) ? data : []).filter(st => {
        const stDate = new Date(st.start_time);
        return (
          st.consultant_id === consultant._id &&
          stDate.getTime() >= weekStart.getTime() &&
          stDate.getTime() <= weekEnd.getTime()
        );
      });
      // Lấy các slot đang tick mà chưa tồn tại
      const slotsToRegister: { start_time: string, end_time: string }[] = [];
      for (let dayIdx = 0; dayIdx < modalWeekData[modalWeekIndex].days.length; dayIdx++) {
        for (let slotIdx = 0; slotIdx < timeSlots.length; slotIdx++) {
          const key = `${modalWeekIndex}-${dayIdx}-${slotIdx}`;
          if (selectedSlots[key]) {
            const dayObj = modalWeekData[modalWeekIndex].days[dayIdx];
            const slotHour = parseInt(timeSlots[slotIdx]);
            const exists = (Array.isArray(data) ? data : []).some(st => {
              const stDate = new Date(st.start_time);
              return (
                st.consultant_id === consultant._id &&
                stDate.getFullYear() === dayObj.date.getFullYear() &&
                stDate.getMonth() === dayObj.date.getMonth() &&
                stDate.getDate() === dayObj.date.getDate() &&
                stDate.getHours() === slotHour
              );
            });
            if (!exists) {
              const start = new Date(dayObj.date);
              start.setHours(slotHour, 0, 0, 0);
              const end = new Date(dayObj.date);
              end.setHours(slotHour + 1, 0, 0, 0);
              slotsToRegister.push({
                start_time: start.toISOString(),
                end_time: end.toISOString()
              });
            }
          }
        }
      }
      // Nếu đã đủ 20 slot thì luôn cho đăng ký thêm slot mới
      if (weekSlots.length < 20 && (weekSlots.length + slotsToRegister.length) < 20) {
        toast.error('Bạn phải đăng ký ít nhất 20 ca làm trong 1 tuần!');
        return;
      }
      if (slotsToRegister.length === 0) {
        toast.error('Bạn chưa chọn ca nào mới để đăng ký!');
        return;
      }
      await createSlotTimeApi({
        consultant_id: consultant._id,
        slots: slotsToRegister
      });
      toast.success(`Đăng ký thành công ${slotsToRegister.length} ca làm!`);
      setMoDangKy(false); // Đóng modal sau khi thành công
      setSelectedSlots({});
      fetchAllSlotTimes();
    } catch (err: unknown) {
      let message = 'Có lỗi khi đăng ký ca làm!';
      const e = err as { response?: { data?: { message?: string } } };
      if (e.response && e.response.data && typeof e.response.data.message === 'string') {
        message = e.response.data.message;
      }
      toast.error(message);
    } finally {
      setLoadingSlots(false); // Kết thúc loading
    }
  };

  // Fetch all slot times khi mở modal đăng ký ca làm
  const fetchAllSlotTimes = async (): Promise<void> => {
    setLoadingSlots(true);
    try {
      const data = await getAllSlotTimeApi();
      setAllSlotTimes(Array.isArray(data) ? data : []);
    } catch {
      setAllSlotTimes([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Khi mở modal đăng ký ca làm, fetch slot times
  React.useEffect(() => {
    if (moDangKy) fetchAllSlotTimes();
    // eslint-disable-next-line
  }, [moDangKy]);

  // Kiểm tra slot đã đăng ký chưa
  const isSlotRegistered = (dayObj: { date: Date }, slot: string): SlotTime | undefined => {
    if (!user?._id || !consultant?._id) return undefined;
    // Tìm slot time cùng ngày, giờ, consultant
    return allSlotTimes.find(st => {
      const stDate = new Date(st.start_time);
      return (
        st.consultant_id === consultant._id &&
        stDate.getFullYear() === dayObj.date.getFullYear() &&
        stDate.getMonth() === dayObj.date.getMonth() &&
        stDate.getDate() === dayObj.date.getDate() &&
        stDate.getHours() === parseInt(slot)
      );
    });
  };

  // Xử lý click vào slot đã đăng ký để xóa
  const handleDeleteSlotTime = async (slotTimeId: string, dayObj: {date: Date}) => {
    // Lấy lại slot time mới nhất trước khi kiểm tra
    await fetchAllSlotTimes();
    // Lấy ngày đầu tuần của slot này
    const weekStart = getStartOfWeek(dayObj.date);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);
    // Đếm số slot đã đăng ký trong tuần này (trừ slot chuẩn bị xóa)
    const weekSlots = allSlotTimes.filter(st => {
      if (!user?._id || !consultant?._id) return false;
      const stDate = new Date(st.start_time);
      return (
        st.consultant_id === consultant._id &&
        stDate.getTime() >= weekStart.getTime() &&
        stDate.getTime() <= weekEnd.getTime() &&
        st._id !== slotTimeId
      );
    });
    if (weekSlots.length < 20) {
      toast.error('Bạn phải có ít nhất 20 ca làm trong 1 tuần, không thể xóa thêm!');
      return;
    }
    try {
      await deleteSlotTimeApi(slotTimeId);
      toast.success('Đã xóa ca làm!');
      fetchAllSlotTimes();
    } catch (err: unknown) {
      let message = 'Xóa ca làm thất bại!';
      const e = err as { response?: { data?: { message?: string } } };
      if (e.response && e.response.data && typeof e.response.data.message === 'string') {
        message = e.response.data.message;
      }
      toast.error(message);
    }
  };

  // Thêm event listener để xử lý mouseup ngoài bảng cho kéo xóa
  React.useEffect(() => {
    if (!isDeleting) return;
    window.addEventListener('mouseup', handleDeleteMouseUp);
    return () => window.removeEventListener('mouseup', handleDeleteMouseUp);
  }, [isDeleting, deleteTargets]);

  const isSlotHasAppointment = (dayObj: { date: Date }, slot: string) => {
    return appointments.some(app => {
      const date = getAppointmentStartTime(app);
      if (!date) return false;
      return (
        date.getFullYear() === dayObj.date.getFullYear() &&
        date.getMonth() === dayObj.date.getMonth() &&
        date.getDate() === dayObj.date.getDate() &&
        date.getHours() === parseInt(slot)
      );
    });
  };

  // Hàm xử lý click vào appointment để chuyển đến report
  const handleAppointmentClick = (appointmentId: string) => {
    navigate(`/consultants/reports/${appointmentId}`);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] px-0 md:px-8 py-0 md:py-8">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
      {/* Modal đăng ký ca làm */}
      {moDangKy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 relative">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" onClick={() => setMoDangKy(false)}>
              <X size={22} />
            </button>
            <h2 className="text-2xl font-bold text-[#283593] mb-2">Đăng ký ca làm</h2>
            <p className="text-gray-500 mb-4">Chọn các khung giờ bạn muốn đăng ký trong 2 tuần kế tiếp</p>
            {/* Chọn tuần và ca */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setModalWeekIndex(modalWeekIndex === 0 ? 1 : 0)} className="p-1 hover:bg-gray-100 rounded">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => setModalWeekIndex(modalWeekIndex === 1 ? 0 : 1)} className="p-1 hover:bg-gray-100 rounded">
                  <ChevronRight size={20} />
                </button>
              </div>
              {/* Thêm hướng dẫn kéo chọn/xóa slot */}
              <span className="text-sm text-[#f02e2e] font-medium ml-2">Kéo giữ để thêm hoặc xóa nhiều slot</span>
            </div>
            {/* Lịch đăng ký ca làm */}
            <div className="overflow-x-auto relative min-h-[400px]">
              {loadingSlots ? (
                <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-2 text-blue-500 font-semibold">Đang tải dữ liệu...</p>
                  </div>
                </div>
              ) : null}
              <table className="min-w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-xs font-semibold text-gray-500 py-2 px-2 bg-gray-50 rounded-tl-xl text-center align-middle">Giờ</th>
                    {modalWeekData[modalWeekIndex].days.map((day, idx) => (
                      <th key={idx} className="text-xs font-semibold text-[#283593] py-2 px-2 bg-gray-50 text-center align-middle">{day.dayName}<br/><span className="text-gray-400">{day.dateString}</span></th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot, slotIdx) => (
                    <tr key={slotIdx}>
                      <td className="text-sm text-gray-500 font-medium py-2 px-2 bg-gray-50 border-b border-gray-100 text-center align-middle whitespace-nowrap">{slot}</td>
                      {modalWeekData[modalWeekIndex].days.map((day, dayIdx) => {
                        const key = `${modalWeekIndex}-${dayIdx}-${slotIdx}`;
                        const slotTimeObj = isSlotRegistered(day, slot);
                        const isSelected = selectedSlots[key];
                        return (
                          <td key={dayIdx} className="py-2 px-2 text-center border-b border-gray-100 align-middle">
                            <div className="flex items-center justify-center">
                              {slotTimeObj ? (
                                <button
                                  className="w-8 h-8 rounded-md border-2 flex items-center justify-center bg-green-100 border-green-400 text-green-700 font-bold cursor-pointer hover:bg-green-200 transition-all duration-150 relative"
                                  title="Đã đăng ký. Nhấn để xóa hoặc kéo để xóa nhiều."
                                  onClick={() => { if (!isDeleting) handleDeleteSlotTime(slotTimeObj._id, day); }}
                                  onMouseDown={e => { e.preventDefault(); handleDeleteMouseDown(dayIdx, slotIdx, slotTimeObj._id); }}
                                  onMouseEnter={() => handleDeleteMouseEnter(dayIdx, slotIdx, slotTimeObj._id)}
                                >
                                  ✓
                                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-green-600 whitespace-nowrap">Đã đăng ký</span>
                                </button>
                              ) : (
                                <button
                                  className={`w-8 h-8 rounded-md border-2 flex items-center justify-center transition-all duration-150
                                    ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-300 text-gray-300 hover:border-blue-400'}
                                  `}
                                  onClick={e => {
                                    e.preventDefault();
                                    const key = `${modalWeekIndex}-${dayIdx}-${slotIdx}`;
                                    setSelectedSlots(prev => {
                                      if (prev[key]) {
                                        const n = { ...prev };
                                        delete n[key];
                                        return n;
                                      } else {
                                        return { ...prev, [key]: true };
                                      }
                                    });
                                  }}
                                  onMouseDown={e => { e.preventDefault(); handleSlotMouseDown(dayIdx, slotIdx); }}
                                  onMouseEnter={() => handleSlotMouseEnter(dayIdx, slotIdx)}
                                  onMouseUp={() => handleSlotMouseUp(dayIdx, slotIdx)}
                                  aria-label="Chọn khung giờ"
                                  style={{ minWidth: '2rem', minHeight: '2rem', userSelect: 'none' }}
                                >
                                  {isSelected ? <span className="font-bold">✓</span> : ''}
                                </button>
                              )}
                              {isSlotHasAppointment(day, slot) && (
                                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500" title="Có appointment"></div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          
            {/* Nút xác nhận */}
            <div className="flex justify-end gap-2 mt-6">
              <button className="px-5 py-2 rounded-lg bg-gray-100 text-gray-600 font-medium hover:bg-gray-200" onClick={() => setMoDangKy(false)}>Huỷ</button>
              <button className="px-5 py-2 rounded-lg bg-blue-500 text-white font-semibold shadow hover:bg-blue-700 transition-all duration-200" onClick={handleDangKy}>Đăng ký</button>
            </div>
            {/* Popup sửa/xóa slot đã chọn */}
            {selectedSlotEdit && (
              <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-10">
                <div className="bg-white rounded-xl shadow-lg p-6 min-w-[260px] flex flex-col gap-4 items-center relative">
                  <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setSelectedSlotEdit(null)}><X size={20} /></button>
                  <div className="flex items-center gap-2 mb-2">
                    <Edit size={20} className="text-blue-500" />
                    <span className="font-semibold text-[#283593]">Sửa/Xóa ca làm</span>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button className="px-4 py-2 rounded-lg bg-yellow-100 text-yellow-700 font-medium flex items-center gap-1 hover:bg-yellow-200" onClick={() => { setSelectedSlotEdit(null); toast.success('Đã sửa ca làm!'); }}><Edit size={16}/> Sửa</button>
                    <button className="px-4 py-2 rounded-lg bg-red-100 text-red-700 font-medium flex items-center gap-1 hover:bg-red-200" onClick={() => { const key = `${modalWeekIndex}-${selectedSlotEdit.dayIdx}-${selectedSlotEdit.slotIdx}`; setSelectedSlots(prev => { const n = { ...prev }; delete n[key]; return n; }); setSelectedSlotEdit(null); toast.success('Đã xóa ca làm!'); }}><Trash2 size={16}/> Xóa</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 md:px-0">
        <div className="flex items-center justify-between pt-8 pb-2">
          <div>
            <h1 className="text-3xl font-bold text-[#283593] mb-1">Lịch khám bệnh nhân</h1>
            <p className="text-base text-gray-500">Xem và quản lý lịch hẹn khám bệnh</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-blue-400 text-white px-5 py-2 rounded-xl font-medium flex items-center gap-2 shadow hover:bg-blue-700 transition-all duration-200" onClick={() => setMoDangKy(true)}>
              <Plus size={18} /> Thêm ca làm
            </button>
          </div>
        </div>
        {/* Filter Section */}
        <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-4 mb-6">
          <select className="px-4 py-2 rounded-lg border border-gray-200 text-[#283593] bg-white" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
            {statusOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <div className="flex-1"></div>
          <div className="flex gap-1">
            {shiftOptions.map(opt => (
              <button
                key={opt.value}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-150
                  ${shift === opt.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-[#283593]'}
                  focus:outline-none`}
                onClick={() => setShift(opt.value as 'all' | 'morning' | 'afternoon')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {/* Schedule Grid */}
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
          <div className="flex items-center px-6 pt-6 pb-2 justify-between">
            <div>
              <span className="font-semibold text-[#283593]">{weekData[weekIndex].weekName}</span>
              <span className="ml-2 text-gray-400 text-sm">({weekData[weekIndex].days[0].dateString} - {weekData[weekIndex].days[6].dateString})</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setWeekIndex(weekIndex === 0 ? 3 : weekIndex - 1)} 
                className="p-1 hover:bg-gray-100 rounded"
                disabled={weekIndex === 0}
              >
                <ChevronLeft size={22} className={`${weekIndex === 0 ? 'text-gray-300' : 'text-[#283593]'}`} />
              </button>
              <span className="text-sm text-gray-500 px-2">
                {weekIndex + 1}/4
              </span>
              <button 
                onClick={() => setWeekIndex(weekIndex === 3 ? 0 : weekIndex + 1)} 
                className="p-1 hover:bg-gray-100 rounded"
                disabled={weekIndex === 3}
              >
                <ChevronRight size={22} className={`${weekIndex === 3 ? 'text-gray-300' : 'text-[#283593]'}`} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-t border-gray-100">
            {weekData[weekIndex].days.map((day, idx) => {

              // Lấy slot time của ngày này
              let filteredTimeSlots = timeSlots;
              if (shift === 'morning') filteredTimeSlots = ["08:00", "09:00", "10:00", "11:00"];
              else if (shift === 'afternoon') filteredTimeSlots = ["13:00", "14:00", "15:00", "16:00", "17:00"];
              // Lấy slot theo ca
              const daySlots = filteredTimeSlots.map(slot => {
                // Tìm slot time object đúng ngày/giờ
                const slotTimeObj = slotTimes.find(st => {
                  const stDate = new Date(st.start_time);
                  const match = (
                    stDate.getFullYear() === day.date.getFullYear() &&
                    stDate.getMonth() === day.date.getMonth() &&
                    stDate.getDate() === day.date.getDate() &&
                    stDate.getHours() === parseInt(slot)
                  );

                  return match;
                });
                // Tìm appointment cho slot này
                const appointment = appointments.find(app => {
                  const appDate = getAppointmentStartTime(app);
                  if (!appDate) return false;
                  return (
                    appDate.getFullYear() === day.date.getFullYear() &&
                    appDate.getMonth() === day.date.getMonth() &&
                    appDate.getDate() === day.date.getDate() &&
                    appDate.getHours() === parseInt(slot)
                  );
                });
                return { slot, slotTimeObj, appointment };
              });
              // Lọc theo trạng thái
              let filteredSlots = daySlots;
              if (selectedStatus === 'Chưa có người đặt') {
                filteredSlots = daySlots.filter(s => s.slotTimeObj && !s.appointment);
              } else if (selectedStatus !== 'Tất cả') {
                filteredSlots = daySlots.filter(s => s.appointment && s.appointment.status === selectedStatus);
              }
              // Nếu không có lịch nào thì hiện dòng "không có lịch"
              return (
                <div key={idx} className="min-h-[120px] border-r border-gray-100 last:border-r-0 px-2 py-2">
                  <div className="text-center mb-2">
                    <div className="font-medium text-[#283593]">{day.dayName}</div>
                    <div className="text-xs text-gray-400">{day.dateString}</div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {filteredSlots.length === 0 ? (
                      <div className="rounded-xl p-3 bg-gray-50 text-gray-400 text-center min-h-[120px] flex items-center justify-center border border-dashed border-gray-200">
                        Không có lịch
                      </div>
                    ) : (
                      filteredSlots.map(({ slot, slotTimeObj, appointment }, slotIdx) => {
                        if (appointment && appointment.status !== 'rescheduled') {
                          // Render như cũ
                          const date = getAppointmentStartTime(appointment);
                          if (!date) return null;
                          const endDate = new Date(date.getTime() + 60 * 60 * 1000);
                          const hour = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0') + ' - ' + endDate.getHours().toString().padStart(2, '0') + ':' + endDate.getMinutes().toString().padStart(2, '0');
                          const customerName = appointment.user_id?.fullName
                            || appointment.user_id?.name
                            || appointment.user_id?.username
                            || appointment.user_id?.displayName
                            || 'Không rõ tên';
                          // Kiểm tra logic hiển thị nút
                          const now = new Date();
                          const slotDateTime = new Date(date);
                          const slotEndTime = new Date(slotDateTime.getTime() + 60 * 60 * 1000); // +1 giờ
                          const isSlotPassed = now > slotEndTime;
                          const isCompleted = appointment.status === 'completed';
                          const isConfirmed = appointment.status === 'confirmed' || appointment.status === 'scheduled';
                          

                          
                          return (
                            <div 
                              key={slot + slotIdx} 
                              className={`rounded-xl p-3 shadow-sm border border-gray-100 bg-
                                ${appointment.service_id?.name === "Khám khẩn cấp" ? "red-50" :
                                  appointment.service_id?.name === "Khám trực tuyến" ? "blue-50" :
                                  appointment.status === "completed" ? "green-50" :
                                  appointment.status === "confirmed" || appointment.status === "scheduled" ? "blue-50" :
                                  appointment.status === "pending" ? "yellow-50" : "gray-50"
                                } flex flex-col gap-2 relative min-h-[120px] flex-1 group hover:shadow-lg transition-all duration-200 cursor-pointer`}
                              onClick={() => handleAppointmentClick(appointment._id)}
                              title="Click để xem/tạo báo cáo"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1 text-[#283593] text-sm font-medium">
                                  <Clock size={16} className="mr-1 text-gray-400" />
                                  <span>{hour}</span>
                                </div>
                                {/* Hiển thị nút theo logic */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  {isCompleted ? (
                                    <Link 
                                      to={`/consultants/reports/${appointment._id}`}
                                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium bg-white px-2 py-1 rounded-md shadow-sm border border-blue-200 hover:bg-blue-50 transition-all duration-150"
                                      title="Xem chi tiết báo cáo"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Eye size={10} />
                                      <span className="hidden sm:inline">Chi tiết</span>
                                    </Link>
                                  ) : (isSlotPassed && isConfirmed) ? (
                                    <Link 
                                      to={`/consultants/reports/${appointment._id}`}
                                      className="flex items-center gap-1 text-green-600 hover:text-green-800 text-xs font-medium bg-white px-2 py-1 rounded-md shadow-sm border border-green-200 hover:bg-green-50 transition-all duration-150"
                                      title="Viết báo cáo"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <FileText size={10} />
                                      <span className="hidden sm:inline">Báo cáo</span>
                                    </Link>
                                  ) : (
                                    <button 
                                      className="text-gray-400 hover:text-gray-600 opacity-50 transition-opacity duration-150"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreHorizontal size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center mb-1">
                                <img src={appointment.user_id?.photoUrl || 'https://i.pravatar.cc/150?img=3'} alt={customerName} className="w-8 h-8 rounded-full mr-2 border-2 border-white" />
                                <div className="min-w-0">
                                  <div className="font-medium text-[#283593] truncate max-w-[120px]">{customerName}</div>
                                  <div className="text-xs text-gray-500 truncate max-w-[100px]">{appointment.status}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className={`text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 truncate max-w-[180px] whitespace-nowrap overflow-hidden`}>
                                  {appointment.service_id?.name || ''}
                                </span>
                              </div>
                            </div>
                          );
                        } else if (slotTimeObj) {
                          // Slot chưa có người đặt
                          const stDate = new Date(slotTimeObj.start_time);
                          const endDate = new Date(stDate.getTime() + 60 * 60 * 1000);
                          const hour = stDate.getHours().toString().padStart(2, '0') + ':' + stDate.getMinutes().toString().padStart(2, '0') + ' - ' + endDate.getHours().toString().padStart(2, '0') + ':' + endDate.getMinutes().toString().padStart(2, '0');
                          return (
                            <div key={slot + slotIdx} className="rounded-xl p-3 shadow-sm border border-green-200 bg-green-50 text-[#283593] flex flex-col min-h-[120px] flex-1">
                              <div className="flex items-center gap-1 text-[#283593] text-sm font-medium mb-1">
                                <Clock size={16} className="mr-1 text-green-400" />
                                <span>{hour}</span>
                              </div>
                              <div className="flex-1 flex items-center justify-center">
                                <span className="text-sm font-medium text-[#283593] text-center">Chưa có người</span>
                              </div>
                            </div>
                          );
                        } else {
                          return null;
                        }
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
