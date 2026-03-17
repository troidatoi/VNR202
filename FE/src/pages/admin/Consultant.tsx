import React, { useEffect, useState, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../api';
import ConsultantScheduleModal from '../../components/admin/ConsultantScheduleModal';

// Interface cho dữ liệu tư vấn viên
interface IConsultant {
  _id: string;
  accountId: {
    _id: string;
    username: string;
    email: string;
    photoUrl?: string;
    fullName: string;
    phoneNumber: string;
    role: string;
    gender?: string;
  };
  introduction: string;
  contact: string;
  startDateofWork: string;
  status: 'active' | 'inactive' | 'isDeleted';
  createdAt: string;
  updatedAt: string;
}

// Interface cho dữ liệu chứng chỉ
interface ICertificate {
  _id: string;
  consultant_id: { _id: string };
  title: string;
  type: string;
  issuedBy: number;
  issueDate: string;
  expireDate?: string;
  description?: string;
  fileUrl: string;
}

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

interface IFormData {
  accountId: string;
  fullName: string;
  email: string;
  phone: string;
  introduction: string;
  contact: string;
  startDateofWork: string;
  status: 'active' | 'inactive' | 'isDeleted';
}

// Form data cho chứng chỉ
interface ICertificateFormData {
  consultant_id: string;
  title: string;
  type: string;
  issuedBy: number;
  issueDate: string;
  expireDate: string;
  description: string;
  fileUrl: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition bg-gray-800 text-white text-xs rounded py-1 px-2 -top-10 left-1/2 transform -translate-x-1/2 w-max">
        {text}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-full w-2 h-2 bg-gray-800 rotate-45"></div>
      </div>
    </div>
  );
};

