import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  getAccountByIdApi,
  updateAccountApi,
  sendResetPasswordEmailApi,
  getBlogsByUserIdApi,
  updateBlogApi,
} from "../api";
import whaleLogo from "../assets/whale.png";
import type { AxiosError } from "axios";
import { Eye, EyeOff } from "lucide-react";
import BlogDetailView from "../components/blog/BlogDetailView";
import CreateBlogForm from "../components/blog/CreateBlogForm";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";

interface User {
  _id?: string;
  username?: string;
  email?: string;
  password?: string;
  photoUrl?: string;
  fullName?: string;
  phoneNumber?: string;
  role?: "consultant" | "customer";
  gender?: "male" | "female" | "other";
  yearOfBirth?: number;
  isVerified?: boolean;
  isDisabled?: boolean;
}

interface Blog {
  _id: string;
  title: string;
  content: string;
  author: string;
  image?: string;
  thumbnail?: string;
  topics?: string[];
  published: "draft" | "published" | "unpublished" | "rejected";
  comments: {
    userId: string;
    username: string;
    content: string;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
  anDanh?: boolean;
  rejectionReason?: string;
}


const menuTabs = [
  { key: "profile", label: "Hồ sơ người dùng" },
  { key: "blogs", label: "Bài viết" },
];

export default function Profile() {
  const location = useLocation();
  const [tab, setTab] = useState("profile");
  const { user: authUser, updateUserInfo } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [editData, setEditData] = useState<User>({});
  const [editMode, setEditMode] = useState(false);
  const [fieldError, setFieldError] = useState<{
    fullName?: string;
    phoneNumber?: string;
  }>({});
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [blogDangXem, setBlogDangXem] = useState<Blog | null>(null);
  const [modalBlog, setModalBlog] = useState(false);
  const [blogDangSua, setBlogDangSua] = useState<Blog | null>(null);
  const [modalEdit, setModalEdit] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterKeyword, setFilterKeyword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
      setEditData(authUser);
    }
  }, [authUser]);

  // Tự động chuyển tab nếu có query ?tab=payments
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam && menuTabs.some((t) => t.key === tabParam)) {
      setTab(tabParam);
    }
  }, [location.search]);

  useEffect(() => {
    if (user?._id) {
      getBlogsByUserIdApi(user._id)
        .then(setBlogs)
        .catch(() => setBlogs([]));
    }
  }, [user?._id]);

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
        yearOfBirth: editData.yearOfBirth,
      });
      const updated = await getAccountByIdApi(user._id);
      setUser(updated);
      setEditData(updated);
      setEditMode(false);
      setFieldError({}); // Clear any previous errors

      // Cập nhật AuthContext để comment có thể sử dụng fullName mới
      await updateUserInfo();
    } catch (error: unknown) {
      // Extract error message from response
      const errorMessage = (error as AxiosError<{ message?: string }>).response?.data?.message;
      if (errorMessage?.toLowerCase().includes("số điện thoại")) {
        setFieldError((prev) => ({
          ...prev,
          phoneNumber: errorMessage,
        }));
      }
    }
  };




  // Hàm lọc blog
  const filteredBlogs = blogs.filter((blog) => {
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "published" && blog.published === "published") ||
      (filterStatus === "pending" && blog.published === "draft") ||
      (filterStatus === "unpublished" && blog.published === "unpublished") ||
      (filterStatus === "rejected" && blog.published === "rejected");
    const matchKeyword = blog.title
      .toLowerCase()
      .includes(filterKeyword.toLowerCase());
    return matchStatus && matchKeyword;
  });

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file hình ảnh (JPG, PNG, GIF)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước file không được vượt quá 5MB");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("image", file);

      // Sử dụng API upload của backend với progress tracking
      const response = await axios.post(
        "https://mln111-1.onrender.com/api/uploads/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          onUploadProgress: () => {
            // Progress tracking can be added here if needed
          },
        }
      );

      if (response.data && response.data.imageUrl) {
        // Cập nhật avatar URL trong database
        if (user?._id) {
          await updateAccountApi(user._id, {
            photoUrl: response.data.imageUrl,
          });
          // Cập nhật user ngay lập tức
          const updated = await getAccountByIdApi(user._id);
          setUser(updated);
          setEditData(updated);

          // Cập nhật AuthContext để comment có thể sử dụng thông tin mới
          await updateUserInfo();
        }

        toast.success("Cập nhật ảnh đại diện thành công!", {
          position: "top-center",
          autoClose: 2500,
        });
      } else {
        toast.error("Không nhận được URL ảnh từ server!", {
          position: "top-center",
          autoClose: 2500,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại.", {
        position: "top-center",
        autoClose: 2500,
      });
    } finally {
      // setUploadProgress(0); // XÓA biến uploadProgress và setUploadProgress không dùng
    }
  };


  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center py-4 px-2 relative overflow-x-hidden">
      {/* Bóng tròn 2 màu chủ đạo - triết học */}
      <div className="absolute top-10 left-[-80px] w-60 h-60 bg-amber-100 rounded-full opacity-30 blur-2xl z-0"></div>
      <div className="absolute top-1/3 left-[-100px] w-72 h-72 bg-yellow-100 rounded-full opacity-25 blur-2xl z-0"></div>
      <div className="absolute bottom-20 left-[-60px] w-44 h-44 bg-amber-200 rounded-full opacity-20 blur-2xl z-0"></div>
      <div className="absolute top-20 right-[-80px] w-60 h-60 bg-yellow-200 rounded-full opacity-25 blur-2xl z-0"></div>
      <div className="absolute top-1/2 right-[-100px] w-72 h-72 bg-amber-100 rounded-full opacity-30 blur-2xl z-0"></div>
      <div className="absolute bottom-10 right-[-60px] w-44 h-44 bg-yellow-100 rounded-full opacity-20 blur-2xl z-0"></div>
      <div className="bg-amber-50/80 backdrop-blur-md rounded-3xl shadow-lg border border-amber-200 flex flex-col w-full max-w-6xl overflow-hidden relative">
        {/* Main content container */}
        <div className="flex flex-row w-full">
          {/* Sidebar */}
          <div className="w-64 py-10 px-6 bg-amber-100/50">
            {/* Nút quay về trang chủ nằm trong menu */}
            <Link
              to="/"
              className="inline-flex items-center text-amber-700 font-medium hover:underline bg-amber-50 rounded-lg px-3 py-1.5 shadow-sm border border-amber-200 mb-4"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Trang chủ
            </Link>
            <nav className="flex flex-col gap-2">
              {menuTabs.map((m) => (
                <button
                  key={m.key}
                  className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${tab === m.key
                      ? "bg-amber-50 text-amber-800 shadow-sm border border-amber-200"
                      : "text-amber-700 hover:bg-amber-100"
                    }`}
                  onClick={() => setTab(m.key)}
                >
                  {m.label}
                </button>
              ))}
              <div className="mt-auto pt-8 border-t border-amber-200">
                <Link
                  to="/login"
                  className="text-amber-600 font-medium hover:underline flex items-center gap-2 px-4"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-5-5H3zm7 5a1 1 0 10-2 0v4a1 1 0 102 0V8z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Đăng xuất
                </Link>
              </div>
            </nav>
          </div>
          {/* Main content */}
          <div className="flex-1">
            <div className="max-w-4xl mx-auto">
              {tab === "profile" && (
                <div className="bg-amber-50/80 backdrop-blur-md rounded-lg shadow-lg border border-amber-200 p-8">
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Phần Avatar */}
                    <div className="flex flex-col items-center space-y-4 w-full md:w-1/3">
                      <div className="relative w-48 h-48">
                        <img
                          src={user?.photoUrl || whaleLogo}
                          alt="Avatar"
                          className="w-full h-full object-cover rounded-full border-4 border-amber-500"
                        />
                        <button
                          onClick={handleAvatarClick}
                          className="absolute bottom-2 right-2 bg-amber-500 text-white p-2 rounded-full hover:bg-amber-600 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleAvatarChange}
                          className="hidden"
                          accept="image/*"
                        />
                      </div>
                      <h2 className="text-2xl font-bold text-center text-amber-800">
                        {user?.fullName}
                      </h2>
                      <p className="text-amber-600 text-center">
                        {user?.role === "consultant"
                          ? "Tư vấn viên"
                          : "Khách hàng"}
                      </p>
                    </div>

                    {/* Phần thông tin */}
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-amber-800">
                          Thông tin cá nhân
                        </h3>
                        <div className="flex items-center gap-4">
                          {!editMode ? (
                            <button
                              onClick={handleEdit}
                              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                              Chỉnh sửa
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditMode(false);
                                  setEditData(user || {});
                                }}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                              >
                                Hủy
                              </button>
                              <button
                                onClick={handleUpdate}
                                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Lưu thay đổi
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Form fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-amber-700">
                            Họ và tên
                          </label>
                          <input
                            type="text"
                            value={editData.fullName || ""}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                fullName: e.target.value,
                              })
                            }
                            disabled={!editMode}
                            className={`w-full px-4 py-2 rounded-lg border ${editMode
                                ? "border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                                : "bg-amber-50 border-amber-200"
                              } transition-colors`}
                            placeholder="Nhập họ và tên"
                          />
                          {fieldError.fullName && (
                            <p className="text-red-500 text-sm mt-1">
                              {fieldError.fullName}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-amber-700">
                            Email
                          </label>
                          <input
                            type="email"
                            value={editData.email || ""}
                            disabled
                            className="w-full px-4 py-2 rounded-lg bg-amber-50 border border-amber-200"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-amber-700">
                            Số điện thoại
                          </label>
                          <input
                            type="tel"
                            value={editData.phoneNumber || ""}
                            onChange={(e) => {
                              setEditData({
                                ...editData,
                                phoneNumber: e.target.value,
                              });
                              // Clear error when user starts typing
                              if (fieldError.phoneNumber) {
                                setFieldError((prev) => ({
                                  ...prev,
                                  phoneNumber: undefined,
                                }));
                              }
                            }}
                            disabled={!editMode}
                            className={`w-full px-4 py-2 rounded-lg border ${fieldError.phoneNumber
                                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                                : editMode
                                  ? "border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                  : "bg-gray-50 border-gray-200"
                              } transition-colors`}
                            placeholder="0xxxxxxxxx"
                          />
                          {fieldError.phoneNumber && (
                            <p className="text-red-500 text-sm mt-1">
                              {fieldError.phoneNumber}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-amber-700">
                            Giới tính
                          </label>
                          <select
                            value={editData.gender || ""}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                gender: e.target.value as
                                  | "male"
                                  | "female"
                                  | "other",
                              })
                            }
                            disabled={!editMode}
                            className={`w-full px-4 py-2 rounded-lg border ${editMode
                                ? "border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                                : "bg-amber-50 border-amber-200"
                              } transition-colors`}
                          >
                            <option value="">Chọn giới tính</option>
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                            <option value="other">Khác</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-amber-700">
                            Năm sinh
                          </label>
                          <input
                            type="number"
                            value={editData.yearOfBirth || ""}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                yearOfBirth: parseInt(e.target.value),
                              })
                            }
                            disabled={!editMode}
                            className={`w-full px-4 py-2 rounded-lg border ${editMode
                                ? "border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                                : "bg-amber-50 border-amber-200"
                              } transition-colors`}
                            min="1900"
                            max={new Date().getFullYear()}
                            placeholder="Nhập năm sinh"
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}
              {tab === "blogs" && (
                <div className="p-8">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-amber-800 mb-2">
                      Bài viết của bạn
                    </h2>
                    <p className="text-amber-600 text-lg">
                      Quản lý và theo dõi các bài viết của bạn
                    </p>
                  </div>
                  {/* Filter */}
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-amber-200">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-amber-700 mb-2">
                          Lọc theo trạng thái
                        </label>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full rounded-xl border border-amber-200 px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white/80"
                        >
                          <option value="all">Tất cả bài viết</option>
                          <option value="published">Đã xuất bản</option>
                          <option value="pending">Chưa duyệt</option>
                          <option value="unpublished">Ngừng xuất bản</option>
                          <option value="rejected">Đã từ chối</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-amber-700 mb-2">
                          Tìm kiếm
                        </label>
                        <input
                          type="text"
                          value={filterKeyword}
                          onChange={(e) => setFilterKeyword(e.target.value)}
                          placeholder="Tìm theo tiêu đề bài viết..."
                          className="w-full rounded-xl border border-amber-200 px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white/80"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Đã xuất bản */}
                    <div
                      className={`bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 shadow-lg border-2 flex flex-col items-center justify-center transition-all cursor-pointer hover:shadow-xl hover:scale-105 ${filterStatus === "published"
                          ? "border-green-500 ring-4 ring-green-200"
                          : "border-green-200 hover:border-green-300"
                        }`}
                      onClick={() => setFilterStatus("published")}
                    >
                      <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-green-700 mb-2">Đã xuất bản</p>
                      <p className="text-3xl font-bold text-green-800">
                        {
                          blogs.filter((blog) => blog.published === "published")
                            .length
                        }
                      </p>
                    </div>

                    {/* Chưa duyệt */}
                    <div
                      className={`bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 shadow-lg border-2 flex flex-col items-center justify-center transition-all cursor-pointer hover:shadow-xl hover:scale-105 ${filterStatus === "pending"
                          ? "border-yellow-500 ring-4 ring-yellow-200"
                          : "border-yellow-200 hover:border-yellow-300"
                        }`}
                      onClick={() => setFilterStatus("pending")}
                    >
                      <div className="p-4 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-full mb-4 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-yellow-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-yellow-700 mb-2">Chưa duyệt</p>
                      <p className="text-3xl font-bold text-yellow-800">
                        {
                          blogs.filter((blog) => blog.published === "draft")
                            .length
                        }
                      </p>
                    </div>

                    {/* Ngừng xuất bản */}
                    <div
                      className={`bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 shadow-lg border-2 flex flex-col items-center justify-center transition-all cursor-pointer hover:shadow-xl hover:scale-105 ${filterStatus === "unpublished"
                          ? "border-orange-500 ring-4 ring-orange-200"
                          : "border-orange-200 hover:border-orange-300"
                        }`}
                      onClick={() => setFilterStatus("unpublished")}
                    >
                      <div className="p-4 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full mb-4 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-orange-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                          />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-orange-700 mb-2">Ngừng xuất bản</p>
                      <p className="text-3xl font-bold text-orange-800">
                        {
                          blogs.filter((blog) => blog.published === "unpublished")
                            .length
                        }
                      </p>
                    </div>

                    {/* Đã từ chối */}
                    <div
                      className={`bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 shadow-lg border-2 flex flex-col items-center justify-center transition-all cursor-pointer hover:shadow-xl hover:scale-105 ${filterStatus === "rejected"
                          ? "border-red-500 ring-4 ring-red-200"
                          : "border-red-200 hover:border-red-300"
                        }`}
                      onClick={() => setFilterStatus("rejected")}
                    >
                      <div className="p-4 bg-gradient-to-br from-red-100 to-rose-100 rounded-full mb-4 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-red-700 mb-2">Đã từ chối</p>
                      <p className="text-3xl font-bold text-red-800">
                        {
                          blogs.filter((blog) => blog.published === "rejected")
                            .length
                        }
                      </p>
                    </div>
                  </div>

                  {/* Danh sách bài viết */}
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-200">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-amber-800">
                        {filterStatus === "published"
                          ? "Bài viết đã xuất bản"
                          : filterStatus === "pending"
                            ? "Bài viết chưa duyệt"
                            : filterStatus === "unpublished"
                              ? "Bài viết ngừng xuất bản"
                              : filterStatus === "rejected"
                                ? "Bài viết bị từ chối"
                                : "Tất cả bài viết"}
                      </h3>
                      <div className="text-sm text-amber-600">
                        {filteredBlogs.length} bài viết
                      </div>
                    </div>

                    {filteredBlogs.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-24 h-24 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-medium text-gray-600 mb-2">Không có bài viết nào</h4>
                        <p className="text-gray-500">Hãy tạo bài viết đầu tiên của bạn!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredBlogs.map((blog) => (
                          <div
                            key={blog._id}
                            className={`bg-gradient-to-r from-amber-50 via-yellow-50 to-white hover:from-amber-100 hover:shadow-lg transition-all duration-300 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-md cursor-pointer border-2 border-amber-200 hover:border-amber-300`}
                          >
                            <div className="flex-1">
                              <div className="font-bold text-lg text-gray-800 mb-2">
                                {blog.title}
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center gap-1">
                                  <svg
                                    className="w-4 h-4 text-amber-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  {new Date(blog.createdAt).toLocaleDateString(
                                    "vi-VN"
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <svg
                                    className="w-4 h-4 text-amber-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                  </svg>
                                  {(blog.author === user?.fullName ||
                                    blog.author === user?.username) &&
                                    blog.anDanh
                                    ? "Ẩn danh"
                                    : blog.author}
                                </div>
                              </div>
                              <div
                                className={`text-sm ${blog.published === "published"
                                    ? "text-green-700"
                                    : blog.published === "draft"
                                      ? "text-yellow-700"
                                      : blog.published === "unpublished"
                                        ? "text-orange-700"
                                        : "text-red-700"
                                  } font-semibold inline-block px-3 py-1.5 rounded-full ${blog.published === "published"
                                    ? "bg-green-100 border-2 border-green-200"
                                    : blog.published === "draft"
                                      ? "bg-yellow-100 border-2 border-yellow-200"
                                      : blog.published === "unpublished"
                                        ? "bg-orange-100 border-2 border-orange-200"
                                        : "bg-red-100 border-2 border-red-200"
                                  }`}
                              >
                                {blog.published === "published"
                                  ? "Đã xuất bản"
                                  : blog.published === "draft"
                                    ? "Chưa duyệt"
                                    : blog.published === "unpublished"
                                      ? "Ngừng xuất bản"
                                      : "Đã từ chối"}
                              </div>
                              {blog.published === "rejected" &&
                                blog.rejectionReason && (
                                  <div className="text-sm text-red-600 mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                                    <strong>Lý do từ chối:</strong> {blog.rejectionReason}
                                  </div>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setBlogDangXem(blog);
                                  setModalBlog(true);
                                }}
                                className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Xem chi tiết
                              </button>
                              {blog.published !== "rejected" &&
                                blog.published !== "published" && (
                                  <button
                                    onClick={() => {
                                      setBlogDangSua(blog);
                                      setModalEdit(true);
                                    }}
                                    className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Chỉnh sửa
                                  </button>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom wave decoration */}
        <div className="w-full h-40 mt-12 relative">
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1440 320"
              className="w-full"
            >
              <path
                fill="#DBE8FA"
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
      {/* Modal xem chi tiết blog */}
      {modalBlog && blogDangXem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto relative">
            <BlogDetailView
              blog={{
                ...blogDangXem!,
                authorId: {
                  _id: user?._id || "",
                  fullName: user?.fullName || "",
                  username: user?.username || "",
                },
                anDanh: !!blogDangXem?.anDanh,
              }}
              onClose={() => setModalBlog(false)}
            />
          </div>
        </div>
      )}
      {/* Modal chỉnh sửa blog */}
      {modalEdit && blogDangSua && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <CreateBlogForm
              initialData={{
                title: blogDangSua.title,
                content: blogDangSua.content,
                authorId: user?._id || "",
                topics: blogDangSua.topics?.join(", ") || "",
                image: blogDangSua.image || "",
                published: blogDangSua.published,
                anDanh: blogDangSua.anDanh,
              }}
              onCancel={() => setModalEdit(false)}
              onSuccess={() => {
                setModalEdit(false);
                setBlogDangSua(null);
                if (authUser?._id)
                  getBlogsByUserIdApi(authUser._id).then(setBlogs);
              }}
              onSubmit={async (data) => {
                if (blogDangSua.published === "published") {
                  alert("Không thể chỉnh sửa bài viết đã xuất bản.");
                  return;
                }
                const dataUpdate = { ...data };
                await updateBlogApi(blogDangSua._id, dataUpdate);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
