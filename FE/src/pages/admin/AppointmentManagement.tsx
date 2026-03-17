import React, { useState, useEffect } from 'react';
import { getAllAppointmentsApi, updateAppointmentStatusApi, getAppointmentByIdApi, getAllConsultantsApi, getAllSlotTimeApi, getSlotTimeByConsultantIdApi } from '../../api';
import { format, parseISO, addDays, isSameDay, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ConsultantAccount {
  _id: string;
  fullName: string;
  photoUrl?: string;
}

interface Consultant {
  _id: string;
  accountId: ConsultantAccount;
}

interface AppointmentUser {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  photoUrl?: string;
  username?: string;
}

interface AppointmentService {
  _id: string;
  name: string;
  price: number;
  description: string;
}

interface SlotTime {
  _id: string;
  consultant_id: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface Appointment {
  _id: string;
  slotTime_id: SlotTime | string;
  user_id: AppointmentUser | string;
  consultant_id: Consultant | string;
  service_id: AppointmentService | string;
  dateBooking: string;
  reason: string;
  note?: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "rescheduled";
}

const statusColors = {
  available: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  confirmed: 'bg-amber-100 text-amber-800 border-amber-300',
  completed: 'bg-amber-50 text-amber-800 border-amber-200',
  cancelled: 'bg-rose-50 text-rose-800 border-rose-200'
};

const statusLabels = {
  available: 'Slot trống',
  pending: 'Đang chờ',
  confirmed: 'Đã xác nhận',
  completed: 'Đã hoàn thành', 
  cancelled: 'Đã hủy'
};

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [allSlots, setAllSlots] = useState<SlotTime[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedConsultant, setSelectedConsultant] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [hoveredAppointment, setHoveredAppointment] = useState<Appointment | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<SlotTime | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<{x: number, y: number}>({x: 0, y: 0});

  // Các khung giờ làm việc
  const timeSlots = [
    "08:00 - 09:00",
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "13:00 - 14:00",
    "14:00 - 15:00",
    "15:00 - 16:00",
    "16:00 - 17:00",
  ];

  const [statusLabels] = useState({
    pending: 'Chờ thanh toán',
    confirmed: 'Đã thanh toán',
    completed: 'Đã hoàn thành',
    cancelled: 'Đã hủy',
    available: 'Slot trống'
  });

  useEffect(() => {
    fetchConsultants();
    fetchAppointments();
    fetchAllSlots();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      console.log('Đang gọi API lấy danh sách cuộc hẹn...');
      const data = await getAllAppointmentsApi();
      console.log('Kết quả API appointments:', data);
      
      if (Array.isArray(data) && data.length > 0) {
        // Xử lý dữ liệu đảm bảo trạng thái hợp lệ
        const processedData = data.map(appointment => {
          if (!appointment.status) {
            appointment.status = 'pending';
          }
          return appointment;
        });
        
        setAppointments(processedData);
      } else {
        console.warn('API trả về dữ liệu rỗng hoặc không phải mảng');
        // Sử dụng dữ liệu mẫu nếu API không trả về dữ liệu
        const sampleData = createSampleData();
        setAppointments(sampleData);
      }
    } catch (error) {
      console.error('Lỗi khi gọi API appointments:', error);
      // Sử dụng dữ liệu mẫu nếu API lỗi
      const sampleData = createSampleData();
      setAppointments(sampleData);
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultants = async () => {
    try {
      const data = await getAllConsultantsApi();
      setConsultants(data);
    } catch (error) {
      console.error('Error fetching consultants:', error);
    }
  };

  const fetchAllSlots = async () => {
    try {
      console.log('Đang gọi API lấy danh sách slot time...');
      const data = await getAllSlotTimeApi();
      console.log('Kết quả API slot times:', data);
      
      if (Array.isArray(data) && data.length > 0) {
        setAllSlots(data);
        console.log('Đã cập nhật state allSlots với', data.length, 'slot');
      } else {
        console.warn('API slot time trả về dữ liệu rỗng hoặc không phải mảng');
        // Có thể tạo dữ liệu mẫu nếu cần
      }
    } catch (error) {
      console.error('Lỗi khi gọi API slot times:', error);
    }
  };

  const fetchSlotsByConsultant = async (consultantId: string) => {
    if (consultantId === 'all') {
      fetchAllSlots();
      return;
    }

    try {
      console.log(`Đang gọi API lấy danh sách slot time cho consultant ${consultantId}...`);
      const data = await getSlotTimeByConsultantIdApi(consultantId);
      console.log('Kết quả API slot times by consultant:', data);
      
      if (Array.isArray(data)) {
        setAllSlots(data);
        console.log('Đã cập nhật state allSlots với', data.length, 'slot của consultant');
      } else {
        console.warn('API slot time by consultant trả về dữ liệu không phải mảng');
      }
    } catch (error) {
      console.error('Lỗi khi gọi API slot times by consultant:', error);
    }
  };

  const handleConsultantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedConsultant(value);
    fetchSlotsByConsultant(value);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStatusFilter(e.target.value);
  };

  const handlePrevWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const handleCurrentWeek = () => {
    setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const handleAppointmentClick = async (appointmentId: string) => {
    try {
      const data = await getAppointmentByIdApi(appointmentId);
      setSelectedAppointment(data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching appointment details:', error);
    }
  };

  const handleMouseEnter = (appointment: Appointment, event: React.MouseEvent) => {
    setHoveredAppointment(appointment);
    setHoveredPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredAppointment(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAppointment(null);
  };

  // Generate the days of the week
  const weekDays = Array.from({ length: 7 }).map((_, index) => {
    const day = addDays(currentWeek, index);
    return {
      date: day,
      formattedDate: format(day, 'dd/MM'),
      dayName: format(day, 'EEEE', { locale: vi }),
      isToday: isSameDay(day, new Date())
    };
  });

  // Filter appointments
  const filteredAppointments = appointments.filter(appointment => {
    // Filter by consultant if selected
    const consultantFilter = selectedConsultant !== "all"
      ? (appointment.consultant_id as Consultant)._id === selectedConsultant
      : true;
    
    // Filter by status if not set to 'all'
    const statusFilterCondition = statusFilter !== 'all'
      ? appointment.status === statusFilter
      : true;
    
    // Filter by current week
    const appointmentDate = parseISO(appointment.dateBooking);
    const weekStart = currentWeek;
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
    const inCurrentWeek = appointmentDate >= weekStart && appointmentDate <= weekEnd;
    
    return consultantFilter && statusFilterCondition && inCurrentWeek;
  });

  // Group appointments by day
  const appointmentsByDay = weekDays.map(day => {
    const dayAppointments = filteredAppointments.filter(appointment => 
      isSameDay(parseISO(appointment.dateBooking), day.date)
    );
    
    return {
      ...day,
      appointments: dayAppointments
    };
  });

  // Format time from a date string
  const formatTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'HH:mm');
    } catch (error) {
      return '';
    }
  };

  // Get time range for an appointment
  const getAppointmentTimeRange = (appointment: Appointment) => {
    const slotTime = appointment.slotTime_id as SlotTime;
    if (!slotTime || !slotTime.start_time || !slotTime.end_time) return '';
    
    const startTime = formatTime(slotTime.start_time);
    const endTime = formatTime(slotTime.end_time);
    
    return `${startTime} - ${endTime}`;
  };

  // Get slots for a specific time and day
  const getSlotsForTimeSlot = (day: Date, timeSlot: string) => {
    const hourStart = parseInt(timeSlot.split(':')[0]);
    
    // Filter slots that match this time and day
    return allSlots.filter(slot => {
      if (!slot.start_time) return false;
      
      const slotDate = parseISO(slot.start_time);
      const slotHour = slotDate.getHours();
      
      return isSameDay(slotDate, day) && slotHour === hourStart;
    });
  };

  // Get appointments for a specific slot
  const getAppointmentForSlot = (slotId: string) => {
    return appointments.find(appointment => 
      typeof appointment.slotTime_id === 'object' 
        ? appointment.slotTime_id._id === slotId
        : appointment.slotTime_id === slotId
    );
  };

  // Get consultant name by ID
  const getConsultantNameById = (consultantId: string) => {
    const consultant = consultants.find(c => c._id === consultantId);
    return consultant ? consultant.accountId.fullName : 'Tư vấn viên không xác định';
  };

  const handleMouseEnterSlot = (slot: SlotTime, event: React.MouseEvent) => {
    setHoveredSlot(slot);
    setHoveredPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeaveSlot = () => {
    setHoveredSlot(null);
  };

  // Thêm hàm để tạo dữ liệu mẫu nếu cần thiết
  const createSampleData = () => {
    console.log('Creating sample appointment data for display');
    
    // Tạo danh sách tư vấn viên mẫu nếu không có thật
    if (consultants.length === 0) {
      setConsultants([
        {
          _id: 'c1',
          accountId: {
            _id: 'a1',
            fullName: 'Hong Hanh',
            photoUrl: ''
          }
        },
        {
          _id: 'c2',
          accountId: {
            _id: 'a2',
            fullName: 'Thai Anh',
            photoUrl: ''
          }
        },
        {
          _id: 'c3',
          accountId: {
            _id: 'a3',
            fullName: 'Doan Trinh',
            photoUrl: ''
          }
        }
      ]);
    }

    // Tạo user mẫu
    const sampleUsers = [
      { _id: 'u1', fullName: 'Embes_customer', email: 'embes@example.com', photoUrl: '' },
      { _id: 'u2', fullName: 'Thang Hung', email: 'thang@example.com', photoUrl: '' },
    ];

    // Tạo dịch vụ mẫu
    const sampleServices = [
      { _id: 's1', name: 'Tư vấn cho phụ huynh có con em nghiện', price: 100000, description: 'Dịch vụ tư vấn' },
      { _id: 's2', name: 'Khám trực tuyến', price: 150000, description: 'Dịch vụ khám trực tuyến' },
    ];

    // Ngày hiện tại và các ngày trong tuần hiện tại
    const today = new Date();
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    
    // Tạo các cuộc hẹn mẫu
    const sampleAppointments: Appointment[] = [];
    
    // Tạo dữ liệu cho tuần này
    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(currentWeekStart, i);
      const consultantIndex = i % 3; // Luân phiên giữa 3 tư vấn viên
      const consultant = consultants[consultantIndex] || {
        _id: `c${consultantIndex + 1}`,
        accountId: {
          _id: `a${consultantIndex + 1}`,
          fullName: ['Hong Hanh', 'Thai Anh', 'Doan Trinh'][consultantIndex],
          photoUrl: ''
        }
      };
      
      // Mỗi ngày có 1-2 cuộc hẹn
      const numAppointments = Math.floor(Math.random() * 2) + 1;
      
      for (let j = 0; j < numAppointments; j++) {
        // Random slot time
        const slotHour = 8 + j * 2; // 8:00, 10:00, ...
        const slotTime = {
          _id: `st${i}${j}`,
          consultant_id: consultant._id,
          start_time: new Date(currentDate.setHours(slotHour, 0, 0)).toISOString(),
          end_time: new Date(currentDate.setHours(slotHour + 1, 0, 0)).toISOString(),
          status: "booked"
        };
        
        // Random status
        const statuses: ("pending" | "confirmed" | "cancelled" | "completed" | "rescheduled")[] = ["pending", "confirmed", "cancelled", "completed", "rescheduled"];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Random user & service
        const userIndex = Math.floor(Math.random() * sampleUsers.length);
        const serviceIndex = Math.floor(Math.random() * sampleServices.length);
        
        sampleAppointments.push({
          _id: `app${i}${j}`,
          slotTime_id: slotTime,
          user_id: sampleUsers[userIndex],
          consultant_id: consultant,
          service_id: sampleServices[serviceIndex],
          dateBooking: currentDate.toISOString(),
          reason: "Con út bị nghiện",
          note: "Khám nhẹ nhẹ để thương thôi nha",
          status: status
        });
      }
    }
    
    console.log('Sample appointments created:', sampleAppointments.length);
    return sampleAppointments;
  };

  // Sử dụng dữ liệu mẫu nếu cần
  useEffect(() => {
    if (!loading && appointments.length === 0) {
      // Nếu không có dữ liệu từ API, sử dụng dữ liệu mẫu
      console.log('No data from API, using sample data for display');
      setAppointments(createSampleData());
    }
  }, [loading, appointments.length, consultants]);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <style dangerouslySetInnerHTML={{
        __html: `
          .text-2xs {
            font-size: 0.7rem;
            line-height: 1.1rem;
          }
          .appointment-grid {
            display: grid;
            grid-template-columns: 70px repeat(7, minmax(0, 1fr));
            width: 100%;
          }
          .appointment-cell {
            min-width: 0;
            overflow: hidden;
          }
          .status-badge {
            display: inline-block;
            padding: 0.15rem 0.35rem;
            border-radius: 0.25rem;
            font-weight: 500;
            font-size: 0.7rem;
            text-align: center;
          }
          .status-pending { background-color: #FEF3C7; color: #92400E; }
          .status-confirmed { background-color: #DBEAFE; color: #1E40AF; }
          .status-completed { background-color: #E0E7FF; color: #3730A3; }
          .status-cancelled { background-color: #FEE2E2; color: #B91C1C; }
          .status-available { background-color: #D1FAE5; color: #065F46; }
          
          .appointment-slot {
            transition: all 0.2s;
            border-left-width: 3px;
          }
          .appointment-slot:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
        `
      }} />
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-4">
        <h1 className="text-xl font-bold text-gray-800">Quản lý lịch hẹn</h1>
        <p className="text-gray-600 text-sm">Xem và quản lý tất cả các lịch hẹn</p>
      </div>
      
      {/* Filters and controls */}
      <div className="mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Consultant filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tư vấn viên</label>
            <div className="relative">
              <select
                value={selectedConsultant}
                onChange={handleConsultantChange}
                className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 appearance-none bg-white"
              >
                <option value="all">Tất cả tư vấn viên</option>
                {consultants.map(consultant => (
                  <option key={consultant._id} value={consultant._id}>
                    {consultant.accountId.fullName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lọc theo trạng thái</label>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <label className={`flex items-center justify-center px-2 py-2 rounded-md cursor-pointer border ${statusFilter === 'all' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name="statusFilter"
                  value="all"
                  checked={statusFilter === 'all'}
                  onChange={handleStatusFilterChange}
                  className="sr-only"
                />
                <span className="font-medium">Tất cả</span>
              </label>
              <label className={`flex items-center justify-center px-2 py-2 rounded-md cursor-pointer border ${statusFilter === 'available' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name="statusFilter"
                  value="available"
                  checked={statusFilter === 'available'}
                  onChange={handleStatusFilterChange}
                  className="sr-only"
                />
                <span className="font-medium">Slot trống</span>
              </label>
              <label className={`flex items-center justify-center px-2 py-2 rounded-md cursor-pointer border ${statusFilter === 'pending' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name="statusFilter"
                  value="pending"
                  checked={statusFilter === 'pending'}
                  onChange={handleStatusFilterChange}
                  className="sr-only"
                />
                <span className="font-medium">Chờ thanh toán</span>
              </label>
              <label className={`flex items-center justify-center px-2 py-2 rounded-md cursor-pointer border ${statusFilter === 'confirmed' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name="statusFilter"
                  value="confirmed"
                  checked={statusFilter === 'confirmed'}
                  onChange={handleStatusFilterChange}
                  className="sr-only"
                />
                <span className="font-medium">Đã thanh toán</span>
              </label>
              <label className={`flex items-center justify-center px-2 py-2 rounded-md cursor-pointer border ${statusFilter === 'completed' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name="statusFilter"
                  value="completed"
                  checked={statusFilter === 'completed'}
                  onChange={handleStatusFilterChange}
                  className="sr-only"
                />
                <span className="font-medium">Đã hoàn thành</span>
              </label>
              <label className={`flex items-center justify-center px-2 py-2 rounded-md cursor-pointer border ${statusFilter === 'cancelled' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name="statusFilter"
                  value="cancelled"
                  checked={statusFilter === 'cancelled'}
                  onChange={handleStatusFilterChange}
                  className="sr-only"
                />
                <span className="font-medium">Đã hủy</span>
              </label>
            </div>
          </div>

          {/* Week navigation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn thời gian</label>
            <div className="flex items-center justify-between">
              <button 
                onClick={handlePrevWeek}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Trước
              </button>
              <button
                onClick={handleCurrentWeek}
                className="px-3 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition text-sm"
              >
                Tuần này
              </button>
              <button
                onClick={handleNextWeek}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center text-sm"
              >
                Sau
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="w-8 h-8 rounded-full border-3 border-amber-500 border-t-transparent animate-spin mx-auto"></div>
          <p className="mt-3 text-gray-600">Đang tải lịch hẹn...</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="w-full">
            <div className="appointment-grid">
              {/* Time column header */}
              <div className="py-2 px-2 text-center font-medium bg-amber-50 rounded-tl-lg sticky left-0 shadow-sm z-10 appointment-cell">
                <span className="text-gray-600 uppercase text-sm tracking-wide">Giờ</span>
              </div>
              
              {/* Day headers */}
              {weekDays.map((day) => (
                <div 
                  key={day.formattedDate} 
                  className={`py-2 px-2 text-center font-medium appointment-cell ${day.isToday ? 'bg-amber-50' : 'bg-amber-50'} ${day.date.getDay() === 0 ? 'rounded-tr-lg' : ''}`}
                >
                  <div className="uppercase text-xs tracking-wide text-gray-500">
                    {(() => {
                      const fullNames = ['CHỦ NHẬT', 'THỨ HAI', 'THỨ BA', 'THỨ TƯ', 'THỨ NĂM', 'THỨ SÁU', 'THỨ BẢY'];
                      return fullNames[day.date.getDay()];
                    })()}
                  </div>
                  <div className={`text-sm font-bold ${day.isToday ? 'text-amber-700' : 'text-gray-800'}`}>{day.formattedDate}</div>
                </div>
              ))}

              {/* Time slots and appointments */}
              {timeSlots.map((timeSlot, timeIndex) => (
                <React.Fragment key={timeSlot}>
                  {/* Time slot */}
                  <div className={`py-2 px-2 text-center bg-amber-50 border-t border-gray-100 sticky left-0 shadow-sm z-10 appointment-cell ${timeIndex % 2 === 0 ? 'bg-amber-50' : 'bg-amber-100'}`}>
                    <div className="font-medium text-sm text-gray-700">{timeSlot}</div>
                  </div>
                  
                  {/* Appointment cells for each day */}
                  {weekDays.map((day) => {
                    // Get all slots for this day and time
                    const slotsForThisTimeSlot = getSlotsForTimeSlot(day.date, timeSlot);
                    
                    return (
                      <div 
                        key={`${day.formattedDate}-${timeSlot}`}
                        className={`p-1 min-h-[60px] border-t border-l border-gray-100 appointment-cell ${day.isToday ? 'bg-amber-50/30' : timeIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} relative`}
                      >
                        {slotsForThisTimeSlot.length > 0 ? (
                          <div className="space-y-1">
                            {slotsForThisTimeSlot.map((slot) => {
                              // Check if this slot has an appointment
                              const appointment = getAppointmentForSlot(slot._id);
                              
                              if (appointment && appointment.status !== 'rescheduled' && (statusFilter === 'all' || appointment.status === statusFilter)) {
                                // This slot has an appointment that matches the filter
                                const user = appointment.user_id as AppointmentUser;
                                const consultant = appointment.consultant_id as Consultant;

                                return (
                                  <div
                                    key={appointment._id}
                                    className={`p-1.5 rounded-md shadow-sm border-l-2 appointment-slot ${
                                      appointment.status === 'pending' ? 'border-amber-400' : 
                                      appointment.status === 'confirmed' ? 'border-amber-400' : 
                                      appointment.status === 'completed' ? 'border-amber-400' : 
                                      'border-rose-400'
                                    } cursor-pointer hover:shadow-md transition-shadow relative group`}
                                    onClick={() => handleAppointmentClick(appointment._id)}
                                    onMouseEnter={(e) => handleMouseEnter(appointment, e)}
                                    onMouseLeave={handleMouseLeave}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className={`font-medium truncate w-3/4 text-sm`}>
                                        {user?.fullName || 'Khách hàng không xác định'}
                                      </div>
                                      <span className={`status-badge status-${appointment.status}`}>
                                        {appointment.status === 'pending' ? 'Chờ' : 
                                         appointment.status === 'confirmed' ? 'XN' : 
                                         appointment.status === 'completed' ? 'HT' : 
                                         'HB'}
                                      </span>
                                    </div>
                                    <div className="text-xs truncate text-gray-600 mt-1">
                                      {consultant?.accountId?.fullName || getConsultantNameById(String(slot.consultant_id))}
                                    </div>
                                  </div>
                                );
                              } else if (slot.status === 'available' && (statusFilter === 'all' || statusFilter === 'available')) {
                                // This is an available slot with no appointment
                                return (
                                  <div
                                    key={slot._id}
                                    className="p-1.5 rounded-md shadow-sm border-l-2 border-emerald-300 appointment-slot cursor-pointer hover:shadow-md transition-shadow"
                                    onMouseEnter={(e) => handleMouseEnterSlot(slot, e)}
                                    onMouseLeave={handleMouseLeaveSlot}
                                  >
                                    <div className="flex items-center">
                                      <div className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></div>
                                      <div className="font-medium truncate text-sm">Slot trống</div>
                                    </div>
                                    <div className="text-xs truncate text-gray-600 mt-1">
                                      {getConsultantNameById(String(slot.consultant_id))}
                                    </div>
                                  </div>
                                );
                              }
                              return null; // Skip other slot statuses or filtered out appointments
                            })}
                          </div>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                            -
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hover tooltip for appointments */}
      {hoveredAppointment && (
        <div
          className="fixed bg-white shadow-xl rounded-lg p-4 z-50 w-80 border border-gray-200"
          style={{
            top: hoveredPosition.y + 20,
            left: hoveredPosition.x - 150,
            pointerEvents: 'none'
          }}
        >
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              hoveredAppointment.status === 'pending' ? 'bg-amber-500' : 
              hoveredAppointment.status === 'confirmed' ? 'bg-amber-500' : 
              hoveredAppointment.status === 'completed' ? 'bg-amber-500' : 
              'bg-rose-500'
            }`}></div>
            <div className="font-medium text-lg">{(hoveredAppointment.user_id as AppointmentUser)?.fullName || "Không có tên"}</div>
          </div>
          
          <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm text-gray-700">{(hoveredAppointment.consultant_id as Consultant)?.accountId?.fullName || "Không có tên"}</span>
            </div>
            
            <div className="flex items-center">
              <svg className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm text-gray-700 truncate">{(hoveredAppointment.service_id as AppointmentService)?.name || "Không có dịch vụ"}</span>
            </div>
            
            <div className="flex items-center">
              <svg className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-700">{getAppointmentTimeRange(hoveredAppointment)} - {format(parseISO(hoveredAppointment.dateBooking), 'dd/MM/yyyy')}</span>
            </div>
            
            <div className="flex items-center">
              <svg className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">Trạng thái: </span>
              <span className="text-sm ml-1 font-medium">
                {hoveredAppointment.status === 'pending' ? 'Chờ thanh toán' : 
                 hoveredAppointment.status === 'confirmed' ? 'Đã thanh toán' : 
                 hoveredAppointment.status === 'completed' ? 'Đã hoàn thành' : 
                 'Đã hủy'}
              </span>
            </div>
          </div>
          
          <div className="mt-3">
            <div className="text-sm text-gray-600 font-medium">Lý do:</div>
            <div className="mt-1 bg-gray-50 rounded-lg p-2 text-sm text-gray-700 border-l-2 border-amber-300">
              {hoveredAppointment.reason || "Không có lý do"}
            </div>
          </div>
        </div>
      )}

      {/* Hover tooltip for available slots */}
      {hoveredSlot && (
        <div
          className="fixed bg-white shadow-xl rounded-lg p-4 z-50 w-72 border border-gray-200"
          style={{
            top: hoveredPosition.y + 20,
            left: hoveredPosition.x - 150,
            pointerEvents: 'none'
          }}
        >
          <div className="font-medium text-lg flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 mr-2"></span>
            Slot trống
          </div>
          
          <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm text-gray-700">{getConsultantNameById(String(hoveredSlot.consultant_id))}</span>
            </div>
            
            <div className="flex items-center">
              <svg className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-700">{formatTime(hoveredSlot.start_time)} - {formatTime(hoveredSlot.end_time)}</span>
            </div>
            
            <div className="flex items-center">
              <svg className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-700">{format(parseISO(hoveredSlot.start_time), 'dd/MM/yyyy')}</span>
            </div>
          </div>
          
          <div className="mt-3 flex items-center justify-center">
            <span className="status-badge status-available">
              {statusLabels.available}
            </span>
          </div>
        </div>
      )}

      {/* Appointment detail modal */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Chi tiết cuộc hẹn</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
              <div className={`py-3 px-4 ${
                selectedAppointment.status === 'pending' ? 'bg-amber-50' : 
                selectedAppointment.status === 'confirmed' ? 'bg-amber-50' : 
                selectedAppointment.status === 'completed' ? 'bg-amber-50' : 
                'bg-rose-50'
              }`}>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    selectedAppointment.status === 'pending' ? 'bg-amber-500' : 
                    selectedAppointment.status === 'confirmed' ? 'bg-amber-500' : 
                    selectedAppointment.status === 'completed' ? 'bg-amber-500' : 
                    'bg-rose-500'
                  }`}></div>
                  <span className="font-medium text-gray-800">
                    {statusLabels[selectedAppointment.status as keyof typeof statusLabels]}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Khách hàng</div>
                    <div className="text-lg font-medium">{(selectedAppointment.user_id as AppointmentUser)?.fullName}</div>
                    <div className="text-sm text-gray-600 mt-1">{(selectedAppointment.user_id as AppointmentUser)?.email}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Tư vấn viên</div>
                    <div className="text-lg font-medium">{(selectedAppointment.consultant_id as Consultant)?.accountId?.fullName}</div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500 mb-1">Dịch vụ</div>
                  <div className="text-lg font-medium">{(selectedAppointment.service_id as AppointmentService)?.name}</div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Thời gian</div>
                      <div className="text-lg font-medium">{getAppointmentTimeRange(selectedAppointment)}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Ngày</div>
                      <div className="text-lg font-medium">{format(parseISO(selectedAppointment.dateBooking), 'dd/MM/yyyy')}</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500 mb-1">Lý do</div>
                  <div className="bg-gray-50 rounded-lg p-3 text-gray-700">{selectedAppointment.reason || "Không có"}</div>
                </div>
                
                {selectedAppointment.note && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-500 mb-1">Ghi chú</div>
                    <div className="bg-gray-50 rounded-lg p-3 text-gray-700">{selectedAppointment.note}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentManagement; 