const Consultant: React.FC = () => {
  const [consultants, setConsultants] = useState<IConsultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<IConsultant | null>(null);
  const [formData, setFormData] = useState<IFormData>({
    accountId: '',
    fullName: '',
    email: '',
    phone: '',
    introduction: '',
    contact: '',
    startDateofWork: '',
    status: 'active'
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // State cho chứng chỉ
  const [certificates, setCertificates] = useState<ICertificate[]>([]);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [certificateError, setCertificateError] = useState<string | null>(null);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isCreateCertificateModalOpen, setIsCreateCertificateModalOpen] = useState(false);
  const [isUpdateCertificateModalOpen, setIsUpdateCertificateModalOpen] = useState(false);
  const [isDeleteCertificateModalOpen, setIsDeleteCertificateModalOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<ICertificate | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [certificateFormData, setCertificateFormData] = useState<ICertificateFormData>({
    consultant_id: '',
    title: '',
    type: '',
    issuedBy: 0,
    issueDate: '',
    expireDate: '',
    description: '',
    fileUrl: ''
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State cho quản lý lịch làm việc
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;
  const totalPages = Math.ceil(consultants.length / rowsPerPage);
  const paginatedConsultants = consultants.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  
  // Hàm xử lý mở modal xem ảnh chứng chỉ to
  const handleOpenImagePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };

  // Hàm xử lý đóng modal xem ảnh chứng chỉ to
  const handleCloseImagePreview = () => {
    setPreviewImage(null);
  };

  const fetchConsultants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/consultants');
      setConsultants(response.data);
      setError(null);
    } catch (err) {
      console.error('API Error:', err);
      setError('Có lỗi xảy ra khi tải danh sách tư vấn viên');
      toast.error('Không thể tải danh sách tư vấn viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultants();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenUpdateModal = (consultant: IConsultant) => {
    setSelectedConsultant(consultant);
    setFormData({
      accountId: consultant.accountId._id,
      fullName: consultant.accountId.fullName,
      email: consultant.accountId.email,
      phone: consultant.accountId.phoneNumber,
      introduction: consultant.introduction,
      contact: consultant.contact,
      startDateofWork: consultant.startDateofWork,
      status: consultant.status,
    });
    setAvatarPreview(consultant.accountId.photoUrl || null);
    setIsUpdateModalOpen(true);
  };

  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedConsultant(null);
    setFormData({
      accountId: '',
      fullName: '',
      email: '',
      phone: '',
      introduction: '',
      contact: '',
      startDateofWork: '',
      status: 'active'
    });
  };

  const handleUpdateConsultant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsultant) return;

    try {
      // Cập nhật thông tin consultant - không gửi accountId vì không nên thay đổi
      const consultantData = {
        introduction: formData.introduction,
        contact: formData.contact,
        startDateofWork: formData.startDateofWork,
        status: formData.status
      };
      
      const response = await api.put(`/consultants/${selectedConsultant._id}`, consultantData);
      
      setConsultants(prev =>
        prev.map(consultant =>
          consultant._id === selectedConsultant._id ? response.data : consultant
        )
      );
      handleCloseUpdateModal();
      toast.success('Cập nhật tư vấn viên thành công!');
    } catch (error) {
      console.error('Error updating consultant:', error);
      toast.error('Có lỗi xảy ra khi cập nhật tư vấn viên!');
    }
  };

  const handleDeleteConsultant = async () => {
    if (!selectedConsultant) return;

    try {
      await api.delete(`/consultants/${selectedConsultant._id}`);
      setConsultants(prev =>
        prev.filter(consultant => consultant._id !== selectedConsultant._id)
      );
      handleCloseDeleteModal();
      toast.success('Xóa tư vấn viên thành công!');
    } catch {
      toast.error('Có lỗi xảy ra khi xóa tư vấn viên!');
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedConsultant(null);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setAvatarPreview(URL.createObjectURL(file));
    
    try {
      setIsUploadingAvatar(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/uploads/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (selectedConsultant && response.data.imageUrl) {
        // Cập nhật avatar cho consultant (dùng updateAccountApi)
        await api.put(`/accounts/${selectedConsultant.accountId._id}`, {
          photoUrl: response.data.imageUrl
        });
        // Cập nhật lại state consultants để hiển thị avatar mới
        setConsultants(prev => prev.map(consultant =>
          consultant._id === selectedConsultant._id
            ? { ...consultant, accountId: { ...consultant.accountId, photoUrl: response.data.imageUrl } }
            : consultant
        ));
        toast.success('Cập nhật ảnh đại diện thành công!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Có lỗi xảy ra khi tải ảnh lên!');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Hàm xử lý upload file cho chứng chỉ
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type (chỉ cho phép ảnh)
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận file ảnh (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/uploads/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setCertificateFormData(prev => ({
        ...prev,
        fileUrl: response.data.imageUrl
      }));
      
      toast.success('Tải ảnh lên thành công!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Có lỗi xảy ra khi tải ảnh lên');
    } finally {
      setUploading(false);
    }
  };

  // Xử lý khi nhấn nút chọn file
  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Fetch certificates từ API theo consultant_id
  const fetchCertificatesByConsultant = async (consultantId: string) => {
    if (!consultantId) {
      return;
    }
    
    try {
      setCertificateLoading(true);
      const response = await api.get(`/certificates/consultant/${consultantId}`);
      setCertificates(response.data);
      setCertificateError(null);
    } catch {
      // Nếu không có chứng chỉ, hiển thị danh sách trống thay vì thông báo lỗi
      setCertificates([]);
      setCertificateError(null);
    } finally {
      setCertificateLoading(false);
    }
  };

  // Format certificate date
  const formatCertificateDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Get issuer name from id
  const getIssuerName = (issuerId: number) => {
    switch(issuerId) {
      case 1000:
        return "FPT University";
      case 1001:
        return "Công ty ABC";
      case 1002:
        return "Tổ chức XYZ";
      case 1003:
        return "Hiệp hội nghề nghiệp";
      case 1004:
        return "Trung tâm đào tạo";
      default:
        return `Đơn vị ${issuerId}`;
    }
  };

  // Handle certificate form input change
  const handleCertificateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCertificateFormData(prev => ({
      ...prev,
      [name]: name === 'issuedBy' ? Number(value) : value
    }));
  };

  // Open certificate modal
  const handleOpenCertificateModal = (consultant: IConsultant) => {
    setSelectedConsultant(consultant);
    fetchCertificatesByConsultant(consultant._id);
    setIsCertificateModalOpen(true);
  };

  // Close certificate modal
  const handleCloseCertificateModal = () => {
    setIsCertificateModalOpen(false);
    setSelectedConsultant(null);
    setCertificates([]);
  };

  // Hàm xử lý mở modal lịch làm việc
  const handleOpenScheduleModal = (consultant: IConsultant) => {
    setSelectedConsultant(consultant);
    setIsScheduleModalOpen(true);
  };

  // Hàm xử lý đóng modal lịch làm việc
  const handleCloseScheduleModal = () => {
    setIsScheduleModalOpen(false);
    setSelectedConsultant(null);
  };

  // Open create certificate modal
  const handleOpenCreateCertificateModal = () => {
    if (!selectedConsultant) return;
    
    const today = new Date().toISOString().slice(0, 10);
    
    setCertificateFormData({
      consultant_id: selectedConsultant._id,
      title: '',
      type: '',
      issuedBy: 1000, // Giá trị mặc định là FPT University
      issueDate: today,
      expireDate: '',
      description: '',
      fileUrl: ''
    });
    setIsCreateCertificateModalOpen(true);
  };

  // Close create certificate modal
  const handleCloseCreateCertificateModal = () => {
    setIsCreateCertificateModalOpen(false);
  };

  // Handle create certificate
  const handleCreateCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate form
    const todayStr = new Date().toISOString().slice(0, 10);
    let errorMsg = '';
    if (!certificateFormData.consultant_id || !certificateFormData.title || !certificateFormData.type || 
        !certificateFormData.issueDate || !certificateFormData.fileUrl) {
      errorMsg = 'Vui lòng điền đầy đủ thông tin bắt buộc!';
    } else if (certificateFormData.issueDate > todayStr) {
      errorMsg = 'Ngày cấp không được là ngày trong tương lai!';
    } else if (certificateFormData.expireDate) {
      if (certificateFormData.expireDate < todayStr) {
        errorMsg = 'Ngày hết hạn không được là ngày trong quá khứ!';
      } else if (certificateFormData.expireDate < certificateFormData.issueDate) {
        errorMsg = 'Ngày hết hạn không được trước ngày cấp!';
      }
    }
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }
    try {
      const response = await api.post('/certificates', certificateFormData);
      setCertificates(prev => [...prev, response.data]);
      handleCloseCreateCertificateModal();
      toast.success('Tạo chứng chỉ thành công!');
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(`Có lỗi xảy ra khi tạo chứng chỉ: ${apiError.response?.data?.message || 'Lỗi không xác định'}`);
    }
  };

  // Open update certificate modal
  const handleOpenUpdateCertificateModal = (certificate: ICertificate) => {
    setSelectedCertificate(certificate);
    
    // Format dates for input fields
    const formatDateForInput = (dateString: string) => {
      if (!dateString) return '';
      return new Date(dateString).toISOString().slice(0, 10);
    };
    
    setCertificateFormData({
      consultant_id: (typeof certificate.consultant_id === 'object' ? certificate.consultant_id._id : certificate.consultant_id) || '',
      title: certificate.title,
      type: certificate.type,
      issuedBy: certificate.issuedBy,
      issueDate: formatDateForInput(certificate.issueDate),
      expireDate: formatDateForInput(certificate.expireDate || ''),
      description: certificate.description || '',
      fileUrl: certificate.fileUrl
    });
    setIsUpdateCertificateModalOpen(true);
  };

  // Close update certificate modal
  const handleCloseUpdateCertificateModal = () => {
    setIsUpdateCertificateModalOpen(false);
    setSelectedCertificate(null);
  };

  // Handle update certificate
  const handleUpdateCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCertificate) return;
    // Validate form
    const todayStr = new Date().toISOString().slice(0, 10);
    let errorMsg = '';
    if (!certificateFormData.consultant_id || !certificateFormData.title || !certificateFormData.type || 
        !certificateFormData.issueDate || !certificateFormData.fileUrl) {
      errorMsg = 'Vui lòng điền đầy đủ thông tin bắt buộc!';
    } else if (certificateFormData.issueDate > todayStr) {
      errorMsg = 'Ngày cấp không được là ngày trong tương lai!';
    } else if (certificateFormData.expireDate) {
      if (certificateFormData.expireDate < todayStr) {
        errorMsg = 'Ngày hết hạn không được là ngày trong quá khứ!';
      } else if (certificateFormData.expireDate < certificateFormData.issueDate) {
        errorMsg = 'Ngày hết hạn không được trước ngày cấp!';
      }
    }
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }
    try {
      const response = await api.put(`/certificates/${selectedCertificate._id}`, certificateFormData);
      setCertificates(prev =>
        prev.map(cert =>
          cert._id === selectedCertificate._id ? response.data : cert
        )
      );
      handleCloseUpdateCertificateModal();
      toast.success('Cập nhật chứng chỉ thành công!');
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(`Có lỗi xảy ra khi cập nhật chứng chỉ: ${apiError.response?.data?.message || 'Lỗi không xác định'}`);
    }
  };

  // Open delete certificate modal
  const handleOpenDeleteCertificateModal = (certificate: ICertificate) => {
    setSelectedCertificate(certificate);
    setIsDeleteCertificateModalOpen(true);
  };

  // Close delete certificate modal
  const handleCloseDeleteCertificateModal = () => {
    setIsDeleteCertificateModalOpen(false);
    setSelectedCertificate(null);
  };

  // Handle delete certificate
  const handleDeleteCertificate = async () => {
    if (!selectedCertificate) return;

    try {
      await api.delete(`/certificates/${selectedCertificate._id}`);
      
      setCertificates(prev =>
        prev.filter(cert => cert._id !== selectedCertificate._id)
      );
      
      handleCloseDeleteCertificateModal();
      toast.success('Xóa chứng chỉ thành công!');
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(`Có lỗi xảy ra khi xóa chứng chỉ: ${apiError.response?.data?.message || 'Lỗi không xác định'}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg mt-4">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Quản lý tư vấn viên</h1>
      </div>

      {/* Phần tìm kiếm và lọc */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-700 mb-4">Tìm kiếm và Lọc</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tìm kiếm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Tìm theo tên, email..."
                className="focus:ring-amber-500 focus:border-amber-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                onChange={() => {}}
              />
            </div>
          </div>
          
          {/* Lọc theo trạng thái */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md"
              onChange={() => {}}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>
          
          {/* Lọc theo ngày bắt đầu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
            <input
              type="date"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md"
              onChange={() => {}}
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Đặt lại bộ lọc
          </button>
        </div>
      </div>

            <div className="overflow-x-auto shadow-md rounded-lg max-h-[70vh] overflow-y-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gradient-to-r from-amber-50 to-cyan-50 text-gray-700 text-left text-sm font-semibold uppercase tracking-wider">
              <th className="px-4 py-3 rounded-tl-lg">Họ và tên</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-center">Lịch làm việc</th>
              <th className="px-4 py-3 rounded-tr-lg text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm divide-y divide-gray-200">
            {paginatedConsultants.map(consultant => (
              <tr key={consultant._id} className="hover:bg-amber-50 transition-colors duration-150">
                <td className="px-4 py-3 font-medium flex items-center">
                  <img src={consultant.accountId.photoUrl || '/avarta.png'} alt="avatar" className="w-10 h-10 rounded-full object-cover mr-2 inline-block" />
                  {consultant.accountId.fullName}
                </td>
                <td className="px-4 py-3">{consultant.accountId.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      consultant.status === 'active'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : consultant.status === 'inactive'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}
                  >
                    {consultant.status === 'active' ? 'Hoạt động' : consultant.status === 'inactive' ? 'Không hoạt động' : 'Đã xóa'}
                  </span>
                </td>
                                            <td className="px-4 py-3 text-center">
                  <button 
                    onClick={() => handleOpenScheduleModal(consultant)}
                    className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs border border-amber-200 hover:bg-amber-100 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Xem lịch
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center space-x-2">
                    <Tooltip text="Xem chi tiết">
                      <button
                        onClick={() => { setSelectedConsultant(consultant); setIsDetailModalOpen(true); }}
                        className="p-2 rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </Tooltip>

                    <Tooltip text="Chỉnh sửa">
                      <button
                        onClick={() => handleOpenUpdateModal(consultant)}
                        className="p-2 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </Tooltip>

                    <Tooltip text="Quản lý chứng chỉ">
                      <button
                        onClick={() => handleOpenCertificateModal(consultant)}
                        className="p-2 rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex justify-center items-center mt-4 gap-2">
        <button
          className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Trước
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        <button
          className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Sau
        </button>
      </div>

      {/* Modal Cập nhật */}
      {isUpdateModalOpen && selectedConsultant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-semibold text-gray-800">Cập nhật thông tin tư vấn viên</h3>
            </div>
            
            <form onSubmit={handleUpdateConsultant}>
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cột trái: Avatar và thông tin tài khoản */}
                  <div className="space-y-4">
                    <div className="flex flex-col items-center">
                      <img 
                        src={avatarPreview || selectedConsultant.accountId.photoUrl || 'https://via.placeholder.com/150'} 
                        alt="Avatar" 
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                      />
                      <input 
                        type="file" 
                        id="avatar-upload-update" 
                        className="hidden" 
                        onChange={handleAvatarChange} 
                        accept="image/*"
                      />
                      <label 
                        htmlFor="avatar-upload-update" 
                        className="mt-3 px-4 py-2 bg-amber-100 text-amber-700 text-sm font-medium rounded-lg cursor-pointer hover:bg-amber-200 transition"
                      >
                        {isUploadingAvatar ? 'Đang tải lên...' : 'Thay đổi ảnh đại diện'}
                      </label>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h4 className="font-semibold text-gray-700 mb-2">Thông tin tài khoản (chỉ đọc)</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Họ tên:</strong> {selectedConsultant.accountId.fullName}</p>
                        <p><strong>Email:</strong> {selectedConsultant.accountId.email}</p>
                        <p><strong>SĐT:</strong> {selectedConsultant.accountId.phoneNumber}</p>
                      </div>
                    </div>
                  </div>

                  {/* Cột phải: Form thông tin */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Giới thiệu</label>
                      <textarea
                        name="introduction"
                        value={formData.introduction}
                        onChange={handleInputChange}
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                        placeholder="Nhập thông tin giới thiệu về tư vấn viên"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Thông tin liên hệ</label>
                      <input
                        type="text"
                        name="contact"
                        value={formData.contact}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                        placeholder="Thông tin liên hệ thêm (nếu có)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ngày bắt đầu làm việc</label>
                      <input
                        type="date"
                        name="startDateofWork"
                        value={formData.startDateofWork ? new Date(formData.startDateofWork).toISOString().split('T')[0] : ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                      >
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Không hoạt động</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
                <button type="button" onClick={handleCloseUpdateModal} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xóa */}
      {isDeleteModalOpen && selectedConsultant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Xác nhận xóa</h2>
              <button
                onClick={handleCloseDeleteModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p>Bạn có chắc chắn muốn xóa tư vấn viên "{selectedConsultant.accountId.fullName}"?</p>
              <p className="text-sm text-gray-500 mt-2">Hành động này không thể hoàn tác.</p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseDeleteModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConsultant}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailModalOpen && selectedConsultant && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="text-center">
              <img src={selectedConsultant.accountId.photoUrl || '/avarta.png'} alt="avatar" className="w-24 h-24 rounded-full object-cover mx-auto mb-2 border-2 border-amber-200" />
              <h3 className="text-xl font-bold text-gray-800">{selectedConsultant.accountId.fullName}</h3>
              <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${selectedConsultant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {selectedConsultant.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
              </span>
            </div>
            <div className="mt-4 border-t pt-4 text-sm text-gray-700 space-y-2">
              <p><strong>Email:</strong> {selectedConsultant.accountId.email}</p>
              <p><strong>Số điện thoại:</strong> {selectedConsultant.accountId.phoneNumber}</p>
              <p><strong>Giới thiệu:</strong> {selectedConsultant.introduction}</p>
              <p><strong>Thông tin liên hệ:</strong> {selectedConsultant.contact}</p>
              <p><strong>Số năm làm việc:</strong> {(() => {
                  if (!selectedConsultant.startDateofWork) return 'Chưa cập nhật';
                  const startYear = new Date(selectedConsultant.startDateofWork).getFullYear();
                  if (isNaN(startYear)) return 'Chưa cập nhật';
                  const currentYear = new Date().getFullYear();
                  const years = currentYear - startYear;
                  return years >= 0 ? `${years} năm` : 'Chưa cập nhật';
              })()}</p>
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Modal quản lý chứng chỉ */}
      {isCertificateModalOpen && selectedConsultant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
              <div className="flex items-center">
                <img 
                  src={selectedConsultant.accountId.photoUrl || '/avarta.png'} 
                  alt={selectedConsultant.accountId.fullName} 
                  className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-amber-200"
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Quản lý chứng chỉ</h2>
                  <p className="text-gray-600">{selectedConsultant.accountId.fullName}</p>
                </div>
              </div>
              <button
                onClick={handleCloseCertificateModal}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="flex justify-end mb-6">
              <button
                onClick={handleOpenCreateCertificateModal}
                className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 flex items-center shadow-md transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Thêm chứng chỉ
              </button>
            </div>

            {/* Hiển thị trạng thái loading */}
            {certificateLoading && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
              </div>
            )}

            {/* Hiển thị thông báo lỗi */}
            {certificateError && !certificateLoading && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
                <div className="flex items-center">
                  <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>{certificateError}</p>
                </div>
              </div>
            )}

            {/* Hiển thị thông báo không có dữ liệu */}
            {!certificateLoading && !certificateError && certificates.length === 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-700 p-4 mb-6 rounded flex items-center">
                <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Chưa có chứng chỉ nào cho tư vấn viên này. Hãy thêm chứng chỉ mới!</p>
              </div>
            )}

            {/* Bảng chứng chỉ */}
            {!certificateLoading && !certificateError && certificates.length > 0 && (
              <div className="overflow-x-auto shadow-md rounded-lg max-h-[70vh] overflow-y-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gradient-to-r from-amber-50 to-cyan-50 text-gray-700 text-left text-sm font-semibold uppercase tracking-wider">
                      <th className="px-4 py-3 rounded-tl-lg">Tiêu đề</th>
                      <th className="px-4 py-3">Loại</th>
                      <th className="px-4 py-3">Ngày cấp</th>
                      <th className="px-4 py-3">Ngày hết hạn</th>
                      <th className="px-4 py-3">Cấp bởi</th>
                      <th className="px-4 py-3 rounded-tr-lg text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-sm divide-y divide-gray-200">
                    {certificates.map((certificate) => (
                      <tr key={certificate._id} className="hover:bg-amber-50 transition-colors duration-150">
                        <td className="px-4 py-3 font-medium">
                          <a 
                            href={certificate.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-amber-600 hover:text-amber-900 hover:underline flex items-center"
                          >
                            {certificate.title}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </td>
                        <td className="px-4 py-3">{certificate.type}</td>
                        <td className="px-4 py-3">{formatCertificateDate(certificate.issueDate)}</td>
                        <td className="px-4 py-3">{certificate.expireDate ? formatCertificateDate(certificate.expireDate) : 'Không có'}</td>
                        <td className="px-4 py-3">{getIssuerName(certificate.issuedBy)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center space-x-2">
                            <Tooltip text="Xem ảnh chứng chỉ">
                              <a
                                href={certificate.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 relative group"
                                onClick={(e) => {
                                  // Ngăn chặn mở link nếu người dùng chỉ muốn xem trước
                                  if (e.ctrlKey || e.metaKey) {
                                    // Cho phép mở trong tab mới khi nhấn Ctrl/Cmd + Click
                                    return;
                                  }
                                  e.preventDefault();
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                                <div className="absolute hidden group-hover:block transition-opacity bg-white p-3 rounded-md shadow-lg -top-48 left-1/2 transform -translate-x-1/2 z-50 border border-amber-100">
                                  <div className="text-center mb-1 text-xs text-gray-500">Xem trước chứng chỉ</div>
                                  <img 
                                    src={certificate.fileUrl} 
                                    alt="Xem trước chứng chỉ" 
                                    className="h-40 w-auto max-w-[280px] object-contain border border-gray-200 rounded cursor-pointer hover:border-amber-300"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenImagePreview(certificate.fileUrl);
                                    }}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.onerror = null;
                                      target.src = '/avarta.png'; // Sử dụng ảnh placeholder có sẵn
                                    }}
                                  />
                                </div>
                              </a>
                            </Tooltip>
                            
                            <Tooltip text="Cập nhật">
                              <button
                                onClick={() => handleOpenUpdateCertificateModal(certificate)}
                                className="p-2 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                            </Tooltip>

                            <Tooltip text="Xóa">
                              <button
                                onClick={() => handleOpenDeleteCertificateModal(certificate)}
                                className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal tạo chứng chỉ mới */}
      {isCreateCertificateModalOpen && selectedConsultant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold text-gray-800">Thêm chứng chỉ mới</h2>
              <button
                onClick={handleCloseCreateCertificateModal}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateCertificate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề chứng chỉ</label>
                <input
                  type="text"
                  name="title"
                  value={certificateFormData.title}
                  onChange={handleCertificateInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  required
                  placeholder="Nhập tiêu đề chứng chỉ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại chứng chỉ</label>
                <input
                  type="text"
                  name="type"
                  value={certificateFormData.type}
                  onChange={handleCertificateInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  required
                  placeholder="Ví dụ: Kỹ năng, Ngoại ngữ, Chuyên môn..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị cấp</label>
                <select
                  name="issuedBy"
                  value={certificateFormData.issuedBy}
                  onChange={handleCertificateInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  required
                >
                  <option value="">-- Chọn đơn vị cấp --</option>
                  <option value="1000">FPT University</option>
                  <option value="1001">Công ty ABC</option>
                  <option value="1002">Tổ chức XYZ</option>
                  <option value="1003">Hiệp hội nghề nghiệp</option>
                  <option value="1004">Trung tâm đào tạo</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày cấp</label>
                  <input
                    type="date"
                    name="issueDate"
                    value={certificateFormData.issueDate}
                    onChange={handleCertificateInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn (nếu có)</label>
                  <input
                    type="date"
                    name="expireDate"
                    value={certificateFormData.expireDate}
                    onChange={handleCertificateInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  name="description"
                  value={certificateFormData.description}
                  onChange={handleCertificateInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  placeholder="Mô tả chi tiết về chứng chỉ này"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh chứng chỉ</label>
                <div className="mt-1 flex items-center">
                  {certificateFormData.fileUrl ? (
                    <div className="flex flex-col space-y-2 w-full">
                      <div className="flex items-center justify-between">
                        <a
                          href={certificateFormData.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-600 hover:text-amber-900 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Xem ảnh đã tải lên
                        </a>
                        <button
                          type="button"
                          onClick={() => setCertificateFormData(prev => ({ ...prev, fileUrl: '' }))}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                      <div className="mt-2 border rounded-md p-1 bg-gray-50">
                        <img 
                          src={certificateFormData.fileUrl} 
                          alt="Xem trước chứng chỉ" 
                          className="w-full max-h-60 object-contain rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = '/avarta.png';
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSelectFile}
                      className="w-full px-4 py-3 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300"
                      disabled={uploading}
                    >
                      {uploading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Đang tải...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Nhấp để chọn ảnh chứng chỉ
                        </span>
                      )}
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">Tải lên ảnh chứng chỉ để làm bằng chứng xác thực. Chỉ chấp nhận file JPG, PNG, GIF (tối đa 5MB).</p>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseCreateCertificateModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md shadow-sm transition-colors"
                  disabled={uploading}
                >
                  Tạo chứng chỉ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal cập nhật chứng chỉ */}
      {isUpdateCertificateModalOpen && selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold text-gray-800">Cập nhật chứng chỉ</h2>
              <button
                onClick={handleCloseUpdateCertificateModal}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateCertificate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề chứng chỉ</label>
                <input
                  type="text"
                  name="title"
                  value={certificateFormData.title}
                  onChange={handleCertificateInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  required
                  placeholder="Nhập tiêu đề chứng chỉ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại chứng chỉ</label>
                <input
                  type="text"
                  name="type"
                  value={certificateFormData.type}
                  onChange={handleCertificateInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  required
                  placeholder="Ví dụ: Kỹ năng, Ngoại ngữ, Chuyên môn..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị cấp</label>
                <select
                  name="issuedBy"
                  value={certificateFormData.issuedBy}
                  onChange={handleCertificateInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  required
                >
                  <option value="">-- Chọn đơn vị cấp --</option>
                  <option value="1000">FPT University</option>
                  <option value="1001">Công ty ABC</option>
                  <option value="1002">Tổ chức XYZ</option>
                  <option value="1003">Hiệp hội nghề nghiệp</option>
                  <option value="1004">Trung tâm đào tạo</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày cấp</label>
                  <input
                    type="date"
                    name="issueDate"
                    value={certificateFormData.issueDate}
                    onChange={handleCertificateInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn (nếu có)</label>
                  <input
                    type="date"
                    name="expireDate"
                    value={certificateFormData.expireDate}
                    onChange={handleCertificateInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  name="description"
                  value={certificateFormData.description}
                  onChange={handleCertificateInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  placeholder="Mô tả chi tiết về chứng chỉ này"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh chứng chỉ</label>
                <div className="mt-1 flex items-center">
                  {certificateFormData.fileUrl ? (
                    <div className="flex flex-col space-y-2 w-full">
                      <div className="flex items-center justify-between">
                        <a
                          href={certificateFormData.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-600 hover:text-amber-900 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Xem ảnh đã tải lên
                        </a>
                        <button
                          type="button"
                          onClick={() => setCertificateFormData(prev => ({ ...prev, fileUrl: '' }))}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                      <div className="mt-2 border rounded-md p-1 bg-gray-50">
                        <img 
                          src={certificateFormData.fileUrl} 
                          alt="Xem trước chứng chỉ" 
                          className="w-full max-h-60 object-contain rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = '/avarta.png';
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSelectFile}
                      className="w-full px-4 py-3 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300"
                      disabled={uploading}
                    >
                      {uploading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Đang tải...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Nhấp để chọn ảnh chứng chỉ
                        </span>
                      )}
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">Tải lên ảnh chứng chỉ để làm bằng chứng xác thực. Chỉ chấp nhận file JPG, PNG, GIF (tối đa 5MB).</p>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseUpdateCertificateModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md shadow-sm transition-colors"
                  disabled={uploading}
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal xóa chứng chỉ */}
      {isDeleteCertificateModalOpen && selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold text-gray-800">Xác nhận xóa</h2>
              <button
                onClick={handleCloseDeleteCertificateModal}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">
                    Bạn có chắc chắn muốn xóa chứng chỉ "<span className="font-semibold">{selectedCertificate.title}</span>" không?
                  </p>
                  <p className="text-sm text-red-700 mt-2">
                    Hành động này không thể hoàn tác.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCloseDeleteCertificateModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteCertificate}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Xóa chứng chỉ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xem ảnh chứng chỉ to */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="relative max-w-3xl max-h-[90vh] overflow-auto">
            <button
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
              onClick={handleCloseImagePreview}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={previewImage} alt="Certificate" className="max-w-full max-h-[90vh]" />
          </div>
        </div>
      )}

      {/* Modal quản lý lịch làm việc */}
      {selectedConsultant && (
        <ConsultantScheduleModal
          consultantId={selectedConsultant._id}
          open={isScheduleModalOpen}
          onClose={handleCloseScheduleModal}
        />
      )}
      {/* Kết thúc modal quản lý lịch làm việc */}
    </div>
  );
};

export default Consultant; 