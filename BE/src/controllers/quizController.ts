import { Request, Response } from "express";
import Quiz from "../models/Quiz";
import Question from "../models/Question";
import QuizResult from "../models/QuizResult";
import mongoose from "mongoose";
import Account from "../models/Account";

// Tạo mới quiz
export const createQuiz = async (req: Request, res: Response) => {
  try {
    const { _id, title, description, ageGroups, tags, maxScore, isActive } =
      req.body;
    if (!_id || !title || !description || !ageGroups || !maxScore) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }
    // Kiểm tra trùng _id
    const existed = await Quiz.findById(_id);
    if (existed) {
      return res
        .status(409)
        .json({ success: false, message: "Quiz ID đã tồn tại" });
    }
    const quiz = new Quiz({
      _id,
      title,
      description,
      ageGroups,
      tags,
      maxScore,
      isActive,
    });
    await quiz.save();
    res.status(201).json({ success: true, data: quiz });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi tạo quiz" });
  }
};

// Lấy chi tiết quiz
export const getQuizById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz không tồn tại" });
    }
    res.json({ success: true, data: quiz });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi lấy quiz" });
  }
};

// Cập nhật quiz
export const updateQuiz = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, ageGroups, tags, maxScore, isActive } =
      req.body;
    const quiz = await Quiz.findByIdAndUpdate(
      id,
      { title, description, ageGroups, tags, maxScore, isActive },
      { new: true, runValidators: true }
    );
    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz không tồn tại" });
    }
    res.json({ success: true, data: quiz });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi cập nhật quiz" });
  }
};

// Xóa quiz
export const deleteQuiz = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Soft delete: chỉ cập nhật isActive thành false
    const quiz = await Quiz.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz không tồn tại" });
    }
    res.json({ success: true, message: "Quiz đã được ẩn (soft delete)" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server khi ẩn quiz" });
  }
};

// Tạo mới câu hỏi
export const createQuestion = async (req: Request, res: Response) => {
  try {
    const {
      quizId,
      text,
      options,
      type,
      ageGroup,
      topic,
      difficulty,
      isActive,
    } = req.body;
    if (!quizId || !text || !options || !ageGroup || !topic) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }
    const question = new Question({
      quizId,
      text,
      options,
      type,
      ageGroup,
      topic,
      difficulty,
      isActive,
    });
    await question.save();
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi tạo câu hỏi" });
  }
};

// Lấy chi tiết câu hỏi
export const getQuestionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);
    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Câu hỏi không tồn tại" });
    }
    res.json({ success: true, data: question });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi lấy câu hỏi" });
  }
};

// Cập nhật câu hỏi
export const updateQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text, options, type, ageGroup, topic, difficulty, isActive } =
      req.body;
    const question = await Question.findByIdAndUpdate(
      id,
      { text, options, type, ageGroup, topic, difficulty, isActive },
      { new: true, runValidators: true }
    );
    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Câu hỏi không tồn tại" });
    }
    res.json({ success: true, data: question });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi cập nhật câu hỏi" });
  }
};

// Xóa câu hỏi
export const deleteQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const question = await Question.findByIdAndDelete(id);
    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Câu hỏi không tồn tại" });
    }
    res.json({ success: true, message: "Đã xóa câu hỏi thành công" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi xóa câu hỏi" });
  }
};

// Lấy danh sách câu hỏi theo quizId
export const getQuestionsByQuiz = async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const questions = await Question.find({ quizId });
    res.json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách câu hỏi",
    });
  }
};

// Interface cho request body khi submit quiz
interface SubmitQuizRequest extends Request {
  body: {
    quizId: string;
    userId?: string;
    sessionId?: string;
    answers: {
      questionId: string;
      selectedOption: number;
    }[];
  };
}

