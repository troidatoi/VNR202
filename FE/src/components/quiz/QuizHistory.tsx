import { useState, useEffect } from "react";
import { getUserQuizHistoryApi, getQuizResultByIdApi } from "../../api/index";
import { motion } from "framer-motion";

interface QuizHistoryProps {
  userId: string;
  onClose: () => void;
}

interface QuizHistoryItem {
  _id: string;
  quizId: {
    _id: string;
    title: string;
    description: string;
  };
  takenAt: string;
  totalScore: number;
  riskLevel: string;
  suggestedAction: string;
}

// Thêm type cho chi tiết kết quả quiz
interface QuizResultDetail {
  _id: string;
  quizId: { _id: string; title: string; maxScore: number };
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

export default function QuizHistory({ userId, onClose }: QuizHistoryProps) {
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<QuizResultDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [userId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await getUserQuizHistoryApi(userId);
      if (response.success) {
        setHistory(response.data);
      } else {
        setError("Không thể tải lịch sử làm quiz");
      }
    } catch {
      setError("Đã xảy ra lỗi khi tải lịch sử");
    } finally {
      setLoading(false);
    }
  };

  // Khi click vào 1 bài quiz trong lịch sử
  const handleShowDetail = async (resultId: string) => {
    setLoadingDetail(true);
    try {
      const res = await getQuizResultByIdApi(resultId);
      if (res.success) setDetail(res.data);
    } catch (error) {
      console.error("Error loading quiz detail:", error);
      setError("Không thể tải chi tiết kết quả");
    } finally {
      setLoadingDetail(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    const colorMap: Record<string, string> = {
      low: "text-green-600 bg-green-50 border-green-200",
      moderate: "text-yellow-600 bg-yellow-50 border-yellow-200",
      high: "text-orange-600 bg-orange-50 border-orange-200",
      critical: "text-red-600 bg-red-50 border-red-200",
    };
    return colorMap[riskLevel] || "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getRiskLevelText = (riskLevel: string) => {
    const textMap: Record<string, string> = {
      low: "Thấp",
      moderate: "Trung bình",
      high: "Cao",
      critical: "Nguy hiểm",
    };
    return textMap[riskLevel] || riskLevel;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 shadow-xl"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 text-center">Đang tải lịch sử...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">
            {detail ? "Chi tiết kết quả quiz" : "Lịch sử làm quiz"}
          </h2>
          <button
            onClick={detail ? () => setDetail(null) : onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {detail ? (
            loadingDetail ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
                <p className="mt-4 text-gray-600">Đang tải chi tiết...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Quiz Info */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {detail.quizId.title}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Thời gian làm bài</div>
                      <div className="font-medium text-gray-900">
                        {new Date(detail.takenAt).toLocaleString("vi-VN")}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Điểm số</div>
                      <div className="font-bold text-2xl text-blue-600">
                        {detail.quizId.maxScore
                          ? Math.floor((detail.totalScore / detail.quizId.maxScore) * 100)
                          : detail.totalScore}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Mức rủi ro</div>
                      <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getRiskLevelColor(detail.riskLevel)}`}>
                        {getRiskLevelText(detail.riskLevel)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Đề xuất</div>
                      <div className="font-medium text-gray-900">
                        {detail.suggestedAction}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Answers Table */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900">Chi tiết câu trả lời</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Câu hỏi</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đáp án đã chọn</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mức ảnh hưởng</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {detail.answers.map((ans, idx) => {
                          // Kiểm tra null safety
                          if (!ans.questionId || !ans.questionId.options) {
                            return (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">{idx + 1}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 italic">Câu hỏi không khả dụng</td>
                                <td className="px-6 py-4 text-sm text-gray-500 italic">-</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{ans.score}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 italic">-</td>
                              </tr>
                            );
                          }

                          const selectedOpt = ans.questionId.options[ans.selectedOption];
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
                              <td className="px-6 py-4 text-sm text-gray-900 font-medium">{idx + 1}</td>
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
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${impactColor}`}>
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

                {/* Back Button */}
                <div className="text-center">
                  <button
                    onClick={() => setDetail(null)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Quay lại danh sách
                  </button>
                </div>
              </div>
            )
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 font-medium mb-4">{error}</p>
              <button
                onClick={loadHistory}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có lịch sử</h3>
              <p className="text-gray-600">Bạn chưa có lịch sử làm quiz nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => handleShowDetail(item._id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {item.quizId.title}
                      </h3>
                      
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Thời gian</div>
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(item.takenAt).toLocaleString("vi-VN")}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Điểm số</div>
                          <div className="text-lg font-bold text-blue-600">
                            {item.totalScore}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Mức rủi ro</div>
                          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getRiskLevelColor(item.riskLevel)}`}>
                            {getRiskLevelText(item.riskLevel)}
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-sm text-gray-500 mb-1">Đề xuất</div>
                        <div className="text-sm text-gray-900 font-medium">
                          {item.suggestedAction}
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
