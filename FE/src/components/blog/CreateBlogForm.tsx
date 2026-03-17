import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import type { BlogData } from "../../api";

interface CreateBlogFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: {
    title?: string;
    content?: string;
    authorId?: string;
    topics?: string;
    image?: string;
    published?: 'draft' | 'published' | 'unpublished' | 'rejected';
    anDanh?: boolean;
    authorName?: string; // Added for displaying author name in edit form
  };
  onSubmit?: (data: BlogData) => Promise<void>;
  isAdmin?: boolean;
}

interface UserInfo {
  _id?: string;
  fullName?: string;
  username?: string;
}

const CreateBlogForm: React.FC<CreateBlogFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
  onSubmit,
  isAdmin,
}) => {
  const [tieuDe, setTieuDe] = useState(initialData?.title || "");
  const [noiDung, setNoiDung] = useState(initialData?.content || ""); // Plain text
  const [tacGia, setTacGia] = useState(initialData?.authorId || "");
  const [topics, setTopics] = useState(initialData?.topics || "");
  const [hinhAnh, setHinhAnh] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.image || null
  );
  const [dangTai, setDangTai] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [anDanh, setAnDanh] = useState(initialData?.anDanh || false);
  // Thêm biến kiểm tra nếu đã từng là ẩn danh thì không cho sửa lại
  const isLockedAnonymous = initialData?.anDanh === true;
  const [trangThai, setTrangThai] = useState<'draft' | 'published' | 'unpublished' | 'rejected'>(
    initialData?.published || 'draft'
  );

  useEffect(() => {
    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo && !initialData?.authorId) {
      const info = JSON.parse(storedUserInfo);
      setUserInfo(info);
      setTacGia(info._id || "");
    }
  }, [initialData]);

  useEffect(() => {
    if (anDanh) {
      // Không thay đổi giá trị lưu vào DB, chỉ dùng để hiển thị
    } else if (userInfo && !initialData?.authorId) {
      setTacGia(userInfo._id || "");
    }
  }, [anDanh, userInfo, initialData]);

  // Không cần useEffect này nữa vì sử dụng textarea đơn giản

  useEffect(() => {
    validateAll();
    // eslint-disable-next-line
  }, [tieuDe, tacGia, noiDung, topics, hinhAnh]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setHinhAnh(file);
      setTouched((prev) => ({ ...prev, hinhAnh: true }));
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setHinhAnh(null);
      setImagePreview(null);
    }
  };

  const validateAll = () => {
    const errors: { [key: string]: string } = {};
    if (!tieuDe.trim()) {
      errors.tieuDe = "Tiêu đề không được để trống";
    } else if (tieuDe.trim().length < 5) {
      errors.tieuDe = "Tiêu đề phải có ít nhất 5 ký tự";
    } else if (tieuDe.trim().length > 150) {
      errors.tieuDe = "Tiêu đề không được quá 150 ký tự";
    }

    // Validate authorId (tác giả sẽ lấy từ user đăng nhập)
    if (!tacGia.trim()) {
      errors.tacGia = "Không tìm thấy thông tin tác giả. Vui lòng đăng nhập lại.";
    }

    // Validate nội dung: kiểm tra text thuần
    const plainText = noiDung.trim();
    if (!plainText) {
      errors.noiDung = "Nội dung không được để trống";
    } else if (plainText.length < 50) {
      errors.noiDung = "Nội dung phải có ít nhất 50 ký tự";
    }
    if (hinhAnh) {
      const validImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!validImageTypes.includes(hinhAnh.type)) {
        errors.hinhAnh = "Ảnh phải có định dạng JPG, JPEG, PNG hoặc WEBP";
      } else if (hinhAnh.size > 2 * 1024 * 1024) {
        errors.hinhAnh = "Ảnh không được quá 2MB";
      }
    }
    const topicArr = topics
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (topicArr.length === 0) {
      errors.topics = "Vui lòng nhập ít nhất 1 chủ đề.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      tieuDe: true,
      tacGia: true,
      noiDung: true,
      topics: true,
      hinhAnh: true,
    });
    if (!validateAll()) return;
    setDangTai(true);
    try {
      // Lưu tên tác giả thật trong trường hợp ẩn danh
      let realAuthor = tacGia;

      // Nếu đang trong chế độ ẩn danh và trường tacGia đã bị thay đổi thành "Ẩn danh"
      // thì phục hồi lại giá trị ban đầu từ initialData hoặc userInfo
      if (anDanh && tacGia === "Ẩn danh") {
        realAuthor = initialData?.authorId || userInfo?._id || "";
      }

      const blogData: BlogData = {
        title: tieuDe,
        content: noiDung,
        authorId: realAuthor,
        topics: topics.split(",").map((topic: string) => topic.trim()),
        published: isAdmin ? (trangThai === 'draft' ? 'published' : trangThai === 'rejected' ? 'published' : trangThai) : 'draft',
        anDanh: anDanh
      };
      if (hinhAnh) {
        blogData.image = hinhAnh;
      } else if (initialData?.image) {
        blogData.image = initialData.image;
      }
      if (onSubmit) {
        await onSubmit(blogData);
      } else {
        // fallback: gọi API tạo mới như cũ
        const { createBlogApi } = await import("../../api");
        await createBlogApi(blogData);
        toast.success(
          "Bài viết của bạn đã gửi thành công, vui lòng chờ admin duyệt!"
        );
      }
      onSuccess();
    } catch (error: unknown) {
      toast.error("Có lỗi xảy ra khi gửi bài viết. Vui lòng thử lại sau.");
      console.error("Error submitting blog:", error);
    } finally {
      setDangTai(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8 px-2 sm:px-4 md:px-6 lg:px-8">
      {/* Form card */}
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
        <div className="mb-6 sm:mb-8 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {initialData ? "Sửa Bài Viết" : "Tạo Bài Viết Mới"}
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Chia sẻ kiến thức và cảm nhận về Quyền con người trong XHCN với cộng đồng MLN131!
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề
            </label>
            <input
              type="text"
              className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 placeholder-gray-400"
              value={tieuDe}
              onChange={(e) => {
                setTieuDe(e.target.value);
              }}
              onBlur={() => handleBlur("tieuDe")}
              required
              style={{
                borderColor:
                  touched.tieuDe && formErrors.tieuDe ? "#f56565" : "#d1d5db",
              }}
            />
            {touched.tieuDe && formErrors.tieuDe && (
              <p className="mt-1 text-sm text-red-600 font-medium">
                {formErrors.tieuDe}
              </p>
            )}
          </div>
          {/* Tác giả */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tác giả
            </label>
            <div className="flex items-center gap-3 mb-2">
              <input
                id="anDanh"
                type="checkbox"
                checked={anDanh}
                onChange={(e) => setAnDanh(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isLockedAnonymous}
              />
              <label
                htmlFor="anDanh"
                className="text-sm text-gray-700 select-none cursor-pointer"
              >
                Đăng ẩn danh
              </label>
            </div>
            <div className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 text-gray-900">
              {anDanh ? "Ẩn danh" : (initialData?.authorName || userInfo?.fullName || userInfo?.username || "Đang tải...")}
            </div>
            {isLockedAnonymous && (
              <p className="mt-1 text-xs text-red-600 font-semibold">
                Bài viết này đã được đăng ẩn danh và không thể chuyển lại thành hiện tên tác giả.
              </p>
            )}
            {anDanh && !isLockedAnonymous && (
              <p className="mt-1 text-xs text-blue-600">
                Tên tác giả thực sẽ được lưu trong hệ thống nhưng hiển thị là "Ẩn danh" cho người đọc.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nội dung
            </label>
            <textarea
              value={noiDung}
              onChange={(e) => {
                setNoiDung(e.target.value);
                setTouched((prev) => ({ ...prev, noiDung: true }));
              }}
              onBlur={() => handleBlur("noiDung")}
              placeholder="Nhập nội dung bài viết của bạn..."
              className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 placeholder-gray-400 min-h-[150px] sm:min-h-[200px] resize-y"
              style={{
                borderColor:
                  touched.noiDung && formErrors.noiDung ? "#f56565" : "#d1d5db",
              }}
            />
            {touched.noiDung && formErrors.noiDung && (
              <p className="mt-1 text-sm text-red-600 font-medium">
                {formErrors.noiDung}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ảnh đại diện blog
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              onBlur={() => handleBlur("hinhAnh")}
              className="mt-1 block w-full text-sm sm:text-base bg-white text-gray-900 border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3"
              style={{
                color:
                  touched.hinhAnh && formErrors.hinhAnh ? "#f56565" : "inherit",
              }}
            />
            {touched.hinhAnh && formErrors.hinhAnh && (
              <p className="mt-1 text-sm text-red-600 font-medium">
                {formErrors.hinhAnh}
              </p>
            )}
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="mt-2 w-40 h-28 object-cover rounded-lg border border-gray-300 mx-auto"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chủ đề (phân tách bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              onBlur={() => handleBlur("topics")}
              placeholder="Ví dụ: sức khỏe, tâm lý, dinh dưỡng"
              className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 placeholder-gray-400"
              style={{
                borderColor:
                  touched.topics && formErrors.topics ? "#f56565" : "#d1d5db",
              }}
            />
            {touched.topics && formErrors.topics && (
              <p className="mt-1 text-sm text-red-600 font-medium">
                {formErrors.topics}
              </p>
            )}
          </div>

          {/* Trạng thái xuất bản - chỉ hiển thị cho admin */}
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái xuất bản
              </label>
              <select
                value={trangThai}
                onChange={(e) => setTrangThai(e.target.value as 'draft' | 'published' | 'unpublished' | 'rejected')}
                className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900"
              >
                <option value="published">Xuất bản</option>
                <option value="unpublished">Ngừng xuất bản</option>
              </select>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 sm:pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 border border-gray-300"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={dangTai}
              className={`w-full sm:w-auto px-4 sm:px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md border border-blue-700 ${dangTai ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {dangTai ? "Đang xử lý..." : initialData ? "Cập nhật" : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBlogForm;