// GET /api/quizzes - Lấy danh sách các bài quiz
export const getAllQuizzes = async (req: Request, res: Response) => {
  try {
    console.log("Getting all quizzes...");

    const { ageGroup, isActive } = req.query;
    let filter: any = {};

    // Xử lý filter isActive
    if (typeof isActive !== "undefined") {
      if (isActive === "true") filter.isActive = true;
      else if (isActive === "false") filter.isActive = false;
    }

    // Filter theo age group nếu có
    if (ageGroup) {
      filter.ageGroups = { $in: [ageGroup] };
    }

    const quizzes = await Quiz.find(filter).sort({ title: 1 });
    console.log(`Found ${quizzes.length} quizzes`);

    // Thêm thông tin số câu hỏi cho mỗi quiz
    const quizzesWithQuestionCount = await Promise.all(
      quizzes.map(async (quiz) => {
        const questionCount = await Question.countDocuments({
          quizId: quiz._id,
          isActive: true,
        });
        return {
          ...quiz.toObject(),
          questionCount,
        };
      })
    );

    res.json({
      success: true,
      data: quizzesWithQuestionCount,
    });
  } catch (error) {
    console.error("Error in getAllQuizzes:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách quiz",
    });
  }
};

// GET /api/quizzes/:quizId/questions?ageGroup=teen - Lấy câu hỏi theo quiz và age group
export const getQuizQuestions = async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const { ageGroup, limit } = req.query;

    console.log(`Getting questions for quiz: ${quizId}, ageGroup: ${ageGroup}`);

    // Kiểm tra quiz có tồn tại không
    const quiz = await Quiz.findOne({ _id: quizId, isActive: true });
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy quiz",
      });
    }

    // Build filter cho questions
    let filter: any = {
      quizId,
      isActive: true,
    };

    if (ageGroup) {
      filter.ageGroup = ageGroup;
    }

    let questionQuery = Question.find(filter).sort({ createdAt: 1 });

    // Random shuffle nếu có limit (cho random questions)
    if (limit && parseInt(limit as string) > 0) {
      const limitNum = parseInt(limit as string);
      const allQuestions = await Question.find(filter);

      // Logic đặc biệt cho ASSIST và CRAFFT: 10 câu medium + 5 câu easy
      if (quizId === "assist" || quizId === "crafft") {
        console.log(
          `Special logic for ${quizId}: selecting 10 medium + 5 easy questions`
        );

        // Phân loại câu hỏi theo difficulty
        const mediumQuestions = allQuestions.filter(
          (q) => q.difficulty === "medium"
        );
        const easyQuestions = allQuestions.filter(
          (q) => q.difficulty === "easy"
        );

        console.log(
          `Found ${mediumQuestions.length} medium questions and ${easyQuestions.length} easy questions`
        );

        // Kiểm tra xem có đủ câu hỏi không
        if (mediumQuestions.length < 10) {
          console.warn(
            `Warning: Only ${mediumQuestions.length} medium questions available, need 10`
          );
        }
        if (easyQuestions.length < 5) {
          console.warn(
            `Warning: Only ${easyQuestions.length} easy questions available, need 5`
          );
        }

        // Random 10 câu medium (hoặc tất cả nếu không đủ)
        const shuffledMedium = mediumQuestions.sort(() => 0.5 - Math.random());
        const selectedMedium = shuffledMedium.slice(
          0,
          Math.min(10, mediumQuestions.length)
        );

        // Random 5 câu easy (hoặc tất cả nếu không đủ)
        const shuffledEasy = easyQuestions.sort(() => 0.5 - Math.random());
        const selectedEasy = shuffledEasy.slice(
          0,
          Math.min(5, easyQuestions.length)
        );

        // Kết hợp và shuffle lại để trộn thứ tự
        const combinedQuestions = [...selectedMedium, ...selectedEasy];
        const finalQuestions = combinedQuestions.sort(
          () => 0.5 - Math.random()
        );

        console.log(
          `Selected ${selectedMedium.length} medium + ${selectedEasy.length} easy = ${finalQuestions.length} total questions`
        );

        return res.json({
          success: true,
          data: {
            quiz,
            questions: finalQuestions,
            total: allQuestions.length,
            selected: finalQuestions.length,
            breakdown: {
              medium: selectedMedium.length,
              easy: selectedEasy.length,
              total: finalQuestions.length,
            },
            available: {
              medium: mediumQuestions.length,
              easy: easyQuestions.length,
            },
            maxScore: 15,
          },
        });
      } else {
        // Logic cũ cho các quiz khác
        const shuffled = allQuestions.sort(() => 0.5 - Math.random());
        const randomQuestions = shuffled.slice(0, limitNum);

        console.log(
          `Returning ${randomQuestions.length} random questions out of ${allQuestions.length}`
        );

        return res.json({
          success: true,
          data: {
            quiz,
            questions: randomQuestions,
            total: allQuestions.length,
            selected: randomQuestions.length,
            maxScore: randomQuestions.length, // mỗi câu 1 điểm
          },
        });
      }
    }

    const questions = await questionQuery;
    console.log(`Found ${questions.length} questions`);

    res.json({
      success: true,
      data: {
        quiz,
        questions,
        total: questions.length,
      },
    });
  } catch (error) {
    console.error("Error in getQuizQuestions:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách câu hỏi",
    });
  }
};

