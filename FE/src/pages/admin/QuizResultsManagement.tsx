import React, { useEffect, useState } from "react";
import api from "../../api";
import QuizResultDetailModal from "../../components/admin/QuizResultDetailModal";
import QuizResultsErrorBoundary from "../../components/admin/QuizResultsErrorBoundary";

interface QuizResult {
  _id: string;
  quizId: { _id: string; title: string } | string;
  userId: { _id: string; fullName: string; email: string } | string;
  takenAt: string;
  totalScore: number;
  riskLevel: string;
  suggestedAction: string;
}

interface Quiz {
  _id: string;
  title: string;
}

interface Pagination {
  current: number;
  limit: number;
  total: number;
  pages: number;
}

interface QuizStats {
  totalResults: number;
  recentResults: number;
  scoreStats: {
    average: number;
    min: number;
    max: number;
  };
  riskLevelDistribution: Array<{
    _id: string;
    count: number;
    avgScore: number;
  }>;
  quizDistribution: Array<{
    _id: string;
    count: number;
    avgScore: number;
  }>;
}

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

export default function QuizResultsManagement() {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizId, setQuizId] = useState("");
  const [user, setUser] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    current: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [selectedResult, setSelectedResult] = useState<QuizResultDetail | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Lấy danh sách quiz
  useEffect(() => {
    api
      .get("/quizzes")
      .then((res) => {
        if (Array.isArray(res.data)) setQuizzes(res.data);
        else if (Array.isArray(res.data?.data)) setQuizzes(res.data.data);
        else setQuizzes([]);
      })
      .catch((error) => {
        console.error("Error fetching quizzes:", error);
        setQuizzes([]);
      });
  }, []);

  // Lấy toàn bộ kết quả quiz
  const fetchResults = async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: pagination.limit.toString(),
      };
      if (quizId) params.quizId = quizId;
      if (user) params.userId = user;
      if (riskLevel) params.riskLevel = riskLevel;
      if (from) params.from = from;
      if (to) params.to = to;

      const res = await api.get("/quizzes/quiz-results/all", { params });
      setResults(res.data?.data?.results || []);
      setPagination(
        res.data?.data?.pagination || {
          current: 1,
          limit: 20,
          total: 0,
          pages: 1,
        }
      );
    } catch (error) {
      console.error("Error fetching results:", error);
      setResults([]);
      setPagination({
        current: 1,
        limit: 20,
        total: 0,
        pages: 1,
      });
    }
    setLoading(false);
  };

  // Lấy thống kê
  const fetchStats = async () => {
    try {
      const params: Record<string, string> = {};
      if (quizId) params.quizId = quizId;
      if (from) params.from = from;
      if (to) params.to = to;

      const res = await api.get("/quizzes/quiz-results/stats", { params });
      setStats(res.data?.data || null);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats(null);
    }
  };

  useEffect(() => {
    fetchResults(1);
    fetchStats();
    // eslint-disable-next-line
  }, [quizId, user, riskLevel, from, to]);

  // Nhóm kết quả theo quiz title
  const grouped = results.reduce((acc: Record<string, QuizResult[]>, r) => {
    let title = "Unknown Quiz";

    if (r.quizId) {
      if (typeof r.quizId === "object" && r.quizId.title) {
        title = r.quizId.title;
      } else if (typeof r.quizId === "string") {
        title = r.quizId;
      }
    }

    if (!acc[title]) acc[title] = [];
    acc[title].push(r);
    return acc;
  }, {});

  const getRiskLevelColor = (riskLevel: string) => {
    const colors = {
      low: "bg-green-100 text-green-800",
      moderate: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
      unknown: "bg-gray-100 text-gray-800",
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
      unknown: "Không xác định",
    };
    return texts[riskLevel as keyof typeof texts] || "Không xác định";
  };

  const handlePageChange = (page: number) => {
    fetchResults(page);
  };

  const handleViewDetail = async (resultId: string) => {
    try {
      const res = await api.get(`/quizzes/quiz-results/result/${resultId}`);
      setSelectedResult(res.data?.data || null);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error fetching detail:", error);
      alert("Không thể tải chi tiết kết quả");
    }
  };

  // Fallback component khi không có dữ liệu
  if (!results && !loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            Chưa có dữ liệu
          </h2>
          <p className="text-gray-500 mb-4">
            Hiện tại chưa có kết quả trắc nghiệm nào trong hệ thống.
          </p>
          <button
            onClick={() => fetchResults(1)}
            className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600"
          >
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <QuizResultsErrorBoundary>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Quản lý kết quả trắc nghiệm</h1>
          <button
            onClick={() => setShowStats(!showStats)}
            className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600"
          >
            {showStats ? "Ẩn thống kê" : "Xem thống kê"}
          </button>
        </div>

        {/* Thống kê */}
        {showStats && stats && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Thống kê tổng quan</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded shadow">
                <div className="text-2xl font-bold text-amber-600">
                  {stats?.totalResults || 0}
                </div>
                <div className="text-sm text-gray-600">Tổng kết quả</div>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <div className="text-2xl font-bold text-green-600">
                  {stats?.recentResults || 0}
                </div>
                <div className="text-sm text-gray-600">7 ngày qua</div>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <div className="text-2xl font-bold text-orange-600">
                  {stats?.scoreStats?.average?.toFixed(1) || 0}
                </div>
                <div className="text-sm text-gray-600">Điểm trung bình</div>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <div className="text-2xl font-bold text-purple-600">
                  {stats?.riskLevelDistribution?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Mức rủi ro</div>
              </div>
            </div>

            {/* Risk Level Distribution */}
            {stats?.riskLevelDistribution &&
              stats.riskLevelDistribution.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Phân bố mức rủi ro:</h4>
                  <div className="flex gap-4">
                    {stats.riskLevelDistribution.map((item) => (
                      <div
                        key={item._id}
                        className="bg-white p-2 rounded shadow"
                      >
                        <div className="font-bold">
                          {getRiskLevelText(item._id)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {item.count} kết quả
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Bộ lọc */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-3">Bộ lọc</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block font-semibold mb-1">Bài đánh giá</label>
              <select
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={quizId}
                onChange={(e) => setQuizId(e.target.value)}
              >
                <option value="">Tất cả</option>
                {quizzes.map((q) => (
                  <option key={q._id} value={q._id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Người dùng (ID/email)
              </label>
              <input
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="Nhập ID hoặc email"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Mức rủi ro</label>
              <select
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="low">Thấp</option>
                <option value="moderate">Trung bình</option>
                <option value="high">Cao</option>
                <option value="critical">Nguy hiểm</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Từ ngày</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Đến ngày</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Pagination Info */}
        <div className="mb-4 text-sm text-gray-600">
          Hiển thị {results.length} kết quả trong tổng số{" "}
          {pagination?.total || 0} kết quả
        </div>

        {/* Danh sách kết quả */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải...</p>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Không có kết quả nào.</p>
          </div>
        ) : (
          <>
            {Object.entries(grouped).map(([title, items]) => (
              <div key={title} className="mb-8">
                <h2 className="text-xl font-bold mb-3 text-amber-700">
                  {title}
                </h2>
                <div className="overflow-x-auto rounded-lg shadow bg-white">
                  <table className="min-w-full">
                    <thead className="bg-amber-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Người dùng
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                          Ngày làm
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                          Điểm
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                          Mức rủi ro
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Đề xuất
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.map((r) => (
                        <tr key={r._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {r.userId
                              ? typeof r.userId === "object" &&
                                r.userId.fullName
                                ? `${r.userId.fullName} (${
                                    r.userId.email || "N/A"
                                  })`
                                : typeof r.userId === "string"
                                ? r.userId
                                : "Unknown User"
                              : "Anonymous User"}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {r.takenAt
                              ? new Date(r.takenAt).toLocaleString("vi-VN")
                              : "N/A"}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold">
                            {r.totalScore || 0}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(
                                r.riskLevel || "unknown"
                              )}`}
                            >
                              {getRiskLevelText(r.riskLevel || "unknown")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm max-w-xs truncate">
                            {r.suggestedAction || "Không có đề xuất"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleViewDetail(r._id)}
                              className="text-amber-600 hover:text-amber-800 hover:underline text-sm font-medium"
                            >
                              Xem chi tiết
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <button
                  onClick={() => handlePageChange(pagination.current - 1)}
                  disabled={pagination.current === 1}
                  className="px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>

                {Array.from(
                  { length: Math.min(5, pagination.pages) },
                  (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 border rounded ${
                          page === pagination.current
                            ? "bg-amber-500 text-white"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  }
                )}

                <button
                  onClick={() => handlePageChange(pagination.current + 1)}
                  disabled={pagination.current === pagination.pages}
                  className="px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}

        {/* Detail Modal */}
        <QuizResultDetailModal
          result={selectedResult}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedResult(null);
          }}
        />
      </div>
    </QuizResultsErrorBoundary>
  );
}
