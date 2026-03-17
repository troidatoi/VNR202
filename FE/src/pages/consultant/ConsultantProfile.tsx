import { useState, useEffect, useRef } from "react";
import whaleLogo from "../../assets/whale.png";
import {
  PlusCircle,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Filter,
  CalendarDays,
  X,
} from "lucide-react";
import {
  getAccountByIdApi,
  updateAccountApi,
  changePasswordApi,
  sendResetPasswordEmailApi,
  getConsultantByAccountIdApi,
  updateConsultantApi,
  getCertificatesByConsultantIdApi,
  createCertificateApi,
  updateCertificateApi,
  deleteCertificateApi,
  getCertificateByIdApi,
} from "../../api";
import type { AxiosError } from "axios";
import React from "react";

// Interfaces
interface User {
  _id?: string;
  username?: string;
  email?: string;
  password?: string;
  photoUrl?: string;
  fullName?: string;
  phoneNumber?: string;
  role?: "consultant" | "customer";
  gender?: "nam" | "nữ";
  isVerified?: boolean;
  isDisabled?: boolean;
}

interface ICertificate {
  _id?: string;
  title: string;
  type?: string;
  issuedBy: string;
  issueDate: string;
  expireDate?: string;
  description?: string;
  fileUrl: string;
  consultant_id?: string;
}

interface IConsultant {
  _id?: string;
  accountId?: string;
  introduction?: string;
  contact?: string;
  startDateofWork?: string;
  certificates?: ICertificate[];
}

const DEFAULT_CERT_IMAGE =
  "https://cdn.prod.website-files.com/60a530a795c0ca8a81c5868a/660568c3773236b1fdefc245_badge-preview%20(2)%2011.46.22.png";

