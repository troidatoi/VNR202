import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MemoryGame from "../components/MemoryGame";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAllBlogsApi } from "../api";
import { motion } from "framer-motion";
import bgHome from "../assets/background.png";
import card1 from "../assets/card1.png";
import card2 from "../assets/card2.png";
import card3 from "../assets/card3.png";
import card4 from "../assets/card4.png";

// Triết lý và trích dẫn về Quyền con người
const philosophyQuotes = [
  {
    quote: "Tất cả con người đều được tự do và bình đẳng về nhân phẩm và quyền lợi.",
    author: "Tuyên ngôn Nhân quyền Quốc tế",
    context: "Điều 1 - Tuyên ngôn Nhân quyền Quốc tế 1948"
  },
  {
    quote: "Quyền con người là những quyền cơ bản mà mọi người đều có được, bất kể quốc tịch, giới tính, chủng tộc, ngôn ngữ hay tôn giáo.",
    author: "Liên Hợp Quốc",
    context: "Tuyên ngôn Nhân quyền Quốc tế"
  },
  {
    quote: "Trong xã hội chủ nghĩa, quyền cá nhân gắn liền với lợi ích của tập thể và xã hội.",
    author: "Tư tưởng Mác-Lênin",
    context: "Quan điểm XHCN về quyền con người"
  },
  {
    quote: "Mọi người đều có quyền được sống, tự do và an toàn.",
    author: "Tuyên ngôn Nhân quyền Quốc tế",
    context: "Điều 3 - Tuyên ngôn Nhân quyền 1948"
  }
];

// Nội dung về Quyền con người trong XHCN (Chương 4)
const humanRightsContent = {
  title: "Quyền con người trong Xã hội chủ nghĩa",
  subtitle: "Chương 4: Dân chủ XHCN và Nhà nước XHCN",
  principles: [
    {
      title: "Quyền chính trị",
      description: "Quyền tham gia quản lý nhà nước và xã hội, quyền bầu cử, quyền tự do ngôn luận.",
      detail: "Quyền tham gia quản lý nhà nước và xã hội, quyền bầu cử, quyền tự do ngôn luận.",
      icon: "🏛️",
      color: "from-amber-600 to-amber-800",
      examples: ["Quyền bầu cử", "Quyền tham gia quản lý nhà nước", "Quyền tự do ngôn luận"]
    },
    {
      title: "Quyền kinh tế",
      description: "Quyền lao động, quyền sở hữu tài sản, quyền tự do kinh doanh trong khuôn khổ pháp luật.",
      detail: "Quyền lao động, quyền sở hữu tài sản, quyền tự do kinh doanh trong khuôn khổ pháp luật.",
      icon: "💼",
      color: "from-green-500 to-green-700",
      examples: ["Quyền lao động", "Quyền sở hữu tài sản", "Quyền tự do kinh doanh"]
    },
    {
      title: "Quyền xã hội",
      description: "Quyền được giáo dục, quyền chăm sóc sức khỏe, quyền an sinh xã hội.",
      detail: "Quyền được giáo dục, quyền chăm sóc sức khỏe, quyền an sinh xã hội.",
      icon: "🏥",
      color: "from-amber-500 to-amber-700",
      examples: ["Quyền giáo dục", "Quyền chăm sóc sức khỏe", "Quyền an sinh xã hội"]
    },
    {
      title: "Quyền văn hóa",
      description: "Quyền sáng tạo, quyền hưởng thụ văn hóa, quyền tự do tôn giáo.",
      detail: "Quyền sáng tạo, quyền hưởng thụ văn hóa, quyền tự do tôn giáo.",
      icon: "🎨",
      color: "from-purple-500 to-purple-700",
      examples: ["Quyền sáng tạo", "Quyền hưởng thụ văn hóa", "Quyền tự do tôn giáo"]
    }
  ],
  features: [
    {
      title: "Quan điểm XHCN",
      description: "Quyền cá nhân gắn với lợi ích xã hội, đề cao bình đẳng và công bằng xã hội.",
      icon: "⚖️"
    },
    {
      title: "Vai trò Nhà nước",
      description: "Nhà nước bảo vệ và ban hành pháp luật để đảm bảo quyền con người.",
      icon: "🏛️"
    },
    {
      title: "Quyền con người tại Việt Nam",
      description: "Hiến pháp và pháp luật Việt Nam bảo vệ đầy đủ quyền con người theo chuẩn quốc tế.",
      icon: "🇻🇳"
    }
  ]
};

