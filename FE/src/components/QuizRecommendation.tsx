import React, { useEffect, useState } from 'react';
import { getAllBlogsApi, getAllEventsApi, getAllServicesApi } from '../api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Blog {
  _id: string;
  title: string;
  content: string;
  author: string;
  image?: string;
  thumbnail?: string;
  topics?: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EventHome {
  _id: string;
  title: string;
  startDate: string;
  location?: string;
  description?: string;
  image?: string;
}

interface QuizResult {
  resultId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  riskLevel: string;
  riskLevelDescription: string;
  suggestedAction: string;
  shouldSeeConsultant: boolean;
  takenAt: string;
}

interface QuizRecommendationProps {
  quizResult: QuizResult;
}

interface Service {
  _id: string;
  name: string;
  description: string;
  image?: string;
  level?: string;
}

const truncateContent = (content: string, maxLength: number = 120) => {
  // Chuyển đổi line breaks thành spaces để hiển thị preview
  const normalizedContent = content.replace(/\n/g, ' ').replace(/\r/g, ' ');
  const strippedContent = normalizedContent.replace(/<[^>]*>?/gm, '');
  return strippedContent.length > maxLength
    ? strippedContent.substring(0, maxLength) + '...'
    : strippedContent;
};

const QuizRecommendation: React.FC<QuizRecommendationProps> = ({ quizResult }) => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [events, setEvents] = useState<EventHome[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const navigate = useNavigate();

  // Phân tích chi tiết dựa trên kết quả
  const getDetailedAnalysis = () => {
    const { riskLevel, percentage } = quizResult;
    
    switch (riskLevel) {
      case 'low':
        return {
          title: 'Kết quả đánh giá: Nguy cơ thấp',
          riskDescription: `Dựa trên các câu trả lời của bạn hôm nay, điểm số (${percentage}%) nằm trong **phạm vi nguy cơ thấp**.`,
          analysis: `Điểm số trong phạm vi này cho thấy bạn có ý thức tốt về các yếu tố rủi ro và đang duy trì lối sống tích cực. Bạn có khả năng nhận biết và tránh xa các tình huống có thể dẫn đến nghiện.

**Thực trạng tại Việt Nam:** Theo Bộ Y tế, chỉ có 15% dân số Việt Nam duy trì được ý thức phòng ngừa tốt như bạn. Điều này cho thấy bạn đang có những lựa chọn đúng đắn.

**Tác động tích cực:** Lối sống phòng ngừa không chỉ giúp tránh xa các chất gây nghiện mà còn cải thiện sức khỏe tinh thần, tăng cường mối quan hệ xã hội và nâng cao chất lượng cuộc sống tổng thể.`,
          tips: [
            'Tiếp tục duy trì các hoạt động thể thao và sở thích lành mạnh',
            'Chia sẻ kiến thức tích cực với bạn bè và gia đình',
            'Tham gia các hoạt động cộng đồng và tình nguyện',
            'Xây dựng mạng lưới bạn bè tích cực',
            'Học hỏi thêm về kỹ năng quản lý căng thẳng'
          ],
          recommendations: [
            'Trở thành đại sứ truyền thông tích cực trong cộng đồng',
            'Tham gia các chương trình giáo dục phòng chống tệ nạn xã hội',
            'Phát triển kỹ năng lãnh đạo và hỗ trợ người khác'
          ],
          color: 'from-green-500 to-emerald-600',
          icon: '🌟',
          bgColor: 'from-green-50 to-emerald-50',
          riskColor: 'text-green-600 bg-green-100'
        };
      case 'moderate':
        return {
          title: 'Kết quả đánh giá: Nguy cơ trung bình',
          riskDescription: `Dựa trên các câu trả lời của bạn hôm nay, điểm số (${percentage}%) nằm trong **phạm vi nguy cơ trung bình**.`,
          analysis: `Điểm số trong phạm vi này cho thấy có sự gia tăng nguy cơ phát triển các vấn đề liên quan đến chất gây nghiện, khó khăn trong các lĩnh vực khác của cuộc sống (ví dụ: mối quan hệ, công việc) và sự căng thẳng chung.

**Thực trạng cần lưu ý:** Nghiên cứu cho thấy 60% các trường hợp nghiện bắt đầu từ giai đoạn rủi ro trung bình này. Tuy nhiên, đây cũng là thời điểm có thể can thiệp hiệu quả nhất với tỷ lệ thành công lên đến 80%.

**Hiểu về cơ chế:** Não bộ ở giai đoạn này đang bắt đầu có những thay đổi nhỏ trong hệ thống phần thưởng. Việc can thiệp sớm có thể ngăn chặn những thay đổi nghiêm trọng hơn.

**Các yếu tố nguy cơ:** Căng thẳng công việc/học tập, áp lực xã hội, môi trường tiêu cực, thiếu kỹ năng quản lý cảm xúc.`,
          tips: [
            'Có 2-3 ngày trong tuần hoàn toàn không tiếp xúc với các yếu tố nguy cơ',
            'Thử các hoạt động ít có khả năng liên quan đến rủi ro (đi bộ, xem phim, thể thao)',
            'Xây dựng thói quen ăn uống lành mạnh và ngủ đủ giấc',
            'Luân phiên các hoạt động giải trí bằng những lựa chọn an toàn',
            'Theo dõi hành vi của bạn - điều này có thể giúp bạn duy trì đúng hướng',
            'Học các kỹ thuật thư giãn như thiền định, yoga hoặc hít thở sâu'
          ],
          recommendations: [
            'Nói chuyện với bác sĩ hoặc chuyên gia tư vấn về tình trạng hiện tại',
            'Tham gia các nhóm hỗ trợ cộng đồng',
            'Xây dựng kế hoạch quản lý căng thẳng cá nhân',
            'Tìm hiểu về các chương trình phòng ngừa và can thiệp sớm'
          ],
          color: 'from-yellow-500 to-orange-500',
          icon: '⚠️',
          bgColor: 'from-yellow-50 to-orange-50',
          riskColor: 'text-yellow-700 bg-yellow-100'
        };
      case 'high':
        return {
          title: 'Kết quả đánh giá: Nguy cơ cao',
          riskDescription: `Dựa trên các câu trả lời của bạn hôm nay, điểm số (${percentage}%) nằm trong **phạm vi nguy cơ cao**.`,
          analysis: `Điểm số trong phạm vi này cho thấy có nguy cơ đáng kể phát triển các vấn đề sức khỏe dài hạn liên quan đến chất gây nghiện, khó khăn nghiêm trọng trong công việc và mối quan hệ, cũng như tình trạng căng thẳng tâm lý cao.

**Thực trạng khẩn cấp:** Theo WHO, việc can thiệp trong giai đoạn này có thể ngăn ngừa 70-80% trường hợp phát triển thành nghiện nghiêm trọng. Đây là "cửa sổ vàng" để thay đổi.

**Các dấu hiệu cảnh báo:** Thay đổi hành vi đột ngột, suy giảm hiệu suất học tập/công việc, cô lập xã hội, thay đổi nhóm bạn, rối loạn giấc ngủ và ăn uống.

**Tác động não bộ:** Ở giai đoạn này, các vùng não liên quan đến kiểm soát xung động và ra quyết định đang bị ảnh hưởng, nhưng vẫn có thể phục hồi với can thiệp phù hợp.`,
          tips: [
            'Tránh hoàn toàn các tình huống và môi trường có nguy cơ cao',
            'Thông báo ngay với gia đình hoặc người thân tin tưởng',
            'Loại bỏ tất cả các yếu tố kích thích khỏi tầm với',
            'Thiết lập lịch trình hàng ngày có cấu trúc và ý nghĩa',
            'Tham gia ngay các hoạt động thay thế tích cực',
            'Học kỹ năng từ chối và quản lý áp lực đồng trang lứa',
            'Xây dựng hệ thống hỗ trợ khẩn cấp (số điện thoại, địa chỉ)'
          ],
          recommendations: [
            'Tìm kiếm ngay sự hỗ trợ từ các chuyên gia tâm lý hoặc bác sĩ',
            'Tham gia các chương trình can thiệp sớm',
            'Xem xét liệu pháp tâm lý nhận thức hành vi (CBT)',
            'Tham gia nhóm hỗ trợ có giám sát chuyên môn',
            'Đánh giá và điều chỉnh môi trường sống, học tập, làm việc'
          ],
          color: 'from-orange-500 to-red-500',
          icon: '🚨',
          bgColor: 'from-orange-50 to-red-50',
          riskColor: 'text-orange-700 bg-orange-100'
        };
      case 'critical':
        return {
          title: 'Kết quả đánh giá: Nguy cơ rất cao',
          riskDescription: `Dựa trên các câu trả lời của bạn hôm nay, điểm số (${percentage}%) nằm trong **phạm vi nguy cơ rất cao**.`,
          analysis: `Điểm số trong phạm vi này cho thấy nguy cơ rất cao phát triển các vấn đề sức khỏe nghiêm trọng, suy giảm chức năng xã hội đáng kể, và có thể đã xuất hiện các dấu hiệu của rối loạn sử dụng chất.

**Tình trạng khẩn cấp:** Đây là giai đoạn cần can thiệp y tế ngay lập tức. Não bộ đã có những thay đổi đáng kể về cấu trúc và chức năng, đặc biệt ở vùng kiểm soát xung động.

**Hy vọng phục hồi:** Mặc dù nghiêm trọng, não bộ vẫn có khả năng phục hồi đáng kinh ngạc (neuroplasticity). Hàng triệu người đã vượt qua giai đoạn này và có cuộc sống hạnh phúc.

**Các phương pháp điều trị hiện đại:**
- Điều trị y khoa: Thuốc giảm cơn thèm và triệu chứng cai
- Trị liệu tâm lý: CBT, DBT, liệu pháp động lực
- Hỗ trợ xã hội: Nhóm tự giúp, tư vấn gia đình
- Phương pháp tổng hợp: Kết hợp đa ngành cho hiệu quả tối ưu`,
          tips: [
            'Liên hệ ngay với đường dây nóng hỗ trợ 24/7',
            'Thông báo tình trạng khẩn cấp với gia đình',
            'Đến ngay cơ sở y tế gần nhất để đánh giá',
            'Loại bỏ hoàn toàn các chất gây nghiện khỏi môi trường',
            'Không ở một mình trong giai đoạn này',
            'Tuân thủ nghiêm ngặt hướng dẫn của chuyên gia y tế'
          ],
          recommendations: [
            'Chương trình cai nghiện nội trú có giám sát y tế',
            'Đánh giá tâm thần học toàn diện',
            'Lập kế hoạch điều trị cá nhân hóa dài hạn',
            'Hỗ trợ gia đình và tư vấn hệ thống',
            'Theo dõi y tế định kỳ và xét nghiệm',
            'Chuẩn bị cho quá trình phục hồi dài hạn'
          ],
          color: 'from-red-500 to-red-700',
          icon: '🆘',
          bgColor: 'from-red-50 to-red-100',
          riskColor: 'text-red-700 bg-red-100'
        };
      default:
        return {
          title: 'Kết quả đánh giá',
          riskDescription: 'Cảm ơn bạn đã tham gia đánh giá.',
          analysis: 'Kết quả sẽ giúp bạn hiểu rõ hơn về tình trạng hiện tại của mình.',
          tips: ['Tìm hiểu thêm về các biện pháp phòng ngừa và bảo vệ sức khỏe.'],
          recommendations: ['Tham khảo ý kiến chuyên gia khi cần thiết.'],
          color: 'from-sky-500 to-sky-600',
          icon: '',
          bgColor: 'from-sky-50 to-sky-100',
          riskColor: 'text-sky-700 bg-sky-100'
        };
    }
  };

  // Lấy blog và event phù hợp
  const getRelevantContent = () => {
    const { riskLevel } = quizResult;
    
    switch (riskLevel) {
      case 'low':
        return {
          blogKeywords: ['phòng ngừa', 'lối sống lành mạnh', 'tích cực'],
          eventTypes: ['giáo dục', 'tuyên truyền', 'thể thao'],
          blogTitle: 'Bài viết về lối sống tích cực',
          eventTitle: 'Sự kiện giáo dục và tuyên truyền'
        };
      case 'moderate':
        return {
          blogKeywords: ['cảnh báo', 'phòng ngừa', 'nhận biết'],
          eventTypes: ['hướng dẫn', 'tư vấn', 'giáo dục'],
          blogTitle: 'Kiến thức phòng ngừa cần biết',
          eventTitle: 'Hoạt động tư vấn và hướng dẫn'
        };
      case 'high':
      case 'critical':
        return {
          blogKeywords: ['hỗ trợ', 'can thiệp', 'điều trị'],
          eventTypes: ['tư vấn', 'hỗ trợ', 'điều trị'],
          blogTitle: 'Thông tin hỗ trợ và can thiệp',
          eventTitle: 'Dịch vụ tư vấn và hỗ trợ'
        };
      default:
        return {
          blogKeywords: ['tổng quát'],
          eventTypes: ['tổng quát'],
          blogTitle: 'Bài viết hữu ích',
          eventTitle: 'Sự kiện quan trọng'
        };
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setLoadingServices(true);
      try {
        // Lấy blog mới nhất
        const allBlogs = await getAllBlogsApi();
        const publishedBlogs = allBlogs
          .filter((blog: Blog) => blog.published)
          .sort((a: Blog, b: Blog) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 4);
        setBlogs(publishedBlogs);

        // Lấy event mới nhất
        const allEvents = await getAllEventsApi();
        const sortedEvents = Array.isArray(allEvents)
          ? allEvents.sort((a: EventHome, b: EventHome) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).slice(0, 4)
          : [];
        setEvents(sortedEvents);

        // Lấy danh sách dịch vụ
        const allServices = await getAllServicesApi();
        setServices(allServices);
      } catch {
        // Không hiển thị lỗi để không làm gián đoạn UX
      } finally {
        setLoading(false);
        setLoadingServices(false);
      }
    };
    fetchData();
  }, []);

  const analysis = getDetailedAnalysis();
  const content = getRelevantContent();

  // Lọc dịch vụ phù hợp
  const matchedServices = services.filter(s => s.level === quizResult.riskLevel);
  const fallbackServices = services.filter(s => !s.level);
  const recommendedServices = matchedServices.length > 0 ? matchedServices : fallbackServices;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="mt-12 space-y-8"
    >
      {/* Professional Analysis Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          📋 Báo cáo phân tích cá nhân
        </h2>
        <p className="text-gray-600">
          Dành thời gian đọc kết quả của bạn, dựa trên cách bạn trả lời các câu hỏi hôm nay.
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Thông tin sau đây dựa trên dữ liệu và hướng dẫn dành cho dân số Việt Nam. 
          Chúng tôi khuyến nghị bạn tìm kiếm lời khuyên cụ thể và nói chuyện với chuyên gia y tế.
        </p>
      </div>

      {/* Risk Assessment */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200"
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">{analysis.icon}</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">{analysis.title}</h3>
        </div>
        
        <div className="mb-6">
          <div className="prose prose-gray max-w-none leading-relaxed text-gray-700">
            {analysis.riskDescription.split('\n').map((paragraph, index) => {
              if (paragraph.trim() === '') return null;
              if (paragraph.includes('**')) {
                const parts = paragraph.split('**');
                return (
                  <p key={index} className="mb-4">
                    {parts.map((part, partIndex) => 
                      partIndex % 2 === 1 ? 
                        <strong key={partIndex} className="font-bold text-gray-900">{part}</strong> : 
                        part
                    )}
                  </p>
                );
              }
              return <p key={index} className="mb-4">{paragraph}</p>;
            })}
          </div>
        </div>

        {/* Risk Level Indicator */}
        <div className="text-center mb-6">
          <div className="text-6xl font-bold text-blue-600 mb-2">
            {quizResult.percentage}<span className="text-2xl">%</span>
          </div>
          <span className={`inline-block px-6 py-2 rounded-full text-sm font-semibold ${analysis.riskColor}`}>
            {analysis.title.replace('Kết quả đánh giá: ', '')}
          </span>
        </div>

        {/* Detailed Analysis */}
        <div className="bg-gray-50 rounded-2xl p-6">
          <div className="prose prose-gray max-w-none leading-relaxed text-gray-700">
            {analysis.analysis.split('\n').map((paragraph, index) => {
              if (paragraph.trim() === '') return null;
              if (paragraph.includes('**')) {
                const parts = paragraph.split('**');
                return (
                  <p key={index} className="mb-4">
                    {parts.map((part, partIndex) => 
                      partIndex % 2 === 1 ? 
                        <strong key={partIndex} className="font-bold text-gray-900">{part}</strong> : 
                        part
                    )}
                  </p>
                );
              }
              if (paragraph.trim().startsWith('-')) {
                return (
                  <li key={index} className="ml-4 mb-2 text-gray-700">
                    {paragraph.replace(/^-\s*/, '')}
                  </li>
                );
              }
              return <p key={index} className="mb-4">{paragraph}</p>;
            })}
          </div>
        </div>
      </motion.div>

      {/* Tips and Information */}
      <motion.div
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-3xl p-8 shadow-xl border border-blue-100"
      >
        <h3 className="text-2xl font-bold text-blue-700 mb-6 flex items-center">
          <span className="text-3xl mr-3">💡</span>
          Mẹo và thông tin hữu ích
        </h3>
        
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Bạn có thể làm gì?</h4>
          <p className="text-gray-600 mb-4">
            Chúng tôi ở đây để giúp bạn! Nhiều người khác đã đi trước bạn trong hành trình này và 
            thật hữu ích khi biết cách họ vượt qua. Dưới đây là một số mẹo nhanh bạn có thể bắt đầu:
          </p>
          <div className="space-y-3">
            {analysis.tips.map((tip, index) => (
              <div key={index} className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                <span className="text-gray-700">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contact - for high/critical risk */}
        {(quizResult.riskLevel === 'high' || quizResult.riskLevel === 'critical') && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
            <h4 className="text-lg font-bold text-red-800 mb-3 flex items-center">
              <span className="text-2xl mr-2">🚨</span>
              Liên hệ khẩn cấp
            </h4>
            <div className="space-y-2 text-red-700">
              <p><strong>Đường dây nóng:</strong> 1900 2017 (24/7)</p>
              <p><strong>Trung tâm Cai nghiện:</strong> 0243 826 2888</p>
              <p><strong>Tư vấn tâm lý:</strong> 1900 1567</p>
            </div>
          </div>
        )}

        <p className="text-gray-500 text-sm">
          Chúng tôi khuyến nghị bạn nói chuyện với bác sĩ trước khi thực hiện bất kỳ thay đổi đáng kể nào.
        </p>
      </motion.div>

      {/* Service Recommendations */}
      <motion.div
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200"
      >
        <h3 className="text-2xl font-bold text-slate-800 mb-6">
          Khuyến nghị dịch vụ
        </h3>
        
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Bước tiếp theo: Thay đổi để có cuộc sống tốt hơn</h4>
          <p className="text-gray-600 mb-4">
            Dựa trên câu trả lời của bạn, bạn có thể cân nhắc các lựa chọn sau:
          </p>
          <div className="space-y-3">
            {analysis.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start">
                <span className="inline-block w-2 h-2 bg-sky-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                <span className="text-slate-700">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Content Recommendations */}
      <motion.div
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-3xl p-8 shadow-xl border border-sky-200 mb-8"
      >
        <h3 className="text-2xl font-bold text-sky-800 mb-6">Dịch vụ phù hợp với bạn</h3>
        {loadingServices ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-sky-600"></div>
          </div>
        ) : recommendedServices.length === 0 ? (
          <div className="text-gray-500 text-center">Không tìm thấy dịch vụ phù hợp.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {recommendedServices.map(service => (
              <div
                key={service._id}
                className="flex bg-sky-50 rounded-xl p-4 cursor-pointer hover:bg-sky-100 transition-all border border-sky-100 shadow-sm"
                onClick={() => navigate(`/service?id=${service._id}`)}
              >
                <img
                  src={service.image || '/logo.png'}
                  alt={service.name}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                />
                <div className="ml-4 flex-1">
                  <div className="font-semibold text-sky-800 line-clamp-1 text-base">{service.name}</div>
                  <div className="text-gray-600 text-sm line-clamp-2 mt-1">{service.description}</div>
                  {service.level && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-700 border border-sky-200">
                      Mức độ: {service.level === 'low' ? 'Thấp' : service.level === 'moderate' ? 'Trung bình' : service.level === 'high' ? 'Cao' : service.level === 'critical' ? 'Nghiêm trọng' : 'Phù hợp với tất cả'}
                    </span>
                  )}
                  {!service.level && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                      Phù hợp với tất cả mọi người
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Blog Section */}
        <motion.div
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-3xl shadow-xl p-6 border border-slate-200"
        >
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {content.blogTitle}
            </h3>
            <p className="text-gray-600 text-sm">Tìm hiểu thêm kiến thức hữu ích qua các bài viết chuyên môn</p>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-sky-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {blogs.slice(0, 3).map((blog) => (
                <motion.div
                  key={blog._id}
                  whileHover={{ scale: 1.02, x: 4 }}
                  className="flex bg-slate-50 rounded-xl p-4 cursor-pointer hover:bg-slate-100 transition-all"
                  onClick={() => navigate(`/blogs/${blog._id}`)}
                >
                  <img
                    src={blog.image || blog.thumbnail || 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a'}
                    alt={blog.title}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="ml-4 flex-1">
                    <div className="font-semibold text-slate-800 line-clamp-1 text-sm">{blog.title}</div>
                    <div className="text-gray-600 text-xs line-clamp-2 mt-1">{truncateContent(blog.content, 60)}</div>
                  </div>
                </motion.div>
              ))}
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/blogs')}
                className="w-full bg-sky-600 text-white py-2 rounded-xl font-medium hover:bg-sky-700 transition-all text-sm"
              >
                Xem tất cả bài viết
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Event Section */}
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-3xl shadow-xl p-6 border border-slate-200"
        >
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {content.eventTitle}
            </h3>
            <p className="text-gray-600 text-sm">Tham gia các hoạt động để nâng cao nhận thức và kỹ năng</p>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-sky-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {events.slice(0, 3).map((event) => (
                <motion.div
                  key={event._id}
                  whileHover={{ scale: 1.02, x: 4 }}
                  className="flex bg-slate-50 rounded-xl p-4 cursor-pointer hover:bg-slate-100 transition-all"
                  onClick={() => navigate(`/events/${event._id}`)}
                >
                  <img
                    src={event.image || 'https://images.unsplash.com/photo-1464983953574-0892a716854b'}
                    alt={event.title}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="ml-4 flex-1">
                    <div className="font-semibold text-slate-800 line-clamp-1 text-sm">{event.title}</div>
                    <div className="text-gray-600 text-xs line-clamp-2 mt-1">
                      {event.description || 'Sự kiện hấp dẫn đang chờ bạn tham gia!'}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/events')}
                className="w-full bg-sky-600 text-white py-2 rounded-xl font-medium hover:bg-sky-700 transition-all text-sm"
              >
                Khám phá sự kiện
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Professional Disclaimer */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center"
      >
        <h4 className="font-bold text-gray-800 mb-3">TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM</h4>
        <p className="text-gray-600 text-sm leading-relaxed">
          Mặc dù chúng tôi nỗ lực cung cấp thông tin chính xác và hữu ích, thông tin này không nhằm 
          thay thế lời khuyên y tế chuyên nghiệp và không nên được dựa vào hoàn toàn như lời khuyên 
          sức khỏe hoặc cá nhân. Luôn tìm kiếm sự hướng dẫn của bác sĩ hoặc chuyên gia y tế có trình 
          độ khác với bất kỳ câu hỏi nào bạn có thể có về sức khỏe của mình hoặc tình trạng y tế.
        </p>
        <p className="text-gray-500 text-xs mt-3">
          <strong>NẾU BẠN CẦN HỖ TRỢ NGAY LẬP TỨC, VUI LÒNG LIÊN HỆ ĐƯỜNG DÂY NÓNG.</strong>
        </p>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-3xl p-8 text-center shadow-xl border border-gray-200"
      >
        <h3 className="text-2xl font-bold mb-4 text-slate-800">Hành trình của bạn không dừng lại ở đây</h3>
        <p className="text-lg mb-6 text-gray-600">
          Tiếp tục khám phá và học hỏi cùng chúng tôi. Mỗi bước đi đều quan trọng trong hành trình phòng chống tệ nạn xã hội.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/consulting')}
            className="bg-white text-sky-700 px-6 py-3 rounded-xl font-semibold hover:bg-sky-50 transition-all border border-sky-200 shadow-md"
          >
            Tư vấn chuyên môn
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/service')}
            className="bg-sky-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-sky-700 transition-all shadow-md"
          >
            Dịch vụ hỗ trợ
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuizRecommendation; 