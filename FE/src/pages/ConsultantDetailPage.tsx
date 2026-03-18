import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useEffect, useState } from 'react';
import { getConsultantByIdApi, getAllServicesApi, getAllCertificatesApi, getSlotTimeByConsultantIdApi, createAppointmentApi, getSlotTimeByIdApi } from '../api';
import { addDays, startOfWeek, endOfWeek, format, isWithinInterval, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useAuth } from '../contexts/AuthContext';

// Mock data lịch dạng tuần: bookedSlots[day][hour] = { title, color, ... }
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const timeSlots = [
  '08:00', '09:00', '10:00', '11:00',
  '13:00', '14:00', '15:00', '16:00',
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
  startDateofWork: string;
  googleMeetLink: string;
  accountId: User;
}

interface Service {
  _id: string;
  name: string;
  price: number;
  description: string;
}

interface Certificate {
  _id: string;
  consultant_id: string | { _id: string };
  title: string;
  type: string;
  issuedBy: number;
  issueDate: string;
  expireDate?: string;
  description?: string;
  fileUrl: string;
}

interface SlotTime {
  _id: string;
  consultant_id: string;
  start_time: string; // ISO string
  end_time: string;   // ISO string
  status: 'available' | 'booked';
}

const defaultCertificateImg = 'https://pvccardprinting.in/wp-content/uploads/2023/08/standard-certificates-printing.webp';

function ConsultantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State cho modal booking
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; time: string } | null>(null);
  const [form, setForm] = useState({ reason: '', serviceId: '', note: '' });
  const [services, setServices] = useState<Service[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [slotTimes, setSlotTimes] = useState<SlotTime[]>([]);
  const [slotTimeError, setSlotTimeError] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState(0); // 0: tuần này, 1: tuần sau
  const { user } = useAuth();
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedSlotObj, setSelectedSlotObj] = useState<SlotTime | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({ message: '', type: 'success', visible: false });

  // Tính ngày đầu và cuối tuần dựa trên currentWeek
  const today = new Date();
  const weekStart = startOfWeek(addDays(today, currentWeek * 7), { weekStartsOn: 1 }); // Thứ 2
  const weekEnd = endOfWeek(addDays(today, currentWeek * 7), { weekStartsOn: 1 }); // Chủ nhật

  // Function to check if a slot is in the past
  const isPastSlot = (day: string, time: string): boolean => {
    const dayIndex = weekDays.indexOf(day);
    if (dayIndex === -1) return false;

    const slotDate = addDays(weekStart, dayIndex);
    const [hour, minute] = time.split(':').map(Number);

    const slotDateTime = new Date(slotDate);
    slotDateTime.setHours(hour, minute, 0, 0);

    return slotDateTime < new Date();
  };

  // DEBUG: Log weekStart, weekEnd và từng slot để kiểm tra lệch múi giờ
  console.log('weekStart:', weekStart.toISOString(), 'local:', weekStart);
  console.log('weekEnd:', weekEnd.toISOString(), 'local:', weekEnd);
  slotTimes.forEach(st => {
    const d = parseISO(st.start_time);
    console.log('slot:', st.start_time, '->', d.toISOString(), 'local:', d,
      'isWithinInterval:', isWithinInterval(d, { start: weekStart, end: weekEnd }));
  });
  // Lọc slot time thuộc tuần đang xem
  const slotTimesOfWeek = slotTimes.filter(st => {
    const d = parseISO(st.start_time);
    return isWithinInterval(d, { start: weekStart, end: weekEnd });
  });

  // DEBUG: Log dữ liệu slotTimes và slotTimesOfWeek
  console.log('slotTimes:', slotTimes);
  console.log('slotTimesOfWeek:', slotTimesOfWeek);

  useEffect(() => {
    const fetchConsultant = async () => {
      try {
        setLoading(true);
        const data = await getConsultantByIdApi(id as string);
        setConsultant(data);
        setError(null);
        // Sau khi có consultant, lấy certificates
        const allCertificates = await getAllCertificatesApi();
        const filtered = allCertificates.filter((c: Certificate) => {
          if (typeof c.consultant_id === 'string') return c.consultant_id === data._id;
          return c.consultant_id?._id === data._id;
        });
        // Sắp xếp theo issueDate tăng dần
        filtered.sort((a: Certificate, b: Certificate) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime());
        setCertificates(filtered);
        // Lấy slot time của consultant
        try {
          const slotList = await getSlotTimeByConsultantIdApi(data._id);
          setSlotTimes(Array.isArray(slotList) ? slotList : []);
          setSlotTimeError(null);
        } catch {
          setSlotTimes([]);
          setSlotTimeError('Không thể tải lịch tư vấn của chuyên gia này.');
        }
      } catch (error) {
        setError('Không thể tải thông tin chuyên gia.');
        setConsultant(null);
        setCertificates([]);
        setSlotTimes([]);
        // eslint-disable-next-line no-console
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchConsultant();
  }, [id]);

  // Lấy danh sách dịch vụ khi mở modal
  useEffect(() => {
    if (showModal) {
      getAllServicesApi().then(setServices).catch(() => setServices([]));
    }
  }, [showModal]);

  const handleOpenModal = (day: string, time: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!user.isVerified) {
      navigate('/verify-otp');
      return;
    }

    // Tìm slotObj tương ứng
    const slotObj = slotTimesOfWeek.find(st => {
      let dayOfWeek, hour;
      try {
        dayOfWeek = formatInTimeZone(st.start_time, 'Asia/Ho_Chi_Minh', 'E').substring(0, 3);
        hour = formatInTimeZone(st.start_time, 'Asia/Ho_Chi_Minh', 'HH:00');
      } catch {
        const d = new Date(st.start_time);
        dayOfWeek = format(d, 'E').substring(0, 3);
        hour = format(d, 'HH:00');
      }
      return dayOfWeek === day && hour === time;
    });
    setSelectedSlot({ day, time });
    setSelectedSlotObj(slotObj || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setForm({ reason: '', serviceId: '', note: '' });
    setSelectedSlot(null);
    setSelectedSlotObj(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Hàm hiển thị notification
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification(n => ({ ...n, visible: false }));
    }, 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !consultant || !selectedSlotObj) {
      showNotification('Thiếu thông tin người dùng, chuyên gia hoặc slot!', 'error');
      return;
    }
    setBookingLoading(true);
    try {
      // Kiểm tra lại slot còn available không trước khi đặt (gọi theo id)
      const latestSlot = await getSlotTimeByIdApi(selectedSlotObj._id);
      if (!latestSlot || latestSlot.status !== 'available') {
        showNotification('Slot này đã có người đặt, vui lòng chọn slot khác!', 'error');
        setBookingLoading(false);
        handleCloseModal();
        return;
      }
      const payload = {
        slotTime_id: selectedSlotObj._id,
        user_id: user._id,
        consultant_id: consultant._id,
        service_id: form.serviceId,
        dateBooking: selectedSlotObj.start_time,
        reason: form.reason,
        note: form.note,
      };
      await createAppointmentApi(payload);
      setSlotTimes(prevSlotTimes => prevSlotTimes.map(st =>
        st._id === selectedSlotObj._id ? { ...st, status: 'booked' } : st
      ));
      showNotification('Đặt lịch thành công!', 'success');
      handleCloseModal();
    } catch (err: unknown) {
      let msg = '';
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        msg = (err.response.data as { message?: string }).message || '';
      }
      showNotification('Đặt lịch thất bại! ' + msg, 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  // Hàm kiểm tra slot trước khi chuyển sang thanh toán
  const handleGoToPayment = async () => {
    if (!selectedSlotObj) return;
    const latestSlot = await getSlotTimeByIdApi(selectedSlotObj._id);
    if (!latestSlot || latestSlot.status !== 'available') {
      showNotification('Slot này đã có người đặt, vui lòng chọn slot khác!', 'error');
      handleCloseModal();
      return;
    }
    // Chuyển sang bước/thanh toán (tuỳ flow của bạn)
    // Ví dụ: setShowPaymentModal(true);
  };

  // Hàm gọi sau khi thanh toán thành công
  const handlePaymentSuccess = async () => {
    if (!user || !consultant || !selectedSlotObj) {
      showNotification('Thiếu thông tin người dùng, chuyên gia hoặc slot!', 'error');
      return;
    }
    setBookingLoading(true);
    try {
      // Kiểm tra lại slot còn available không trước khi tạo appointment
      const latestSlot = await getSlotTimeByIdApi(selectedSlotObj._id);
      if (!latestSlot || latestSlot.status !== 'available') {
        showNotification('Slot này đã có người đặt, vui lòng chọn slot khác!', 'error');
        setBookingLoading(false);
        handleCloseModal();
        return;
      }
      const payload = {
        slotTime_id: selectedSlotObj._id,
        user_id: user._id,
        consultant_id: consultant._id,
        service_id: form.serviceId,
        dateBooking: selectedSlotObj.start_time,
        reason: form.reason,
        note: form.note,
      };
      await createAppointmentApi(payload);
      setSlotTimes(prevSlotTimes => prevSlotTimes.map(st =>
        st._id === selectedSlotObj._id ? { ...st, status: 'booked' } : st
      ));
      showNotification('Đặt lịch thành công!', 'success');
      handleCloseModal();
    } catch (err: unknown) {
      let msg = '';
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        msg = (err.response.data as { message?: string }).message || '';
      }
      showNotification('Đặt lịch thất bại! ' + msg, 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-xl">Đang tải dữ liệu...</div>;
  if (error || !consultant) return <div className="text-center py-20 text-xl text-red-600">{error || 'Không tìm thấy chuyên gia.'}</div>;

  return (
    <div>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Thông tin bên trái */}
          <div className="w-full md:w-1/3 flex flex-col items-center justify-center p-8">
            <img src={consultant.accountId?.photoUrl || 'https://via.placeholder.com/150'} alt={consultant.accountId?.fullName || 'Chuyên gia'} className="w-36 h-36 rounded-full object-cover border-4 border-blue-200 mb-4" />
            <h2 className="text-2xl font-bold text-blue-700 mb-1 text-center">{consultant.accountId?.fullName || 'Chuyên gia'}</h2>
            <div className="text-blue-600 font-semibold mb-2 text-center">Chuyên gia tư vấn</div>
            <div className="text-gray-600 mb-3 text-center">{consultant.introduction}</div>
            <div className="flex flex-col gap-1 text-gray-500 text-sm w-full items-center mb-4">
              <span>Email: {consultant.accountId?.email || 'Không có email'}</span>
              <span>SĐT: {consultant.accountId?.phoneNumber || 'Không có số điện thoại'}</span>
              <span>Số năm cộng tác tại VNR202: {(() => {
                if (!consultant.startDateofWork) return 'Chưa cập nhật';
                const startYear = new Date(consultant.startDateofWork).getFullYear();
                if (isNaN(startYear)) return 'Chưa cập nhật';
                const currentYear = new Date().getFullYear();
                const years = currentYear - startYear;
                return years >= 0 ? `${years} năm` : 'Chưa cập nhật';
              })()}</span>
            </div>
            {/* Certificates */}
            <div className="w-full mt-2">
              <h4 className="text-base font-semibold text-blue-700 mb-2 text-center">Chứng chỉ & Bằng cấp</h4>
              {certificates.length === 0 ? (
                <div className="text-gray-400 text-center">Chưa có chứng chỉ nào.</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {Object.entries(certificates.reduce((acc, cert) => {
                    const year = new Date(cert.issueDate).getFullYear();
                    if (!acc[year]) acc[year] = [];
                    acc[year].push(cert);
                    return acc;
                  }, {} as Record<string, Certificate[]>)).sort((a, b) => Number(a[0]) - Number(b[0])).map(([year, certs], idx) => (
                    <div key={year}>
                      <div className={`font-light text-base mb-0.5 ${idx === 0 ? 'text-gray-700' : 'text-gray-500'}`}>{year}</div>
                      <div className={`w-full h-px ${idx === 0 ? 'bg-gray-300' : 'bg-gray-300'} mb-2`}></div>
                      <div className="flex flex-col">
                        {certs.map(cert => (
                          <div key={cert._id} className="flex items-center gap-3 px-1 py-1 rounded-md transition-colors hover:bg-purple-50 group cursor-pointer">
                            <img src={cert.fileUrl} alt={cert.title} className="w-10 h-10 object-cover rounded bg-black border border-gray-200 flex-shrink-0"
                              onError={e => {
                                const target = e.currentTarget;
                                if (target.src !== defaultCertificateImg) target.src = defaultCertificateImg;
                              }}
                            />
                            <div className="font-medium text-sm text-black truncate max-w-[260px] group-hover:text-purple-700" title={cert.title}>{cert.title}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Đường chia dọc */}
          <div className="hidden md:block w-px bg-gray-200 mx-0" style={{ minHeight: '100%' }}></div>
          {/* Lịch bên phải */}
          <div className="w-full md:w-[900px] p-4 md:p-8">
            <div className="mb-4 text-xl font-bold text-blue-700 text-center w-full">
              Lịch tư vấn tuần: {format(weekStart, 'dd/MM/yyyy')} - {format(weekEnd, 'dd/MM/yyyy')}
            </div>
            <div className="overflow-x-auto">
              {slotTimeError ? (
                <div className="text-center text-red-600 py-8">{slotTimeError}</div>
              ) : (
                <div>
                  {/* Header: slot giờ + ngày + nút mũi tên */}
                  <div className="grid grid-cols-9">
                    {/* Nút mũi tên trái */}
                    <div className="flex items-center justify-center bg-gray-50">
                      <button
                        className="text-gray-500 hover:text-blue-600 disabled:opacity-30 focus:outline-none"
                        disabled={currentWeek === 0}
                        onClick={() => setCurrentWeek(0)}
                        aria-label="Tuần trước"
                      >
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </div>
                    {weekDays.map((day) => (
                      <div key={day} className="text-center font-bold text-gray-600 py-2 bg-gray-50 border-t border-gray-100">
                        {day}
                      </div>
                    ))}
                    {/* Nút mũi tên phải */}
                    <div className="flex items-center justify-center bg-gray-50">
                      <button
                        className="text-gray-500 hover:text-blue-600 disabled:opacity-30 focus:outline-none"
                        disabled={currentWeek === 1}
                        onClick={() => setCurrentWeek(1)}
                        aria-label="Tuần sau"
                      >
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </div>
                  </div>
                  {/* Body: slot giờ + slot từng ngày */}
                  {timeSlots.map(slot => (
                    <div key={slot} className="grid grid-cols-9">
                      {/* Giờ */}
                      <div className="text-right pr-2 font-semibold text-gray-400 py-2 border-t border-gray-100 text-sm bg-white flex items-center justify-end">
                        {slot}
                      </div>
                      {/* Slot từng ngày */}
                      {weekDays.map(day => {
                        // DEBUG: Log từng slotObj
                        const slotObj = slotTimesOfWeek.find(st => {
                          let dayOfWeek, hour;
                          try {
                            dayOfWeek = formatInTimeZone(st.start_time, 'Asia/Ho_Chi_Minh', 'E').substring(0, 3);
                            hour = formatInTimeZone(st.start_time, 'Asia/Ho_Chi_Minh', 'HH:00');
                          } catch {
                            const d = new Date(st.start_time);
                            dayOfWeek = format(d, 'E').substring(0, 3);
                            hour = format(d, 'HH:00');
                          }
                          return dayOfWeek === day && hour === slot;
                        });

                        const isBooked = slotObj?.status === 'booked';
                        const isAvailable = slotObj?.status === 'available';
                        const isPast = isPastSlot(day, slot);

                        return (
                          <button
                            key={day + slot}
                            className={`h-14 w-full flex items-center justify-center border-t border-l border-gray-200 transition-all focus:outline-none
                              ${isPast ? 'bg-gray-100 text-gray-500 cursor-not-allowed' :
                                isBooked ? 'bg-red-200 text-red-700 cursor-not-allowed' :
                                  isAvailable ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer' :
                                    'bg-gray-50 cursor-not-allowed'}
                            `}
                            style={{ borderRadius: 0 }}
                            onClick={() => isAvailable && !isPast && handleOpenModal(day, slot)}
                            type="button"
                            disabled={!isAvailable || isPast}
                          >
                            {isPast ? '' : isBooked ? 'Đã đặt' : isAvailable ? 'Có sẵn' : ''}
                          </button>
                        );
                      })}
                      {/* Cột 9 trống cho cân layout */}
                      <div></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Modal booking */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-blue-600 text-2xl" onClick={handleCloseModal}>&times;</button>
            <h4 className="text-xl font-bold text-blue-700 mb-4">Đặt lịch khám với {consultant.accountId?.fullName || 'Chuyên gia'}</h4>
            <div className="mb-2 text-gray-500 text-sm">{selectedSlot?.day} - {selectedSlot?.time}</div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <select
                name="serviceId"
                required
                className="border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.serviceId}
                onChange={handleChange}
              >
                <option value="">Chọn dịch vụ</option>
                {services.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
              <textarea
                name="reason"
                required
                placeholder="Lý do khám"
                className="border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                value={form.reason}
                onChange={handleChange}
                rows={3}
              />
              <textarea
                name="note"
                placeholder="Ghi chú (tuỳ chọn)"
                className="border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                value={form.note}
                onChange={handleChange}
                rows={2}
              />
              <div className="flex gap-4 justify-end mt-2">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300">Đóng</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700" disabled={bookingLoading}>{bookingLoading ? 'Đang gửi...' : 'Xác nhận'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {notification.visible && (
        <div
          className={`fixed z-[9999] left-1/2 -translate-x-1/2 top-8 min-w-[320px] max-w-[90vw] px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 transition-all
            ${notification.type === 'success' ? 'bg-green-50 border border-green-300 text-green-800' : 'bg-red-50 border border-red-300 text-red-800'}`}
          style={{ animation: 'fadeInDown 0.3s' }}
        >
          {notification.type === 'success' ? (
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#22c55e" opacity="0.15" /><path d="M7 13l3 3 7-7" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          ) : (
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#ef4444" opacity="0.15" /><path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          )}
          <span className="flex-1 font-medium text-base">{notification.message}</span>
          <button
            className="ml-2 text-xl text-gray-400 hover:text-gray-700 focus:outline-none"
            onClick={() => setNotification(n => ({ ...n, visible: false }))}
            aria-label="Đóng thông báo"
          >
            &times;
          </button>
        </div>
      )}
      <Footer />
    </div>
  );
}

export default ConsultantDetailPage; 