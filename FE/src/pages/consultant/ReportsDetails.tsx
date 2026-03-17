import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, Mail, MapPin, Clipboard, ArrowLeft, User, FileDown, Clock, CheckCircle, Video, X, Check } from 'lucide-react';
import { getAppointmentByIdApi, createReportApi, getReportByAppointmentIdApi, getAppointmentByConsultantIdApi, getReportByConsultantIdApi, updateReportApi, capNhatLinkMeetApi } from '../../api';

// Định nghĩa type cho appointment dựa trên response thực tế
interface Appointment {
  _id: string;
  slotTime_id: {
    _id: string;
    consultant_id: string;
    start_time: string;
    end_time: string;
    status: string;
    __v?: number;
  };
  user_id: {
    _id: string;
    username: string;
    email: string;
    photoUrl?: string;
    fullName?: string;
    phoneNumber?: string;
    gender?: string;
    birthday?: string;
    age?: string;
    yearOfBirth?: number;
    address?: string;
  };
  consultant_id: {
    _id: string;
    // ... các trường khác nếu cần
  };
  service_id: {
    _id: string;
    name: string;
    // ... các trường khác nếu cần
  };
  dateBooking: string;
  reason: string;
  note?: string;
  status: string;
  meetLink?: string;
}

interface ConsultantAppointment {
  _id: string;
  slotTime_id?: {
    start_time: string;
    end_time: string;
  };
  user_id?: {
    _id: string;
    fullName: string;
    photoUrl?: string;
  };
  service_id?: {
    name: string;
  };
  status: string;
  reason?: string;
  dateBooking: string;
}

interface FilteredReportItem extends Report {
  appointmentData?: ConsultantAppointment;
}

interface Report {
  _id: string;
  appointment_id: string;
  account_id: string;
  consultant_id: string;
  nameOfPatient: string;
  age: number;
  gender: string;
  condition: string;
  notes?: string;
  recommendations?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const ReportsDetails = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [consultantAppointments, setConsultantAppointments] = useState<ConsultantAppointment[]>([]);
  const [consultantReports, setConsultantReports] = useState<Report[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<FilteredReportItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [tenBenhNhan, setTenBenhNhan] = useState('');
  const [tuoiBenhNhan, setTuoiBenhNhan] = useState('');
  const [gioiTinhBenhNhan, setGioiTinhBenhNhan] = useState('');
  const [daGhiNhan, setDaGhiNhan] = useState(false);
  const [dangChinhSua, setDangChinhSua] = useState(false);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);

  // Meet Link states
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [meetLinkInput, setMeetLinkInput] = useState('');
  const [meetLinkLoading, setMeetLinkLoading] = useState(false);

  // Thêm state để trigger reload lịch sử
  const [shouldReloadHistory, setShouldReloadHistory] = useState(0);

  const [newRecord, setNewRecord] = useState({
    appointmentId: '',
    condition: '',
    status: 'completed',
    consultation_notes: '',
    recommendations: '',
  });