// POST /api/quiz-results - Submit kết quả làm bài
export const submitQuizResult = async (
  req: SubmitQuizRequest,
  res: Response
) => {
  try {
    const { quizId, userId, sessionId, answers } = req.body;

    console.log(`Submitting quiz result for quiz: ${quizId}`);

    // Enhanced Validation
    if (!quizId || !answers || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc (quizId, answers)",
      });
    }

    if (!userId && !sessionId) {
      return res.status(400).json({
        success: false,
        message: "Cần có userId hoặc sessionId",
      });
    }

    // Validate userId format if provided
    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "userId không hợp lệ",
      });
    }

    // Validate answers structure
    for (const answer of answers) {
      if (!answer.questionId || typeof answer.selectedOption !== "number") {
        return res.status(400).json({
          success: false,
          message: "Cấu trúc answers không hợp lệ",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(answer.questionId)) {
        return res.status(400).json({
          success: false,
          message: "questionId không hợp lệ",
        });
      }
    }

    // Kiểm tra quiz có tồn tại
    const quiz = await Quiz.findOne({ _id: quizId, isActive: true });
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy quiz",
      });
    }

    // Lấy thông tin các câu hỏi để tính điểm
    const questionIds = answers.map(
      (a) => new mongoose.Types.ObjectId(a.questionId)
    );
    const questions = await Question.find({ _id: { $in: questionIds } });

    if (questions.length !== answers.length) {
      return res.status(400).json({
        success: false,
        message: "Một số câu hỏi không hợp lệ",
      });
    }

    // Tính điểm cho từng câu trả lời
    let totalScore = 0;
    const processedAnswers = answers.map((answer) => {
      const question = questions.find(
        (q) => (q._id as any).toString() === answer.questionId
      );
      if (!question) {
        throw new Error(`Question not found: ${answer.questionId}`);
      }

      // Validate selectedOption
      if (
        answer.selectedOption < 0 ||
        answer.selectedOption >= question.options.length
      ) {
        throw new Error(`Invalid option index: ${answer.selectedOption}`);
      }

      const selectedOptionScore = question.options[answer.selectedOption].score;
      totalScore += selectedOptionScore;

      return {
        questionId: new mongoose.Types.ObjectId(answer.questionId),
        selectedOption: answer.selectedOption,
        score: selectedOptionScore,
      };
    });

    // Tính toán risk level
    // Tính tổng max score thực tế từ các câu hỏi
    let totalMaxScore = 0;
    questions.forEach((question) => {
      const maxScoreForQuestion = Math.max(
        ...question.options.map((opt) => opt.score)
      );
      totalMaxScore += maxScoreForQuestion;
    });

    const percentage = (totalScore / totalMaxScore) * 100;

    let riskLevel: string;
    let suggestedAction: string;

    if (percentage >= 75) {
      riskLevel = "critical";
      suggestedAction =
        "Khuyến khích tìm kiếm sự hỗ trợ chuyên môn ngay lập tức";
    } else if (percentage >= 50) {
      riskLevel = "high";
      suggestedAction = "Nên gặp chuyên viên tư vấn để được hỗ trợ";
    } else if (percentage >= 25) {
      riskLevel = "moderate";
      suggestedAction = "Cần chú ý và theo dõi, có thể tìm hiểu thêm thông tin";
    } else {
      riskLevel = "low";
      suggestedAction = "Tiếp tục duy trì lối sống tích cực và sức khỏe tốt";
    }

    // Tạo quiz result
    const quizResult = new QuizResult({
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      sessionId: sessionId || undefined,
      quizId,
      answers: processedAnswers,
      totalScore,
      riskLevel,
      suggestedAction,
      isAnonymous: !userId,
      takenAt: new Date(),
    });

    await quizResult.save();

    console.log(`Quiz result saved with ID: ${quizResult._id}`);

    res.status(201).json({
      success: true,
      data: {
        resultId: quizResult._id,
        totalScore,
        maxScore: totalMaxScore,
        percentage: Math.round(percentage),
        riskLevel,
        riskLevelDescription: (quizResult as any).riskLevelDescription,
        suggestedAction,
        shouldSeeConsultant: (quizResult as any).shouldSeeConsultant(),
        takenAt: quizResult.takenAt,
      },
    });
  } catch (error) {
    console.error("Error in submitQuizResult:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lưu kết quả quiz",
    });
  }
};

