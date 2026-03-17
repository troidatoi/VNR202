import React, { useEffect, useState, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../api";
import axios from "axios";

// Thêm CSS cho animation
const fadeInDown = `
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in-down {
  animation: fadeInDown 0.3s ease-out forwards;
}
`;

// Interface cho dữ liệu dịch vụ
interface IService {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string; // Thêm trường image thay vì duration
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  level?: "low" | "moderate" | "high" | "critical";
}

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

const LEVEL_OPTIONS = [
  { value: "", label: "Không chọn" },
  { value: "low", label: "Thấp" },
  { value: "moderate", label: "Trung bình" },
  { value: "high", label: "Cao" },
  { value: "critical", label: "Nghiêm trọng" },
];

const Service: React.FC = () => {
  const [services, setServices] = useState<IService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<IService | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State cho thông báo thành công
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    image: "", // Thêm trường image thay vì duration
    status: "active" as "active" | "inactive",
    level: "" as "" | "low" | "moderate" | "high" | "critical",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({
    min: "",
    max: "",
  });

  // Filtered services
  const filteredServices = services.filter((service) => {
    // Filter by search term
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by status
    const matchesStatus =
      statusFilter === "" || service.status === statusFilter;

    // Filter by price range
    const matchesMinPrice =
      priceRange.min === "" || service.price >= parseInt(priceRange.min);
    const matchesMaxPrice =
      priceRange.max === "" || service.price <= parseInt(priceRange.max);

    return matchesSearch && matchesStatus && matchesMinPrice && matchesMaxPrice;
  });

  const totalPages = Math.ceil(filteredServices.length / rowsPerPage);
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setPriceRange({ min: "", max: "" });
    setCurrentPage(1);
  };

  // Thêm state lưu lỗi cho từng trường
  const [errors, setErrors] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    backend: "",
  });

  useEffect(() => {
    fetchServices();
  }, []);

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? Number(value) : value,
    }));
  };

  // Validation riêng khi blur hoặc submit
  const validateField = (name: string, value: string | number) => {
    if (name === "name" && typeof value === "string") {
      if (!value.trim()) {
        setErrors((prev) => ({ ...prev, name: "Vui lòng nhập tên dịch vụ!" }));
        return false;
      } else {
        setErrors((prev) => ({ ...prev, name: "" }));
        return true;
      }
    }

    if (name === "description" && typeof value === "string") {
      if (!value.trim()) {
        setErrors((prev) => ({
          ...prev,
          description: "Vui lòng nhập mô tả dịch vụ!",
        }));
        return false;
      } else {
        setErrors((prev) => ({ ...prev, description: "" }));
        return true;
      }
    }

    if (name === "price") {
      setErrors((prev) => ({ ...prev, price: "" }));
      return true;
    }

    return true;
  };

  // Handle field blur - validation khi người dùng rời khỏi trường
  const handleFieldBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  // Hàm xử lý upload ảnh
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      const response = await axios.post(
        "https://mln111-1.onrender.com/api/uploads/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          onUploadProgress: (progressEvent) => {
            // This part is not directly related to the image upload logic
            // but can be used for progress indication if needed.
            // For now, it's commented out.
            // const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            // console.log(`Upload progress: ${percentCompleted}%`);
          },
        }
      );

      if (response.data && response.data.imageUrl) {
        setFormData((prev) => ({
          ...prev,
          image: response.data.imageUrl,
        }));

        // Reset lỗi image nếu có
        setErrors((prev) => ({ ...prev, image: "" }));

        toast.success("Tải ảnh lên thành công!");
      } else {
        toast.error("Không nhận được URL ảnh từ server!");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  // Xử lý khi nhấn nút chọn file
  const handleSelectImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Fetch services from API
  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get("/services");
      // Sắp xếp dịch vụ từ mới nhất đến cũ nhất dựa trên createdAt
      const sortedServices = response.data.sort((a: IService, b: IService) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      setServices(sortedServices);
      setError(null);
    } catch (err) {
      setError("Có lỗi xảy ra khi tải danh sách dịch vụ");
      toast.error("Không thể tải danh sách dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Open create modal
  const handleOpenCreateModal = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      image: "",
      status: "active",
      level: "",
    });
    // Reset errors khi mở modal tạo mới
    setErrors({
      name: "",
      description: "",
      price: "",
      image: "",
      backend: "",
    });
    setIsCreateModalOpen(true);
  };

  // Close create modal
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setFormData({
      name: "",
      description: "",
      price: 0,
      image: "",
      status: "active",
      level: "",
    });
  };

  // Handle create service
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra lỗi các trường khi submit
    let hasError = false;

    // Kiểm tra tất cả các trường
    if (!validateField("name", formData.name)) hasError = true;
    if (!validateField("description", formData.description)) hasError = true;

    if (!formData.image) {
      setErrors((prev) => ({
        ...prev,
        image: "Vui lòng tải lên hình ảnh cho dịch vụ!",
      }));
      hasError = true;
    }

    if (hasError) {
      return;
    }

    try {
      // Tạo đối tượng dữ liệu để gửi đi
      const serviceData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        image: formData.image,
        status: formData.status,
        ...(formData.level && { level: formData.level }),
      };

      // Gọi API tạo dịch vụ
      const response = await api.post("/services", serviceData);

      // Cập nhật danh sách dịch vụ
      setServices((prev) => [...prev, response.data]);

      // Đóng modal và thông báo thành công
      handleCloseCreateModal();
      toast.success("✅ Dịch vụ đã được tạo thành công!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        style: {
          backgroundColor: "#0ea5e9",
          color: "white",
          fontSize: "14px",
        },
      });

      // Hiển thị thông báo thành công
      setSuccessMessage(
        `Dịch vụ "${response.data.name}" đã được tạo thành công!`
      );
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

      // Tải lại danh sách dịch vụ
      fetchServices();
    } catch (error: any) {
      toast.error("Có lỗi xảy ra khi tạo dịch vụ. Vui lòng thử lại.");

      // Xử lý lỗi từ API
      const errorMessage =
        error.response?.data?.message || "Có lỗi xảy ra khi tạo dịch vụ!";
      setErrors((prev) => ({ ...prev, backend: errorMessage }));
      toast.error(errorMessage);
    }
  };

  // Open update modal
  const handleOpenUpdateModal = (service: IService) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      image: service.image,
      status: service.status,
      level: service.level || "",
    });
    // Reset errors khi mở modal cập nhật
    setErrors({
      name: "",
      description: "",
      price: "",
      image: "",
      backend: "",
    });
    setIsUpdateModalOpen(true);
  };

  // Close update modal
  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedService(null);
    setFormData({
      name: "",
      description: "",
      price: 0,
      image: "",
      status: "active",
      level: "",
    });
    // Reset errors khi đóng modal cập nhật
    setErrors({
      name: "",
      description: "",
      price: "",
      image: "",
      backend: "",
    });
  };

  // Handle update service
  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    // Kiểm tra lỗi các trường khi submit
    let hasError = false;
    const newErrors = { ...errors };

    // Kiểm tra tất cả các trường - chỉ validate những trường bắt buộc
    if (!formData.name.trim()) {
      newErrors.name = "Vui lòng nhập tên dịch vụ!";
      hasError = true;
    } else {
      newErrors.name = "";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Vui lòng nhập mô tả dịch vụ!";
      hasError = true;
    } else {
      newErrors.description = "";
    }

    if (!formData.image) {
      newErrors.image = "Vui lòng tải lên hình ảnh cho dịch vụ!";
      hasError = true;
    } else {
      newErrors.image = "";
    }

    setErrors(newErrors);

    if (hasError) {
      toast.error("Vui lòng điền đầy đủ thông tin trước khi lưu thay đổi");
      return;
    }

    try {
      await api.put(`/services/${selectedService._id}`, {
        ...formData,
        ...(formData.level ? { level: formData.level } : {}),
      });

      // Reset errors ngay sau khi API thành công
      setErrors({
        name: "",
        description: "",
        price: "",
        image: "",
        backend: "",
      });

      // Fetch dữ liệu mới và đóng modal
      fetchServices();
      handleCloseUpdateModal();

      // Sử dụng set timeout để đảm bảo thông báo hiển thị sau khi modal đóng
      setTimeout(() => {
        // Hiển thị thông báo thành công nổi bật và rõ ràng
        toast.success("✅ Dịch vụ đã được cập nhật thành công!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          style: {
            backgroundColor: "#0ea5e9",
            color: "white",
            fontSize: "14px",
            fontWeight: "bold",
            border: "1px solid #0284c7",
            borderRadius: "8px",
          },
        });

        // Hiển thị thông báo thành công
        setSuccessMessage(
          `Dịch vụ "${formData.name}" đã được cập nhật thành công!`
        );
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      }, 300);
    } catch (err) {
      toast.error("Có lỗi xảy ra khi cập nhật dịch vụ");
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg mt-4">
      <style>{fadeInDown}</style>
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

      {/* Thông báo thành công */}
      {successMessage && (
        <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 relative animate-fade-in-down">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-amber-800">
                {successMessage}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="inline-flex rounded-md p-1.5 text-amber-500 hover:bg-amber-100 focus:outline-none"
                >
                  <span className="sr-only">Đóng</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input file ẩn */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        className="hidden"
        accept="image/jpeg, image/png, image/gif, image/jpg"
      />

      {/* Tiêu đề và nút thêm mới */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Quản lý dịch vụ
        </h1>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Thêm dịch vụ
        </button>
      </div>

      {/* Phần tìm kiếm và lọc */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-700 mb-4">
          Tìm kiếm và Lọc
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tìm kiếm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm theo tên, mô tả..."
                className="focus:ring-amber-500 focus:border-amber-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Lọc theo trạng thái */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>

          {/* Lọc theo giá */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Khoảng giá (VNĐ)
            </label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => {
                    setPriceRange((prev) => ({ ...prev, min: e.target.value }));
                    setCurrentPage(1);
                  }}
                  placeholder="Giá tối thiểu"
                  className="focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => {
                    setPriceRange((prev) => ({ ...prev, max: e.target.value }));
                    setCurrentPage(1);
                  }}
                  placeholder="Giá tối đa"
                  className="focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Đặt lại bộ lọc
          </button>
        </div>

        {filteredServices.length > 0 ? (
          <div className="mt-4 text-sm text-gray-600">
            Hiển thị {paginatedServices.length} trên {filteredServices.length}{" "}
            dịch vụ
          </div>
        ) : (
          <div className="mt-4 text-sm text-gray-600">
            Không tìm thấy dịch vụ nào phù hợp với bộ lọc
          </div>
        )}
      </div>

      {/* Bảng dịch vụ */}
      <div className="overflow-x-auto shadow-md rounded-lg max-h-[70vh] overflow-y-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-amber-50 text-gray-700 text-left text-sm font-semibold uppercase tracking-wider">
              <th className="px-4 py-3 rounded-tl-lg">Tên dịch vụ</th>
              <th className="px-4 py-3">Mô tả</th>
              <th className="px-4 py-3">Giá</th>
              <th className="px-4 py-3">Hình ảnh</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 rounded-tr-lg">Thao tác</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm divide-y divide-gray-200">
            {paginatedServices.map((service) => (
              <tr
                key={service._id}
                className="border-b border-gray-200 hover:bg-amber-50 transition-colors duration-150"
              >
                <td className="px-4 py-3 font-medium">{service.name}</td>
                <td className="px-4 py-3 max-w-xs truncate">
                  {service.description}
                </td>
                <td className="px-4 py-3">{formatCurrency(service.price)}</td>
                <td className="px-4 py-3">
                  {service.image && (
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-12 h-12 object-cover rounded-md"
                    />
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${service.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                      }`}
                  >
                    {service.status === "active"
                      ? "Hoạt động"
                      : "Không hoạt động"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <Tooltip text="Cập nhật">
                      <button
                        onClick={() => handleOpenUpdateModal(service)}
                        className="p-2 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"
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
            className={`px-3 py-1 rounded ${currentPage === i + 1
                ? "bg-amber-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
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

      {/* Modal Tạo dịch vụ mới */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-amber-700">
                Thêm dịch vụ mới
              </h2>
              <button
                type="button"
                onClick={handleCloseCreateModal}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            {errors.backend && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                <div className="flex">
                  <svg
                    className="h-4 w-4 text-red-500 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>{errors.backend}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateService} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Tên dịch vụ
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    placeholder="Nhập tên dịch vụ"
                    className={`block w-full rounded-md py-2 px-3 text-sm border focus:ring-amber-500 focus:border-amber-500 ${errors.name
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                      }`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Giá (VNĐ)
                  </label>
                  <input
                    id="price"
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    step="1000"
                    placeholder="Nhập giá dịch vụ"
                    className={`block w-full rounded-md py-2 px-3 text-sm border focus:ring-amber-500 focus:border-amber-500 ${errors.price
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                      }`}
                  />
                  {errors.price && (
                    <p className="text-red-500 text-xs mt-1">{errors.price}</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Mô tả
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  rows={3}
                  placeholder="Nhập mô tả chi tiết về dịch vụ"
                  className={`block w-full rounded-md py-2 px-3 text-sm border focus:ring-amber-500 focus:border-amber-500 ${errors.description
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                    }`}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hình ảnh
                </label>
                <div className="flex items-center space-x-3 mb-2">
                  <button
                    type="button"
                    onClick={handleSelectImage}
                    className="px-3 py-2 bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 transition-colors flex items-center text-sm"
                    disabled={uploading}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {uploading ? "Đang tải lên..." : "Chọn ảnh"}
                  </button>
                  {formData.image && (
                    <span className="text-sm text-green-600 flex items-center">
                      <svg
                        className="h-4 w-4 text-green-500 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Đã tải ảnh lên
                    </span>
                  )}
                </div>
                {formData.image && (
                  <div className="mt-2 border rounded overflow-hidden shadow-sm">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-40 object-cover"
                    />
                  </div>
                )}
                {errors.image && (
                  <p className="text-red-500 text-xs mt-1">{errors.image}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Trạng thái
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="block w-full rounded-md py-2 px-3 text-sm border-gray-300 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="level"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Mức độ khuyến nghị
                </label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="block w-full rounded-md py-2 px-3 text-sm border-gray-300 focus:ring-amber-500 focus:border-amber-500"
                >
                  {LEVEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${uploading
                      ? "bg-amber-400 cursor-not-allowed"
                      : "bg-amber-600 hover:bg-amber-700"
                    }`}
                  disabled={uploading}
                >
                  {uploading ? "Đang tải lên..." : "Tạo dịch vụ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cập nhật dịch vụ */}
      {isUpdateModalOpen && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          {/* Nội dung form cập nhật */}
          <form
            onSubmit={handleUpdateService}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                Chỉnh sửa dịch vụ
              </h2>
              <button
                type="button"
                onClick={handleCloseUpdateModal}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <svg
                  className="w-6 h-6 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên dịch vụ
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-amber-500 focus:border-amber-500 ${errors.name ? "border-red-300 bg-red-50" : "border-gray-300"
                    }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-amber-500 focus:border-amber-500 ${errors.description
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                    }`}
                ></textarea>
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá (VND)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-amber-500 focus:border-amber-500 ${errors.price
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                    }`}
                />
                {errors.price && (
                  <p className="text-red-500 text-xs mt-1">{errors.price}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ảnh dịch vụ
                </label>
                <div className="mt-2 flex items-center gap-4">
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={handleSelectImage}
                    disabled={uploading}
                    className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${uploading ? "bg-gray-400" : "bg-amber-600 hover:bg-amber-700"
                      } focus:outline-none`}
                  >
                    {uploading ? "Đang tải..." : "Chọn ảnh"}
                  </button>
                </div>
                {errors.image && (
                  <p className="text-red-500 text-xs mt-1">{errors.image}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mức độ khuyến nghị
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                >
                  {LEVEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Footer */}
            <div className="flex justify-end items-center p-6 border-t border-gray-200 space-x-3">
              <button
                type="button"
                onClick={handleCloseUpdateModal}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
              >
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Service;
