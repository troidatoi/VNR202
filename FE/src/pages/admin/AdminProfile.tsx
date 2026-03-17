import React, { useState, useEffect, useRef } from 'react';
import { getAccountByIdApi, updateAccountApi, sendResetPasswordEmailApi, changePasswordApi } from '../../api';
import { uploadAvatarApi } from '../../api/index';
import whaleLogo from '../../assets/whale.png';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

interface User {
  _id?: string;
  username?: string;
  email?: string;
  password?: string;
  photoUrl?: string;
  fullName?: string;
  phoneNumber?: string;
  role?: string;
  gender?: string;
  isVerified?: boolean;
  isDisabled?: boolean;
}

const AdminProfile: React.FC = () => {
  const { user: authUser, updateUserInfo } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [editData, setEditData] = useState<User>({});
  const [editMode, setEditMode] = useState(false);
  const [fieldError, setFieldError] = useState<{ fullName?: string; phoneNumber?: string }>({});
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdStep, setPwdStep] = useState<'email'|'otp'|'newpass'>('email');
  const [pwdEmail, setPwdEmail] = useState('');
  const [pwdOtp, setPwdOtp] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showPwdNew, setShowPwdNew] = useState(false);
  const [showPwdConfirm, setShowPwdConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // Thêm state cho đổi mật khẩu
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePwdLoading, setChangePwdLoading] = useState(false);
  const [changePwdError, setChangePwdError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;
      try {
        const data = await getAccountByIdApi(userId);
        setUser(data);
        setEditData(data);
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const handleEdit = () => setEditMode(true);

  const validateProfile = async () => {
    if (!user?._id) return false;
    if (!editData.fullName) {
      return false;
    }
    return true;
  };

  const handleUpdate = async () => {
    if (!user?._id) return;
    if (!(await validateProfile())) return;
    try {
      await updateAccountApi(user._id, {
        fullName: editData.fullName,
        phoneNumber: editData.phoneNumber,
        gender: editData.gender,
      });
      const updated = await getAccountByIdApi(user._id);
      setUser(updated);
      setEditData(updated);
      setEditMode(false);
      setFieldError({});
      toast.success('Cập nhật thành công!');
      
      // Cập nhật AuthContext để comment có thể sử dụng fullName mới
      await updateUserInfo();
    } catch (error: unknown) {
      const errorMessage = (error as any).response?.data?.message;
      if (errorMessage?.toLowerCase().includes('số điện thoại')) {
        setFieldError(prev => ({
          ...prev,
          phoneNumber: errorMessage
        }));
      }
    }
  };

  const handleAvatarClick = () => {
    if (editMode && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?._id) return;
    setIsUploadingAvatar(true);
    try {
      // Upload lên server lấy url
      const imageUrl = await uploadAvatarApi(file);
      // Cập nhật photoUrl cho tài khoản
      await updateAccountApi(user._id, { photoUrl: imageUrl });
      setAvatarPreview(imageUrl);
      setUser((prev) => prev ? { ...prev, photoUrl: imageUrl } : prev);
      setEditData((prev) => ({ ...prev, photoUrl: imageUrl }));
      toast.success('Đổi ảnh đại diện thành công!');
      
      // Cập nhật AuthContext để comment có thể sử dụng thông tin mới
      await updateUserInfo();
    } catch (err) {
      toast.error('Lỗi khi upload ảnh!');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Đổi mật khẩu (demo, cần tích hợp API thực tế nếu có)
  const handleSendOtp = async () => {
    setPwdError('');
    setPwdLoading(true);
    try {
      await sendResetPasswordEmailApi(pwdEmail);
      setPwdStep('otp');
      setPwdOtp('');
      setPwdError('');
    } catch (error) {
      setPwdError('Không gửi được OTP, kiểm tra email!');
    } finally {
      setPwdLoading(false);
    }
  };

  // Đổi mật khẩu thực tế
  const handleChangePassword = async () => {
    setChangePwdError('');
    setChangePwdLoading(true);
    try {
      if (!user?._id) throw new Error('Không xác định user!');
      if (!oldPassword || !newPassword || !confirmPassword) {
        setChangePwdError('Vui lòng nhập đầy đủ thông tin!');
        setChangePwdLoading(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setChangePwdError('Mật khẩu xác nhận không khớp!');
        setChangePwdLoading(false);
        return;
      }
      await changePasswordApi(user._id, oldPassword, newPassword, confirmPassword);
      toast.success('Đổi mật khẩu thành công!');
      setShowPwdModal(false);
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      setChangePwdError(err?.response?.data?.message || 'Lỗi khi đổi mật khẩu!');
    } finally {
      setChangePwdLoading(false);
    }
  };

  // ... Có thể bổ sung các hàm đổi mật khẩu thực tế nếu cần

  return (
    <div className="min-h-screen bg-[#f4f8fb] flex flex-col items-center py-10">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-amber-200">
              <img
                src={avatarPreview || user?.photoUrl || whaleLogo}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
            {editMode && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300">
                <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
            {isUploadingAvatar && (
              <div className="text-sm text-amber-500 animate-pulse">Đang tải ảnh lên...</div>
            )}
          </div>
          <div className="font-bold text-xl text-gray-800 mt-4">{user?.fullName || '---'}</div>
          <div className="text-gray-500">{user?.role === 'admin' ? 'Quản trị viên' : user?.role}</div>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-gray-500 text-sm mb-2">Họ và tên</label>
            <input
              disabled={!editMode}
              className={`w-full border border-gray-200 rounded-md px-4 py-2 text-gray-700 ${!editMode ? 'bg-gray-50' : 'bg-white'}`}
              value={editMode ? (editData.fullName || '') : user?.fullName || ''}
              onChange={e => setEditData({ ...editData, fullName: e.target.value })}
            />
            {fieldError.fullName && <div className="text-red-500 text-xs mt-1">{fieldError.fullName}</div>}
          </div>
          <div>
            <label className="block text-gray-500 text-sm mb-2">Số điện thoại</label>
            <input
              disabled={!editMode}
              className={`w-full border border-gray-200 rounded-md px-4 py-2 text-gray-700 ${!editMode ? 'bg-gray-50' : 'bg-white'}`}
              value={editMode ? (editData.phoneNumber || '') : user?.phoneNumber || ''}
              onChange={e => setEditData({ ...editData, phoneNumber: e.target.value })}
            />
            {fieldError.phoneNumber && <div className="text-red-500 text-xs mt-1">{fieldError.phoneNumber}</div>}
          </div>
          <div>
            <label className="block text-gray-500 text-sm mb-2">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200"
            />
          </div>
          <div className="flex justify-end gap-2">
            {!editMode ? (
              <button onClick={handleEdit} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">Chỉnh sửa</button>
            ) : (
              <>
                <button onClick={() => { setEditMode(false); setEditData(user || {}); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">Hủy</button>
                <button onClick={handleUpdate} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">Lưu</button>
              </>
            )}
          </div>
        </div>
        <div className="mt-8 border-t pt-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-gray-500 text-sm mb-2">Mật khẩu</label>
              <div className="text-gray-700 font-medium">••••••••</div>
            </div>
            <button
              className="border border-amber-600 text-amber-600 px-4 py-1.5 rounded-lg text-sm font-medium bg-white transition-colors hover:bg-amber-50"
              onClick={() => setShowPwdModal(true)}
            >
              Đổi mật khẩu
            </button>
          </div>
          {/* Modal đổi mật khẩu (demo) */}
          {showPwdModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md relative">
                <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowPwdModal(false)}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h3 className="text-lg font-semibold mb-4">Đổi mật khẩu</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-500 text-sm mb-2">Mật khẩu cũ</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full border border-gray-200 rounded-md px-4 py-2 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 text-sm mb-2">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full border border-gray-200 rounded-md px-4 py-2 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 text-sm mb-2">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full border border-gray-200 rounded-md px-4 py-2 text-gray-700"
                    />
                  </div>
                  <button
                    className="w-full bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 transition-colors"
                    onClick={handleChangePassword}
                    disabled={changePwdLoading}
                  >
                    {changePwdLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
                  </button>
                  {changePwdError && <div className="text-red-500 text-sm mt-2">{changePwdError}</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile; 