// GET /api/quiz-results/:userId - Lịch sử kết quả làm bài
export const getUserQuizResults = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    console.log(`Getting quiz results for user: ${userId}`);

    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const skip = (pageNum - 1) * limitNum;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.json({
        success: true,
        data: {
          results: [],
          pagination: {
            current: pageNum,
            limit: limitNum,
            total: 0,
            pages: 1,
          },
        },
      });
    }

    // Lấy kết quả quiz của user
    const results = await QuizResult.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .populate("quizId", "title description")
      .sort({ takenAt: -1 })
      .limit(limitNum)
      .skip(skip);

    const total = await QuizResult.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
    });

    console.log(`Found ${results.length} quiz results for user`);

    res.json({
      success: true,
      data: {
        results,
        pagination: {
          current: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Error in getUserQuizResults:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy lịch sử kết quả",
    });
  }
};

// GET /api/quiz-results/result/:resultId - Lấy chi tiết một kết quả
export const getQuizResultById = async (req: Request, res: Response) => {
  try {
    const { resultId } = req.params;

    console.log(`Getting quiz result details: ${resultId}`);

    const result = await QuizResult.findById(resultId)
      .populate("quizId", "title description maxScore")
      .populate("userId", "fullName email")
      .populate("answers.questionId", "text options");

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy kết quả quiz",
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in getQuizResultById:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết kết quả",
    });
  }
};

