import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getBlogByIdApi, getAllBlogsApi } from '../api';
import MainLayout from '../components/layout/MainLayout';
import BlogDetailView from '../components/blog/BlogDetailView';

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

function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) return;

      setLoading(true);
      setError(null); // Reset error state

      try {
        const blogData = await getBlogByIdApi(id);

        // Nếu blog chưa được xuất bản, chuyển hướng về trang blogs
        if (blogData.published !== 'published') {
          setError('Bài viết này chưa được xuất bản');
          return;
        }

        setBlog(blogData);

        // Set page title
        document.title = `${blogData.title} | VNR202`;

        // Lấy bài viết liên quan theo tag
        if (blogData.topics && blogData.topics.length > 0) {
          try {
            const allBlogs = await getAllBlogsApi(); // This will only return published blogs
            const related = allBlogs.filter((b: Blog) =>
              b._id !== blogData._id &&
              b.topics && b.topics.some((tag: string) => blogData.topics.includes(tag))
            ).slice(0, 3);
            setRelatedBlogs(related);
          } catch (err) {
            console.error('Error fetching related blogs:', err);
            // Không set error vì đây không phải lỗi nghiêm trọng
            setRelatedBlogs([]);
          }
        } else {
          setRelatedBlogs([]);
        }
      } catch (err: any) {
        setError(err.message || 'Không thể tải bài viết. Vui lòng thử lại sau.');
        console.error('Error fetching blog:', err);
        setBlog(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id, navigate]);

  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex justify-center items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !blog) {
    return (
      <MainLayout>
        <div className="min-h-screen flex flex-col justify-center items-center p-4">
          <div className="bg-white p-8 rounded-xl shadow-sm max-w-2xl mx-auto text-center">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-2xl font-bold text-red-500 mb-4">
              {error || 'Bài viết không khả dụng'}
            </h1>
            <p className="text-gray-600 mb-6">
              {error || 'Bài viết này có thể chưa được xuất bản, đã bị xóa hoặc không tồn tại.'}
            </p>
            <Link
              to="/blogs"
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full hover:from-cyan-600 hover:to-blue-600 transition shadow-md flex items-center justify-center max-w-xs mx-auto"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại danh sách bài viết
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero section with image */}
      <BlogDetailView blog={blog} />
      {/* Related content section */}
      {relatedBlogs.length > 0 && (
        <div className="max-w-4xl mx-auto mt-12">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Bài viết liên quan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedBlogs.map((item) => (
              <Link
                key={item._id}
                to={`/blogs/${item._id}`}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full"
              >
                {item.image ? (
                  <img src={item.image} alt={item.title} className="h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 w-full bg-gray-100 flex items-center justify-center text-gray-400">Không có ảnh</div>
                )}
                <div className="p-4 flex flex-col flex-grow">
                  <span className="text-xs text-gray-500 mb-1">{formatDate(item.createdAt)}</span>
                  <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2">{item.title}</h4>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.topics && item.topics.slice(0, 2).map((topic, idx) => (
                      <span key={idx} className="text-xs bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded-full">{topic}</span>
                    ))}
                  </div>
                  <span className="text-xs text-cyan-600 mt-auto">Đọc tiếp &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default BlogDetailPage; 