export default function ConsultantProfile() {
  const { user: authUser, updateUserInfo } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [editData, setEditData] = useState<User>({});
  const [editMode, setEditMode] = useState(false);
  const [consultant, setConsultant] = useState<IConsultant | null>(null);
  const [certificates, setCertificates] = useState<ICertificate[]>([]);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [fieldError, setFieldError] = useState<{
    fullName?: string;
    phoneNumber?: string;
  }>({});
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdStep, setPwdStep] = useState<"email" | "otp" | "newpass">("email");
  const [pwdEmail, setPwdEmail] = useState("");
  const [pwdOtp, setPwdOtp] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showPwdNew, setShowPwdNew] = useState(false);
  const [showPwdConfirm, setShowPwdConfirm] = useState(false);
  const [modalCertificate, setModalCertificate] = useState(false);
  const [chungChiDangSua, setChungChiDangSua] = useState<ICertificate | null>(
    null
  );
  const [initialCertificateData, setInitialCertificateData] = useState<
    Omit<ICertificate, "_id">
  >({
    title: "",
    type: "",
    issuedBy: "",
    issueDate: "",
    expireDate: "",
    description: "",
    fileUrl: "",
  });
  const [editConsultant, setEditConsultant] = useState(false);
  const [consultantEditData, setConsultantEditData] = useState<
    Partial<IConsultant>
  >({});
  const [certificateFilter, setCertificateFilter] = useState("all");
  const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const fetchConsultant = async () => {
      if (!user?._id) return;
      try {
        const consultantData = await getConsultantByAccountIdApi(user._id);
        setConsultant(consultantData);
        if (consultantData?._id) {
          fetchCertificates(consultantData._id);
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu chuyên gia:", err);
      }
    };

    if (user?._id) fetchConsultant();
  }, [user?._id]);

  const fetchCertificates = async (consultantId: string) => {
    try {
      const certsData = await getCertificatesByConsultantIdApi(consultantId);
      setCertificates(certsData || []);
    } catch {
      setCertificates([]);
    }
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2000);
  };

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
      });
      const updated = await getAccountByIdApi(user._id);
      setUser(updated);
      setEditData(updated);
      setEditMode(false);
      showToast("success", "Cập nhật thành công!");

      // Cập nhật AuthContext để comment có thể sử dụng fullName mới
      await updateUserInfo();
    } catch {
      showToast("error", "Cập nhật thất bại!");
    }
  };

  const handleBlurField = async (
    field: "fullName" | "phoneNumber",
    value: string
  ) => {
    if (!user?._id) return;
    try {
      await updateAccountApi(user._id, { [field]: value });
      setFieldError((prev) => ({ ...prev, [field]: undefined }));
      showToast("success", "Cập nhật thành công!");
      const updated = await getAccountByIdApi(user._id);
      setUser(updated);
      setEditData(updated);

      // Cập nhật AuthContext để comment có thể sử dụng fullName mới
      await updateUserInfo();
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      if (axiosErr?.response?.data?.message) {
        setFieldError((prev) => ({
          ...prev,
          [field]: axiosErr.response!.data.message!,
        }));
      }
    }
  };

  // Password change handlers (API)
  const handleSendOtp = async () => {
    setPwdError("");
    setPwdLoading(true);
    try {
      await sendResetPasswordEmailApi(pwdEmail);
      setPwdStep("otp");
    } catch {
      setPwdError("Không gửi được OTP, kiểm tra email!");
    }
    setPwdLoading(false);
  };

  const handleVerifyOtp = async () => {
    setPwdError("");
    setPwdLoading(true);
    try {
      await fetch("/api/auth/check-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifyCode: pwdOtp }),
      });
      setPwdStep("newpass");
    } catch {
      setPwdError("OTP không đúng hoặc đã hết hạn!");
    }
    setPwdLoading(false);
  };

  const handleChangePassword = async () => {
    setPwdError("");
    setPwdLoading(true);
    try {
      if (!user?.email) throw new Error("No user email");
      await changePasswordApi(user.email, "", pwdNew, pwdConfirm);
      setShowPwdModal(false);
      setPwdStep("email");
      setPwdEmail("");
      setPwdOtp("");
      setPwdNew("");
      setPwdConfirm("");
      showToast("success", "Đổi mật khẩu thành công!");
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setPwdError(
        axiosErr?.response?.data?.message || "Đổi mật khẩu thất bại!"
      );
    }
    setPwdLoading(false);
  };

  const handleCertificateSubmit = async (
    data: Omit<ICertificate, "_id" | "consultant_id">
  ) => {
    if (!consultant?._id) {
      showToast("error", "Không tìm thấy thông tin chuyên gia.");
      return;
    }
    // issuedBy phải là number
    const apiData = {
      title: data.title,
      type: data.type || "",
      issuedBy: Number(data.issuedBy),
      issueDate: data.issueDate,
      expireDate: data.expireDate,
      description: data.description,
      fileUrl: data.fileUrl,
      consultant_id: consultant._id,
    };
    try {
      if (chungChiDangSua?._id) {
        await updateCertificateApi(chungChiDangSua._id, apiData);
        showToast("success", "Cập nhật chứng chỉ thành công!");
      } else {
        await createCertificateApi(apiData);
        showToast("success", "Thêm chứng chỉ thành công!");
      }
      fetchCertificates(consultant._id); // Refresh list
      setModalCertificate(false);
      setChungChiDangSua(null);
    } catch {
      showToast("error", "Thao tác thất bại!");
    }
  };

  const handleDeleteCertificate = async (certificateId?: string) => {
    if (!certificateId || !consultant?._id) return;
    try {
      await deleteCertificateApi(certificateId);
      showToast("success", "Xóa chứng chỉ thành công!");
      fetchCertificates(consultant._id); // Refresh list
    } catch {
      showToast("error", "Xóa thất bại!");
    }
  };

  const handleConsultantEdit = () => {
    if (!consultant) return;
    setConsultantEditData(consultant);
    setEditConsultant(true);
  };

  const handleConsultantCancel = () => {
    setEditConsultant(false);
  };

  const handleConsultantSave = async () => {
    if (!consultant?._id) {
      showToast("error", "Không tìm thấy thông tin chuyên gia.");
      return;
    }
    try {
      const updatedData = {
        introduction: consultantEditData.introduction,
        startDateofWork: consultantEditData.startDateofWork,
      };
      const updated = await updateConsultantApi(consultant._id, updatedData);
      setConsultant(updated);
      setEditConsultant(false);
      showToast("success", "Cập nhật thông tin chuyên gia thành công!");
    } catch {
      showToast("error", "Cập nhật thông tin chuyên gia thất bại!");
    }
  };

  const formatDateForInput = (date?: string) => {
    if (!date) return "";
    try {
      return new Date(date).toISOString().split("T")[0];
    } catch {
      console.error("Invalid date format:", date);
      return "";
    }
  };

  const filteredCertificates = certificates.filter((cert) => {
    if (certificateFilter === "all") return true;
    if (!cert.expireDate) return false;
    const now = new Date();
    const expireDate = new Date(cert.expireDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    if (certificateFilter === "expired") return expireDate < now;
    if (certificateFilter === "expiring_soon")
      return expireDate >= now && expireDate <= thirtyDaysFromNow;
    if (certificateFilter === "valid") return expireDate > thirtyDaysFromNow;
    return true;
  });

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?._id) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploadingAvatar(true);
    try {
      // Upload to server
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch(
        "https://mln111-1.onrender.com/api/uploads/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );
      if (!response.ok) throw new Error("Failed to upload image");
      const { imageUrl } = await response.json();
      // Update user's photoUrl
      await updateAccountApi(user._id, { photoUrl: imageUrl });
      // Update local user state
      setUser((prev) => (prev ? { ...prev, photoUrl: imageUrl } : null));
      setEditData((prev) => ({ ...prev, photoUrl: imageUrl }));
      showToast("success", "Cập nhật ảnh đại diện thành công!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      showToast("error", "Không thể cập nhật ảnh đại diện!");
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] flex flex-col items-center py-4 px-2 relative overflow-x-hidden">
      {/* Background decoration */}
      <div className="absolute top-10 left-[-80px] w-60 h-60 bg-cyan-200 rounded-full opacity-40 blur-2xl z-0"></div>
      <div className="absolute top-1/3 left-[-100px] w-72 h-72 bg-pink-200 rounded-full opacity-35 blur-2xl z-0"></div>
      <div className="absolute bottom-20 left-[-60px] w-44 h-44 bg-blue-200 rounded-full opacity-35 blur-2xl z-0"></div>
      <div className="absolute top-20 right-[-80px] w-60 h-60 bg-cyan-200 rounded-full opacity-40 blur-2xl z-0"></div>
      <div className="absolute top-1/2 right-[-100px] w-72 h-72 bg-pink-200 rounded-full opacity-35 blur-2xl z-0"></div>
      <div className="absolute bottom-10 right-[-60px] w-44 h-44 bg-blue-200 rounded-full opacity-35 blur-2xl z-0"></div>

      <div className="bg-white rounded-3xl shadow-sm flex flex-col w-full max-w-6xl overflow-hidden relative">
        <div className="flex flex-row w-full">
          {/* Main Content */}
          <div className="flex-1">
            <div className="max-w-4xl mx-auto">
              <div className="p-7">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">
                  Hồ sơ chuyên gia
                </h2>
                <p className="text-gray-500 mb-8">
                  Quản lý thông tin cá nhân, chuyên môn và các chứng chỉ của
                  bạn.
                </p>

                {/* Avatar + Name */}
                <div className="flex flex-col items-center mb-8">
                  <div
                    className="relative group cursor-pointer"
                    onClick={handleAvatarClick}
                  >
                    <div className="w-24 h-24 rounded-full overflow-hidden">
                      <img
                        src={
                          avatarPreview ||
                          user?.photoUrl ||
                          "https://i.pravatar.cc/150?img=3"
                        }
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300">
                      <svg
                        className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                  {isUploadingAvatar && (
                    <div className="text-sm text-blue-500 animate-pulse">
                      Đang tải ảnh lên...
                    </div>
                  )}
                  <div className="font-bold text-lg text-gray-800 mb-1">
                    {user?.fullName || "---"}
                  </div>
                </div>
                {/* User Info Section */}
                <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-700 mb-6">
                      Thông tin cá nhân
                    </h3>
                    {!editMode ? (
                      <button
                        onClick={() => setEditMode(true)}
                        className="text-blue-600 text-sm font-medium flex items-center gap-1"
                      >
                        <Edit size={14} /> Chỉnh sửa
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditMode(false);
                            setEditData(user || {});
                          }}
                          className="text-gray-600 text-sm font-medium"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleUpdate}
                          className="text-blue-600 text-sm font-medium"
                        >
                          Lưu
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-500 text-sm mb-2">
                        Họ và tên
                      </label>
                      <input
                        disabled={!editMode}
                        className={`w-full border border-gray-200 rounded-md px-4 py-2 text-gray-700 ${!editMode ? "bg-gray-50" : "bg-white"
                          }`}
                        value={
                          editMode
                            ? editData.fullName || ""
                            : user?.fullName || ""
                        }
                        onChange={(e) =>
                          setEditData({ ...editData, fullName: e.target.value })
                        }
                        onBlur={(e) =>
                          handleBlurField("fullName", e.target.value)
                        }
                      />
                      {fieldError.fullName && (
                        <div className="text-red-500 text-xs mt-1">
                          {fieldError.fullName}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-500 text-sm mb-2">
                        Số điện thoại
                      </label>
                      <input
                        disabled={!editMode}
                        className={`w-full border border-gray-200 rounded-md px-4 py-2 text-gray-700 ${!editMode ? "bg-gray-50" : "bg-white"
                          }`}
                        value={
                          editMode
                            ? editData.phoneNumber || ""
                            : user?.phoneNumber || ""
                        }
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            phoneNumber: e.target.value,
                          })
                        }
                        onBlur={(e) =>
                          handleBlurField("phoneNumber", e.target.value)
                        }
                      />
                      {fieldError.phoneNumber && (
                        <div className="text-red-500 text-xs mt-1">
                          {fieldError.phoneNumber}
                        </div>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-md p-4">
                      <label className="block text-gray-500 text-sm mb-2">
                        Email
                      </label>
                      <div className="text-gray-700 font-medium">
                        {user?.email || ""}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-md p-4 flex items-center justify-between">
                      <div>
                        <label className="block text-gray-500 text-sm mb-2">
                          Mật khẩu
                        </label>
                        <div className="text-gray-700 font-medium">••••••</div>
                      </div>
                      <button
                        className="border border-blue-600 text-blue-600 px-4 py-1.5 rounded-lg text-sm font-medium bg-white transition-colors hover:bg-blue-50"
                        onClick={() => setShowPwdModal(true)}
                      >
                        Đổi mật khẩu
                      </button>
                    </div>
                  </div>
                </div>

                {/* Consultant Info Section */}
                <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-700 mb-6">
                      Thông tin chuyên gia
                    </h3>
                    {!editConsultant ? (
                      <button
                        onClick={handleConsultantEdit}
                        className="text-blue-600 text-sm font-medium flex items-center gap-1"
                      >
                        <Edit size={14} /> Chỉnh sửa
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={handleConsultantCancel}
                          className="text-gray-600 text-sm font-medium"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleConsultantSave}
                          className="text-blue-600 text-sm font-medium"
                        >
                          Lưu
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-500 text-sm mb-2">
                        Ngày bắt đầu làm việc
                      </label>
                      <input
                        type="date"
                        className={`w-full border border-gray-200 rounded-md px-4 py-2 text-gray-700 ${!editConsultant ? "bg-gray-50" : "bg-white"
                          }`}
                        value={
                          editConsultant
                            ? formatDateForInput(
                              consultantEditData.startDateofWork
                            )
                            : formatDateForInput(consultant?.startDateofWork)
                        }
                        onChange={(e) =>
                          editConsultant &&
                          setConsultantEditData({
                            ...consultantEditData,
                            startDateofWork: e.target.value,
                          })
                        }
                        disabled={!editConsultant}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-gray-500 text-sm mb-2">
                        Giới thiệu bản thân
                      </label>
                      <textarea
                        rows={4}
                        className={`w-full border border-gray-200 rounded-md px-4 py-2 text-gray-700 ${!editConsultant ? "bg-gray-50" : "bg-white"
                          }`}
                        placeholder="Viết một vài dòng giới thiệu về kinh nghiệm và chuyên môn của bạn..."
                        value={
                          editConsultant
                            ? consultantEditData.introduction || ""
                            : consultant?.introduction || ""
                        }
                        onChange={(e) =>
                          editConsultant &&
                          setConsultantEditData({
                            ...consultantEditData,
                            introduction: e.target.value,
                          })
                        }
                        disabled={!editConsultant}
                      />
                    </div>
                  </div>
                </div>

                {/* Certificates Section */}
                <div className="bg-white rounded-2xl border border-gray-100 p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold text-gray-700">
                      Quản lý chứng chỉ
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Filter size={16} className="text-gray-500" />
                        <select
                          value={certificateFilter}
                          onChange={(e) => setCertificateFilter(e.target.value)}
                          className="bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">Tất cả</option>
                          <option value="valid">Còn hạn</option>
                          <option value="expiring_soon">Sắp hết hạn</option>
                          <option value="expired">Đã hết hạn</option>
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          setChungChiDangSua(null);
                          setInitialCertificateData({
                            title: "",
                            type: "",
                            issuedBy: "",
                            issueDate: "",
                            expireDate: "",
                            description: "",
                            fileUrl: "",
                          });
                          setModalCertificate(true);
                        }}
                        className="text-blue-600 text-sm font-medium flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md"
                      >
                        <PlusCircle size={14} /> Thêm chứng chỉ
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredCertificates.length === 0 ? (
                      <p className="text-gray-500 italic md:col-span-2">
                        Không có chứng chỉ nào phù hợp.
                      </p>
                    ) : (
                      filteredCertificates.map((cert) => (
                        <div
                          key={cert._id}
                          className="relative aspect-video rounded-lg overflow-hidden group shadow-lg bg-gray-200 cursor-pointer"
                          onClick={() => setViewImageUrl(cert.fileUrl)}
                        >
                          <img
                            src={cert.fileUrl || DEFAULT_CERT_IMAGE}
                            alt={cert.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = DEFAULT_CERT_IMAGE;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <h4 className="font-bold text-lg truncate">
                              {cert.title}
                            </h4>
                            <div className="flex items-center text-xs opacity-80 gap-3 mt-1">
                              <div className="flex items-center gap-1">
                                <CalendarDays size={12} />
                                <span>
                                  Cấp:{" "}
                                  {new Date(cert.issueDate).toLocaleDateString(
                                    "vi-VN"
                                  )}
                                </span>
                              </div>
                              {cert.expireDate && (
                                <div className="flex items-center gap-1">
                                  <CalendarDays size={12} />
                                  <span>
                                    Hết hạn:{" "}
                                    {new Date(
                                      cert.expireDate
                                    ).toLocaleDateString("vi-VN")}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (cert._id) {
                                  const detail = await getCertificateByIdApi(
                                    cert._id
                                  );
                                  // Format ngày về YYYY-MM-DD cho input type="date"
                                  const formatDate = (d: string | undefined) =>
                                    d
                                      ? new Date(d).toISOString().split("T")[0]
                                      : "";
                                  setChungChiDangSua(detail);
                                  setInitialCertificateData({
                                    ...detail,
                                    issueDate: formatDate(detail.issueDate),
                                    expireDate: formatDate(detail.expireDate),
                                  });
                                  setModalCertificate(true);
                                }
                              }}
                              className="bg-white/80 backdrop-blur-sm text-gray-800 p-2 rounded-full hover:bg-white"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCertificate(cert._id);
                              }}
                              className="bg-white/80 backdrop-blur-sm text-gray-800 p-2 rounded-full hover:bg-white"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave decoration */}
        <div className="w-full h-40 mt-12 relative">
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1440 320"
              className="w-full"
            >
              <path
                fill="#b1e2f3"
                fillOpacity="1"
                d="M0,128L48,133.3C96,139,192,149,288,144C384,139,480,117,576,128C672,139,768,181,864,176C960,171,1056,117,1152,96C1248,75,1344,85,1392,90.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              ></path>
            </svg>
            <img
              src={whaleLogo}
              alt="Whale decoration"
              className="absolute right-16 bottom-4 w-32 h-auto opacity-80"
              style={{ transform: "scaleX(-1)" }}
            />
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {viewImageUrl && (
        <div
          className="fixed inset-0 z-[1001] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm"
          onClick={() => setViewImageUrl(null)}
        >
          <button
            className="absolute top-5 right-5 text-white/80 hover:text-white z-10"
            onClick={() => setViewImageUrl(null)}
          >
            <X size={32} />
          </button>
          <img
            src={viewImageUrl}
            alt="Certificate full view"
            className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_CERT_IMAGE;
            }}
          />
        </div>
      )}

      {/* Toasts and Modals */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-lg shadow-lg text-white text-base font-semibold transition-all ${toast.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
        >
          {toast.message}
        </div>
      )}

      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Đổi mật khẩu
            </h3>
            {pwdStep === "email" && (
              <>
                <label className="block text-gray-500 text-sm mb-2">
                  Email
                </label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
                  value={pwdEmail}
                  onChange={(e) => setPwdEmail(e.target.value)}
                  placeholder="Nhập email đã đăng ký"
                />
                {pwdError && (
                  <div className="text-red-500 text-xs mb-2">{pwdError}</div>
                )}
                <button
                  className="w-full bg-blue-600 text-white py-2 rounded font-medium"
                  onClick={handleSendOtp}
                  disabled={pwdLoading}
                >
                  {pwdLoading ? "Đang gửi..." : "Gửi mã OTP"}
                </button>
              </>
            )}
            {pwdStep === "otp" && (
              <>
                <label className="block text-gray-500 text-sm mb-2">
                  Mã OTP
                </label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
                  value={pwdOtp}
                  onChange={(e) => setPwdOtp(e.target.value)}
                  placeholder="Nhập mã OTP"
                />
                {pwdError && (
                  <div className="text-red-500 text-xs mb-2">{pwdError}</div>
                )}
                <button
                  className="w-full bg-blue-600 text-white py-2 rounded font-medium"
                  onClick={handleVerifyOtp}
                  disabled={pwdLoading}
                >
                  {pwdLoading ? "Đang xác thực..." : "Xác nhận OTP"}
                </button>
              </>
            )}
            {pwdStep === "newpass" && (
              <>
                <label className="block text-gray-500 text-sm mb-2">
                  Mật khẩu mới
                </label>
                <div className="relative mb-2">
                  <input
                    type={showPwdNew ? "text" : "password"}
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-10"
                    value={pwdNew}
                    onChange={(e) => setPwdNew(e.target.value)}
                    placeholder="Mật khẩu mới"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                    onClick={() => setShowPwdNew((v) => !v)}
                  >
                    {showPwdNew ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="relative mb-3">
                  <input
                    type={showPwdConfirm ? "text" : "password"}
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-10"
                    value={pwdConfirm}
                    onChange={(e) => {
                      setPwdConfirm(e.target.value);
                      if (pwdNew !== e.target.value) {
                        setPwdError("Mật khẩu không khớp.");
                      } else {
                        setPwdError("");
                      }
                    }}
                    placeholder="Xác nhận mật khẩu"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                    onClick={() => setShowPwdConfirm((v) => !v)}
                  >
                    {showPwdConfirm ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {pwdError && (
                  <div className="text-red-500 text-xs mb-2">{pwdError}</div>
                )}
                <button
                  className="w-full bg-blue-600 text-white py-2 rounded font-medium"
                  onClick={handleChangePassword}
                  disabled={pwdLoading || !!pwdError}
                >
                  {pwdLoading ? "Đang đổi..." : "Đổi mật khẩu"}
                </button>
              </>
            )}
            <button
              className="w-full mt-3 text-gray-500 hover:text-gray-700 text-sm"
              onClick={() => setShowPwdModal(false)}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {modalCertificate && (
        <CertificateModal
          initialData={initialCertificateData}
          onClose={() => setModalCertificate(false)}
          onSubmit={handleCertificateSubmit}
        />
      )}
    </div>
  );
}

