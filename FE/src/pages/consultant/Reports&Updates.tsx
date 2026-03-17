import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Plus, Check, FileText, Calendar, Clock, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getReportByConsultantIdApi, getConsultantByAccountIdApi, getAppointmentByConsultantIdApi } from '../../api';

interface ApiReport {
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

interface Appointment {
  _id: string;
  user_id?: {
    fullName: string;
    photoUrl?: string;
  };
  service_id?: {
    name: string;
  };
  dateBooking: string;
  slotTime_id?: {
    start_time: string;
    end_time: string;
  };
}

interface Report {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientAvatar: string;
  customerName: string;
  customerAvatar: string;
  appointmentDate: string;
  appointmentTime: string;
  reportDate: string;
  status: 'completed' | 'in-progress' | 'draft';
  condition: string;
  notes: string;
  recommendations: string[];
  nextAppointment?: string;
  tags: string[];
  appointmentId: string;
}

const ReportsAndUpdates = () => {
  // State
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(5);

  // Fetch data từ API
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        
        const accountId = localStorage.getItem('userId') || 
                         localStorage.getItem('accountId') || 
                         localStorage.getItem('id') ||
                         sessionStorage.getItem('userId') ||
                         sessionStorage.getItem('accountId');
        
        if (!accountId) {
          setReports([]);
          setFilteredReports([]);
          setLoading(false);
          return;
        }

        // Lấy consultant info
        const consultantData = await getConsultantByAccountIdApi(accountId);
        const consultantId = consultantData._id;

        console.log('Current consultant ID:', consultantId); // Debug log

        // Lấy reports và appointments - chỉ của consultant hiện tại
        const [reportsData, appointmentsData] = await Promise.all([
          getReportByConsultantIdApi(consultantId), // Chỉ lấy reports do consultant này viết
          getAppointmentByConsultantIdApi(consultantId)
        ]);

        console.log('Reports data:', reportsData); // Debug log

        // Kiểm tra format data
        if (!Array.isArray(reportsData)) {
          setReports([]);
          setFilteredReports([]);
          return;
        }

        if (!Array.isArray(appointmentsData)) {
          setReports([]);
          setFilteredReports([]);
          return;
        }

        // Filter để đảm bảo chỉ lấy reports do consultant hiện tại viết
        const filteredReportsData = reportsData.filter((apiReport: ApiReport) => 
          apiReport.consultant_id === consultantId
        );

        console.log('Filtered reports by consultant ID:', filteredReportsData); // Debug log

        // Convert API data to component format
        const formattedReports: Report[] = filteredReportsData.map((apiReport: ApiReport) => {
          const matchingAppointment = appointmentsData.find((app: Appointment) => app._id === apiReport.appointment_id);
          
          const formattedReport = {
            id: apiReport._id,
            patientName: apiReport.nameOfPatient || 'Không có tên',
            patientAge: apiReport.age || 0,
            patientGender: apiReport.gender || 'Không rõ',
            patientAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(apiReport.nameOfPatient || 'Patient')}`,
            customerName: matchingAppointment?.user_id?.fullName || 'Không có tên',
            customerAvatar: matchingAppointment?.user_id?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(matchingAppointment?.user_id?.fullName || 'Customer')}`,
            appointmentDate: matchingAppointment?.dateBooking ? new Date(matchingAppointment.dateBooking).toLocaleDateString('vi-VN') : '',
            appointmentTime: matchingAppointment?.slotTime_id?.start_time ? 
              `${new Date(matchingAppointment.slotTime_id.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(matchingAppointment.slotTime_id.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'Chưa có thời gian',
            reportDate: new Date(apiReport.createdAt).toLocaleDateString('vi-VN'),
            status: apiReport.status as 'completed' | 'in-progress' | 'draft',
            condition: apiReport.condition || 'Không có thông tin',
            notes: apiReport.notes || 'Không có ghi chú',
            recommendations: apiReport.recommendations ? [apiReport.recommendations] : [],
            tags: [apiReport.condition || 'Không có thông tin'],
            appointmentId: apiReport.appointment_id,
            nextAppointment: undefined
          };
          
          return formattedReport;
        });

        setReports(formattedReports);
        setFilteredReports(formattedReports); // Set initial filtered reports
      } catch (error) {
        console.error('Lỗi khi fetch reports:', error);
        setReports([]);
        setFilteredReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Xử lý tìm kiếm và lọc
  useEffect(() => {
    if (reports.length === 0) {
      setFilteredReports([]);
      return;
    }

    let result = [...reports]; // Create a copy
    
    // Tìm kiếm theo tên bệnh nhân
    if (searchTerm) {
      result = result.filter(report => 
        report.patientName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sắp xếp theo ngày báo cáo (mới nhất lên đầu)
    result = result.sort((a, b) => {
      if (!a.reportDate) return 1;
      if (!b.reportDate) return -1;
      
      const [dayA, monthA, yearA] = a.reportDate.split('/').map(Number);
      const [dayB, monthB, yearB] = b.reportDate.split('/').map(Number);
      
      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);
      
      return dateB.getTime() - dateA.getTime();
    });
    
    setFilteredReports(result);
  }, [reports, searchTerm]);

  // Phân trang
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

  // Xử lý chuyển trang
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Hàm lấy màu dựa trên trạng thái
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Hàm lấy text trạng thái tiếng Việt
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Đã hoàn thành';
      case 'in-progress':
        return 'Đang tiến hành';
      case 'draft':
        return 'Bản nháp';
      default:
        return status;
    }
  };

  // Hàm lấy icon dựa trên trạng thái
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'draft':
        return <FileText className="w-4 h-4 text-gray-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Báo cáo & Cập nhật</h1>
            <p className="text-gray-600 mt-2">Quản lý báo cáo sau các buổi tư vấn và theo dõi tiến trình</p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-blue-600 px-4 py-2 rounded-lg shadow-sm text-white flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Thêm báo cáo
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8 max-w-md">
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Tổng số báo cáo</p>
                <h3 className="text-2xl font-bold text-gray-800">{reports.length}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm theo tên bệnh nhân..." 
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full md:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-6 mb-8">
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Đang tải báo cáo...</h3>
              <p className="text-gray-500">Vui lòng chờ trong giây lát</p>
            </div>
          ) : currentReports.length > 0 ? (
            currentReports.map((report) => (
              <div key={report.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div className="flex items-center">
                      <img 
                        src={report.patientAvatar} 
                        alt={report.patientName} 
                        className="w-12 h-12 rounded-full object-cover mr-4"
                      />
                      <div>
                        <Link 
                          to={`/consultants/reports/${report.appointmentId}`} 
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {report.patientName}
                        </Link>
                        <div className="text-sm font-medium text-gray-600">
                          {report.patientAge > 0 ? `${report.patientAge} tuổi` : 'Chưa rõ tuổi'}
                          {' • '}
                          {report.patientGender || 'Chưa rõ giới tính'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Buổi tư vấn: {report.appointmentDate} • {report.appointmentTime}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        <span className="ml-1">{getStatusText(report.status)}</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <MoreHorizontal className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Thông tin khách hàng */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <img 
                        src={report.customerAvatar} 
                        alt={report.customerName} 
                        className="w-8 h-8 rounded-full object-cover mr-3"
                      />
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Tài khoản đặt lịch</h4>
                        <p className="text-sm text-gray-600">{report.customerName}</p>
                        {report.customerName !== report.patientName && (
                          <p className="text-xs text-gray-500">Đặt lịch cho: {report.patientName}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Tình trạng:</h4>
                        <p className="text-gray-600">{report.condition}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Ghi chú:</h4>
                        <p className="text-gray-600">{report.notes}</p>
                      </div>
                    </div>
                    
                    {report.recommendations.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Khuyến nghị:</h4>
                        <ul className="list-disc pl-5 text-gray-600 space-y-1">
                          {report.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      {report.tags.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {report.nextAppointment && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-sm">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">Buổi hẹn tiếp theo: </span>
                        <span className="font-medium text-gray-800 ml-1">{report.nextAppointment}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex justify-end gap-2">
                    {report.status === 'completed' ? (
                      <Link to={`/consultants/reports/${report.appointmentId}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Xem chi tiết
                      </Link>
                    ) : (
                      <Link to={`/consultants/reports/${report.appointmentId}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        {report.status === 'draft' ? 'Tiếp tục chỉnh sửa' : 'Tạo báo cáo'}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy báo cáo nào</h3>
              <p className="text-gray-500">Không có báo cáo nào phù hợp với điều kiện tìm kiếm của bạn.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredReports.length > reportsPerPage && (
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
            <div className="hidden md:block">
              <p className="text-sm text-gray-700">
                Hiển thị <span className="font-medium">{indexOfFirstReport + 1}</span> đến <span className="font-medium">
                  {Math.min(indexOfLastReport, filteredReports.length)}
                </span> trong <span className="font-medium">{filteredReports.length}</span> kết quả
              </p>
            </div>
            
            <div className="flex-1 flex justify-between md:justify-end">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md mr-2 ${
                  currentPage === 1 
                    ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Trước
              </button>
              
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                  currentPage === totalPages 
                    ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Sau
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsAndUpdates;
