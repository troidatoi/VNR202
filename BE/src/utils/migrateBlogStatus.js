const mongoose = require('mongoose');
require('dotenv').config();

// Kết nối database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database_name');

// Schema Blog với enum mới
const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  image: { type: String },
  thumbnail: { type: String },
  topics: [{ type: String }],
  published: { 
    type: String, 
    enum: ['draft', 'published', 'unpublished', 'rejected'], 
    default: 'draft' 
  },
  comments: [{
    userId: { type: String, required: true },
    username: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  anDanh: { type: Boolean, default: false }
}, {
  timestamps: true,
  versionKey: false
});

const Blog = mongoose.model('Blog', BlogSchema);

async function migrateBlogStatus() {
  try {
    console.log('Bắt đầu migration blog status...');
    
    // Kiểm tra số lượng blog
    const blogCount = await Blog.countDocuments();
    console.log(`Tổng số blog trong database: ${blogCount}`);
    
    // Hiển thị thống kê trạng thái hiện tại
    const statusStats = await Blog.aggregate([
      {
        $group: {
          _id: '$published',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('Thống kê trạng thái blog hiện tại:');
    statusStats.forEach(stat => {
      console.log(`- ${stat._id || 'null'}: ${stat.count} blog`);
    });
    
    // Kiểm tra xem có blog nào có trạng thái không hợp lệ không
    const invalidBlogs = await Blog.find({
      published: { $nin: ['draft', 'published', 'unpublished', 'rejected'] }
    });
    
    if (invalidBlogs.length > 0) {
      console.log(`Tìm thấy ${invalidBlogs.length} blog có trạng thái không hợp lệ:`);
      invalidBlogs.forEach(blog => {
        console.log(`- Blog "${blog.title}" có trạng thái: ${blog.published}`);
      });
    } else {
      console.log('Tất cả blog đều có trạng thái hợp lệ!');
    }
    
    console.log('Migration hoàn thành!');
    
  } catch (error) {
    console.error('Lỗi migration:', error);
  } finally {
    mongoose.connection.close();
    console.log('Đã đóng kết nối database');
  }
}

// Chạy migration
migrateBlogStatus(); 