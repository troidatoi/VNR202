import React from "react";

interface OfflineModeProps {
  onRetry: () => void;
  onContinueOffline: () => void;
}

const OfflineMode: React.FC<OfflineModeProps> = ({
  onRetry,
  onContinueOffline,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Offline icon */}
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Không thể kết nối đến server
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-500 mb-6">
            Server Render.com hiện tại không khả dụng. Bạn có thể thử lại hoặc
            tiếp tục ở chế độ offline.
          </p>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={onRetry}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              🔄 Thử lại kết nối
            </button>

            <button
              onClick={onContinueOffline}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              📱 Tiếp tục offline
            </button>
          </div>

          {/* Info about offline mode */}
          <div className="mt-6 p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-700">
              💡 Chế độ offline cho phép bạn xem một số tính năng cơ bản mà
              không cần kết nối server
            </p>
          </div>

          {/* Technical details */}
          <details className="mt-4">
            <summary className="text-xs text-gray-400 cursor-pointer">
              Chi tiết kỹ thuật
            </summary>
            <div className="mt-2 text-xs text-gray-500 text-left">
              <p>• Server: Render.com free tier</p>
              <p>• Status: Cold start hoặc offline</p>
              <p>• Retry: Tự động sau 30 giây</p>
              <p>• Fallback: Local development server</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default OfflineMode;
