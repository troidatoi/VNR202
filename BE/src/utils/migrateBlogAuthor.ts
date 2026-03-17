const mongoose = require('mongoose');
const Blog = require('../models/Blog').default;
const Account = require('../models/Account').default;

async function migrateBlogAuthor() {
  try {
    console.log('Bắt đầu migration blog author...');
    
    // Kết nối database
    await mongoose.connect('mongodb://localhost:27017/hopehub', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Đã kết nối database');
    
    // Lấy tất cả blogs hiện tại
    const blogs = await Blog.find({});
    console.log(`Tìm thấy ${blogs.length} blogs cần migration`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const blog of blogs) {
      try {
        // Kiểm tra xem blog đã có authorId chưa
        if (blog.authorId) {
          console.log(`Blog ${blog._id} đã có authorId, bỏ qua`);
          continue;
        }
        
        // Tìm account theo author name
        let account = null;
        
        // Thử tìm theo fullName
        account = await Account.findOne({ fullName: blog.author });
        
        // Nếu không tìm thấy, thử tìm theo username
        if (!account) {
          account = await Account.findOne({ username: blog.author });
        }
        
        // Nếu vẫn không tìm thấy, tạo account mới
        if (!account) {
          console.log(`Không tìm thấy account cho author: ${blog.author}, tạo account mới`);
          account = new Account({
            fullName: blog.author,
            username: blog.author.toLowerCase().replace(/\s+/g, ''),
            email: `${blog.author.toLowerCase().replace(/\s+/g, '')}@example.com`,
            password: 'temp_password_123', // Cần thay đổi sau
            role: 'customer',
            isVerified: true
          });
          await account.save();
          console.log(`Đã tạo account mới: ${account._id}`);
        }
        
        // Cập nhật blog
        await Blog.findByIdAndUpdate(
          blog._id,
          {
            $set: {
              authorId: account._id,
              anDanh: false // Mặc định không ẩn danh
            },
            $unset: { author: 1 }
          }
        );
        
        console.log(`Đã migration blog ${blog._id}: author "${blog.author}" -> authorId "${account._id}"`);
        successCount++;
        
      } catch (error) {
        console.error(`Lỗi migration blog ${blog._id}:`, (error as any).message);
        errorCount++;
      }
    }
    
    console.log(`\nMigration hoàn thành:`);
    console.log(`- Thành công: ${successCount} blogs`);
    console.log(`- Lỗi: ${errorCount} blogs`);
    
  } catch (error) {
    console.error('Lỗi migration:', (error as any).message);
  } finally {
    await mongoose.disconnect();
    console.log('Đã ngắt kết nối database');
  }
}

// Chạy migration nếu file được gọi trực tiếp
if (require.main === module) {
  migrateBlogAuthor();
}

export = migrateBlogAuthor; 