// Bộ câu hỏi trắc nghiệm về Quyền con người
const principleQuizzes = [
  {
    principle: 0,
    title: "Quyền chính trị",
    detail: "Quyền tham gia quản lý nhà nước và xã hội, quyền bầu cử, quyền tự do ngôn luận.",
    detailedContent: {
      introduction: "Quyền chính trị là nền tảng của dân chủ, cho phép công dân tham gia vào quá trình ra quyết định.",
      characteristics: [
        "Quyền bầu cử và ứng cử",
        "Quyền tham gia quản lý nhà nước",
        "Quyền tự do ngôn luận",
        "Quyền lập hội"
      ],
      mechanism: "Công dân tham gia vào các hoạt động chính trị thông qua bầu cử, biểu tình hợp pháp, và các tổ chức chính trị."
    },
    examples: [
      {
        title: "Quyền bầu cử",
        content: "Công dân từ 18 tuổi trở lên có quyền bầu cử đại biểu Quốc hội và Hội đồng nhân dân các cấp.",
        visual: "🗳️"
      },
      {
        title: "Quyền tham gia quản lý",
        content: "Công dân có quyền tham gia thảo luận các vấn đề chung của cộng đồng, đóng góp ý kiến cho hoạt động của cơ quan nhà nước.",
        visual: "📢"
      }
    ],
    questions: [
      {
        question: "Quyền chính trị cơ bản nào cho phép công dân tham gia bầu cử?",
        options: [
          "Quyền tự do ngôn luận",
          "Quyền bầu cử",
          "Quyền sở hữu tài sản",
          "Quyền giáo dục"
        ],
        correct: 1,
        explanation: "Quyền bầu cử là quyền chính trị cơ bản, cho phép công dân tham gia vào quá trình bầu ra đại biểu đại diện cho mình."
      },
      {
        question: "Theo quan điểm XHCN, quyền chính trị gắn liền với điều gì?",
        options: [
          "Quyền lợi cá nhân",
          "Lợi ích tập thể và xã hội",
          "Quyền lực kinh tế",
          "Quyền tự do tuyệt đối"
        ],
        correct: 1,
        explanation: "Trong XHCN, quyền cá nhân gắn liền với lợi ích của tập thể và xã hội."
      },
      {
        question: "Quyền tự do ngôn luận trong XHCN được thực hiện theo cách nào?",
        options: [
          "Tự do tuyệt đối",
          "Trong khuôn khổ pháp luật",
          "Không có giới hạn",
          "Chỉ trong gia đình"
        ],
        correct: 1,
        explanation: "Quyền tự do ngôn luận được thực hiện trong khuôn khổ pháp luật, đảm bảo trật tự xã hội."
      },
      {
        question: "Ai có quyền bầu cử tại Việt Nam?",
        options: [
          "Tất cả công dân từ 18 tuổi trở lên",
          "Chỉ người trưởng thành có thu nhập",
          "Chỉ người có học vấn cao",
          "Chỉ người có tài sản"
        ],
        correct: 0,
        explanation: "Tất cả công dân Việt Nam từ 18 tuổi trở lên đều có quyền bầu cử, không phân biệt giới tính, dân tộc, tôn giáo."
      },
      {
        question: "Quyền tham gia quản lý nhà nước bao gồm những gì?",
        options: [
          "Chỉ quyền bầu cử",
          "Quyền đóng góp ý kiến, tham gia thảo luận các vấn đề chung",
          "Chỉ quyền biểu tình",
          "Chỉ quyền thành lập đảng"
        ],
        correct: 1,
        explanation: "Quyền tham gia quản lý nhà nước bao gồm nhiều hình thức như bầu cử, đóng góp ý kiến, tham gia thảo luận."
      }
    ]
  },
  {
    principle: 1,
    title: "Quyền kinh tế",
    detail: "Quyền lao động, quyền sở hữu tài sản, quyền tự do kinh doanh trong khuôn khổ pháp luật.",
    detailedContent: {
      introduction: "Quyền kinh tế đảm bảo cho con người có khả năng tự nuôi sống bản thân và gia đình.",
      characteristics: [
        "Quyền lao động và lựa chọn nghề nghiệp",
        "Quyền sở hữu tài sản hợp pháp",
        "Quyền tự do kinh doanh",
        "Quyền được trả công công bằng"
      ],
      mechanism: "Nhà nước tạo điều kiện cho người lao động có việc làm, bảo vệ quyền lợi người lao động."
    },
    examples: [
      {
        title: "Quyền lao động",
        content: "Người lao động có quyền làm việc, lựa chọn nghề nghiệp, hưởng lương công bằng và an toàn lao động.",
        visual: "👷"
      },
      {
        title: "Quyền sở hữu tài sản",
        content: "Tài sản hợp pháp của cá nhân được pháp luật bảo vệ, không ai bị tước đoạt tài sản một cách bất hợp pháp.",
        visual: "🏠"
      }
    ],
    questions: [
      {
        question: "Quyền lao động cơ bản bao gồm những gì?",
        options: [
          "Chỉ quyền được làm việc",
          "Quyền được trả lương công bằng, an toàn lao động, nghỉ ngơi",
          "Chỉ quyền chọn nơi làm việc",
          "Chỉ quyền nghỉ việc"
        ],
        correct: 1,
        explanation: "Quyền lao động toàn diện bao gồm: làm việc, lựa chọn nghề nghiệp, hưởng lương công bằng, an toàn lao động và nghỉ ngơi."
      },
      {
        question: "Trong XHCN, quyền sở hữu tài sản được quy định như thế nào?",
        options: [
          "Không ai được sở hữu tài sản",
          "Tài sản hợp pháp được pháp luật bảo vệ",
          "Chỉ nhà nước được sở hữu",
          "Tài sản không được bảo vệ"
        ],
        correct: 1,
        explanation: "Pháp luật XHCN bảo vệ quyền sở hữu tài sản hợp pháp của cá nhân."
      },
      {
        question: "Quyền tự do kinh doanh trong XHCN được thực hiện như thế nào?",
        options: [
          "Không giới hạn",
          "Trong khuôn khổ pháp luật",
          "Chỉ nhà nước được kinh doanh",
          "Cấm kinh doanh tư nhân"
        ],
        correct: 1,
        explanation: "Quyền tự do kinh doanh được thực hiện trong khuôn khổ pháp luật, đảm bảo trật tự kinh tế."
      },
      {
        question: "Người lao động có quyền gì về điều kiện lao động?",
        options: [
          "Làm việc bất kỳ điều kiện nào",
          "Làm việc trong môi trường an toàn, hưởng lương công bằng",
          "Không có quyền gì",
          "Chỉ có quyền nghỉ việc"
        ],
        correct: 1,
        explanation: "Người lao động có quyền làm việc trong môi trường an toàn, hưởng lương công bằng theo pháp luật."
      },
      {
        question: "Mục đích của quyền kinh tế trong XHCN là gì?",
        options: [
          "Chỉ để lợi ích cá nhân",
          "Đảm bảo đời sống vật chất, tạo điều kiện phát triển toàn diện cho con người",
          "Chỉ để nhà nước giàu có",
          "Không có mục đích gì"
        ],
        correct: 1,
        explanation: "Quyền kinh tế nhằm đảm bảo đời sống vật chất và tạo điều kiện phát triển toàn diện cho con người."
      }
    ]
  },
  {
    principle: 2,
    title: "Quyền xã hội",
    detail: "Quyền được giáo dục, quyền chăm sóc sức khỏe, quyền an sinh xã hội.",
    detailedContent: {
      introduction: "Quyền xã hội đảm bảo mọi người có cơ hội phát triển và được bảo vệ trước các rủi ro xã hội.",
      characteristics: [
        "Quyền được giáo dục và đào tạo",
        "Quyền chăm sóc sức khỏe",
        "Quyền an sinh xã hội",
        "Quyền được hưởng các thành tựu văn minh"
      ],
      mechanism: "Nhà nước và xã hội cùng tạo điều kiện để mọi người tiếp cận các dịch vụ xã hội cơ bản."
    },
    examples: [
      {
        title: "Quyền giáo dục",
        content: "Mọi người có quyền được học tập, nhà nước tạo điều kiện giáo dục miễn phí các cấp.",
        visual: "📚"
      },
      {
        title: "Quyền chăm sóc sức khỏe",
        content: "Người dân có quyền được khám bệnh, chữa bệnh, tham gia bảo hiểm y tế.",
        visual: "🏥"
      }
    ],
    questions: [
      {
        question: "Quyền giáo dục được thể hiện như thế nào tại Việt Nam?",
        options: [
          "Chỉ giáo dục mầm non miễn phí",
          "Giáo dục tiểu học và trung học cơ sở bắt buộc, miễn phí",
          "Chỉ đại học miễn phí",
          "Không có giáo dục miễn phí"
        ],
        correct: 1,
        explanation: "Việt Nam thực hiện giáo dục tiểu học và trung học cơ sở bắt buộc, miễn phí."
      },
      {
        question: "Quyền chăm sóc sức khỏe được đảm bảo thông qua gì?",
        options: [
          "Chỉ bệnh viện tư nhân",
          "Hệ thống bảo hiểm y tế, mạng lưới y tế cơ sở",
          "Chỉ người già mới được chăm sóc",
          "Không có quyền này"
        ],
        correct: 1,
        explanation: "Bảo hiểm y tế và mạng lưới y tế cơ sở đảm bảo quyền chăm sóc sức khỏe cho mọi người."
      },
      {
        question: "An sinh xã hội trong XHCN bao gồm những gì?",
        options: [
          "Chỉ trợ cấp người nghèo",
          "Bảo hiểm xã hội, bảo hiểm thất nghiệp, trợ cấp đặc biệt",
          "Chỉ dành cho người già",
          "Không có an sinh xã hội"
        ],
        correct: 1,
        explanation: "An sinh xã hội bao gồm bảo hiểm xã hội, bảo hiểm thất nghiệp và các chế độ trợ cấp đặc biệt."
      },
      {
        question: "Mọi người có quyền tiếp cận các thành tựu văn minh như thế nào?",
        options: [
          "Phải trả phí cao",
          "Nhà nước tạo điều kiện tiếp cận các dịch vụ văn hóa, thông tin",
          "Chỉ người có tiền mới được",
          "Không ai được tiếp cận"
        ],
        correct: 1,
        explanation: "Nhà nước tạo điều kiện để mọi người đều có thể tiếp cận các thành tựu văn minh."
      },
      {
        question: "Trẻ em có những quyền xã hội nào?",
        options: [
          "Không có quyền gì",
          "Quyền được học tập, chăm sóc sức khỏe, bảo vệ",
          "Chỉ quyền được ăn uống",
          "Chỉ quyền được đi học"
        ],
        correct: 1,
        explanation: "Trẻ em có quyền được học tập, chăm sóc sức khỏe, bảo vệ khỏi bạo lực và bóc lột."
      }
    ]
  },
  {
    principle: 3,
    title: "Quyền văn hóa",
    detail: "Quyền sáng tạo, quyền hưởng thụ văn hóa, quyền tự do tôn giáo.",
    detailedContent: {
      introduction: "Quyền văn hóa đảm bảo cho con người được phát triển về tinh thần, tham gia vào đời sống văn hóa.",
      characteristics: [
        "Quyền tham gia đời sống văn hóa",
        "Quyền sáng tạo văn hóa, nghệ thuật",
        "Quyền tự do tôn giáo",
        "Quyền bảo tồn và phát huy bản sắc văn hóa dân tộc"
      ],
      mechanism: "Nhà nước tôn trọng và tạo điều kiện cho hoạt động văn hóa, tôn giáo."
    },
    examples: [
      {
        title: "Quyền sáng tạo",
        content: "Mọi người có quyền sáng tác, nghiên cứu khoa học, phát triển công nghệ.",
        visual: "✍️"
      },
      {
        title: "Quyền tự do tôn giáo",
        content: "Người dân có quyền tin hoặc không tin tôn giáo, thực hành tín ngưỡng theo quy định pháp luật.",
        visual: "🕉️"
      }
    ],
    questions: [
      {
        question: "Quyền văn hóa trong XHCN bao gồm những gì?",
        options: [
          "Chỉ quyền xem phim",
          "Quyền sáng tạo, hưởng thụ văn hóa, tự do tôn giáo",
          "Chỉ quyền đi lễ chùa",
          "Không có quyền văn hóa"
        ],
        correct: 1,
        explanation: "Quyền văn hóa bao gồm: quyền sáng tạo, quyền hưởng thụ văn hóa và quyền tự do tôn giáo."
      },
      {
        question: "Quyền tự do tôn giáo được thực hiện như thế nào?",
        options: [
          "Tự do tuyệt đối",
          "Trong khuôn khổ pháp luật, không được lợi dụng tôn giáo",
          "Chỉ được tin một tôn giáo",
          "Cấm tất cả tôn giáo"
        ],
        correct: 1,
        explanation: "Quyền tự do tôn giáo được thực hiện trong khuôn khổ pháp luật, đảm bảo trật tự xã hội."
      },
      {
        question: "Mọi người có quyền gì trong việc bảo tồn văn hóa?",
        options: [
          "Không được phép",
          "Quyền bảo tồn và phát huy bản sắc văn hóa dân tộc",
          "Chỉ nhà nước được bảo tồn",
          "Chỉ người già mới được giữ"
        ],
        correct: 1,
        explanation: "Mọi người có quyền tham gia bảo tồn và phát huy bản sắc văn hóa dân tộc."
      },
      {
        question: "Quyền sáng tạo được bảo vệ như thế nào?",
        options: [
          "Không được bảo vệ",
          "Thông qua luật sở hữu trí tuệ, quyền tác giả",
          "Chỉ sáng tác văn học mới được bảo vệ",
          "Phải đăng ký trước"
        ],
        correct: 1,
        explanation: "Luật sở hữu trí tuệ và quyền tác giả bảo vệ quyền sáng tạo của cá nhân."
      },
      {
        question: "Trong XHCN, quyền văn hóa có mối quan hệ như thế nào với quyền khác?",
        options: [
          "Độc lập hoàn toàn",
          "Quyền văn hóa là một phần của quyền con người, liên quan mật thiết với quyền xã hội",
          "Không liên quan gì",
          "Quyền văn hóa quan trọng hơn tất cả"
        ],
        correct: 1,
        explanation: "Quyền văn hóa là một phần không thể thiếu của quyền con người, liên quan mật thiết với các quyền khác."
      }
    ]
  }
];


