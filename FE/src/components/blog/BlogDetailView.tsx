import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCommentsApi, deleteCommentApi, addCommentApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface IComment {
  _id?: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

interface Blog {
  _id: string;
  title: string;
  content: string;
  authorId: {
    _id: string;
    fullName: string;
    username: string;
  };
  image?: string;
  thumbnail?: string;
  topics?: string[];
  published: 'draft' | 'published' | 'unpublished' | 'rejected';
  comments: IComment[];
  createdAt: string;
  updatedAt: string;
  anDanh: boolean;
}

interface BlogDetailViewProps {
  blog: Blog;
  onClose?: () => void;
}

const dinhDangNgay = (chuoiNgay: string) => {
  const tuyChon: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return new Date(chuoiNgay).toLocaleDateString('vi-VN', tuyChon);
};

// Hàm chuyển đổi text thuần thành HTML với line breaks
const formatBlogContent = (content: string) => {
  if (!content) return '';
  
  // Escape HTML để tránh XSS
  const escapedContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  
  // Chuyển đổi line breaks thành <br> tags
  return escapedContent
    .replace(/\n/g, '<br>')
    .replace(/\r\n/g, '<br>')
    .replace(/\r/g, '<br>');
};

const BlogDetailView: React.FC<BlogDetailViewProps> = ({ blog, onClose }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<IComment[]>([]);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [newComment, setNewComment] = useState('');
  const [commentName, setCommentName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [blog._id]);

  const fetchComments = async () => {
    try {
      const data = await getCommentsApi(blog._id);
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Không thể tải bình luận');
    }
  };

  const sortComments = (commentsToSort: IComment[]) => {
    switch (sortOrder) {
      case 'newest':
        return [...commentsToSort].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return [...commentsToSort].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      default:
        return commentsToSort;
    }
  };

  const sortedComments = sortComments(comments);


  const handleDeleteComment = async (commentId: string) => {
    if (!user?._id) return;
    
    try {
      await deleteCommentApi(blog._id, commentId, user._id);
      await fetchComments();
      toast.success('Đã xóa bình luận');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Không thể xóa bình luận');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      // Cải thiện logic xử lý tên người dùng
      let displayName = 'Khách';
      
      if (user) {
        // Nếu đã đăng nhập, ưu tiên fullName, sau đó username, cuối cùng là email
        if (user.fullName && user.fullName.trim()) {
          displayName = user.fullName.trim();
        } else if (user.username && user.username.trim()) {
          displayName = user.username.trim();
        } else if (user.email) {
          // Lấy phần trước @ của email làm tên hiển thị
          displayName = user.email.split('@')[0];
        }
      } else if (commentName.trim()) {
        // Nếu chưa đăng nhập nhưng có nhập tên
        displayName = commentName.trim();
      }
      
      await addCommentApi(blog._id, {
        userId: user?._id || 'anonymous',
        username: displayName,
        content: newComment.trim()
      });
      setNewComment('');
      setCommentName('');
      await fetchComments();
      toast.success('Đã thêm bình luận');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Không thể thêm bình luận');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!blog) return null;

  return (
    <div className="relative">
      {/* Nút đóng nếu dùng trong modal */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white rounded-full shadow p-2 hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition"
          title="Đóng"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      {/* Hero section */}
      <div className="relative h-[300px] md:h-[350px] overflow-hidden rounded-t-xl">
        {blog.image ? (
          <img
            src={blog.image}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary-400 via-secondary-300 to-accent-200"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 flex items-end">
          <div className="px-6 pb-10">
            <div className="flex items-center mb-3">
              <span className="bg-primary/80 text-light px-4 py-1 rounded-full text-sm backdrop-blur-sm">
                {dinhDangNgay(blog.createdAt)}
              </span>
              <span className="mx-3 text-white/70">•</span>
              <span className="text-white/90">Tác giả: <span className="font-medium">{blog.anDanh ? 'Ẩn danh' : blog.authorId.fullName}</span></span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 drop-shadow-sm">{blog.title}</h1>
          </div>
        </div>
      </div>
      {/* Nội dung blog */}
      <div className="bg-light py-8 px-4 md:px-10 rounded-b-xl shadow-sm">
        {/* Chủ đề */}
        {blog.topics && blog.topics.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {blog.topics.map((chuDe) => (
              <span key={chuDe} className="inline-block bg-primary-50 text-primary text-xs px-3 py-1 rounded-full">
                {chuDe}
              </span>
            ))}
          </div>
        )}
        {/* Nội dung chính */}
        <div
          className="prose lg:prose-xl prose-stone max-w-none mb-6"
          dangerouslySetInnerHTML={{ __html: formatBlogContent(blog.content) }}
        />

        {/* Comments section */}
        <div className="mt-12 border-t pt-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-primary">Bình luận ({comments.length})</h3>
            
            {/* Sort options */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-bodytext">Sắp xếp:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                className="px-3 py-1 text-sm border border-primary-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
              </select>
            </div>
          </div>
          
          {/* Add comment form */}
          {user ? (
            <form onSubmit={handleSubmitComment} className="mb-8">
              <div className="bg-primary-50 rounded-lg p-6">
                <label htmlFor="newComment" className="block text-sm font-medium text-primary mb-3">
                  Thêm bình luận
                </label>
                <textarea
                  id="newComment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Chia sẻ suy nghĩ của bạn về bài viết này..."
                  className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                  rows={4}
                  required
                />
                <div className="flex justify-end mt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Đang gửi...' : 'Gửi bình luận'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-8 text-center py-8 bg-primary-50 rounded-lg">
              <p className="text-bodytext mb-4">Đăng nhập để tham gia bình luận</p>
              <Link 
                to="/login" 
                className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Đăng nhập
              </Link>
            </div>
          )}

          {/* Comments list */}
          <div className="space-y-6">
            {sortedComments.map((comment) => (
              <div key={comment._id} className="flex gap-4 p-4 bg-primary-50 rounded-lg">
                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-primary">{comment.username}</span>
                      <span className="mx-2 text-secondary-400">•</span>
                      <span className="text-sm text-bodytext">{dinhDangNgay(comment.createdAt)}</span>
                    </div>
                    {user?._id === comment.userId && (
                      <button
                        onClick={() => comment._id && handleDeleteComment(comment._id)}
                        className="text-danger hover:text-danger-600"
                        title="Xóa bình luận"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-bodytext">{comment.content}</p>
                </div>
              </div>
            ))}
            
            {comments.length === 0 && (
              <div className="text-center py-8 text-secondary-500">
                Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetailView; 