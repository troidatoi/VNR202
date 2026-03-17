import React, { useEffect, useState } from 'react';
import api, { checkPhoneNumberExistsApi } from '../../api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Interface cho dữ liệu tài khoản
interface IAccount {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: string;
  gender?: string;
  isDisabled: boolean;
  isVerified: boolean;
  photoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UpdateAccountForm {
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  gender: string;
  role?: string;
  photoUrl?: string;
}

interface CreateAccountForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber: string;
  gender: string;
  role: 'customer' | 'consultant';  // Restrict role types
}

// Interface cho form consultant
interface ConsultantForm {
  introduction: string;
  contact: string;
  experience: number;
  startDateofWork: string;
}

// Available roles for account creation
const AVAILABLE_ROLES = [
  { value: 'customer', label: 'Khách hàng' },
  { value: 'consultant', label: 'Tư vấn viên' }
];

// Component Tooltip
interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
        {text}
      </div>
    </div>
  );
};

// Component con cho input số điện thoại + icon trạng thái
const PhoneNumberInput: React.FC<{
  
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  excludeId?: string;
  disabled?: boolean;
}> = React.memo(({ value, onChange, excludeId, disabled }) => {
  const [phoneCheckLoading, setPhoneCheckLoading] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);

  useEffect(() => {
    if (!value) {
      setPhoneExists(false);
      return;
    }
    const timeout = setTimeout(async () => {
      setPhoneCheckLoading(true);
      try {
        const res = await checkPhoneNumberExistsApi(value, excludeId);
        setPhoneExists(res.existed);
      } catch {
        setPhoneExists(false);
      } finally {
        setPhoneCheckLoading(false);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [value, excludeId]);

  // Xác định trạng thái icon
  let icon = null;
  let iconColor = '';
  if (phoneCheckLoading) {
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
    );
    iconColor = 'text-amber-500';
  } else if (phoneExists) {
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
    );
    iconColor = 'text-red-500';
  } else if (value) {
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
    );
    iconColor = 'text-green-500';
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
      <div className="relative">
        <input
          type="text"
          name="phoneNumber"
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm pr-10 ${phoneExists ? 'border-red-500' : ''}`}
        />
        {/* Icon trạng thái, luôn giữ chỗ, luôn căn giữa dọc */}
        <span
          className={`absolute top-0 bottom-0 right-3 flex items-center transition-all duration-200 ease-in-out ${iconColor}`}
          style={{ width: 20, height: 20, opacity: icon ? 1 : 0, transform: icon ? 'scale(1)' : 'scale(0.7)' }}
        >
          {icon || <span style={{ width: 20, height: 20 }} />}
        </span>
      </div>
      {phoneCheckLoading && <div className="text-xs text-amber-500 mt-1">Đang kiểm tra...</div>}
      {phoneExists && <div className="text-xs text-red-500 mt-1">Số điện thoại đã tồn tại</div>}
    </div>
  );
});

const AccountList: React.FC = () => {
  const [accounts, setAccounts] = useState<IAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [accountToToggle, setAccountToToggle] = useState<{id: string, isDisabled: boolean} | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<IAccount | null>(null);
  const [accountDetail, setAccountDetail] = useState<IAccount | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [currentUser, setCurrentUser] = useState<IAccount | null>(null);
  const [updateForm, setUpdateForm] = useState<UpdateAccountForm>({
    username: '',
    email: '',
    fullName: '',
    phoneNumber: '',
    gender: ''
  });
  const [createForm, setCreateForm] = useState<CreateAccountForm>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
    gender: '',
    role: 'customer'
  });
  const [consultantForm, setConsultantForm] = useState<ConsultantForm>({
    introduction: '',
    contact: '',
    experience: 0,
    startDateofWork: new Date().toISOString().split('T')[0]
  });
  const [consultantFormErrors, setConsultantFormErrors] = useState<{[key: string]: string}>({});
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State cho upload ảnh đại diện
  // const [avatarFile, setAvatarFile] = useState<File | null>(null); // Không dùng
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;

  useEffect(() => {
    // Hàm để lấy danh sách tài khoản
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/accounts');
        setAccounts(response.data);
        setLoading(false);

        // Giả định user hiện tại là admin đầu tiên trong danh sách
        // Trong thực tế, bạn sẽ lấy thông tin này từ context auth hoặc localStorage
        const adminUser = response.data.find((account: IAccount) => account.role === 'admin');
        if (adminUser) {
          setCurrentUser(adminUser);
        }
      } catch (err: unknown) {
        console.error('Lỗi khi lấy danh sách tài khoản:', err);
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu');
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'consultant':
        return 'bg-amber-100 text-amber-800';
      default: // customer
        return 'bg-emerald-100 text-emerald-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa cập nhật';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isAdminAccount = (account: IAccount) => {
    return account.role === 'admin';
  };

  const canModifyRole = (account: IAccount) => {
    // Nếu user hiện tại là admin và đang cập nhật một tài khoản không phải của mình
    return currentUser && currentUser.role === 'admin' && currentUser._id !== account._id;
  };

  const openConfirmToggleModal = (id: string, isDisabled: boolean) => {
    const account = accounts.find(acc => acc._id === id);
    
    // Không cho phép vô hiệu hóa tài khoản admin
    if (account && account.role === 'admin') {
      toast.error('Không thể vô hiệu hóa tài khoản Admin');
      return;
    }
    
    setAccountToToggle({ id, isDisabled });
    setIsConfirmModalOpen(true);
  };

  const closeConfirmToggleModal = () => {
    setIsConfirmModalOpen(false);
    setAccountToToggle(null);
  };

  const handleToggleStatus = async () => {
    if (!accountToToggle) return;
    
    try {
      const { id, isDisabled } = accountToToggle;
      
      await api.put(`/accounts/${id}`, { 
        isDisabled: !isDisabled 
      });
      
      // Cập nhật state sau khi thay đổi trạng thái thành công
      setAccounts(accounts.map(account => 
        account._id === id 
          ? {...account, isDisabled: !isDisabled} 
          : account
      ));
      
      toast.success(isDisabled ? 'Đã mở khóa tài khoản thành công!' : 'Đã khóa tài khoản thành công!');
      closeConfirmToggleModal();
    } catch (err: unknown) {
      console.error('Lỗi khi cập nhật trạng thái:', err);
      toast.error('Không thể cập nhật trạng thái tài khoản');
      closeConfirmToggleModal();
    }
  };

  const handleOpenDetailModal = async (id: string) => {
    try {
      setLoadingDetail(true);
      const response = await api.get(`/accounts/${id}`);
      setAccountDetail(response.data);
      setIsDetailModalOpen(true);
      setLoadingDetail(false);
    } catch (err: unknown) {
      console.error('Lỗi khi lấy chi tiết tài khoản:', err);
      toast.error(err instanceof Error ? err.message : 'Không thể lấy chi tiết tài khoản');
      setLoadingDetail(false);
    }
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setAccountDetail(null);
  };

  const handleOpenUpdateModal = (account: IAccount) => {
    setSelectedAccount(account);
    setUpdateForm({
      username: account.username,
      email: account.email,
      fullName: account.fullName || '',
      phoneNumber: account.phoneNumber || '',
      gender: account.gender || '',
      role: account.role,
      photoUrl: account.photoUrl
    });
    setIsUpdateModalOpen(true);
  };

  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedAccount(null);
    setUpdateForm({
      username: '',
      email: '',
      fullName: '',
      phoneNumber: '',
      gender: '',
      role: '',
      photoUrl: ''
    });
  };

  const handleUpdateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUpdateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    // Nếu chuyển từ customer sang consultant thì validate các trường tư vấn viên
    if (selectedAccount.role === 'customer' && updateForm.role === 'consultant') {
      if (!validateConsultantForm()) {
        // Nếu có lỗi, không submit
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setFormErrors({});

      const response = await api.put(`/accounts/${selectedAccount._id}`, {
        ...updateForm,
        ...(selectedAccount.role === 'customer' && updateForm.role === 'consultant' ? consultantForm : {})
      });
      setAccounts(accounts.map(acc => acc._id === selectedAccount._id ? response.data : acc));
      toast.success('Cập nhật tài khoản thành công!');
      handleCloseUpdateModal();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setFormErrors({ submit: error.message });
      } else {
        setFormErrors({ submit: 'Có lỗi xảy ra khi cập nhật tài khoản' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hàm xử lý thay đổi form consultant
  const handleConsultantFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConsultantForm(prev => ({
      ...prev,
      [name]: value
    }));
    // Xóa lỗi khi người dùng thay đổi giá trị
    if (consultantFormErrors[name]) {
      setConsultantFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Hàm validate form consultant
  const validateConsultantForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!consultantForm.introduction.trim()) {
      errors.introduction = 'Vui lòng nhập giới thiệu';
    }
    if (!consultantForm.contact.trim()) {
      errors.contact = 'Vui lòng nhập thông tin liên hệ';
    }
    if (!consultantForm.startDateofWork) {
      errors.startDateofWork = 'Vui lòng chọn ngày bắt đầu làm việc';
    }

    setConsultantFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreateModal = () => {
    setCreateForm({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      phoneNumber: '',
      gender: '',
      role: 'customer'
    });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setFormErrors({});
  };

  const handleCreateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({
      ...prev,
      [name]: value
    }));
    // Xóa lỗi khi người dùng sửa trường đó
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateCreateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Validate username
    if (!createForm.username) {
      errors.username = "Vui lòng nhập tên đăng nhập";
    } else if (createForm.username.length < 8 || createForm.username.length > 30) {
      errors.username = "Tên đăng nhập phải từ 8-30 ký tự";
    } else if (!/^[a-zA-Z0-9_]+$/.test(createForm.username)) {
      errors.username = "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới";
    }

    // Validate email
    if (!createForm.email) {
      errors.email = "Vui lòng nhập email";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(createForm.email)) {
      errors.email = "Email không hợp lệ";
    }

    // Validate password
    if (!createForm.password) {
      errors.password = "Vui lòng nhập mật khẩu";
    } else if (createForm.password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(createForm.password)) {
      errors.password = "Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt";
    }

    // Validate confirm password
    if (!createForm.confirmPassword) {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (createForm.password !== createForm.confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    // Validate role
    if (!createForm.role) {
      errors.role = "Vui lòng chọn vai trò";
    } else if (!AVAILABLE_ROLES.some(r => r.value === createForm.role)) {
      errors.role = "Vai trò không hợp lệ";
    }

    // Validate required fields
    if (!createForm.fullName) errors.fullName = "Vui lòng nhập họ tên";
    if (!createForm.phoneNumber) errors.phoneNumber = "Vui lòng nhập số điện thoại";
    if (!createForm.gender) errors.gender = "Vui lòng chọn giới tính";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCreateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Tạo đối tượng dữ liệu cho request API
      const accountData = {
        username: createForm.username,
        email: createForm.email,
        password: createForm.password,
        fullName: createForm.fullName || '',
        phoneNumber: createForm.phoneNumber || '',
        gender: createForm.gender || undefined,
        role: createForm.role,
        isVerified: true // Admin tạo tài khoản thì mặc định đã xác thực
      };
      
      // Gọi API tạo tài khoản
      const response = await api.post('/accounts', accountData);
      
      // Thêm tài khoản mới vào state
      setAccounts([...accounts, response.data]);
      
      // Đóng modal và hiện thông báo thành công
      handleCloseCreateModal();
      toast.success('Tạo tài khoản thành công!');
    } catch (err: unknown) {
      console.error('Lỗi khi tạo tài khoản:', err);
      
      // Xử lý lỗi từ server nếu có
      if (err instanceof Error && err.message.includes('duplicate key')) {
        // Lỗi trùng lặp (duplicate key)
        if (err.message.includes('username')) {
          setFormErrors(prev => ({ ...prev, username: 'Tên đăng nhập đã tồn tại' }));
        }
        if (err.message.includes('email')) {
          setFormErrors(prev => ({ ...prev, email: 'Email đã tồn tại' }));
        }
      } else {
        toast.error(err instanceof Error ? err.message : 'Không thể tạo tài khoản');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý chọn file ảnh
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setIsUploadingAvatar(true);
    try {
      // Upload lên Cloudinary (giả sử bạn có endpoint /uploads/upload)
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/uploads/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('Upload response:', res);
      const url = res.data.imageUrl;
      setUpdateForm(prev => ({ ...prev, photoUrl: url }));
      setIsUploadingAvatar(false);
      toast.success('Tải ảnh lên thành công!');
    } catch (err: unknown) {
      setIsUploadingAvatar(false);
      console.error('Upload error:', err);
      if (err instanceof Error) {
        console.error('Error response:', err.message);
      }
      toast.error('Tải ảnh lên thất bại!');
    }
  };

  // Hàm xử lý tìm kiếm
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setSearchTerm(e.target.value);
  };

  // Hàm xử lý lọc vai trò
  const handleRoleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    setRoleFilter(e.target.value);
  };

  // Hàm xử lý lọc trạng thái
  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    setStatusFilter(e.target.value);
  };

  // Hàm xử lý lọc giới tính
  const handleGenderFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    setGenderFilter(e.target.value);
  };

  // Hàm reset bộ lọc
  const handleResetFilters = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
    setGenderFilter('');
  };

  // Hàm lọc tài khoản
  const filteredAccounts = accounts.filter(account => {
    // Ẩn tài khoản admin khỏi danh sách
    if (account.role === 'admin') {
      return false;
    }
    
    const matchesSearch = searchTerm === '' || 
      (account.username?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (account.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (account.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesRole = roleFilter === '' || account.role === roleFilter;
    const matchesStatus = statusFilter === '' || 
      (statusFilter === 'active' && !account.isDisabled) ||
      (statusFilter === 'disabled' && account.isDisabled);
    const matchesGender = genderFilter === '' || account.gender === genderFilter;

    return matchesSearch && matchesRole && matchesStatus && matchesGender;
  });

  // Tính toán phân trang sau khi đã có filteredAccounts
  const totalPages = Math.ceil(filteredAccounts.length / rowsPerPage);
  const paginatedAccounts = filteredAccounts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

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
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 w-full flex flex-col justify-center items-center">
        <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-sm p-6 mb-8">
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
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-2xl font-semibold text-gray-800">Quản lý tài khoản</h1>
          </div>

          {/* Phần tìm kiếm và lọc */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Tìm kiếm và Lọc</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Tìm theo tên, email..."
                    className="focus:ring-amber-500 focus:border-amber-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              {/* Lọc theo vai trò */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                <select
                  value={roleFilter}
                  onChange={handleRoleFilter}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md"
                >
                  <option value="">Tất cả vai trò</option>
                  <option value="admin">Admin</option>
                  <option value="consultant">Tư vấn viên</option>
                  <option value="customer">Khách hàng</option>
                </select>
              </div>
              {/* Lọc theo trạng thái */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={statusFilter}
                  onChange={handleStatusFilter}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="disabled">Đã bị khóa</option>
                </select>
              </div>
              {/* Lọc theo giới tính */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                <select
                  value={genderFilter}
                  onChange={handleGenderFilter}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md"
                >
                  <option value="">Tất cả giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-500">
                  Kết quả: {filteredAccounts.length} tài khoản
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Đặt lại
                </button>
                <button
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Thêm tài khoản
                </button>
              </div>
            </div>
          </div>

          {/* Bảng danh sách tài khoản */}
          <div className="bg-white shadow rounded-lg w-full mb-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-500">{error}</div>
            ) : (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-amber-50">
                    <tr>
                      <th scope="col" className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tài khoản
                      </th>
                      <th scope="col" className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thông tin
                      </th>
                      <th scope="col" className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vai trò
                      </th>
                      <th scope="col" className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th scope="col" className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Xác thực
                      </th>
                      <th scope="col" className="w-1/6 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedAccounts.map((account) => (
                      <tr key={account._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={account.photoUrl || '/avarta.png'}
                                alt={account.username}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 max-w-[180px] truncate" title={account.username}>{account.username}</div>
                              <div className="text-sm text-gray-500">{account.gender || 'Chưa cập nhật'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{account.fullName || 'Chưa cập nhật'}</div>
                          <div className="text-sm text-gray-500">{account.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(account.role)}`}>
                            {account.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${account.isDisabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {account.isDisabled ? 'Đã bị khóa' : 'Đang hoạt động'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${account.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {account.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2 justify-end">
                            <Tooltip text="Khóa/Mở khóa">
                              <button
                                onClick={() => openConfirmToggleModal(account._id, account.isDisabled)}
                                disabled={isAdminAccount(account)}
                                className={`text-gray-400 hover:text-gray-500 ${isAdminAccount(account) ? 'cursor-not-allowed opacity-50' : ''}`}
                              >
                                {account.isDisabled ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                )}
                              </button>
                            </Tooltip>
                            <Tooltip text="Cập nhật">
                              <button
                                onClick={() => handleOpenUpdateModal(account)}
                                className="text-yellow-400 hover:text-yellow-500"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            </Tooltip>
                            <Tooltip text="Chi tiết">
                              <button
                                onClick={() => handleOpenDetailModal(account._id)}
                                className="text-amber-400 hover:text-amber-500"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* PHÂN TRANG KIỂU CONSULTANT */}
                {totalPages > 1 && (
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
                )}
              </>
            )}
          </div>

          {/* Modal Cập nhật tài khoản */}
          {isUpdateModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-0 w-full max-w-md">
                <div className="p-6 max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold">Cập nhật tài khoản</h2>
                    <button
                      onClick={handleCloseUpdateModal}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  <form onSubmit={handleUpdateAccount}>
                    <div className="space-y-4">
                      {/* Ảnh đại diện */}
                      <div className="flex flex-col items-center">
                        <img
                          src={avatarPreview || updateForm.photoUrl || selectedAccount?.photoUrl || '/avarta.png'}
                          alt="avatar"
                          className="w-24 h-24 rounded-full object-cover border-2 border-amber-200 mb-2"
                        />
                        <label className="block text-sm font-medium text-gray-700">Ảnh đại diện</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="mt-1 block w-full text-sm"
                          disabled={isUploadingAvatar}
                        />
                        {isUploadingAvatar && <div className="text-xs text-amber-500 mt-1">Đang tải ảnh lên...</div>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Họ tên</label>
                        <input
                          type="text"
                          name="fullName"
                          value={updateForm.fullName}
                          onChange={handleUpdateFormChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tên tài khoản</label>
                        <input
                          type="text"
                          name="username"
                          value={updateForm.username}
                          disabled
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm bg-gray-100 cursor-not-allowed"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={updateForm.email}
                          disabled
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm bg-gray-100 cursor-not-allowed"
                          required
                        />
                      </div>
                      <PhoneNumberInput
                        value={updateForm.phoneNumber}
                        onChange={handleUpdateFormChange}
                        excludeId={selectedAccount?._id}
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Giới tính</label>
                        <select
                          name="gender"
                          value={updateForm.gender}
                          onChange={handleUpdateFormChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                        >
                          <option value="">Chọn giới tính</option>
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>

                      {/* Thêm trường role */}
                      {selectedAccount && canModifyRole(selectedAccount) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Vai trò</label>
                          <select
                            name="role"
                            value={updateForm.role}
                            onChange={handleUpdateFormChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                          >
                            {/* Nếu là consultant thì không cho phép chọn customer */}
                            {selectedAccount.role !== 'consultant' && (
                              <option value="customer">Customer</option>
                            )}
                            <option value="consultant">Consultant</option>
                            {selectedAccount.role === 'admin' && (
                              <option value="admin">Admin</option>
                            )}
                          </select>
                          {selectedAccount.role === 'admin' && currentUser && currentUser._id === selectedAccount._id && (
                            <p className="mt-1 text-xs text-red-500">Admin không thể thay đổi vai trò của chính mình</p>
                          )}
                        </div>
                      )}

                      {/* Nếu chuyển từ customer sang consultant thì hiện form tư vấn viên */}
                      {selectedAccount && selectedAccount.role === 'customer' && updateForm.role === 'consultant' && (
                        <div className="border-t pt-4 mt-4">
                          <h3 className="text-base font-semibold mb-2 text-amber-600">Thông tin tư vấn viên</h3>
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700">Giới thiệu</label>
                            <textarea
                              name="introduction"
                              value={consultantForm.introduction}
                              onChange={handleConsultantFormChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                              rows={2}
                            />
                            {consultantFormErrors.introduction && (
                              <p className="mt-1 text-sm text-red-600">{consultantFormErrors.introduction}</p>
                            )}
                          </div>
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700">Thông tin liên hệ</label>
                            <input
                              type="text"
                              name="contact"
                              value={consultantForm.contact}
                              onChange={handleConsultantFormChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                            />
                            {consultantFormErrors.contact && (
                              <p className="mt-1 text-sm text-red-600">{consultantFormErrors.contact}</p>
                            )}
                          </div>
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700">Ngày bắt đầu làm việc</label>
                            <input
                              type="date"
                              name="startDateofWork"
                              value={consultantForm.startDateofWork}
                              onChange={handleConsultantFormChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                            />
                            {consultantFormErrors.startDateofWork && (
                              <p className="mt-1 text-sm text-red-600">{consultantFormErrors.startDateofWork}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={handleCloseUpdateModal}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700"
                      >
                        Cập nhật
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Modal Xác nhận khóa/mở khóa tài khoản */}
          {isConfirmModalOpen && accountToToggle && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold">Xác nhận</h2>
                  <button
                    onClick={closeConfirmToggleModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                <div className="mb-6 flex items-center">
                  <div className={`mr-4 p-3 rounded-full ${accountToToggle.isDisabled ? 'bg-green-100' : 'bg-red-100'}`}>
                    {accountToToggle.isDisabled ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </div>
                  <p>
                    {accountToToggle.isDisabled 
                      ? 'Bạn có chắc chắn muốn mở khóa tài khoản này?' 
                      : 'Bạn có chắc chắn muốn khóa tài khoản này?'}
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeConfirmToggleModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleToggleStatus}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center ${
                      accountToToggle.isDisabled 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {accountToToggle.isDisabled ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                        Mở khóa
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Khóa
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Chi tiết tài khoản */}
          {isDetailModalOpen && accountDetail && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold">Chi tiết tài khoản</h2>
                  <button
                    onClick={handleCloseDetailModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>

                {loadingDetail ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col items-center">
                      <div className="w-32 h-32 mb-4">
                        <img
                          className="h-32 w-32 rounded-full object-cover"
                          src={accountDetail.photoUrl || '/avarta.png'}
                          alt={accountDetail.username}
                        />
                      </div>
                      <span className={`px-3 py-1 text-sm rounded-full ${getRoleBadgeClass(accountDetail.role)}`}>
                        {accountDetail.role}
                      </span>
                      <span className={`mt-2 px-3 py-1 text-sm rounded-full ${accountDetail.isDisabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {accountDetail.isDisabled ? 'Đã bị khóa' : 'Đang hoạt động'}
                      </span>
                      <span className={`mt-2 px-3 py-1 text-sm rounded-full ${accountDetail.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {accountDetail.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">ID</p>
                        <p className="mt-1">{accountDetail._id}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Họ tên</p>
                        <p className="mt-1">{accountDetail.fullName || 'Chưa cập nhật'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tên tài khoản</p>
                        <p className="mt-1">{accountDetail.username}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="mt-1">{accountDetail.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Số điện thoại</p>
                        <p className="mt-1">{accountDetail.phoneNumber || 'Chưa cập nhật'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Giới tính</p>
                        <p className="mt-1">{accountDetail.gender || 'Chưa cập nhật'}</p>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-4 border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Ngày tạo</p>
                          <p className="mt-1">{formatDate(accountDetail.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Lần cập nhật cuối</p>
                          <p className="mt-1">{formatDate(accountDetail.updatedAt)}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          onClick={() => {
                            handleCloseDetailModal();
                            handleOpenUpdateModal(accountDetail);
                          }}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-md hover:bg-yellow-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Cập nhật
                        </button>
                        {/* Ẩn nút khóa/mở khóa đối với tài khoản admin */}
                        {!isAdminAccount(accountDetail) && (
                          <button
                            onClick={() => {
                              handleCloseDetailModal();
                              openConfirmToggleModal(accountDetail._id, accountDetail.isDisabled);
                            }}
                            className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md ${
                              accountDetail.isDisabled 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-red-600 hover:bg-red-700'
                            }`}
                          >
                            {accountDetail.isDisabled ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                </svg>
                                Mở khóa
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Khóa
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Tạo tài khoản mới */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg w-full max-w-md p-6">
                <h2 className="text-xl font-semibold mb-4">Tạo tài khoản mới</h2>
                <form onSubmit={handleCreateAccount} className="space-y-4">
                  {/* Full Name field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
                    <input
                      type="text"
                      name="fullName"
                      value={createForm.fullName}
                      onChange={handleCreateFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                      required
                    />
                  </div>

                  {/* Username field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
                    <input
                      type="text"
                      name="username"
                      value={createForm.username}
                      onChange={handleCreateFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                      required
                    />
                    {formErrors.username && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
                    )}
                  </div>

                  {/* Email field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={createForm.email}
                      onChange={handleCreateFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                      required
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Password field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                    <input
                      type="password"
                      name="password"
                      value={createForm.password}
                      onChange={handleCreateFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                      required
                    />
                    {formErrors.password && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={createForm.confirmPassword}
                      onChange={handleCreateFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                      required
                    />
                    {formErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Phone Number field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={createForm.phoneNumber}
                      onChange={handleCreateFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                      required
                    />
                  </div>

                  {/* Gender field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Giới tính</label>
                    <select
                      name="gender"
                      value={createForm.gender}
                      onChange={handleCreateFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                      required
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                    </select>
                  </div>

                  {/* Role field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vai trò</label>
                    <select
                      name="role"
                      value={createForm.role}
                      onChange={handleCreateFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                      required
                    >
                      {AVAILABLE_ROLES.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={handleCloseCreateModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-amber-300"
                    >
                      {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Nút thêm tài khoản mới */}
          <div className="fixed bottom-8 right-8">
            <button
              onClick={handleOpenCreateModal}
              className="bg-amber-600 hover:bg-amber-700 text-white p-4 rounded-full shadow-lg flex items-center justify-center"
              aria-label="Thêm tài khoản mới"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountList; 