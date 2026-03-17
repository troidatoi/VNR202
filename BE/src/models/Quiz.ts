import mongoose, { Schema, Document } from "mongoose";

// Interface TypeScript cho Quiz (chứa field dữ liệu)
export interface IQuiz {
  _id: string; // Custom string ID like "assist", "crafft"
  title: string;
  description: string;
  ageGroups: ("teen" | "parent" | "adult")[];
  tags: string[];
  maxScore: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface mở rộng Document để dùng với Mongoose (nếu cần dùng các method của Document)
export interface IQuizDocument extends IQuiz, Document {
  _id: any; // Ghi đè _id của Document nếu cần, hoặc để Mongoose tự xử lý qua generic
}

// Schema Mongoose cho Quiz
const quizSchema = new Schema<IQuiz>(
  {
    _id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    ageGroups: [
      {
        type: String,
        enum: ["teen", "parent", "adult"],
        required: true,
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    maxScore: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    _id: false, // Disable auto-generated _id since we use custom string ID
  }
);

// Indexes for performance
quizSchema.index({ ageGroups: 1, isActive: 1 });
quizSchema.index({ tags: 1, isActive: 1 });

// Virtual to get question count
quizSchema.virtual("questionCount", {
  ref: "Question",
  localField: "_id",
  foreignField: "quizId",
  count: true,
});

export default mongoose.model<IQuiz>("Quiz", quizSchema);
