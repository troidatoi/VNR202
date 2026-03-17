import React, { useState, useEffect } from "react";

interface ColdStartLoadingProps {
  message?: string;
  onTimeout?: () => void;
}

const ColdStartLoading: React.FC<ColdStartLoadingProps> = ({
  message = "Server đang khởi động...",
  onTimeout,
}) => {
  const [dots, setDots] = useState("");
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
      setTimeElapsed((prev) => prev + 1);
    }, 500);

    // Timeout after 60 seconds
    const timeout = setTimeout(() => {
      if (onTimeout) {
        onTimeout();
      }
    }, 60000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onTimeout]);

  const getStatusMessage = () => {
    if (timeElapsed < 10) return "Đang đánh thức server...";
    if (timeElapsed < 20) return "Đang phân bổ tài nguyên...";
    if (timeElapsed < 30) return "Đang khởi tạo ứng dụng...";
    if (timeElapsed < 40) return "Đang kết nối database...";
    if (timeElapsed < 50) return "Gần như hoàn tất...";
    return "Vui lòng chờ thêm một chút...";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Render.com style loading animation */}
          <div className="mb-6">
            <div className="inline-block animate-pulse">
              <div className="text-4xl font-mono text-gray-800">RENDER</div>
            </div>
          </div>

          {/* Loading spinner */}
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          </div>

          {/* Status message */}
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {getStatusMessage()}
          </h3>

          {/* Progress indicator */}
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((timeElapsed / 60) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Time elapsed */}
          <p className="text-sm text-gray-500">
            Đã chờ {timeElapsed} giây{dots}
          </p>

          {/* Info about Render.com */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 Server miễn phí trên Render.com cần thời gian để khởi động sau
              khi không hoạt động
            </p>
          </div>

          {/* Cancel button */}
          {timeElapsed > 30 && (
            <button
              onClick={onTimeout}
              className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Thử lại hoặc chuyển sang chế độ offline
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ColdStartLoading;