export const getUserQuizHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const history = await QuizResult.find({ userId })
      .sort({ takenAt: -1 }) // Sort by newest first
      .select("quizId totalScore riskLevel suggestedAction takenAt")
      .limit(20); // Limit to last 20 results

    res.json(history);
  } catch (error) {
    console.error("Error fetching quiz history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Lấy toàn bộ kết quả quiz (có filter, phân trang)
export const getAllQuizResults = async (req: Request, res: Response) => {
  try {
    const {
      quizId,
      userId,
      riskLevel,
      from,
      to,
      page = 1,
      limit = 20,
    } = req.query;

    const filter: any = {};

    // Validate and add quizId filter
    if (quizId) {
      if (typeof quizId !== "string") {
        return res.status(400).json({
          success: false,
          message: "quizId phải là string",
        });
      }
      filter.quizId = quizId;
    }

    // Validate and add userId filter
    if (userId) {
      if (
        typeof userId === "string" &&
        mongoose.Types.ObjectId.isValid(userId)
      ) {
        filter.userId = new mongoose.Types.ObjectId(userId);
      } else if (typeof userId === "string" && userId.includes("@")) {
        // Nếu userId là email, tìm account
        const user = await Account.findOne({ email: userId });
        if (user) {
          filter.userId = user._id;
        } else {
          filter.userId = null; // Không tìm thấy user
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "userId không hợp lệ",
        });
      }
    }

    // Validate and add riskLevel filter
    if (riskLevel) {
      const validRiskLevels = ["low", "moderate", "high", "critical"];
      if (!validRiskLevels.includes(riskLevel as string)) {
        return res.status(400).json({
          success: false,
          message: "riskLevel không hợp lệ",
        });
      }
      filter.riskLevel = riskLevel;
    }

    // Validate and add date range filter
    if (from || to) {
      filter.takenAt = {};
      if (from) {
        const fromDate = new Date(from as string);
        if (isNaN(fromDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "from date không hợp lệ",
          });
        }
        filter.takenAt.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to as string);
        if (isNaN(toDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "to date không hợp lệ",
          });
        }
        filter.takenAt.$lte = toDate;
      }
    }

    // Validate pagination parameters
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: "Tham số phân trang không hợp lệ",
      });
    }

    const skip = (pageNum - 1) * limitNum;

    // Get total count and results
    const total = await QuizResult.countDocuments(filter);
    const results = await QuizResult.find(filter)
      .populate("quizId", "title")
      .populate("userId", "fullName email")
      .sort({ takenAt: -1 })
      .skip(skip)
      .limit(limitNum);

    console.log(`Found ${results.length} quiz results out of ${total} total`);

    res.json({
      success: true,
      data: {
        results,
        pagination: {
          current: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Lỗi BE getAllQuizResults:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách kết quả quiz",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// GET /api/quizzes/quiz-results/stats - Thống kê kết quả quiz
export const getQuizResultsStats = async (req: Request, res: Response) => {
  try {
    const { quizId, from, to } = req.query;

    const filter: any = {};

    // Add quizId filter if provided
    if (quizId) {
      if (typeof quizId !== "string") {
        return res.status(400).json({
          success: false,
          message: "quizId phải là string",
        });
      }
      filter.quizId = quizId;
    }

    // Add date range filter if provided
    if (from || to) {
      filter.takenAt = {};
      if (from) {
        const fromDate = new Date(from as string);
        if (isNaN(fromDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "from date không hợp lệ",
          });
        }
        filter.takenAt.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to as string);
        if (isNaN(toDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "to date không hợp lệ",
          });
        }
        filter.takenAt.$lte = toDate;
      }
    }

    // Get statistics
    const [totalResults, riskLevelStats, quizStats, recentResults] =
      await Promise.all([
        // Total results
        QuizResult.countDocuments(filter),

        // Risk level distribution
        QuizResult.aggregate([
          { $match: filter },
          {
            $group: {
              _id: "$riskLevel",
              count: { $sum: 1 },
              avgScore: { $avg: "$totalScore" },
            },
          },
          { $sort: { count: -1 } },
        ]),

        // Quiz distribution
        QuizResult.aggregate([
          { $match: filter },
          {
            $group: {
              _id: "$quizId",
              count: { $sum: 1 },
              avgScore: { $avg: "$totalScore" },
            },
          },
          { $sort: { count: -1 } },
        ]),

        // Recent results (last 7 days)
        QuizResult.find({
          ...filter,
          takenAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        }).countDocuments(),
      ]);

    // Calculate average score
    const avgScoreResult = await QuizResult.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          avgScore: { $avg: "$totalScore" },
          minScore: { $min: "$totalScore" },
          maxScore: { $max: "$totalScore" },
        },
      },
    ]);

    const avgScore =
      avgScoreResult.length > 0
        ? avgScoreResult[0]
        : { avgScore: 0, minScore: 0, maxScore: 0 };

    res.json({
      success: true,
      data: {
        totalResults,
        riskLevelDistribution: riskLevelStats,
        quizDistribution: quizStats,
        recentResults,
        scoreStats: {
          average: Math.round(avgScore.avgScore * 100) / 100,
          min: avgScore.minScore,
          max: avgScore.maxScore,
        },
      },
    });
  } catch (error) {
    console.error("Error in getQuizResultsStats:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê kết quả quiz",
    });
  }
};
