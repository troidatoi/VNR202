import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getQuizQuestionsApi,
  submitQuizResultApi,
} from "../api";
import { getAllQuizzesApi } from "../api/index";
import { motion } from "framer-motion";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import BubbleBackground from "../components/BubbleBackground";
import QuizHistory from "../components/quiz/QuizHistory";
import QuizRecommendation from '../components/QuizRecommendation';
import surveyImage from "../assets/survey.jpg";

// Types for Quiz System
interface Quiz {
  _id: string;
  title: string;
  description: string;
  ageGroups: string[];
  tags: string[];
  maxScore?: number;
  questionCount?: number;
  isActive?: boolean;
}

interface QuestionOption {
  text: string;
  score: number;
}

interface Question {
  _id: string;
  quizId: string;
  text: string;
  options: QuestionOption[];
  type: string;
  ageGroup: string;
  topic: string;
  difficulty: string;
}

interface Answer {
  questionId: string;
  selectedOption: number;
}

interface QuizResult {
  resultId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  riskLevel: string;
  riskLevelDescription: string;
  suggestedAction: string;
  shouldSeeConsultant: boolean;
  takenAt: string;
}

export default function QuizzPage() {
  const { user } = useAuth();
  const [showHistory, setShowHistory] = useState(false);

  // States for quiz flow
  const [step, setStep] = useState<
    "selection" | "ageGroup" | "quiz" | "result"
  >("selection");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionBreakdown, setQuestionBreakdown] = useState<{
    medium: number;
    easy: number;
    total: number;
  } | null>(null);

  // Load available quizzes
  useEffect(() => {
    loadQuizzes();
  }, []);

  // Scroll to top when step changes to result
  useEffect(() => {
    if (step === "result") {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      // Chỉ lấy những quiz có trạng thái active
      const response = await getAllQuizzesApi({ isActive: true });
        setQuizzes(response.data);
    } catch (error) {
      setError("Lỗi kết nối server");
      console.error("Error loading quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSelect = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    if (quiz.ageGroups.length === 1) {
      // Auto-select if only one age group
      loadQuestions(quiz._id, quiz.ageGroups[0]);
    } else {
      setStep("ageGroup");
    }
  };

  const handleAgeGroupSelect = (ageGroup: string) => {
    if (selectedQuiz) {
      loadQuestions(selectedQuiz._id, ageGroup);
    }
  };

  const loadQuestions = async (quizId: string, ageGroup: string) => {
    try {
      setLoading(true);
      const limit = quizId === "assist" || quizId === "crafft" ? 15 : 10;
      const response = await getQuizQuestionsApi(quizId, ageGroup, limit);
      if (response.success) {
        setQuestions(response.data.questions);
        setAnswers(
          response.data.questions.map((q: Question) => ({
            questionId: q._id,
            selectedOption: -1,
          }))
        );
        setCurrentQuestionIndex(0);
        setStep("quiz");
        if (response.data.breakdown) {
          setQuestionBreakdown(response.data.breakdown);
        }
      } else {
        setError("Không thể tải câu hỏi");
      }
    } catch (error) {
      setError("Lỗi kết nối server");
      console.error("Error loading questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex].selectedOption = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!selectedQuiz) return;

    try {
      setLoading(true);

      const validAnswers = answers.filter(
        (answer) => answer.selectedOption !== -1
      );

      if (validAnswers.length === 0) {
        setError("Vui lòng trả lời ít nhất một câu hỏi");
        return;
      }

      const submitData = {
        quizId: selectedQuiz._id,
        userId: user?._id,
        sessionId: user ? undefined : `session_${Date.now()}`,
        answers: validAnswers,
      };

      const response = await submitQuizResultApi(submitData);
      if (response.success) {
        setQuizResult(response.data);
        setStep("result");
        // Scroll to top when showing results
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError("Không thể gửi kết quả");
      }
    } catch (error) {
      setError("Lỗi kết nối server");
      console.error("Error submitting quiz:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetQuiz = () => {
    setStep("selection");
    setSelectedQuiz(null);
    setQuestions([]);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setQuizResult(null);
    setError(null);
    setQuestionBreakdown(null);
  };

  const getAgeGroupDisplay = (ageGroup: string) => {
    const ageGroupMap: Record<string, string> = {
      teen: "Thanh thiếu niên (13-17 tuổi)",
      student: "Sinh viên (18-25 tuổi)",
      adult: "Người lớn (25+ tuổi)",
      parent: "Phụ huynh",
    };
    return ageGroupMap[ageGroup] || ageGroup;
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

  const getRiskLevelIcon = (riskLevel: string) => {
    const iconMap: Record<string, string> = {
      low: "🟢",
      moderate: "🟡",
      high: "🟠",
      critical: "🔴",
    };
    return iconMap[riskLevel] || "⚪";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-white rounded-2xl p-12 shadow-xl border border-gray-100"
          >
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            </div>
            <p className="mt-6 text-xl font-semibold text-gray-700">
              Đang tải...
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Vui lòng chờ trong giây lát
            </p>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section - Only show on selection step */}
        {step === "selection" && (
          <div className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 lg:p-12"
            >
                          <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Content Section */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center lg:text-left"
                >
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-sky-600 mb-6">
                    Khám phá bản thân
                  </h1>
                  
                  <p className="text-base text-slate-600 max-w-lg leading-relaxed mb-6">
                    Chọn bài đánh giá phù hợp để hiểu rõ hơn về tình trạng của bạn. 
                    Mỗi bài kiểm tra được thiết kế khoa học để đưa ra đánh giá chính xác nhất.
                  </p>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
                      <span className="text-sm">Đánh giá tình trạng tâm lý hiện tại</span>
          </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
                      <span className="text-sm">Nhận diện các dấu hiệu cảnh báo sớm</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
                      <span className="text-sm">Đề xuất hướng cải thiện phù hợp</span>
                    </div>
                  </div>

          {user && (
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
              onClick={() => setShowHistory(true)}
                      className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 px-4 py-2 rounded-lg text-slate-600 font-medium transition-colors duration-200 border border-slate-300"
                    >
                      <span className="text-slate-500">🕐</span>
                      <span>Lịch sử</span>
                    </motion.button>
                  )}
                </motion.div>

              {/* Survey Illustration */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex justify-center lg:justify-center"
              >
                <div className="relative">
                  <img 
                    src={surveyImage} 
                    alt="Survey Illustration" 
                    className="w-[380px] h-[380px] object-contain opacity-95 rounded-xl shadow-md"
                  />
        </div>
              </motion.div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Show History Modal */}
        {showHistory && user && (
          <QuizHistory
            userId={user._id}
            onClose={() => setShowHistory(false)}
          />
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <span className="font-medium">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 text-xl font-bold transition-colors"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}

        {/* Quiz Selection Step */}
        {step === "selection" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            {/* Quiz Cards Section */}
            <div className="relative">
              {/* Background decorative elements inspired by survey image */}
              <div className="absolute -top-8 -left-8 w-16 h-16 bg-sky-100 rounded-full opacity-50"></div>
              <div className="absolute -bottom-8 -right-8 w-12 h-12 bg-sky-200 rounded-full opacity-50"></div>
              <div className="absolute top-1/2 -left-4 w-8 h-8 bg-sky-300 rounded-full opacity-30"></div>
              <div className="absolute top-1/3 -right-4 w-6 h-6 bg-sky-400 rounded-full opacity-40"></div>
              
              <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto relative z-10">
              {quizzes.map((quiz, index) => (
                <motion.div
                  key={quiz._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                  className="group bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-sky-200 transition-all duration-200 cursor-pointer overflow-hidden"
                  onClick={() => handleQuizSelect(quiz)}
                >
                  {/* Card header */}
                  <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <span className="text-white text-lg">📋</span>
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">{quiz.title}</h3>
                          <p className="text-sky-100 text-sm">{quiz.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sky-100 text-xs font-medium">Câu hỏi</div>
                        <div className="text-white text-2xl font-bold">{quiz.questionCount || 0}</div>
                      </div>
                    </div>
                    </div>

                  <div className="p-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {quiz.ageGroups.map((ageGroup) => (
                        <span
                          key={ageGroup}
                          className="px-3 py-1 bg-sky-50 text-sky-700 rounded-md text-xs font-medium border border-sky-200"
                        >
                          {getAgeGroupDisplay(ageGroup)}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 text-sm font-medium">Bắt đầu đánh giá</span>
                      <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center group-hover:bg-sky-600 transition-colors">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Age Group Selection Step */}
        {step === "ageGroup" && selectedQuiz && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 mb-8 max-w-2xl mx-auto"
              >
                <h2 className="text-3xl font-bold text-sky-600 mb-4">
                  {selectedQuiz.title}
                </h2>
                <p className="text-lg text-slate-600">
                  Chọn nhóm tuổi phù hợp với bạn để có kết quả chính xác nhất
                </p>
              </motion.div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {selectedQuiz.ageGroups.map((ageGroup, index) => (
                <motion.button
                  key={ageGroup}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group p-8 bg-white rounded-2xl border border-slate-200 hover:border-sky-300 transition-all duration-300 shadow-sm hover:shadow-lg text-left"
                  onClick={() => handleAgeGroupSelect(ageGroup)}
                >
                  <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-sky-200 transition-colors duration-300">
                    <div className="w-8 h-8 bg-sky-500 rounded-full"></div>
                  </div>
                  <div className="text-xl font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
                    {getAgeGroupDisplay(ageGroup)}
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => setStep("selection")}
                className="inline-flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-800 hover:bg-white rounded-xl transition-all duration-300 border border-slate-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Quay lại chọn quiz khác
              </button>
            </div>
          </motion.div>
        )}

        {/* Quiz Taking Step */}
        {step === "quiz" && questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Progress Bar */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-slate-800">
                    Câu {currentQuestionIndex + 1} / {questions.length}
                  </span>
                  <span className="px-4 py-2 bg-sky-50 text-sky-700 rounded-lg text-sm font-medium border border-sky-200">
                    {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% hoàn thành
                  </span>
                </div>
              </div>

              {questionBreakdown && (selectedQuiz?._id === "assist" || selectedQuiz?._id === "crafft") && (
                <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-sm text-slate-700 font-medium mb-3">Cấu trúc bài test:</div>
                  <div className="flex gap-6 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-sky-400 rounded-full"></span>
                        Medium: {questionBreakdown.medium} câu
                      </span>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        Easy: {questionBreakdown.easy} câu
                      </span>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-slate-400 rounded-full"></span>
                        Tổng: {questionBreakdown.total} câu
                      </span>
                    </div>
                  </div>
                )}

              <div className="relative w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="bg-sky-500 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Question Card */}
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200"
            >
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    Q
                  </div>
                  <div className="text-sm text-slate-600">
                    <div>Chủ đề: {questions[currentQuestionIndex].topic}</div>
                    <div>Độ khó: {questions[currentQuestionIndex].difficulty}</div>
                    </div>
                  </div>
                <h3 className="text-xl font-bold text-slate-800 leading-relaxed">
                  {questions[currentQuestionIndex].text}
                </h3>
              </div>

              <div className="space-y-4">
                {questions[currentQuestionIndex].options.map((option, optionIndex) => {
                  const isSelected = answers[currentQuestionIndex]?.selectedOption === optionIndex;
                    const optionLabels = ["A", "B", "C", "D", "E"];

                    return (
                      <motion.div
                        key={optionIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: optionIndex * 0.1 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      className={`group relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                          isSelected
                          ? "border-sky-500 bg-sky-50 shadow-md"
                          : "border-slate-200 hover:border-sky-300 bg-white hover:shadow-sm"
                        }`}
                      onClick={() => handleAnswerSelect(currentQuestionIndex, optionIndex)}
                      >
                      <div className="flex items-center gap-4">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                              isSelected
                            ? "border-sky-500 bg-sky-500 text-white"
                            : "border-slate-300 text-slate-500 group-hover:border-sky-400 group-hover:text-sky-400"
                        }`}>
                            {optionLabels[optionIndex]}
                          </div>
                        <span className={`text-lg transition-colors duration-300 ${
                          isSelected ? "text-sky-700 font-medium" : "text-slate-700 group-hover:text-slate-900"
                        }`}>
                            {option.text}
                          </span>
                        </div>

                      </motion.div>
                    );
                })}
              </div>
            </motion.div>

            {/* Navigation */}
            <div className="flex justify-between items-center bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <motion.button
                whileHover={{ scale: 1.05, x: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-3 text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
              >
                ← Câu trước
              </motion.button>

              <div className="text-center">
                <div className="text-sm text-slate-600 mb-1">
                  Đã trả lời: {answers.filter((a) => a.selectedOption !== -1).length}/{questions.length}
                </div>
                <div className="w-24 h-2 bg-slate-200 rounded-full mx-auto">
                  <div
                    className="h-2 bg-sky-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${(answers.filter((a) => a.selectedOption !== -1).length / questions.length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {currentQuestionIndex === questions.length - 1 ? (
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmitQuiz}
                  disabled={answers.filter((a) => a.selectedOption !== -1).length === 0}
                  className="px-8 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg transition-all duration-300"
                >
                  Nộp bài
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05, x: 4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextQuestion}
                  className="px-6 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 font-medium shadow-lg transition-all duration-300"
                >
                  Câu tiếp →
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* Results Step */}
        {step === "result" && quizResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="text-4xl font-bold text-slate-800 mb-4">
                Kết quả đánh giá
              </h2>
              <p className="text-lg text-slate-600">
                Cảm ơn bạn đã hoàn thành bài đánh giá!
              </p>
            </div>

            {/* Score Summary */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="bg-white rounded-2xl shadow-lg p-8 text-center border border-slate-200"
            >
              <div className="mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", duration: 1 }}
                  className="text-6xl font-bold text-sky-600 mb-4"
                >
                  {quizResult.percentage}%
                </motion.div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <motion.div
                    className="bg-sky-500 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${quizResult.percentage}%` }}
                    transition={{ delay: 0.8, duration: 1.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Risk Level */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mb-8"
              >
                <span className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl text-lg font-bold border-2 ${getRiskLevelColor(quizResult.riskLevel)}`}>
                    {quizResult.riskLevelDescription}
                  </span>
              </motion.div>

              {/* Quiz Recommendation */}
              <QuizRecommendation quizResult={quizResult} />

              {/* Consultant Suggestion */}
              {quizResult.shouldSeeConsultant && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.1 }}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-6 mt-6"
                >
                  <h4 className="text-xl font-bold text-slate-800 mb-4">
                    Tư vấn chuyên môn
                  </h4>
                  <p className="text-slate-700 mb-6 leading-relaxed">
                    Dựa trên kết quả đánh giá, chúng tôi khuyến nghị bạn nên gặp chuyên viên tư vấn để được hỗ trợ tốt hơn.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => (window.location.href = "/consulting")}
                    className="bg-sky-600 text-white px-6 py-3 rounded-xl hover:bg-sky-700 transition-all duration-300 font-bold shadow-lg"
                  >
                    Tìm chuyên viên tư vấn
                  </motion.button>
                </motion.div>
              )}
            </motion.div>

            {/* Answer Details */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-lg font-bold mb-4 text-slate-800">Chi tiết câu trả lời của bạn</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">STT</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Câu hỏi</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Đáp án đã chọn</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Điểm</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Mức ảnh hưởng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {answers.map((ans, idx) => {
                      const q = questions.find((q) => q._id === ans.questionId);
                      const selectedOpt = q?.options?.[ans.selectedOption];
                      let impactColor = "";
                      let impactText = "";
                      if (selectedOpt?.score === 0) {
                        impactColor = "text-green-600";
                        impactText = "Thấp";
                      } else if (selectedOpt?.score === 2) {
                        impactColor = "text-yellow-600";
                        impactText = "Trung bình";
                      } else if (selectedOpt?.score === 4) {
                        impactColor = "text-red-600";
                        impactText = "Cao";
                      }
                      return (
                        <tr key={ans.questionId} className="border-b border-slate-100">
                          <td className="px-4 py-3 text-sm text-slate-800">{idx + 1}</td>
                          <td className="px-4 py-3 text-sm text-slate-800">{q?.text}</td>
                          <td className="px-4 py-3 text-sm text-slate-800">{selectedOpt?.text}</td>
                          <td className="px-4 py-3 text-sm text-slate-800">{selectedOpt?.score}</td>
                          <td className={`px-4 py-3 text-sm font-medium ${impactColor}`}>{impactText}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.3 }}
              className="text-center space-x-4"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetQuiz}
                className="px-6 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-700 font-medium shadow-lg transition-all duration-300"
              >
                Làm bài khác
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => (window.location.href = "/")}
                className="px-6 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 font-medium shadow-lg transition-all duration-300"
              >
                Về trang chủ
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}
