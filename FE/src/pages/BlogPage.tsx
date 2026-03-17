import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllBlogsApi } from '../api';
import MainLayout from '../components/layout/MainLayout';
import CreateBlogForm from '../components/blog/CreateBlogForm';
import toast, { Toaster } from 'react-hot-toast';
import { FaSearch } from 'react-icons/fa';

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
  published: boolean;
  createdAt: string;
  updatedAt: string;
  anDanh: boolean;
}

function BlogPage() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const blogsPerPage = 6;

  // Check if user is logged in
  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    const token = localStorage.getItem('token');

    if (storedUserInfo && token) {
      setUserInfo(JSON.parse(storedUserInfo));
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  // Fetch blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const allBlogs = await getAllBlogsApi();
        setBlogs(allBlogs); // getAllBlogsApi now only returns published blogs for non-admin users
        setError(null);
      } catch (err) {
        setError('Không thể tải danh sách bài viết. Vui lòng thử lại sau.');
        console.error('Error fetching blogs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [showCreateForm]); // Refresh blogs after new post is created

  // Handle login prompt for non-authenticated users
  const handleCreateBlogClick = () => {
    if (isLoggedIn) {
      setShowCreateForm(true);
    } else {
      toast.error('Bạn cần đăng nhập để viết bài!', {
        duration: 3000,
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
        icon: '🔒',
      });

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/login', { state: { returnUrl: '/blogs' } });
      }, 2000);
    }
  };

  // Filter blogs based on search term, author, and topic
  const filteredBlogs = blogs.filter(blog => {
    const matchTitleContentAuthor =
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (blog.authorId?.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (blog.topics && blog.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchTitleContentAuthor;
  });

  // Get current blogs for pagination
  const indexOfFirstBlog = currentPage === 1 ? 1 : (currentPage - 1) * blogsPerPage + 1;

  // Separate the newest blog
  const newestBlog = filteredBlogs.length > 0 ? filteredBlogs[0] : null;

  // Get the rest of the blogs for the grid (excluding the newest one if on first page)
  const currentBlogs = currentPage === 1
    ? filteredBlogs.slice(1, 1 + blogsPerPage)
    : filteredBlogs.slice(indexOfFirstBlog, indexOfFirstBlog + blogsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // Truncate content for preview
  const truncateContent = (content: string, maxLength = 150) => {
    // Chuyển đổi line breaks thành spaces để hiển thị preview
    const normalizedContent = content.replace(/\n/g, ' ').replace(/\r/g, ' ');
    const strippedContent = normalizedContent.replace(/<[^>]*>?/gm, ''); // Remove HTML tags
    return strippedContent.length > maxLength
      ? strippedContent.substring(0, maxLength) + '...'
      : strippedContent;
  };

  // Philosophy theme background colors for blog cards without images
  const getBgColor = (id: string) => {
    const colors = [
      'bg-gradient-to-r from-primary-50 to-primary-100',
      'bg-gradient-to-r from-secondary-50 to-secondary-100',
      'bg-gradient-to-r from-accent-50 to-accent-100',
      'bg-gradient-to-r from-primary-100 to-secondary-100',
      'bg-gradient-to-r from-secondary-100 to-accent-100',
      'bg-gradient-to-r from-accent-100 to-primary-100',
    ];
    // Use the first character of the id to deterministically choose a color
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <MainLayout>
      <Toaster position="top-center" />

      <div className="bg-light pt-4 pb-8 text-center border-b border-amber-200">
        <h1 className="text-5xl md:text-6xl font-extrabold text-amber-950 mb-4 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Blog</h1>
        <p className="text-lg md:text-xl text-amber-800 font-medium max-w-2xl mx-auto">
          Khám phá những bài viết sâu sắc về lịch sử Đảng Cộng sản Việt Nam và công cuộc đổi mới.
        </p>
      </div>

      <div className="container mx-auto px-4 py-6 bg-gradient-to-b from-light to-primary-50/30 min-h-screen">
        {/* Create blog button - show different versions based on login state */}
        {!showCreateForm && (
          <div className="mb-8 flex justify-center">
            <button
              onClick={handleCreateBlogClick}
              className={`${isLoggedIn
                ? 'bg-gradient-to-r from-primary to-accent hover:from-primary-700 hover:to-accent-700'
                : 'bg-gradient-to-r from-secondary-400 to-secondary-500 hover:from-secondary-500 hover:to-secondary-600'
                } px-6 py-3 rounded-xl shadow-lg transition-all duration-300 flex items-center font-semibold text-lg text-light drop-shadow`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isLoggedIn ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v5m0 0l-3-3m3 3l3-3M12 9V4m0 0L9 7m3-3l3 3" />
                )}
              </svg>
              {isLoggedIn ? 'Viết bài blog mới' : 'Đăng nhập để viết bài'}
            </button>
          </div>
        )}

        {/* Create blog form */}
        {showCreateForm ? (
          <div className="mb-10">
            <CreateBlogForm
              onSuccess={() => setShowCreateForm(false)}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        ) : (
          <>
            {/* Search Bar - Redesigned */}
            <div className="max-w-2xl mx-auto mb-12 relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm bài viết, tác giả, chủ đề..."
                  className="w-full px-6 pl-14 py-4 rounded-full border-0 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all bg-white text-gray-800 placeholder-gray-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-5 top-1/2 transform -translate-y-1/2">
                  <FaSearch className="text-amber-400" />
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center pr-6">
                  <div className="h-8 w-px bg-gray-200"></div>
                  <span className="pl-3 text-sm text-gray-400">Enter ⏎</span>
                </div>
              </div>
            </div>

            {/* Featured Newest Blog */}
            {currentPage === 1 && newestBlog && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-amber-800 mb-6 border-l-4 border-amber-500 pl-4 bg-amber-50 py-2 rounded-r-lg shadow-sm">
                  Bài viết mới nhất
                </h2>
                <Link
                  to={'/blogs/' + newestBlog._id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden flex flex-col md:flex-row h-full group border border-amber-100"
                >
                  <div className="md:w-1/2 h-64 md:h-auto overflow-hidden relative">
                    {newestBlog.image ? (
                      <img
                        src={newestBlog.image}
                        alt={newestBlog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                      />
                    ) : (
                      <div className="h-full bg-gradient-to-br from-amber-100 to-amber-100 flex items-center justify-center p-6 relative">
                        <div className="text-center">
                          <svg className="w-24 h-24 text-amber-300 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <p className="text-sm font-medium text-amber-400 italic">Hình ảnh minh họa</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  <div className="md:w-1/2 p-8 bg-gradient-to-br from-white to-amber-50">
                    <div className="flex items-center mb-4">
                      <span className="text-sm text-amber-500 bg-amber-50 px-3 py-1 rounded-full">{formatDate(newestBlog.createdAt)}</span>
                      <span className="mx-2 text-amber-200">•</span>
                      <span className="text-sm text-amber-700 font-medium">{newestBlog.anDanh ? 'Ẩn danh' : (newestBlog.authorId?.fullName || 'Không xác định')}</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-4 text-amber-900 group-hover:text-amber-700 transition-colors">{newestBlog.title}</h3>
                    <p className="text-amber-700 mb-6 text-base">{truncateContent(newestBlog.content, 300)}</p>

                    {/* Topics */}
                    {newestBlog.topics && newestBlog.topics.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {newestBlog.topics.map((topic, idx) => (
                          <span key={idx} className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end mt-auto pt-4 border-t border-amber-100">
                      <span className="text-amber-700 font-medium group-hover:text-amber-800 transition flex items-center text-base">
                        Đọc tiếp
                        <svg className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Blog cards - Blue theme */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentBlogs.map((blog) => (
                <Link
                  key={blog._id}
                  to={'/blogs/' + blog._id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full group border border-amber-50"
                >
                  {blog.image ? (
                    <div className="h-56 overflow-hidden relative">
                      <img
                        src={blog.image}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-amber-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  ) : (
                    <div className="h-56 bg-gradient-to-br from-amber-100 to-amber-100 flex items-center justify-center p-6 relative">
                      <div className="text-center">
                        <svg className="w-16 h-16 text-amber-300 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p className="text-sm font-medium text-amber-400 italic">Hình ảnh minh họa</p>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-amber-200/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  )}
                  <div className="flex flex-col flex-1 p-6 bg-gradient-to-br from-white to-amber-50/40">
                    <div className="flex items-center mb-3">
                      <span className="text-xs text-amber-500 bg-amber-50 px-3 py-1 rounded-full">{formatDate(blog.createdAt)}</span>
                      <span className="mx-2 text-amber-200">•</span>
                      <span className="text-xs text-amber-700 font-medium">{blog.anDanh ? 'Ẩn danh' : (blog.authorId?.fullName || 'Không xác định')}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-amber-900 group-hover:text-amber-700 transition-colors">{blog.title}</h3>
                    <p className="text-amber-700 mb-4 text-sm flex-grow">{truncateContent(blog.content)}</p>
                    {/* Topics */}
                    {blog.topics && blog.topics.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {blog.topics.slice(0, 3).map((topic, idx) => (
                          <span key={idx} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-end mt-auto pt-3 border-t border-amber-100">
                      <span className="text-amber-700 font-medium group-hover:text-amber-800 transition flex items-center text-sm">
                        Đọc tiếp
                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {/* Pagination - Blue theme */}
            {filteredBlogs.length > blogsPerPage && (
              <div className="flex justify-center mt-12">
                <nav className="inline-flex bg-white rounded-lg shadow-lg overflow-hidden border border-amber-100">
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={currentPage === 1
                      ? 'px-4 py-2 border-r border-amber-100 flex items-center bg-amber-50 text-amber-300 cursor-not-allowed'
                      : 'px-4 py-2 border-r border-amber-100 flex items-center text-amber-700 hover:bg-amber-50 hover:text-amber-700'
                    }
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Trước
                  </button>
                  {Array.from({ length: Math.ceil(filteredBlogs.length / blogsPerPage) }, (_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => paginate(pageNumber)}
                        className={pageNumber === currentPage
                          ? 'w-10 border-r border-amber-100 bg-amber-600 text-white font-medium'
                          : 'w-10 border-r border-amber-100 text-amber-700 hover:bg-amber-50 hover:text-amber-700'
                        }
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => paginate(Math.min(Math.ceil(filteredBlogs.length / blogsPerPage), currentPage + 1))}
                    disabled={currentPage === Math.ceil(filteredBlogs.length / blogsPerPage)}
                    className={currentPage === Math.ceil(filteredBlogs.length / blogsPerPage)
                      ? 'px-4 py-2 flex items-center bg-amber-50 text-amber-300 cursor-not-allowed'
                      : 'px-4 py-2 flex items-center text-amber-700 hover:bg-amber-50 hover:text-amber-700'
                    }
                  >
                    Sau
                    <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </nav>
              </div>
            )}

            {/* PHẦN MỚI: Bài viết theo 3 chủ đề nhiều nhất */}
            {(() => {
              // Đếm số lượng bài viết theo từng chủ đề
              const topicCount: Record<string, number> = {};
              blogs.forEach(blog => {
                blog.topics?.forEach(topic => {
                  topicCount[topic] = (topicCount[topic] || 0) + 1;
                });
              });
              // Lấy 3 chủ đề nhiều bài nhất
              const topTopics = Object.entries(topicCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([topic]) => topic);
              if (topTopics.length === 0) return null;
              return (
                <div className="mt-16">
                  <h2 className="text-2xl font-bold text-amber-800 mb-6 border-l-4 border-amber-500 pl-4 bg-amber-50 py-2 rounded-r-lg shadow-sm">
                    Bài viết theo chủ đề nổi bật
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {topTopics.map(topic => {
                      const topicBlogs = blogs.filter(blog => blog.topics?.includes(topic)).slice(0, 3);
                      return (
                        <div key={topic} className="bg-white rounded-xl shadow-md p-6 border border-amber-100 flex flex-col">
                          <div className="flex items-center mb-4">
                            <span className="text-lg font-semibold text-amber-700 bg-amber-50 px-4 py-1 rounded-full">{topic}</span>
                          </div>
                          <div className="space-y-4">
                            {topicBlogs.map(blog => (
                              <Link
                                key={blog._id}
                                to={'/blogs/' + blog._id}
                                className="flex items-center gap-3 hover:bg-amber-50 rounded-lg p-3 transition"
                              >
                                {/* Ảnh thu nhỏ vuông */}
                                {blog.image || blog.thumbnail ? (
                                  <img
                                    src={blog.image || blog.thumbnail}
                                    alt={blog.title}
                                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-amber-100 bg-white"
                                  />
                                ) : (
                                  <div className="w-16 h-16 flex items-center justify-center bg-amber-50 rounded-lg flex-shrink-0 border border-amber-100">
                                    <svg className="w-8 h-8 text-amber-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-amber-900 line-clamp-2 mb-1">{blog.title}</div>
                                  <div className="text-xs text-gray-500 mb-1">{formatDate(blog.createdAt)}</div>
                                  <div className="text-xs text-amber-700">{blog.anDanh ? 'Ẩn danh' : (blog.authorId?.fullName || 'Không xác định')}</div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            {/* KẾT THÚC PHẦN MỚI */}

            {/* Tiêu đề Top Tác giả vàng nhạt, căn lề trái, ngoài khung */}
            <div className="mt-20 mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2 bg-yellow-50 text-yellow-700 border-l-4 border-yellow-300 rounded-r-lg py-2 px-6 w-full max-w-max shadow-sm">
                <svg className="w-6 h-6 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Top Tác giả
              </h3>
            </div>
            {/* PHẦN MỚI: Top Tác giả (không tính bài ẩn danh, podium 3 cột) */}
            {(() => {
              // Lọc các blog không ẩn danh
              const nonAnonymousBlogs = blogs.filter(blog => blog.anDanh === false);
              // Đếm số bài viết theo tác giả
              const authorMap: Record<string, { name: string; count: number }> = {};
              nonAnonymousBlogs.forEach(blog => {
                const id = blog.authorId?._id || 'unknown';
                const name = blog.authorId?.fullName || blog.authorId?.username || 'Không rõ';
                if (!authorMap[id]) authorMap[id] = { name, count: 0 };
                authorMap[id].count++;
              });
              const topAuthors = Object.values(authorMap)
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);
              const maxCount = topAuthors[0]?.count || 1;
              if (topAuthors.length === 0) return null;
              // Sắp xếp lại cho podium: #2, #1, #3
              const podium = [topAuthors[1], topAuthors[0], topAuthors[2]];
              const podiumRanks = [2, 1, 3];
              const podiumColors = [
                'bg-gray-200 text-gray-700', // #2
                'bg-yellow-300 text-yellow-900 border-2 border-yellow-400 shadow-lg', // #1
                'bg-rose-200 text-rose-700', // #3
              ];
              return (
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-amber-100">
                  <div className="flex flex-col sm:flex-row justify-center items-end gap-4">
                    {podium.map((author, idx) => (
                      author ? (
                        <div key={idx} className={`flex-1 flex flex-col items-center justify-end ${podiumColors[idx]} rounded-xl px-4 pt-4 pb-2 relative min-w-[100px] max-w-[180px] ${idx === 1 ? 'z-10 scale-110 shadow-xl' : 'opacity-90'} transition-all`} style={{ height: idx === 1 ? 180 : 140 }}>
                          <div className={`absolute -top-7 left-1/2 -translate-x-1/2 w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg border-4 ${idx === 1 ? 'bg-yellow-400 border-yellow-300 text-yellow-900 shadow' : idx === 0 ? 'bg-gray-300 border-gray-200 text-gray-700' : 'bg-rose-300 border-rose-200 text-rose-700'}`}>#{podiumRanks[idx]}</div>
                          <div className="font-semibold text-base mt-6 text-center break-words">{author.name}</div>
                          <div className="text-xs font-medium mt-1 mb-2">{author.count} bài viết</div>
                          {idx === 1 && (
                            <svg className="w-8 h-8 text-yellow-400 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.09 6.26L20 9.27l-5 3.64L16.18 20 12 16.77 7.82 20 9 12.91l-5-3.64 5.91-.01z" /></svg>
                          )}
                        </div>
                      ) : (
                        <div key={idx} className="flex-1 min-w-[100px] max-w-[180px]" />
                      )
                    ))}
                  </div>
                </div>
              );
            })()}
            {/* KẾT THÚC PHẦN MỚI */}


          </>
        )}
      </div>
    </MainLayout>
  );
}

export default BlogPage;
