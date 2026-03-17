import mongoose, { Schema, Document } from "mongoose";

// Interface cho option của câu hỏi
export interface IQuestionOption {
  text: string;
  score: number;
}

// Interface TypeScript cho Question
export interface IQuestion extends Document {
  quizId: string; // Reference to Quiz collection
  text: string;
  options: IQuestionOption[];
  type: "single-choice" | "multiple-choice" | "rating-scale";
  ageGroup: "teen" | "parent" | "adult";
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Schema cho question option
const questionOptionSchema = new Schema<IQuestionOption>(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

// Schema Mongoose cho Question
const questionSchema = new Schema<IQuestion>(
  {
    quizId: {
      type: String,
      required: true,
      ref: "Quiz",
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [questionOptionSchema],
      required: true,
      validate: {
        validator: function (options: IQuestionOption[]) {
          return options.length >= 2 && options.length <= 6;
        },
        message: "Question must have between 2 and 6 options",
      },
    },
    type: {
      type: String,
      enum: ["single-choice", "multiple-choice", "rating-scale"],
      default: "single-choice",
    },
    ageGroup: {
      type: String,
      enum: ["teen", "parent", "adult"],
      required: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
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
  }
);

// Indexes for performance
questionSchema.index({ quizId: 1, ageGroup: 1, isActive: 1 });
questionSchema.index({ quizId: 1, topic: 1, isActive: 1 });
questionSchema.index({ quizId: 1, difficulty: 1, isActive: 1 });

// Virtual to get max possible score for this question
questionSchema.virtual("maxScore").get(function () {
  return Math.max(...this.options.map((option) => option.score));
});

// Virtual to get min possible score for this question
questionSchema.virtual("minScore").get(function () {
  return Math.min(...this.options.map((option) => option.score));
});

export default mongoose.model<IQuestion>("Question", questionSchema);
