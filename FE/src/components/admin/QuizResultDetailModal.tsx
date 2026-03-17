import React from "react";

interface QuizResultDetail {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
  };
  quizId: {
    _id: string;
    title: string;
    description: string;
    maxScore: number;
  };
  answers: Array<{
    questionId: {
      _id: string;
      text: string;
      options: { text: string; score: number }[];
    } | null;
    selectedOption: number;
    score: number;
  }>;
  totalScore: number;
  riskLevel: string;
  suggestedAction: string;
  takenAt: string;
}

interface QuizResultDetailModalProps {
  result: QuizResultDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

const QuizResultDetailModal: React.FC<QuizResultDetailModalProps> = ({
  result,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !result) return null;

  const getRiskLevelColor = (riskLevel: string) => {
    const colors = {
      low: "bg-green-100 text-green-800",
      moderate: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };
    return (
      colors[riskLevel as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  const getRiskLevelText = (riskLevel: string) => {
    const texts = {
      low: "Thấp",
      moderate: "Trung bình",
      high: "Cao",
      critical: "Nguy hiểm",
    };
    return texts[riskLevel as keyof typeof texts] || riskLevel;
  };

  const percentage = result.quizId.maxScore
    ? Math.round((result.totalScore / result.quizId.maxScore) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Chi tiết kết quả quiz
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Quiz Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3">
              {result.quizId.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Người làm bài</div>
                <div className="font-medium">{result.userId.fullName}</div>
                <div className="text-sm text-gray-500">
                  {result.userId.email}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">
                  Thời gian làm bài
                </div>
                <div className="font-medium">
                  {new Date(result.takenAt).toLocaleString("vi-VN")}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Điểm số</div>
                <div className="text-2xl font-bold text-blue-600">
                  {result.totalScore}/{result.quizId.maxScore} ({percentage}%)
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Mức rủi ro</div>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(
                    result.riskLevel
                  )}`}
                >
                  {getRiskLevelText(result.riskLevel)}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600 mb-1">Đề xuất</div>
              <div className="font-medium">{result.suggestedAction}</div>
            </div>
          </div>

          {/* Answers Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">
                Chi tiết câu trả lời
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      STT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Câu hỏi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Đáp án đã chọn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Điểm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mức ảnh hưởng
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.answers.map((ans, idx) => {
                    // Kiểm tra null safety
                    if (!ans.questionId || !ans.questionId.options) {
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {idx + 1}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 italic">
                            Câu hỏi không khả dụng
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 italic">
                            -
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {ans.score}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 italic">
                            -
                          </td>
                        </tr>
                      );
                    }

                    const selectedOpt =
                      ans.questionId.options[ans.selectedOption];
                    let impactColor = "";
                    let impactText = "";

                    if (selectedOpt?.score === 0) {
                      impactColor = "text-green-600 bg-green-50";
                      impactText = "Thấp";
                    } else if (selectedOpt?.score === 2) {
                      impactColor = "text-yellow-600 bg-yellow-50";
                      impactText = "Trung bình";
                    } else if (selectedOpt?.score === 4) {
                      impactColor = "text-red-600 bg-red-50";
                      impactText = "Cao";
                    }

                    return (
                      <tr key={ans.questionId._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                          {ans.questionId.text}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {selectedOpt?.text || "Không có đáp án"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {selectedOpt?.score || 0}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${impactColor}`}
                          >
                            {impactText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-blue-900 mb-2">
              Tóm tắt
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-blue-700 font-medium">Tổng điểm</div>
                <div className="text-2xl font-bold text-blue-600">
                  {result.totalScore}
                </div>
              </div>
              <div>
                <div className="text-blue-700 font-medium">
                  Tỷ lệ hoàn thành
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {percentage}%
                </div>
              </div>
              <div>
                <div className="text-blue-700 font-medium">Số câu trả lời</div>
                <div className="text-2xl font-bold text-blue-600">
                  {result.answers.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResultDetailModal;
