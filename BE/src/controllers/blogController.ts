import { Request, Response } from 'express';
import Blog from '../models/Blog';
import mongoose from 'mongoose';

// Extend Request để bao gồm file từ Multer
interface MulterRequest extends Request {
  file?: any; // Sử dụng any thay vì Express.Multer.File
}

export const getAllBlogs = async (req: Request, res: Response) => {
  try {
    // Check if user is admin from the request
    const isAdmin = req.query.isAdmin === 'true';
    
    // If not admin, only return published blogs
    const query = isAdmin ? {} : { published: 'published' };
    const blogs = await Blog.find(query)
      .populate('authorId', 'fullName username')
      .sort({ createdAt: -1 });
    
    res.json(blogs);
  } catch (error) {
    console.error('Error in getAllBlogs:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const getBlogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isAdmin = req.query.isAdmin === 'true';
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID blog không hợp lệ' });
    }

    const blog = await Blog.findById(id).populate('authorId', 'fullName username');
    
    if (!blog) {
      return res.status(404).json({ message: 'Không tìm thấy blog' });
    }
    
    // Nếu không phải admin, chỉ cho phép xem blog đã xuất bản
    if (!isAdmin && blog.published !== 'published') {
      return res.status(404).json({ message: 'Bài viết này chưa được xuất bản hoặc không tồn tại' });
    }
    
    res.json(blog);
  } catch (error) {
    console.error('Error in getBlogById:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const createBlog = async (req: MulterRequest, res: Response) => {
  try {
    const { title, content, authorId, topics, published, anDanh } = req.body;
    let imageUrl = req.body.image;
    if (req.file && req.file.path) {
      imageUrl = req.file.path;
    }
    
    // Validate published status
    const validStatuses = ['draft', 'published', 'unpublished', 'rejected'];
    const publishedStatus = published || 'draft';
    if (!validStatuses.includes(publishedStatus)) {
      return res.status(400).json({ message: 'Trạng thái published không hợp lệ' });
    }
    
    // Validate authorId
    if (!authorId || !mongoose.Types.ObjectId.isValid(authorId)) {
      return res.status(400).json({ message: 'ID tác giả không hợp lệ' });
    }
    
    // Nếu topics là string (từ form-data), parse thành mảng
    let topicsArr = topics;
    if (typeof topics === 'string') {
      try {
        topicsArr = JSON.parse(topics);
      } catch {
        topicsArr = topics.split(',').map((t: string) => t.trim()).filter(Boolean);
      }
    }
    
    // Xử lý trường anDanh
    const isAnonymous = anDanh === 'true' || anDanh === true;
    
    const newBlog = new Blog({ 
      title, 
      content, 
      authorId, 
      topics: topicsArr, 
      published: publishedStatus, 
      image: imageUrl,
      anDanh: isAnonymous
    });
    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (error) {
    console.error('Error in createBlog:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const updateBlog = async (req: MulterRequest, res: Response) => {
  try {
    // Kiểm tra trạng thái hiện tại của blog
    const existingBlog = await Blog.findById(req.params.id);
    if (!existingBlog) {
      return res.status(404).json({ message: 'Không tìm thấy blog' });
    }

    // Nếu blog đã bị từ chối, không cho phép cập nhật
    if (existingBlog.published === 'rejected') {
      return res.status(403).json({ message: 'Không thể sửa bài viết đã bị từ chối. Vui lòng tạo bài viết mới.' });
    }

    const { title, content, authorId, topics, published, anDanh } = req.body;
    console.log('Update blog request body:', req.body); // Debug log
    
    let updateData: any = { title, content };
    
    // Validate authorId nếu có cập nhật
    if (authorId && !mongoose.Types.ObjectId.isValid(authorId)) {
      return res.status(400).json({ message: 'ID tác giả không hợp lệ' });
    }
    if (authorId) {
      updateData.authorId = authorId;
    }
    
    // Xử lý topics
    if (topics !== undefined && topics !== null) {
      let topicsArr = topics;
      if (typeof topics === 'string') {
        try {
          // Thử parse JSON trước
          topicsArr = JSON.parse(topics);
        } catch {
          // Nếu không phải JSON, split theo dấu phẩy
          topicsArr = topics.split(',').map((t: string) => t.trim()).filter(Boolean);
        }
      }
      // Đảm bảo topicsArr là array
      if (Array.isArray(topicsArr)) {
        updateData.topics = topicsArr;
      } else {
        console.warn('Topics is not an array:', topicsArr);
        updateData.topics = [];
      }
    }
    
    // Validate và xử lý published status
    if (published !== undefined && published !== null) {
      const validStatuses = ['draft', 'published', 'unpublished', 'rejected'];
      if (!validStatuses.includes(published)) {
        return res.status(400).json({ 
          message: `Trạng thái published không hợp lệ: ${published}. Các giá trị hợp lệ: ${validStatuses.join(', ')}` 
        });
      }
      updateData.published = published;
    }
    
    // Xử lý trường anDanh
    if (anDanh !== undefined) {
      updateData.anDanh = anDanh === 'true' || anDanh === true;
    }
    
    // Xử lý image
    if (req.file && req.file.path) {
      updateData.image = req.file.path;
    } else if (req.body.image) {
      updateData.image = req.body.image;
    }
    
    console.log('Update data:', updateData); // Debug log
    
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('authorId', 'fullName username');
    
    if (!blog) return res.status(404).json({ message: 'Không tìm thấy blog' });
    res.json(blog);
  } catch (error) {
    console.error('Error in updateBlog:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const deleteBlog = async (req: Request, res: Response) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Không tìm thấy blog' });
    res.json({ message: 'Xóa blog thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const getBlogsByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID user không hợp lệ' });
    }
    
    // Lấy blog theo authorId
    const blogs = await Blog.find({ authorId: userId })
      .populate('authorId', 'fullName username')
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// [POST] /api/blogs/:id/comments - Thêm comment vào blog
export const addComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, username, content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID blog không hợp lệ' });
    }

    if (!userId || !username || !content) {
      return res.status(400).json({ message: 'Thiếu thông tin comment' });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Không tìm thấy blog' });
    }

    const newComment = {
      userId,
      username,
      content,
      createdAt: new Date()
    };

    blog.comments.push(newComment);
    const updatedBlog = await blog.save();
    
    // Trả về comment mới đã được tạo
    const savedComment = updatedBlog.comments[updatedBlog.comments.length - 1];
    res.status(201).json(savedComment);
  } catch (error) {
    console.error('Error in addComment:', error);
    res.status(500).json({ message: 'Lỗi server khi thêm comment' });
  }
};

// [DELETE] /api/blogs/:blogId/comments/:commentId - Xóa comment
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { blogId, commentId } = req.params;
    const { userId } = req.body; // Người dùng hiện tại

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({ message: 'ID blog không hợp lệ' });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: 'Không tìm thấy blog' });
    }

    // Tìm comment cần xóa
    const comment = blog.comments.find(c => c._id && c._id.toString() === commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Không tìm thấy comment' });
    }

    // Kiểm tra quyền xóa comment (chỉ người tạo comment mới được xóa)
    if (comment.userId !== userId) {
      return res.status(403).json({ message: 'Không có quyền xóa comment này' });
    }

    // Xóa comment
    blog.comments = blog.comments.filter(c => c._id && c._id.toString() !== commentId);
    await blog.save();

    res.json({ message: 'Đã xóa comment thành công' });
  } catch (error) {
    console.error('Error in deleteComment:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa comment' });
  }
};

// [GET] /api/blogs/:id/comments - Lấy tất cả comments của một blog
export const getComments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID blog không hợp lệ' });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Không tìm thấy blog' });
    }

    res.json(blog.comments);
  } catch (error) {
    console.error('Error in getComments:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy comments' });
  }
};

// [PATCH] /api/blogs/:id/status - Thay đổi trạng thái blog (chỉ admin)
export const updateBlogStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { published } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID blog không hợp lệ' });
    }

    const validStatuses = ['draft', 'published', 'unpublished', 'rejected'];
    if (!validStatuses.includes(published)) {
      return res.status(400).json({ 
        message: `Trạng thái published không hợp lệ: ${published}. Các giá trị hợp lệ: ${validStatuses.join(', ')}` 
      });
    }

    const blog = await Blog.findByIdAndUpdate(
      id,
      { published },
      { new: true }
    ).populate('authorId', 'fullName username');

    if (!blog) {
      return res.status(404).json({ message: 'Không tìm thấy blog' });
    }

    res.json(blog);
  } catch (error) {
    console.error('Error in updateBlogStatus:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái blog' });
  }
}; 