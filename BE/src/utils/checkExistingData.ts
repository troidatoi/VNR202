import mongoose from "mongoose";
import dotenv from "dotenv";
import Quiz from "../models/Quiz";
import Question from "../models/Question";
import QuizResult from "../models/QuizResult";

dotenv.config();

async function checkExistingData() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("📡 Connected to MongoDB");

    // Check quizzes collection
    const quizCount = await Quiz.countDocuments();
    console.log(`📝 Total quizzes: ${quizCount}`);

    if (quizCount > 0) {
      const quizzes = await Quiz.find().limit(3);
      console.log("\n🔍 Sample quizzes:");
      quizzes.forEach((quiz) => {
        console.log(
          `  - ${quiz._id}: "${quiz.title}" (${quiz.ageGroups.join(", ")})`
        );
      });
    }

    // Check questions collection
    const questionCount = await Question.countDocuments();
    console.log(`\n❓ Total questions: ${questionCount}`);

    if (questionCount > 0) {
      // Group questions by quiz
      const questionsByQuiz = await Question.aggregate([
        { $group: { _id: "$quizId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      console.log("\n📊 Questions breakdown by quiz:");
      for (const group of questionsByQuiz) {
        console.log(`  - ${group._id}: ${group.count} questions`);
      }

      // Sample question
      const sampleQuestion = await Question.findOne();
      console.log("\n🔍 Sample question structure:");
      console.log(`  Quiz ID: ${sampleQuestion?.quizId}`);
      console.log(`  Text: "${sampleQuestion?.text?.substring(0, 60)}..."`);
      console.log(`  Options: ${sampleQuestion?.options?.length} choices`);
      console.log(`  Age Group: ${sampleQuestion?.ageGroup}`);
      console.log(`  Topic: ${sampleQuestion?.topic}`);
    }

    // Check quiz results
    const resultCount = await QuizResult.countDocuments();
    console.log(`\n📈 Total quiz results: ${resultCount}`);

    if (resultCount > 0) {
      const recentResults = await QuizResult.find()
        .sort({ takenAt: -1 })
        .limit(3)
        .populate("quizId", "title");

      console.log("\n🏆 Recent results:");
      recentResults.forEach((result) => {
        console.log(
          `  - ${(result as any).quizId?.title || result.quizId}: ${
            result.totalScore
          } points, ${result.riskLevel} risk`
        );
      });
    }

    console.log("\n✅ Data check completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error checking data:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  checkExistingData();
}

export { checkExistingData };
