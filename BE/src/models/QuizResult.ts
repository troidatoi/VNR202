import mongoose, { Schema, Document } from "mongoose";

// Interface cho câu trả lời của user
export interface IUserAnswer {
  questionId: mongoose.Types.ObjectId;
  selectedOption: number; // Index of selected option
  score: number;
}

// Interface TypeScript cho QuizResult
export interface IQuizResult extends Document {
  userId?: mongoose.Types.ObjectId; // Optional for anonymous users
  quizId: string; // Reference to Quiz collection
  takenAt: Date;
  answers: IUserAnswer[];
  totalScore: number;
  riskLevel: "low" | "moderate" | "high" | "critical";
  suggestedAction: string;
  isAnonymous: boolean;
  sessionId?: string; // For anonymous users
  createdAt: Date;
  updatedAt: Date;
}

// Schema cho user answer
const userAnswerSchema = new Schema<IUserAnswer>(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    selectedOption: {
      type: Number,
      required: true,
      min: 0,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

// Schema Mongoose cho QuizResult
const quizResultSchema = new Schema<IQuizResult>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      sparse: true, // Allow null for anonymous users
    },
    quizId: {
      type: String,
      required: true,
      ref: "Quiz",
    },
    takenAt: {
      type: Date,
      default: Date.now,
    },
    answers: {
      type: [userAnswerSchema],
      required: true,
    },
    totalScore: {
      type: Number,
      required: true,
      min: 0,
    },
    riskLevel: {
      type: String,
      enum: ["low", "moderate", "high", "critical"],
      required: true,
    },
    suggestedAction: {
      type: String,
      required: true,
      trim: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    sessionId: {
      type: String,
      sparse: true, // For anonymous users
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
quizResultSchema.index({ userId: 1, takenAt: -1 });
quizResultSchema.index({ quizId: 1, takenAt: -1 });
quizResultSchema.index({ riskLevel: 1, takenAt: -1 });

// Virtual to calculate completion percentage
quizResultSchema.virtual("completionPercentage").get(function () {
  // This would need to be calculated based on the quiz's total questions
  return 100; // Assuming completed quizzes are 100%
});

// Virtual to get risk level description in Vietnamese
quizResultSchema.virtual("riskLevelDescription").get(function () {
  const descriptions = {
    low: "Nguy cơ thấp - Bạn có ý thức tốt về phòng ngừa",
    moderate: "Nguy cơ trung bình - Cần chú ý một số yếu tố",
    high: "Nguy cơ cao - Nên tìm hiểu thêm và cân nhắc hỗ trợ",
    critical: "Nguy cơ rất cao - Khuyến khích tìm kiếm sự hỗ trợ chuyên môn",
  };
  return descriptions[this.riskLevel];
});

// Method to determine if user should see a consultant
quizResultSchema.methods.shouldSeeConsultant = function (): boolean {
  return this.riskLevel === "high" || this.riskLevel === "critical";
};

// Static method to calculate risk level based on score and quiz
quizResultSchema.statics.calculateRiskLevel = function (
  totalScore: number,
  maxScore: number
): string {
  const percentage = (totalScore / maxScore) * 100;

  if (percentage >= 75) return "critical";
  if (percentage >= 50) return "high";
  if (percentage >= 25) return "moderate";
  return "low";
};

export default mongoose.model<IQuizResult>("QuizResult", quizResultSchema);