// Certificate Modal Component
function CertificateModal({
  initialData,
  onClose,
  onSubmit,
}: {
  initialData: Omit<ICertificate, "_id">;
  onClose: () => void;
  onSubmit: (data: Omit<ICertificate, "_id" | "consultant_id">) => void;
}): React.ReactElement {
  const [data, setData] = useState(initialData);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title: data.title,
      type: data.type || "",
      issuedBy: data.issuedBy,
      issueDate: data.issueDate,
      expireDate: data.expireDate,
      description: data.description,
      fileUrl: data.fileUrl,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Chỉ chấp nhận file ảnh.");
      return;
    }
    // Validate file size (tối đa 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Kích thước file không được vượt quá 5MB.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(
        "https://mln111-1.onrender.com/api/uploads/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );
      if (!res.ok) throw new Error("Upload thất bại");
      const { imageUrl } = await res.json();
      setData((prev) => ({ ...prev, fileUrl: imageUrl }));
    } catch (err) {
      setUploadError("Tải ảnh lên thất bại.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-6 text-gray-900">
          {initialData.title ? "Chỉnh sửa" : "Thêm mới"} Chứng chỉ
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-600 text-sm mb-1">
              Tên chứng chỉ
            </label>
            <input
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-600 text-sm mb-1">
              Loại chứng chỉ
            </label>
            <input
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={data.type || ""}
              onChange={(e) => setData({ ...data, type: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-600 text-sm mb-1">
              Mã đơn vị cấp (số)
            </label>
            <input
              required
              type="number"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={data.issuedBy}
              onChange={(e) => setData({ ...data, issuedBy: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-600 text-sm mb-1">Ngày cấp</label>
            <input
              required
              type="date"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={data.issueDate}
              onChange={(e) => setData({ ...data, issueDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-600 text-sm mb-1">
              Ngày hết hạn (nếu có)
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={data.expireDate || ""}
              onChange={(e) => setData({ ...data, expireDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-600 text-sm mb-1">Mô tả</label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={data.description || ""}
              onChange={(e) =>
                setData({ ...data, description: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-gray-600 text-sm mb-1">
              Link file chứng chỉ (URL)
            </label>
            <div className="flex flex-col gap-2">
              <input
                placeholder="https://example.com/certificate.jpg"
                type="url"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={data.fileUrl}
                onChange={(e) => setData({ ...data, fileUrl: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Đang tải..." : "Tải ảnh từ thiết bị"}
                </button>
                {uploadError && (
                  <span className="text-red-500 text-xs ml-2">
                    {uploadError}
                  </span>
                )}
              </div>
              {data.fileUrl && (
                <div className="mt-2">
                  <img
                    src={data.fileUrl}
                    alt="Preview"
                    className="max-h-40 rounded border border-gray-200"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        "https://cdn.prod.website-files.com/60a530a795c0ca8a81c5868a/660568c3773236b1fdefc245_badge-preview%20(2)%2011.46.22.png";
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-600 font-medium px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
