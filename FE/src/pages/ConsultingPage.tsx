import { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { getAllConsultantsApi, getAllSlotTimeApi } from '../api';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaUserTie, FaEnvelope, FaCalendarAlt, FaSearch, FaUserMd, FaRegCalendarAlt, FaMoneyBillWave } from 'react-icons/fa';
import consultantImg from '../assets/images/consultant.png';

interface User {
  _id: string;
  fullName: string;
  photoUrl: string;
  email: string;
  phoneNumber: string;
}

interface Consultant {
  _id: string;
  userId: string;
  introduction: string;
  contactLink: string;
  licenseNumber: string;
  startDateofWork: string;
  googleMeetLink: string;
  accountId: User;  // This comes from the populated field
}

interface SlotTime {
  _id: string;
  consultant_id: string;
  status: 'available' | 'booked' | 'cancelled' | 'deleted';
  // ... các trường khác nếu cần
}

function ConsultingPage() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [featuredConsultants, setFeaturedConsultants] = useState<Consultant[]>([]); // Top 3 by booked slot
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State phân trang
  const [page, setPage] = useState(1);
  const pageSize = 4;

  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');

  const handleBookAppointment = (consultantId: string) => {
    const userId = localStorage.getItem("userId");
    const userInfo = localStorage.getItem("userInfo");
    const user = userInfo ? JSON.parse(userInfo) : null;
    
    if (!userId) {
      navigate('/login');
    } else if (!user?.isVerified) {
      navigate('/verify-otp');
    } else {
      navigate(`/consultant/${consultantId}`);
    }
  };

  // Page transition variants
  const pageVariants = {
    initial: {
      opacity: 0,
    },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  // Section variants
  const sectionVariants = {
    initial: { 
      opacity: 0, 
      y: 40 
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut"
      }
    }
  };

  // List item variants
  const itemVariants = {
    initial: { 
      opacity: 0, 
      y: 20 
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  // Feature icon variants
  const featureIconVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    },
    hover: { 
      scale: 1.1,
      transition: { duration: 0.2 }
    }
  };

  useEffect(() => {
    const fetchConsultantsAndSlots = async () => {
      try {
        setLoading(true);
        const [consultantData, slotTimeData] = await Promise.all([
          getAllConsultantsApi(),
          getAllSlotTimeApi(),
        ]);
        setConsultants(consultantData);
        // Đếm số slot booked cho từng consultant
        const bookedCountMap: Record<string, number> = {};
        (slotTimeData as SlotTime[]).forEach((slot) => {
          if (slot.status === 'booked' && slot.consultant_id) {
            bookedCountMap[slot.consultant_id] = (bookedCountMap[slot.consultant_id] || 0) + 1;
          }
        });
        // Sắp xếp consultant theo số slot booked giảm dần
        const sortedConsultants = [...consultantData].sort((a, b) => {
          const countA = bookedCountMap[a._id] || 0;
          const countB = bookedCountMap[b._id] || 0;
          return countB - countA;
        });
        setFeaturedConsultants(sortedConsultants.slice(0, 3));
        setError(null);
      } catch (err) {
        setError('Không thể tải danh sách chuyên gia. Vui lòng thử lại sau.');
        console.error('Error fetching consultants or slot times:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConsultantsAndSlots();
  }, []);

  // Phân trang
  const totalPage = Math.ceil(consultants.length / pageSize);
  const pagedConsultants = consultants.slice((page - 1) * pageSize, page * pageSize);

  // Lọc consultant theo searchTerm
  const filteredConsultants = pagedConsultants.filter(c =>
    c.accountId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.accountId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div>
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <div className="text-xl">Đang tải dữ liệu...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <div className="text-xl text-red-600">{error}</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="relative min-h-screen bg-[#DBE8FA]"
    >
      <Header />
      
      {/* Phần giới thiệu tư vấn viên - giống như phần dịch vụ */}
      <motion.div 
        variants={sectionVariants}
        className="bg-white rounded-3xl shadow-lg mx-4 md:mx-auto max-w-7xl my-10"
      >
        <div className="p-8 md:p-12 flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Column 1: Text */}
          <div className="w-full md:w-1/2">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold text-gray-800"
            >
              <span className="whitespace-nowrap">Đội ngũ chuyên gia tư vấn</span>
              <span className="block text-sky-500 mt-2">tâm lý chuyên nghiệp</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-lg text-gray-700 my-6"
            >
              Chúng tôi quy tụ đội ngũ chuyên gia tư vấn tâm lý giàu kinh nghiệm 
              và tận tâm, luôn sẵn sàng đồng hành và hỗ trợ bạn vượt qua các 
              thách thức về sức khỏe tinh thần.
            </motion.p>
            
            <div className="space-y-5 mb-8">
              <motion.div 
                variants={itemVariants}
                whileHover={{ x: 5 }}
                className="flex items-center gap-4 bg-white/80 p-4 rounded-2xl shadow-sm"
              >
                <motion.div 
                  variants={featureIconVariants}
                  whileHover="hover"
                  className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0"
                >
                  <FaUserMd className="text-sky-600 text-xl" />
                </motion.div>
                <div>
                  <h3 className="font-medium text-gray-800 text-lg">Chuyên môn cao</h3>
                  <p className="text-gray-600">Các chuyên gia được đào tạo bài bản với nhiều năm kinh nghiệm</p>
                </div>
              </motion.div>
              
              <motion.div 
                variants={itemVariants}
                whileHover={{ x: 5 }}
                className="flex items-center gap-4 bg-white/80 p-4 rounded-2xl shadow-sm"
              >
                <motion.div 
                  variants={featureIconVariants}
                  whileHover="hover"
                  className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0"
                >
                  <FaRegCalendarAlt className="text-sky-600 text-xl" />
                </motion.div>
                <div>
                  <h3 className="font-medium text-gray-800 text-lg">Tư vấn tận tâm</h3>
                  <p className="text-gray-600">Lắng nghe và đồng hành cùng bạn trong toàn bộ quá trình</p>
                </div>
              </motion.div>
              
              <motion.div 
                variants={itemVariants}
                whileHover={{ x: 5 }}
                className="flex items-center gap-4 bg-white/80 p-4 rounded-2xl shadow-sm"
              >
                <motion.div 
                  variants={featureIconVariants}
                  whileHover="hover"
                  className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0"
                >
                  <FaMoneyBillWave className="text-sky-600 text-xl" />
                </motion.div>
                <div>
                  <h3 className="font-medium text-gray-800 text-lg">Phương pháp hiệu quả</h3>
                  <p className="text-gray-600">Áp dụng các kỹ thuật tư vấn tiên tiến và phù hợp cá nhân</p>
                </div>
              </motion.div>
            </div>
            
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              whileHover={{ scale: 1.05, backgroundColor: "#2563EB" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.scrollTo({top: 800, behavior: 'smooth'})}
              className="bg-sky-600 hover:bg-sky-700 text-white font-medium px-8 py-4 rounded-full transition-all shadow-md hover:shadow-lg text-lg w-auto"
            >
              Chọn cho bạn một tư vấn viên phù hợp ngay
            </motion.button>
          </div>
          
          {/* Column 2: Image */}
          <div className="w-full md:w-1/2 flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ 
                duration: 0.8,
                type: "spring",
                stiffness: 100
              }}
              className="relative w-full max-w-lg"
            >
              <img 
                src={consultantImg} 
                alt="Tư vấn tâm lý" 
                className="w-full h-auto object-contain"
              />
              {/* Decorative elements */}
              <motion.div 
                animate={{ 
                  opacity: [0.4, 0.6, 0.4],
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  repeat: Infinity,
                  duration: 4,
                  ease: "easeInOut"
                }}
                className="absolute -top-4 -right-4 w-24 h-24 bg-cyan-100 rounded-full opacity-30 blur-2xl"
              />
              <motion.div 
                animate={{ 
                  opacity: [0.4, 0.7, 0.4],
                  scale: [1, 1.2, 1],
                }}
                transition={{ 
                  repeat: Infinity,
                  duration: 5,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-100 rounded-full opacity-30 blur-2xl"
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
      
      {/* Section tiêu biểu */}
      <motion.div 
        variants={sectionVariants}
        className="max-w-7xl mx-auto px-4 py-12 relative z-10"
      >
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.7 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-3xl font-bold text-[#283593] mb-8 text-center"
        >
          Chuyên gia tiêu biểu
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {featuredConsultants.map((consultant, idx) => {
            const startYear = consultant.startDateofWork ? new Date(consultant.startDateofWork).getFullYear() : null;
            const currentYear = new Date().getFullYear();
            const experience = startYear && !isNaN(startYear) ? currentYear - startYear : null;
            return (
              consultant.accountId ? (
                <motion.div
                  key={consultant._id}
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, delay: idx * 0.15, ease: 'easeOut' }}
                  whileHover={{ 
                    scale: 1.03, 
                    boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)",
                    borderColor: "#3a4bb3"
                  }}
                  className="bg-white rounded-3xl border border-[#DBE8FA] shadow p-9 flex flex-col h-full items-center transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:border-[#3a4bb3] cursor-pointer"
                >
                  <div className="flex flex-col flex-grow items-center w-full">
                    <img 
                      src={consultant.accountId.photoUrl || 'https://via.placeholder.com/150'} 
                      alt={consultant.accountId.fullName || 'Chuyên gia'} 
                      className="w-24 h-24 rounded-full object-cover border-4 border-[#DBE8FA] shadow mb-6" 
                    />
                    <h3 className="text-2xl font-bold text-[#283593] mb-1 text-center">{consultant.accountId.fullName || 'Chuyên gia'}</h3>
                    <div className="flex items-center gap-2 text-[15px] font-medium text-[#5C6BC0] mb-2 text-center">
                      <FaUserTie className="inline-block text-[#5C6BC0] text-base" />
                      <span>Chuyên gia tư vấn</span>
                    </div>
                    <div className="text-gray-500 text-center mb-2 line-clamp-2 leading-relaxed">{consultant.introduction}</div>
                    <div className="text-sm text-gray-600 mt-2 text-center">
                      Số năm làm việc: {experience !== null && experience >= 0 ? `${experience} năm` : 'Chưa cập nhật'}
                    </div>
                    <div className="mt-auto w-full flex items-center gap-2 text-gray-400 text-xs text-center justify-center">
                      <FaEnvelope className="inline-block text-gray-400 text-sm" />
                      <span>Liên hệ: {consultant.accountId.email || 'Không có email'}</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-6 px-8 py-3 rounded-full bg-[#283593] text-white font-semibold shadow hover:bg-[#3a4bb3] transition text-base tracking-wide flex items-center gap-2"
                    onClick={() => handleBookAppointment(consultant._id)}
                  >
                    <FaCalendarAlt className="inline-block text-white text-lg mb-0.5" />
                    Đặt lịch
                  </motion.button>
                </motion.div>
              ) : (
                <div key={consultant._id} className="bg-red-100 rounded-3xl shadow-xl p-8 flex flex-col items-center h-full">
                  <div className="text-red-600 font-bold">Thiếu thông tin tài khoản cho chuyên gia này</div>
                </div>
              )
            )
          })}
        </div>
      </motion.div>
      {/* Danh sách consultant */}
      <div className="max-w-7xl mx-auto px-4 pb-16 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.7 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-2xl font-bold text-[#283593] mb-6"
        >
          Danh sách chuyên gia
        </motion.h2>
        {/* Thanh tìm kiếm */}
        <div className="flex justify-center mb-8">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              className="w-full py-3 pl-12 pr-4 rounded-full border border-[#DBE8FA] text-[#283593] bg-white shadow-sm focus:outline-none focus:border-[#3a4bb3] text-base"
              placeholder="Tìm kiếm chuyên gia theo tên hoặc email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#DBE8FA] text-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {filteredConsultants.length === 0 ? (
            <div className="col-span-4 text-center text-gray-500 py-12">Không tìm thấy chuyên gia.</div>
          ) : (
            filteredConsultants.map((consultant, idx) => {
              const startYear = consultant.startDateofWork ? new Date(consultant.startDateofWork).getFullYear() : null;
              const currentYear = new Date().getFullYear();
              const experience = startYear && !isNaN(startYear) ? currentYear - startYear : null;
              return (
                consultant.accountId ? (
                  <motion.div
                    key={consultant._id}
                    initial={{ opacity: 0, y: 60 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, delay: idx * 0.08, ease: 'easeOut' }}
                    className="bg-white rounded-2xl border border-[#DBE8FA] shadow p-7 flex flex-col h-full items-center transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:border-[#3a4bb3] cursor-pointer"
                  > 
                    <div className="flex flex-col flex-grow items-center w-full">
                      <img
                        src={consultant.accountId.photoUrl || 'https://via.placeholder.com/150'}
                        alt={consultant.accountId.fullName || 'Chuyên gia'}
                        className="w-20 h-20 rounded-full object-cover border-4 border-[#DBE8FA] shadow mb-4"
                      />
                      <h3 className="text-lg font-bold text-[#283593] mb-1 text-center">{consultant.accountId.fullName || 'Chuyên gia'}</h3>
                      <div className="flex items-center gap-2 text-[14px] font-medium text-[#5C6BC0] mb-2 text-center">
                        <FaUserTie className="inline-block text-[#5C6BC0] text-base" />
                        <span>Chuyên gia tư vấn</span>
                      </div>
                      <div className="text-gray-500 text-center mb-2 line-clamp-2 leading-relaxed">{consultant.introduction}</div>
                      <div className="text-sm text-gray-600 mt-2 text-center">
                        Số năm làm việc: {experience !== null && experience >= 0 ? `${experience} năm` : 'Chưa cập nhật'}
                      </div>
                      <div className="mt-auto w-full flex items-center gap-2 text-gray-400 text-xs text-center justify-center">
                        <FaEnvelope className="inline-block text-gray-400 text-sm" />
                        <span>{consultant.accountId.email || 'Không có email'}</span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.98 }}
                      className="mt-6 px-7 py-2.5 rounded-full bg-[#283593] text-white font-semibold shadow hover:bg-[#3a4bb3] transition text-base tracking-wide flex items-center gap-2"
                      onClick={() => handleBookAppointment(consultant._id)}
                    >
                      <FaCalendarAlt className="inline-block text-white text-lg mb-0.5" />
                      Đặt lịch
                    </motion.button>
                  </motion.div>
                ) : (
                  <div key={consultant._id} className="bg-red-100 rounded-2xl shadow p-6 flex flex-col items-center h-full">
                    <div className="text-red-600 font-bold">Thiếu thông tin tài khoản cho chuyên gia này</div>
                  </div>
                )
              )
            })
          )}
        </div>
        {/* Pagination */}
        {totalPage > 1 && (
          <div className="flex justify-center mt-10 gap-2">
            {Array.from({ length: totalPage }, (_, i) => (
              <button
                key={i}
                className={`w-10 h-10 rounded-full font-bold border-2 ${page === i + 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200'} hover:bg-blue-100 transition`}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </motion.div>
  );
}

export default ConsultingPage;