  // Hàm reload data consultant
  const reloadConsultantData = async () => {
    if (!appointment?.consultant_id?._id) return;
    
    try {
      // Reload consultant reports
      const consultantReports = await getReportByConsultantIdApi(appointment.consultant_id._id);
      setConsultantReports(consultantReports);
      
      // Reload consultant appointments
      const consultantAppointments = await getAppointmentByConsultantIdApi(appointment.consultant_id._id);
      setConsultantAppointments(consultantAppointments);
    } catch (error) {
      console.error('Lỗi khi reload data consultant:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!appointmentId) {
        return;
      }
      
      setLoading(true);
      
      try {
        // Lấy reports trước để kiểm tra
        const reports = await getReportByAppointmentIdApi(appointmentId);
        
        let report = null;
        if (reports && Array.isArray(reports) && reports.length > 0) {
          report = reports[reports.length - 1];
        }

        // Thử lấy chi tiết appointment
        let appointmentData = null;
        try {
          appointmentData = await getAppointmentByIdApi(appointmentId);
        } catch {
          // Có thể tiếp tục với report data
        }

        // Nếu có appointment data
        if (appointmentData) {
          setAppointment(appointmentData);

          // Lấy danh sách appointments của consultant này
          if (appointmentData.consultant_id?._id) {
            const consultantAppointments = await getAppointmentByConsultantIdApi(appointmentData.consultant_id._id);
            setConsultantAppointments(consultantAppointments);

            // Lấy danh sách reports của consultant này
            const consultantReports = await getReportByConsultantIdApi(appointmentData.consultant_id._id);
            setConsultantReports(consultantReports);
          }
        } 
        // Nếu không có appointment data nhưng có report, tạo fake appointment
        else if (report) {
          const fakeAppointment = {
            _id: appointmentId,
            slotTime_id: {
              _id: '',
              consultant_id: report.consultant_id || '',
              start_time: new Date().toISOString(),
              end_time: new Date().toISOString(),
              status: 'completed'
            },
            user_id: {
              _id: report.account_id || '',
              username: '',
              email: '',
              fullName: report.nameOfPatient || 'Unknown',
              gender: report.gender || '',
              age: report.age?.toString() || '',
            },
            consultant_id: {
              _id: report.consultant_id || ''
            },
            service_id: {
              _id: '',
              name: 'Dịch vụ tư vấn'
            },
            dateBooking: report.createdAt || new Date().toISOString(),
            reason: report.condition || '',
            note: report.notes || '',
            status: 'completed'
          };
          setAppointment(fakeAppointment);
          
          // Thử lấy consultant data nếu có consultant_id
          if (report.consultant_id) {
            try {
              const consultantReports = await getReportByConsultantIdApi(report.consultant_id);
              setConsultantReports(consultantReports);
            } catch {
              // Không thể lấy consultant reports
            }
          }
        }

        // Xử lý report data
        if (report) {
          setTenBenhNhan(report.nameOfPatient || '');
          setTuoiBenhNhan(report.age ? String(report.age) : '');
          setGioiTinhBenhNhan(report.gender || '');
          setNewRecord({
            appointmentId: appointmentId,
            condition: report.condition || '',
            status: report.status || 'completed',
            consultation_notes: report.notes || '',
            recommendations: report.recommendations || '',
          });
          setDaGhiNhan(true);
          setCurrentReportId(report._id);
        } else if (appointmentData) {
          setTenBenhNhan(appointmentData.user_id?.fullName || '');
          setTuoiBenhNhan(appointmentData.user_id?.birthday ? (new Date().getFullYear() - Number(appointmentData.user_id.birthday)).toString() : '');
          setGioiTinhBenhNhan(appointmentData.user_id?.gender || '');
          setDaGhiNhan(false);
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [appointmentId, daGhiNhan]);
  
  // Filter reports based on tab, search and filter
  useEffect(() => {
    let filtered = consultantReports;

    // Filter by current user - chỉ hiển thị report của khách hàng hiện tại
    if (appointment?.user_id?._id) {
      const currentUserId = appointment.user_id._id;
      console.log('Current user ID:', currentUserId); // Debug log
      console.log('All consultant reports:', consultantReports); // Debug log
      console.log('All consultant appointments:', consultantAppointments); // Debug log
      
      // Lọc reports theo user_id bằng cách check appointment_id
      filtered = filtered.filter(report => {
        const matchingAppointment = consultantAppointments.find(app => app._id === report.appointment_id);
        const matches = matchingAppointment?.user_id?._id === currentUserId;
        console.log(`Report ${report._id} for appointment ${report.appointment_id}: matches=${matches}`, {
          reportUserId: matchingAppointment?.user_id?._id,
          currentUserId
        }); // Debug log
        return matches;
      });
      
      console.log('Filtered reports for current user:', filtered); // Debug log
    }

    // Filter by search term (chỉ tìm theo tên)
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.nameOfPatient?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter(report => report.status === filterStatus);
    }

    // Convert reports to display format (we'll use appointment data for missing info)
    const filteredWithAppointmentData = filtered.map(report => {
      const matchingAppointment = consultantAppointments.find(app => app._id === report.appointment_id);
      return {
        ...report,
        appointmentData: matchingAppointment
      };
    });

         setFilteredAppointments(filteredWithAppointmentData);
  }, [consultantReports, consultantAppointments, searchTerm, filterStatus, appointment?.user_id?._id]);

  // Thêm useEffect để reload reports khi cần
  useEffect(() => {
    if (shouldReloadHistory > 0) {
      reloadConsultantData();
    }
  }, [shouldReloadHistory, appointment?.consultant_id?._id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewRecord(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;
    
    // Kiểm tra đã tới giờ khám chưa
    if (!isAppointmentTime()) {
      alert('Chưa tới giờ khám! Vui lòng đợi đến 10 phút trước giờ hẹn.');
      return;
    }

    // Kiểm tra xem có thể chỉnh sửa không
    if (!canEditReport()) {
      alert('Không thể chỉnh sửa báo cáo sau thời gian cuộc hẹn kết thúc!');
      return;
    }
    
    // Validation cho các trường bắt buộc
    const errors = [];
    if (!tenBenhNhan.trim()) errors.push('Tên bệnh nhân');
    if (!tuoiBenhNhan.trim()) errors.push('Tuổi bệnh nhân');
    if (!gioiTinhBenhNhan.trim()) errors.push('Giới tính');
    if (!newRecord.condition.trim()) errors.push('Tình trạng / Chủ đề');
    
    if (errors.length > 0) {
      alert(`Vui lòng nhập đầy đủ thông tin bắt buộc:\n• ${errors.join('\n• ')}`);
      return;
    }
    
    try {
      const payload = {
        account_id: typeof appointment.user_id === 'object' ? appointment.user_id._id : appointment.user_id,
        appointment_id: appointment._id,
        consultant_id: typeof appointment.consultant_id === 'object' ? appointment.consultant_id._id : appointment.consultant_id,
        nameOfPatient: tenBenhNhan,
        age: Number(tuoiBenhNhan),
        gender: gioiTinhBenhNhan,
        condition: newRecord.condition,
        notes: newRecord.consultation_notes,
        recommendations: newRecord.recommendations,
        status: newRecord.status,
      };
      if (currentReportId && daGhiNhan) {
        // Chỉnh sửa report existing
        await updateReportApi(currentReportId, {
          nameOfPatient: tenBenhNhan,
          age: Number(tuoiBenhNhan),
          gender: gioiTinhBenhNhan,
          condition: newRecord.condition,
          notes: newRecord.consultation_notes,
          recommendations: newRecord.recommendations,
          status: newRecord.status,
        });
        alert('Cập nhật ghi nhận thành công!');
        setDangChinhSua(false);
        // Trigger reload lịch sử
        setShouldReloadHistory(prev => prev + 1);
      } else {
        // Tạo report mới
        await createReportApi(payload);
        alert('Tạo ghi nhận thành công!');
        setDaGhiNhan(true);
        // Trigger reload lịch sử
        setShouldReloadHistory(prev => prev + 1);
      }
      // Reset form nếu muốn
    } catch (error: unknown) {
      let message = 'Có lỗi khi tạo ghi nhận!';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          message = axiosError.response.data.message;
        }
      }
      alert(message);
      console.error(error);
    }
  };

  // Helper function để check field có bị lỗi không
  const getFieldErrorClass = (value: string, isRequired: boolean = false) => {
    if (!isRequired) return 'border-gray-300';
    return !value.trim() ? 'border-red-500 bg-red-50' : 'border-gray-300';
  };

  const calculateAge = (yearOfBirth?: number) => {
    if (!yearOfBirth) return 0;
    return new Date().getFullYear() - yearOfBirth;
  };

  if (loading) {
    return <div className="p-6">Đang tải...</div>;
  }
  
  if (!appointment) {
    return <div className="p-6">Không tìm thấy buổi tư vấn.</div>;
  }

  const ageDisplay = appointment?.user_id?.yearOfBirth ? `${calculateAge(appointment.user_id.yearOfBirth)} tuổi` : "Chưa rõ tuổi";

// Kiểm tra đã tới giờ khám chưa (cho phép trước 10 phút)
const isAppointmentTime = () => {
  if (!appointment?.slotTime_id?.start_time) return true; // Nếu không có thời gian thì cho phép
  
  const appointmentTime = new Date(appointment.slotTime_id.start_time);
  const now = new Date();
  const tenPhutTruoc = new Date(appointmentTime.getTime() - 10 * 60 * 1000); // 10 phút trước
  
  console.log('Time check:', {
    now: now.toISOString(),
    appointmentTime: appointmentTime.toISOString(),
    tenPhutTruoc: tenPhutTruoc.toISOString(),
    isTime: now >= tenPhutTruoc
  });
  
  return now >= tenPhutTruoc;
};

// Kiểm tra thời gian cuộc hẹn
const getAppointmentEndTime = () => {
  // Thử nhiều cách để lấy thời gian kết thúc appointment
  let endTime = null;
  
  // Cách 1: Từ slotTime_id.end_time
  if (appointment?.slotTime_id?.end_time) {
    endTime = new Date(appointment.slotTime_id.end_time);
  }
  // Cách 2: Từ dateBooking + 1 giờ
  else if (appointment?.dateBooking) {
    const startTime = new Date(appointment.dateBooking);
    endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 giờ
  }
  // Cách 3: Từ slotTime_id.start_time + 1 giờ
  else if (appointment?.slotTime_id?.start_time) {
    const startTime = new Date(appointment.slotTime_id.start_time);
    endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 giờ
  }
  
  return endTime;
};

// Kiểm tra xem cuộc hẹn đã kết thúc chưa
const isAppointmentEnded = () => {
  const endTime = getAppointmentEndTime();
  if (!endTime) return false; // Nếu không có thông tin thời gian thì cho phép chỉnh sửa
  
  const now = new Date();
  const isEnded = now > endTime;
  
  console.log('Appointment end check:', {
    now: now.toISOString(),
    endTime: endTime.toISOString(),
    isEnded,
    canEdit: !isEnded
  });
  
  return isEnded;
};

// Kiểm tra có thể chỉnh sửa report không
const canEditReport = () => {
  return !isAppointmentEnded(); // Chỉ cho chỉnh sửa khi appointment chưa kết thúc
};

// Kiểm tra có thể tạo Meet link hay không (cho phép trước 10 phút)
const canCreateMeetLink = (): boolean => {
  if (!appointment) return false;
  return appointment.status === 'confirmed' && isAppointmentTime();
};

// Kiểm tra xem có nên hiển thị lịch sử tư vấn không
const shouldShowHistory = () => {
  return !isAppointmentEnded(); // Chỉ hiện khi appointment chưa kết thúc
};

  // Hàm mở modal tạo Meet link
  const handleCreateMeetLink = () => {
    setMeetLinkInput(appointment?.meetLink || '');
    setShowMeetModal(true);
  };

  // Hàm cập nhật Meet link
  const handleUpdateMeetLink = async () => {
    if (!appointment || !meetLinkInput.trim()) {
      alert('Vui lòng nhập Meet link');
      return;
    }

    // Validate Meet link
    if (!meetLinkInput.includes('meet.google.com')) {
      alert('Vui lòng nhập Meet link hợp lệ từ Google Meet');
      return;
    }

    setMeetLinkLoading(true);
    try {
      await capNhatLinkMeetApi(appointment._id, meetLinkInput.trim());
      
      // Cập nhật appointment trong state
      setAppointment(prev => prev ? { ...prev, meetLink: meetLinkInput.trim() } : null);

      setShowMeetModal(false);
      setMeetLinkInput('');
      
      alert('Cập nhật Meet link thành công!');
      
    } catch (error: unknown) {
      console.error('Error updating Meet link:', error);
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data
        ? String(error.response.data.message)
        : 'Có lỗi xảy ra khi cập nhật Meet link';
      alert(errorMessage);
    }
    setMeetLinkLoading(false);
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center mb-8 text-sm">
          <button onClick={() => navigate(-1)} className="flex items-center text-[#283593] hover:underline">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Quay lại
          </button>
          <span className="mx-2">/</span>
          <span className="font-medium">{appointment?.user_id?.fullName}</span>
        </div>

        <div className={`grid grid-cols-1 ${shouldShowHistory() ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-8`}>
          {/* --- LEFT COLUMN --- */}
          <div className="lg:col-span-1 space-y-8 flex flex-col">
            {/* Patient Info Card (Compacted) */}
            <div className="bg-white rounded-2xl shadow border border-[#DBE8FA] overflow-hidden">
              <div className="p-4 flex items-center gap-4 border-b border-[#DBE8FA]">
                <User className="w-6 h-6 text-[#283593]" />
                <h2 className="text-lg font-semibold text-[#283593]">Thông tin bệnh nhân</h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-4">
                  <img src={appointment?.user_id?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment?.user_id?.fullName || '')}`} alt={appointment?.user_id?.fullName || ''} className="w-20 h-20 rounded-full object-cover" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{appointment?.user_id?.fullName}</h3>
                    <p className="text-gray-500">{ageDisplay}, {appointment?.user_id?.gender || 'Chưa rõ'}</p>
                  </div>
                </div>
                <div className="text-sm space-y-2">
                  {appointment?.user_id?.email && <div className="flex items-start gap-2"><Mail className="w-4 h-4 mt-0.5 text-[#283593] flex-shrink-0" /><span className="text-gray-700">{appointment.user_id.email}</span></div>}
                  {appointment?.user_id?.phoneNumber && <div className="flex items-start gap-2"><Phone className="w-4 h-4 mt-0.5 text-[#283593] flex-shrink-0" /><span className="text-gray-700">{appointment.user_id.phoneNumber}</span></div>}
                  {appointment?.user_id?.address && <div className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-[#283593] flex-shrink-0" /><span className="text-gray-700">{appointment.user_id.address}</span></div>}
                </div>
              </div>
            </div>

            {/* Google Meet Link Section */}
            {appointment?.status === 'confirmed' && (
              <div className="bg-white rounded-2xl shadow border border-[#DBE8FA] overflow-hidden">
                <div className="p-4 flex items-center gap-4 border-b border-[#DBE8FA]">
                  <Video className="w-6 h-6 text-[#283593]" />
                  <h2 className="text-lg font-semibold text-[#283593]">Google Meet</h2>
                </div>
                <div className="p-4 space-y-4">
                  {/* Thông tin cuộc hẹn */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">Thông tin buổi tư vấn:</h4>
                    <div className="space-y-1 text-sm text-blue-700">
                      <p><strong>Bệnh nhân:</strong> {appointment?.user_id?.fullName}</p>
                      <p><strong>Email:</strong> {appointment?.user_id?.email || 'Chưa có email'}</p>
                      <p><strong>Dịch vụ:</strong> {appointment?.service_id?.name || 'N/A'}</p>
                      <p><strong>Thời gian:</strong> {appointment?.dateBooking ? new Date(appointment.dateBooking).toLocaleString('vi-VN') : 'N/A'}</p>
                    </div>
                  </div>

                  {/* Thông báo chưa tới giờ */}
                  {!isAppointmentTime() && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-3 text-orange-800">
                        <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                          <Clock className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Chưa tới giờ khám</p>
                          <p className="text-xs text-orange-700 mt-1">Vui lòng đợi đến 10 phút trước giờ hẹn để tạo Google Meet link.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hướng dẫn */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-start gap-2">
                      <Video className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800 mb-2">Hướng dẫn tạo Google Meet:</p>
                        <ol className="text-xs text-green-700 list-decimal list-inside space-y-1">
                          <li>Mở Google Meet và tạo cuộc họp mới</li>
                          <li>Thêm email bệnh nhân: <strong>{appointment?.user_id?.email}</strong></li>
                          <li>Sao chép link Meet và dán vào ô bên dưới</li>
                          <li>Gửi link cho bệnh nhân qua email riêng</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Meet Link Status */}
                  {appointment?.meetLink ? (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-600" />
                          <span className="text-green-700 font-medium">Meet đã tạo thành công</span>
                        </div>
                        <button
                          onClick={handleCreateMeetLink}
                          disabled={!canCreateMeetLink()}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            canCreateMeetLink() 
                              ? 'bg-blue-600 text-white hover:bg-blue-700' 
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Cập nhật
                        </button>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-green-600 break-all">{appointment.meetLink}</p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleCreateMeetLink}
                      disabled={!canCreateMeetLink()}
                      className={`w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                        canCreateMeetLink() 
                          ? 'bg-blue-500 text-white hover:bg-blue-600' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Video className="w-5 h-5" />
                      Tạo Google Meet Link
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* --- Lịch sử tư vấn (Redesigned & Compacted) --- */}
            {shouldShowHistory() && (
            <div className="bg-white rounded-2xl shadow border border-[#DBE8FA] overflow-hidden">
              <div className="p-4 border-b border-[#DBE8FA]">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <h2 className="text-lg font-semibold text-[#283593] pt-1">
                      Lịch sử tư vấn của {appointment?.user_id?.fullName}
                    </h2>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[#E3EAFD] text-[#283593] font-semibold border border-[#DBE8FA] hover:bg-[#d1e0fa]">
                        <FileDown className="w-3 h-3" />
                        <span>Xuất báo cáo</span>
                    </button>
                </div>
              </div>
              {/* Search and Filters */}
              <div className="p-4 border-b border-[#DBE8FA]">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-grow min-w-[150px]">
                      <input 
                        type="text" 
                        placeholder="Tìm kiếm theo tên bệnh nhân..." 
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Lọc:</span>
                      <select 
                        className="p-2 border border-gray-300 rounded-md text-sm"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                          <option value="">Tất cả</option>
                          <option value="completed">Hoàn thành</option>
                          <option value="in-progress">Đang xử lý</option>
                      </select>
                    </div>
                </div>
              </div>
              {/* Record List */}
              <div className="p-4">
                {filteredAppointments.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>Không có báo cáo nào</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAppointments.map((report) => {
                      const appointmentData = report.appointmentData;
                      return (
                        <div 
                          key={report._id} 
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigate(`/consultant/reports/${report.appointment_id}`)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <img 
                                  src={appointmentData?.user_id?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(report.nameOfPatient || '')}`}
                                  alt={report.nameOfPatient || ''}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                                <div>
                                  <h4 className="font-semibold text-gray-800 text-base">{report.nameOfPatient}</h4>
                                  <p className="text-sm font-medium text-gray-600">{report.age} tuổi • {report.gender}</p>
                                  <p className="text-xs text-gray-500">{appointmentData?.service_id?.name || 'Dịch vụ tư vấn'}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    {appointmentData?.slotTime_id?.start_time ? (
                                      `${new Date(appointmentData.slotTime_id.start_time).toLocaleDateString('vi-VN')} - ${new Date(appointmentData.slotTime_id.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} đến ${new Date(appointmentData.slotTime_id.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                                    ) : appointmentData?.dateBooking ? (
                                      new Date(appointmentData.dateBooking).toLocaleDateString('vi-VN')
                                    ) : (
                                      `${new Date(report.createdAt).toLocaleDateString('vi-VN')} - ${new Date(report.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                                    )}
                                  </span>
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-700 mb-2">
                                <strong>Tình trạng:</strong> {report.condition}
                              </p>
                              
                              {report.notes && (
                                <p className="text-sm text-gray-600 mb-2">
                                  <strong>Ghi chú:</strong> {report.notes}
                                </p>
                              )}
                              
                              {report.recommendations && (
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  <strong>Khuyến nghị:</strong> {report.recommendations}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                              {report.status === 'completed' && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            )}
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className={`${shouldShowHistory() ? 'lg:col-span-2' : 'lg:col-span-1'} flex flex-col`}>
            {/* --- Tạo Ghi Nhận Mới (Form) --- */}
            <div className="bg-white rounded-2xl shadow border border-[#DBE8FA] overflow-hidden">
              <div className="p-4 flex items-center gap-4 border-b border-[#DBE8FA]">
                <Clipboard className="w-6 h-6 text-[#283593]" />
                <h2 className="text-lg font-semibold text-[#283593]">Tạo Ghi Nhận Mới</h2>
              </div>
              <form onSubmit={handleFormSubmit} className="p-4 space-y-4">
                {/* Thông báo chưa tới giờ */}
                {!isAppointmentTime() && (
                  <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                    <div className="flex items-center gap-3 text-orange-800">
                      <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                        <Clock className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Chưa tới giờ khám</p>
                        <p className="text-xs text-orange-700 mt-1">Vui lòng đợi đến 10 phút trước giờ hẹn để bắt đầu tạo báo cáo.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Thông báo đã quá giờ khám */}
                {!canEditReport() && (
                  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-3 text-amber-800">
                      <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Cuộc hẹn đã kết thúc</p>
                        <p className="text-xs text-amber-700 mt-1">Không thể chỉnh sửa báo cáo sau thời gian cuộc hẹn kết thúc.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buổi tư vấn</label>
                  <div className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-100">
                    {appointment?.slotTime_id?.start_time && appointment?.slotTime_id?.end_time
                      ? `${new Date(appointment.slotTime_id.start_time).toLocaleDateString('vi-VN')} - ${new Date(appointment.slotTime_id.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} đến ${new Date(appointment.slotTime_id.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                      : '-'}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên bệnh nhân <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={tenBenhNhan} 
                      onChange={e => setTenBenhNhan(e.target.value)} 
                      className={`w-full p-2 border ${getFieldErrorClass(tenBenhNhan, true)} rounded-md text-sm ${!isAppointmentTime() || !canEditReport() ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} 
                      readOnly={daGhiNhan && !dangChinhSua || !isAppointmentTime() || !canEditReport()} 
                      disabled={!isAppointmentTime() || !canEditReport()} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tuổi bệnh nhân <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={tuoiBenhNhan} 
                      onChange={e => setTuoiBenhNhan(e.target.value)} 
                      className={`w-full p-2 border ${getFieldErrorClass(tuoiBenhNhan, true)} rounded-md text-sm ${!isAppointmentTime() || !canEditReport() ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} 
                      readOnly={daGhiNhan && !dangChinhSua || !isAppointmentTime() || !canEditReport()} 
                      disabled={!isAppointmentTime() || !canEditReport()} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giới tính <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={gioiTinhBenhNhan}
                      onChange={e => setGioiTinhBenhNhan(e.target.value)}
                      className={`w-full p-2 border ${getFieldErrorClass(gioiTinhBenhNhan, true)} rounded-md text-sm ${!isAppointmentTime() || !canEditReport() ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                      disabled={daGhiNhan && !dangChinhSua || !isAppointmentTime() || !canEditReport()}
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                    Tình trạng / Chủ đề <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    id="condition" 
                    name="condition" 
                    value={newRecord.condition} 
                    onChange={handleInputChange} 
                    placeholder="VD: Stress, Lo âu..." 
                    className={`w-full p-2 border ${getFieldErrorClass(newRecord.condition, true)} rounded-md text-sm ${!isAppointmentTime() || !canEditReport() ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} 
                    readOnly={daGhiNhan && !dangChinhSua || !isAppointmentTime() || !canEditReport()} 
                    disabled={!isAppointmentTime() || !canEditReport()} 
                  />
                </div>
                <div>
                  <label htmlFor="consultation_notes" className="block text-sm font-medium text-gray-700 mb-1">Ghi chú buổi tư vấn</label>
                  <textarea 
                    id="consultation_notes" 
                    name="consultation_notes" 
                    value={newRecord.consultation_notes} 
                    onChange={handleInputChange} 
                    rows={4} 
                    placeholder="Chi tiết về buổi tư vấn..." 
                    className={`w-full p-2 border ${getFieldErrorClass(newRecord.consultation_notes, false)} rounded-md text-sm ${!isAppointmentTime() || !canEditReport() ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} 
                    readOnly={daGhiNhan && !dangChinhSua || !isAppointmentTime() || !canEditReport()} 
                    disabled={!isAppointmentTime() || !canEditReport()}
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="recommendations" className="block text-sm font-medium text-gray-700 mb-1">Khuyến nghị</label>
                  <textarea 
                    id="recommendations" 
                    name="recommendations" 
                    value={newRecord.recommendations} 
                    onChange={handleInputChange} 
                    rows={3} 
                    placeholder="Các bước tiếp theo cho bệnh nhân..." 
                    className={`w-full p-2 border ${getFieldErrorClass(newRecord.recommendations, false)} rounded-md text-sm ${!isAppointmentTime() || !canEditReport() ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} 
                    readOnly={daGhiNhan && !dangChinhSua || !isAppointmentTime() || !canEditReport()} 
                    disabled={!isAppointmentTime() || !canEditReport()}
                  ></textarea>
                </div>
                {isAppointmentTime() && canEditReport() && daGhiNhan && !dangChinhSua ? (
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-600"
                    onClick={() => {
                      setDangChinhSua(true);
                    }}
                  >
                    Chỉnh sửa ghi nhận
                  </button>
                ) : isAppointmentTime() && canEditReport() ? (
                  <div className="flex gap-2">
                    {dangChinhSua && (
                      <button
                        type="button"
                        className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-gray-500 text-white font-semibold hover:bg-gray-600"
                        onClick={() => {
                          setDangChinhSua(false);
                        }}
                      >
                        Hủy
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-[#283593] text-white font-semibold hover:bg-[#3a4bb3]"
                    >
                      {dangChinhSua ? 'Cập nhật' : 'Lưu Ghi Nhận'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <p className="text-sm">Chưa tới giờ khám. Vui lòng đợi đến 10 phút trước giờ hẹn.</p>
                  </div>
                )}
              </form>
            </div>
            {daGhiNhan && <div className="text-green-600 font-semibold mb-2">Đã ghi nhận</div>}
          </div>
        </div>
      </div>

      {/* Meet Link Modal */}
      {showMeetModal && appointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#283593]">
                  {appointment.meetLink ? 'Cập nhật' : 'Tạo'} Google Meet Link
                </h3>
                <button
                  onClick={() => setShowMeetModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Input Meet Link */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Meet Link:
                </label>
                <input
                  type="url"
                  value={meetLinkInput}
                  onChange={(e) => setMeetLinkInput(e.target.value)}
                  placeholder="https://meet.google.com/abc-def-ghi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#283593] focus:border-[#283593] text-sm"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowMeetModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdateMeetLink}
                  disabled={meetLinkLoading}
                  className="flex-1 px-4 py-2 bg-[#283593] text-white rounded-lg hover:bg-[#3a4bb3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {meetLinkLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {appointment.meetLink ? 'Cập nhật' : 'Tạo'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsDetails;