// Interface cho blog
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

// Tính thời gian đăng bài
const getTimeAgo = (updatedAt: string): string => {
  const now = new Date();
  const updated = new Date(updatedAt);
  const diffInMinutes = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return "Vừa xong";
  if (diffInMinutes === 1) return "1 phút";
  if (diffInMinutes < 60) return `${diffInMinutes} phút`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours === 1) return "1 giờ";
  if (diffInHours < 24) return `${diffInHours} giờ`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "1 ngày";
  return `${diffInDays} ngày`;
};

export default function Home() {
  const navigate = useNavigate();

  // State cho blog từ API
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loadingBlog, setLoadingBlog] = useState(true);
  const [errorBlog, setErrorBlog] = useState<string | null>(null);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // State cho quiz Mác-Lênin
  const [selectedPrinciple, setSelectedPrinciple] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);

  // State cho Memory Game
  const [showMemoryGame, setShowMemoryGame] = useState(false);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoadingBlog(true);
        const allBlogs = await getAllBlogsApi();
        // Chỉ hiển thị blog đã được xuất bản và lấy 6 bài mới nhất theo updatedAt
        const publishedBlogs = allBlogs
          .filter((blog: Blog) => blog.published)
          .sort((a: Blog, b: Blog) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 6);
        setBlogs(publishedBlogs);
        setErrorBlog(null);
      } catch (err) {
        setErrorBlog('Không thể tải danh sách bài viết.');
        console.error('Error fetching blogs:', err);
      } finally {
        setLoadingBlog(false);
      }
    };

    fetchBlogs();
  }, []);

  // Auto-rotate quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % philosophyQuotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Truncate content for preview
  const truncateContent = useCallback((content: string): string => {
    // Chuyển đổi line breaks thành spaces để hiển thị preview
    const normalizedContent = content.replace(/\n/g, ' ').replace(/\r/g, ' ');
    const strippedContent = normalizedContent.replace(/<[^>]*>?/gm, '');
    return strippedContent.length > 150
      ? strippedContent.substring(0, 150) + '...'
      : strippedContent;
  }, []);

  // Hàm xử lý quiz
  const handlePrincipleClick = (index: number) => {
    setSelectedPrinciple(index);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
    setUserAnswers([]);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;

    const currentQuiz = principleQuizzes[selectedPrinciple!];
    const question = currentQuiz.questions[currentQuestion];

    // Lưu câu trả lời của người dùng
    const newUserAnswers = [...userAnswers, selectedAnswer];
    setUserAnswers(newUserAnswers);

    if (selectedAnswer === question.correct) {
      setScore(score + 1);
    }

    if (currentQuestion < currentQuiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setShowResult(true);
    }
  };

  const handleRestartQuiz = () => {
    setSelectedPrinciple(null);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
    setUserAnswers([]);
  };

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section with Philosophy Quote */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative min-h-screen flex items-center justify-center px-2 sm:px-4 py-8 sm:py-12 md:py-20"
        style={{
          backgroundImage: `url(${bgHome})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay để làm mờ background */}
        <div className="absolute inset-0 bg-amber-50/80"></div>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 border border-amber-300 rounded-full"></div>
          <div className="absolute top-40 right-20 w-24 h-24 border border-amber-400 rounded-full"></div>
          <div className="absolute bottom-32 left-1/4 w-16 h-16 border border-amber-200 rounded-full"></div>
          <div className="absolute bottom-20 right-1/3 w-20 h-20 border border-amber-300 rounded-full"></div>
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10 px-2 sm:px-4">
          {/* Main Title */}
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-bold text-amber-900 mb-6 sm:mb-8 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            Quyền con người trong Xã hội chủ nghĩa
            <span className="block text-amber-700 text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl mt-2 sm:mt-4 font-light italic">
              Chương 4: Dân chủ XHCN và Nhà nước XHCN
            </span>
          </motion.h1>

          {/* Philosophy Quote Carousel */}
          <motion.div
            className="philosophy-card max-w-4xl ml-auto mr-4 my-8 sm:my-12 md:my-16 p-4 sm:p-6 md:p-8 lg:p-12 relative z-20"
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <div className="philosophy-quote">
              <motion.p
                key={currentQuoteIndex}
                className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-amber-900 mb-4 sm:mb-6 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                {philosophyQuotes[currentQuoteIndex].quote}
              </motion.p>
              <motion.div
                className="text-right"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <p className="text-xl text-amber-800 font-medium">
                  — {philosophyQuotes[currentQuoteIndex].author}
                </p>
                <p className="text-sm text-amber-600 mt-1 italic">
                  {philosophyQuotes[currentQuoteIndex].context}
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9 }}
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate("/blogs")}
                className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-amber-800 text-white rounded-full text-base sm:text-lg font-medium hover:bg-amber-900 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Khám phá hệ thống bài viết
              </button>
              <button
                onClick={() => navigate("/magazine")}
                className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-amber-800 text-white rounded-full text-base sm:text-lg font-medium hover:bg-amber-900 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                📕 Xem Tạp chí
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Principles Section */}
      <div className="bg-gradient-to-b from-amber-50 to-orange-50 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <motion.div
            className="text-center mb-8 sm:mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-amber-900 mb-4 sm:mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              {humanRightsContent.title}
            </h2>
            <motion.p
              className="text-base sm:text-lg md:text-xl text-amber-700 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {humanRightsContent.subtitle}
            </motion.p>
          </motion.div>

          {/* Principles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12 md:mb-16">
            {humanRightsContent.principles.map((principle, index) => (
              <motion.div
                key={index}
                className="philosophy-card group cursor-pointer overflow-hidden flex flex-col h-full"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                onClick={() => handlePrincipleClick(index)}
              >
                <div className={`h-24 sm:h-28 md:h-32 bg-gradient-to-br ${principle.color} flex items-center justify-center`}>
                  <span className="text-4xl sm:text-5xl md:text-6xl">{principle.icon}</span>
                </div>
                <div className="p-3 sm:p-4 md:p-6 flex flex-col flex-1">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-amber-900 mb-2 sm:mb-3 group-hover:text-amber-800 transition-colors">
                    {principle.title}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-amber-700 leading-relaxed mb-4 flex-grow min-h-[80px]">
                    {principle.description}
                  </p>
                  {principle.examples && (
                    <ul className="text-xs sm:text-sm text-amber-600 mb-3 space-y-1">
                      {principle.examples.map((ex: string, i: number) => (
                        <li key={i}>• {ex}</li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-auto text-center w-full">
                    <span className="inline-block w-full py-2 sm:py-3 bg-amber-100 text-amber-800 rounded-full text-xs sm:text-sm font-bold border-2 border-amber-200 transition group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-700">
                      Bấm để học và kiểm tra
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Features Section */}
          <motion.div
            className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-900 text-center mb-4 sm:mb-6 md:mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
              Đặc điểm quyền con người trong XHCN
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {humanRightsContent.features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="text-center p-4 sm:p-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">{feature.icon}</div>
                  <h4 className="text-base sm:text-lg md:text-xl font-bold text-amber-900 mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-sm sm:text-base text-amber-700">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quiz Section - Hiển thị khi chọn principle */}
      {selectedPrinciple !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-amber-900">
                  {humanRightsContent.principles[selectedPrinciple].title}
                </h3>
                <button
                  onClick={handleRestartQuiz}
                  className="text-amber-600 hover:text-amber-800 text-2xl"
                >
                  ✕
                </button>
              </div>

              {!showResult ? (
                <>
                  <div className="mb-6">
                    <p className="text-sm sm:text-base text-amber-700 mb-4">
                      {humanRightsContent.principles[selectedPrinciple].detail}
                    </p>
                    <div className="bg-amber-50 rounded-xl p-4 mb-4">
                      <p className="text-sm font-medium text-amber-900">
                        Câu hỏi {currentQuestion + 1}/{principleQuizzes[selectedPrinciple].questions.length}
                      </p>
                      <h4 className="text-lg sm:text-xl font-bold text-amber-900 mt-2">
                        {principleQuizzes[selectedPrinciple].questions[currentQuestion].question}
                      </h4>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {principleQuizzes[selectedPrinciple].questions[currentQuestion].options.map((option: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        className={`w-full p-4 text-left rounded-xl transition-all ${
                          selectedAnswer === index
                            ? 'bg-amber-100 border-2 border-amber-500 text-amber-900'
                            : 'bg-amber-50 border-2 border-amber-200 text-amber-900 hover:bg-amber-100'
                        }`}
                      >
                        <span className="font-medium">{option}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleNextQuestion}
                    disabled={selectedAnswer === null}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                      selectedAnswer === null
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-amber-800 text-white hover:bg-amber-900'
                    }`}
                  >
                    {currentQuestion < principleQuizzes[selectedPrinciple].questions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
                  </button>
                </>
              ) : (
                <div className="text-center max-h-[70vh] overflow-y-auto">
                  <div className="text-5xl mb-3">📝</div>
                  <h4 className="text-xl sm:text-2xl font-bold text-amber-900 mb-2">
                    Kết quả chi tiết
                  </h4>
                  <p className="text-lg text-amber-700 mb-4">
                    Bạn trả lời đúng <span className="font-bold text-green-600">{score}</span>/{principleQuizzes[selectedPrinciple].questions.length} câu
                  </p>

                  {/* Hiển thị chi tiết từng câu hỏi */}
                  <div className="text-left space-y-4 mb-6">
                    {principleQuizzes[selectedPrinciple].questions.map((q, idx) => {
                      const userAnswer = userAnswers[idx];
                      const isCorrect = userAnswer === q.correct;
                      return (
                        <div key={idx} className={`rounded-xl p-4 border-2 ${isCorrect ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'}`}>
                          <div className="flex items-start gap-2 mb-2">
                            <span className="text-xl">{isCorrect ? '✅' : '❌'}</span>
                            <div className="flex-1">
                              <p className="font-medium text-amber-900 text-sm">
                                Câu {idx + 1}: {q.question}
                              </p>
                            </div>
                          </div>

                          {/* Hiển thị câu trả lời của user */}
                          <div className="ml-7 mb-2">
                            <p className="text-sm text-amber-700">
                              <span className="font-medium">Bạn chọn:</span>
                              <span className={isCorrect ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                                {' '}{q.options[userAnswer]}
                              </span>
                            </p>
                          </div>

                          {/* Nếu sai hiển thị đáp án đúng */}
                          {!isCorrect && (
                            <div className="ml-7 mb-2">
                              <p className="text-sm text-amber-700">
                                <span className="font-medium">Đáp án đúng:</span>
                                <span className="text-green-600 font-medium"> {q.options[q.correct]}</span>
                              </p>
                            </div>
                          )}

                          {/* Giải thích */}
                          <div className="ml-7 bg-white/50 rounded-lg p-2 mt-2">
                            <p className="text-xs text-amber-800">
                              <span className="font-medium">💡 Giải thích:</span> {q.explanation}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-amber-50 rounded-xl p-4 mb-6 text-left">
                    <p className="text-amber-900">
                      {score >= principleQuizzes[selectedPrinciple].questions.length * 0.7
                        ? '🎉 Tuyệt vời! Bạn đã nắm vững kiến thức về quyền con người trong XHCN!'
                        : score >= principleQuizzes[selectedPrinciple].questions.length * 0.5
                        ? '📚 Tốt! Bạn cần ôn tập thêm một chút nữa.'
                        : '📖 Hãy ôn tập lại kiến thức để hiểu rõ hơn về quyền con người trong XHCN nhé!'}
                    </p>
                  </div>
                  <button
                    onClick={handleRestartQuiz}
                    className="w-full py-4 bg-amber-800 text-white rounded-xl font-bold text-lg hover:bg-amber-900 transition-all"
                  >
                    Làm lại
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}
