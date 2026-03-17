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

// Triết lý và trích dẫn về Đảng lãnh đạo
const philosophyQuotes = [
  {
    quote: "Dù khó khăn gì lớn, dù muốn nào dân tộc nhất định sẽ hoàn toàn giành thắng lợi. Quê hương nhất định sẽ thống nhất. Đồng bào Nam Bắc nhất định sẽ sum họp một nhà.",
    author: "Chủ tịch Hồ Chí Minh",
    context: "Di chúc lịch sử"
  },
  {
    quote: "Đảng lãnh đạo cả nước quá độ lên chủ nghĩa xã hội, không bỏ qua giai đoạn nào.",
    author: "Đảng Cộng sản Việt Nam",
    context: "Đại hội lần thứ IV của Đảng"
  },
  {
    quote: "Công cuộc đổi mới là sự nghiệp của toàn dân, dưới sự lãnh đạo của Đảng.",
    author: "Đảng Cộng sản Việt Nam",
    context: "Nghị quyết Đại hội VI"
  },
  {
    quote: "Xây dựng chủ nghĩa xã hội là nhiệm vụ lịch sử của nhân dân ta.",
    author: "Đảng Cộng sản Việt Nam",
    context: "Cương lĩnh xây dựng đất nước trong thời kỳ quá độ"
  }
];

// Nội dung về Đảng lãnh đạo cả nước qua độ lên CNXH (Chương 3)
const humanRightsContent = {
  title: "Đảng lãnh đạo cả nước quá độ lên chủ nghĩa xã hội",
  subtitle: "Chương 3: Đảng lãnh đạo cả nước qua độ lên chủ nghĩa xã hội và tiến hành công cuộc đổi mới (từ năm 1975 đến nay)",
  principles: [
    {
      title: "Hoàn thành thống nhất đất nước",
      description: "Hoàn thành thống nhất đất nước về mặt nhà nước, bước vào thời kỳ mới.",
      detail: "Hoàn thành thống nhất đất nước về mặt nhà nước, bước vào thời kỳ mới.",
      icon: "🏛️",
      color: "from-amber-600 to-amber-800",
      examples: ["Thống nhất hai miền", "Bầu cử Quốc hội khóa VI", "Thành lập nước CHXHCNVN"]
    },
    {
      title: "Xây dựng chủ nghĩa xã hội",
      description: "Xây dựng chủ nghĩa xã hội và bảo vệ Tổ quốc trong giai đoạn 1975-1980.",
      detail: "Xây dựng chủ nghĩa xã hội và bảo vệ Tổ quốc trong giai đoạn 1975-1980.",
      icon: "🏗️",
      color: "from-green-500 to-green-700",
      examples: ["Xây dựng kinh tế", "Phát triển văn hóa", "Củng cố quốc phòng"]
    },
    {
      title: "Đổi mới toàn diện",
      description: "Đổi mới toàn diện đất nước theo định hướng XHCN, mở cửa hội nhập quốc tế.",
      detail: "Đổi mới toàn diện đất nước theo định hướng XHCN, mở cửa hội nhập quốc tế.",
      icon: "🔄",
      color: "from-blue-500 to-blue-700",
      examples: ["Đổi mới kinh tế", "Đổi mới chính trị", "Hội nhập quốc tế"]
    },
    {
      title: "Đại hội Đảng lần thứ IV",
      description: "Đại hội đại biểu toàn quốc lần thứ IV của Đảng (12/1976), xác định đường lối mới.",
      detail: "Đại hội đại biểu toàn quốc lần thứ IV của Đảng (12/1976), xác định đường lối mới.",
      icon: "⭐",
      color: "from-red-500 to-red-700",
      examples: ["Đường lối đổi mới", "Kế hoạch 5 năm", "Lãnh đạo của Đảng"]
    }
  ],
  features: [
    {
      title: "Sự lãnh đạo của Đảng",
      description: "Đảng Cộng sản Việt Nam lãnh đạo cả nước trong suốt quá trình xây dựng chủ nghĩa xã hội.",
      icon: "⚖️"
    },
    {
      title: "Thành tựu to lớn",
      description: "Đạt được nhiều thành tựu to lớn trong phát triển kinh tế - xã hội, cải thiện đời sống nhân dân.",
      icon: "🏆"
    },
    {
      title: "Hội nhập quốc tế",
      description: "Mở rộng quan hệ đối ngoại, hội nhập kinh tế quốc tế, giữ vững độc lập chủ quyền.",
      icon: "🌍"
    }
  ]
};

// Bộ câu hỏi trắc nghiệm về Đảng lãnh đạo
const principleQuizzes = [
  {
    principle: 0,
    title: "Hoàn thành thống nhất đất nước",
    detail: "Hoàn thành thống nhất đất nước về mặt nhà nước, bước vào thời kỳ mới.",
    detailedContent: {
      introduction: "Sau 1975, nhiệm vụ hàng đầu là hoàn thành thống nhất đất nước về mọi mặt.",
      characteristics: [
        "Thống nhất hai miền Bắc - Nam",
        "Bầu cử Quốc hội chung",
        "Thành lập nước Cộng hòa Xã hội Chủ nghĩa Việt Nam",
        "Thống nhất hệ thống pháp luật"
      ],
      mechanism: "Đảng lãnh đạo quá trình thống nhất đất nước về mặt nhà nước."
    },
    examples: [
      {
        title: "Tổng tuyển cử 1976",
        content: "Ngày 25/4/1976, cuộc Tổng tuyển cử bầu Quốc hội chung của nước Việt Nam thống nhất đã được tiến hành với hơn 23 triệu cử tri tham gia.",
        visual: "🗳️"
      },
      {
        title: "Quốc hội khóa VI",
        content: "Quốc hội khóa VI họp từ 24/6 đến 3/7/1976 tại Hà Nội, thành lập các cơ quan nhà nước mới.",
        visual: "🏛️"
      }
    ],
    questions: [
      {
        question: "Nhiệm vụ hàng đầu của Đảng sau năm 1975 là gì?",
        options: [
          "Xây dựng kinh tế",
          "Hoàn thành thống nhất đất nước",
          "Phát triển văn hóa",
          "Mở cửa đối ngoại"
        ],
        correct: 1,
        explanation: "Sau khi chiến thắng 1975, nhiệm vụ hàng đầu là hoàn thành thống nhất đất nước về mọi mặt."
      },
      {
        question: "Cuộc Tổng tuyển cử bầu Quốc hội chung được tổ chức vào ngày nào?",
        options: [
          "25/4/1975",
          "25/4/1976",
          "25/4/1977",
          "25/4/1978"
        ],
        correct: 1,
        explanation: "Ngày 25/4/1976, cuộc Tổng tuyển cử bầu Quốc hội chung của nước Việt Nam thống nhất đã được tiến hành."
      },
      {
        question: "Quốc hội khóa VI họp tại đâu?",
        options: [
          "Thành phố Hồ Chí Minh",
          "Đà Nẵng",
          "Hà Nội",
          "Huế"
        ],
        correct: 2,
        explanation: "Quốc hội khóa VI họp từ 24/6 đến 3/7/1976 tại Thủ đô Hà Nội."
      },
      {
        question: "Tỷ lệ cử tri tham gia bầu cử Quốc hội 1976 là bao nhiêu?",
        options: [
          "78,77%",
          "88,77%",
          "98,77%",
          "100%"
        ],
        correct: 2,
        explanation: "Hơn 23 triệu cử tri, đại biểu 98,77% tổng số cử tri đã đi bầu."
      },
      {
        question: "Ai được bầu làm Chủ tịch nước tại Quốc hội khóa VI?",
        options: [
          "Phạm Văn Đồng",
          "Trường Chinh",
          "Tôn Đức Thắng",
          "Lê Duẩn"
        ],
        correct: 2,
        explanation: "Quốc hội đã bầu đồng chí Tôn Đức Thắng làm Chủ tịch nước."
      }
    ]
  },
  {
    principle: 1,
    title: "Xây dựng chủ nghĩa xã hội",
    detail: "Xây dựng chủ nghĩa xã hội và bảo vệ Tổ quốc trong giai đoạn 1975-1980.",
    detailedContent: {
      introduction: "Sau khi thống nhất, Đảng lãnh đạo xây dựng chủ nghĩa xã hội trên phạm vi cả nước.",
      characteristics: [
        "Xây dựng cơ sở vật chất",
        "Phát triển văn hóa - giáo dục",
        "Củng cố quốc phòng",
        "Ổn định đời sống nhân dân"
      ],
      mechanism: "Đảng xây dựng kế hoạch 5 năm, huy động sức mạnh toàn dân."
    },
    examples: [
      {
        title: "Kế hoạch 5 năm 1976-1980",
        content: "Đại hội IV của Đảng thông qua Kế hoạch nhà nước 5 năm (1976-1980).",
        visual: "📋"
      },
      {
        title: "Phát triển thủy điện",
        content: "Xây dựng các công trình thủy điện lớn như thủy điện Hòa Bình, phục vụ sản xuất và đời sống.",
        visual: "⚡"
      }
    ],
    questions: [
      {
        question: "Đại hội lần thứ IV của Đảng họp vào thời gian nào?",
        options: [
          "Tháng 10/1976",
          "Tháng 12/1976",
          "Tháng 6/1977",
          "Tháng 8/1977"
        ],
        correct: 1,
        explanation: "Đại hội lần thứ IV của Đảng họp từ ngày 14 đến ngày 20/12/1976 tại Hà Nội."
      },
      {
        question: "Kế hoạch nhà nước 5 năm (1976-1980) được thông qua tại đâu?",
        options: [
          "Đại hội III",
          "Đại hội IV",
          "Đại hội V",
          "Đại hội VI"
        ],
        correct: 1,
        explanation: "Đại hội IV của Đảng đã thông qua Báo cáo về phương hướng, nhiệm vụ và mục tiêu Kế hoạch nhà nước 5 năm (1976-1980)."
      },
      {
        question: "Nhiệm vụ chính trong giai đoạn 1975-1980 là gì?",
        options: [
          "Phát triển du lịch",
          "Xây dựng chủ nghĩa xã hội và bảo vệ Tổ quốc",
          "Mở cửa kinh tế",
          "Gia nhập ASEAN"
        ],
        correct: 1,
        explanation: "Nhiệm vụ chính là xây dựng chủ nghĩa xã hội và bảo vệ Tổ quốc trong giai đoạn 1975-1980."
      },
      {
        question: "Đâu là một trong những mục tiêu kinh tế của giai đoạn này?",
        options: [
          "Phát triển công nghiệp nhẹ",
          "Hoàn thành hệ thống thủy điện để phục vụ sản xuất",
          "Tập trung vào xuất khẩu",
          "Kinh tế thị trường"
        ],
        correct: 1,
        explanation: "Mục tiêu là hoàn thành hệ thống thủy điện để phục vụ sản xuất, phát triển công nghiệp và nông nghiệp."
      },
      {
        question: "Trong giai đoạn này, Đảng tập trung vào việc gì?",
        options: [
          "Xây dựng cơ sở vật chất và văn hóa",
          "Chỉ xây dựng quân sự",
          "Chỉ phát triển giáo dục",
          "Không có kế hoạch cụ thể"
        ],
        correct: 0,
        explanation: "Đảng tập trung xây dựng cơ sở vật chất, phát triển văn hóa - giáo dục và củng cố quốc phòng."
      }
    ]
  },
  {
    principle: 2,
    title: "Đổi mới toàn diện",
    detail: "Đổi mới toàn diện đất nước theo định hướng XHCN, mở cửa hội nhập quốc tế.",
    detailedContent: {
      introduction: "Đổi mới là bước ngoặt lịch sử trong công cuộc xây dựng chủ nghĩa xã hội.",
      characteristics: [
        "Đổi mới tư duy",
        "Đổi mới cơ chế kinh tế",
        "Mở cửa đối ngoại",
        "Giữ vững định hướng XHCN"
      ],
      mechanism: "Đổi mới toàn diện dưới sự lãnh đạo của Đảng, phát huy sức mạnh toàn dân."
    },
    examples: [
      {
        title: "Đại hội VI (1986)",
        content: "Đại hội VI năm 1986 đánh dấu bước ngoặt quan trọng với chính sách đổi mới.",
        visual: "🔄"
      },
      {
        title: "Hội nhập quốc tế",
        content: "Việt Nam mở rộng quan hệ đối ngoại, tham gia các tổ chức quốc tế.",
        visual: "🌍"
      }
    ],
    questions: [
      {
        question: "Đổi mới được khởi xướng tại Đại hội nào?",
        options: [
          "Đại hội IV",
          "Đại hội V",
          "Đại hội VI",
          "Đại hội VII"
        ],
        correct: 2,
        explanation: "Đại hội VI năm 1986 đánh dấu bước ngoặt quan trọng với chính sách đổi mới."
      },
      {
        question: "Đổi mới tập trung vào điều gì?",
        options: [
          "Thay đổi đảng cầm quyền",
          "Đổi mới cơ chế kinh tế, giữ định hướng XHCN",
          "Xóa bỏ chủ nghĩa xã hội",
          "Chỉ thay đổi về chính trị"
        ],
        correct: 1,
        explanation: "Đổi mới tập trung vào đổi mới cơ chế kinh tế, đồng thời giữ vững định hướng chủ nghĩa xã hội."
      },
      {
        question: "Mục tiêu của công cuộc đổi mới là gì?",
        options: [
          "Xây dựng chủ nghĩa tư bản",
          "Xây dựng chủ nghĩa xã hội, phát triển kinh tế",
          "Phục hồi chế độ thuộc địa",
          "Rời bỏ định hướng XHCN"
        ],
        correct: 1,
        explanation: "Mục tiêu là xây dựng chủ nghĩa xã hội và phát triển kinh tế đất nước."
      },
      {
        question: "Trong đổi mới, Việt Nam có chính sách gì về đối ngoại?",
        options: [
          "Đóng cửa hoàn toàn",
          "Mở cửa, hội nhập quốc tế",
          "Chỉ hợp tác với các nước xã hội chủ nghĩa",
          "Không tham gia tổ chức quốc tế"
        ],
        correct: 1,
        explanation: "Việt Nam mở cửa, mở rộng quan hệ đối ngoại và hội nhập quốc tế."
      },
      {
        question: "Điều nào được giữ vững trong công cuộc đổi mới?",
        options: [
          "Thay đổi hoàn toàn hệ thống",
          "Giữ vững định hướng chủ nghĩa xã hội",
          "Xóa bỏ vai trò lãnh đạo của Đảng",
          "Chỉ đổi mới về kinh tế"
        ],
        correct: 1,
        explanation: "Trong công cuộc đổi mới, Việt Nam giữ vững định hướng chủ nghĩa xã hội và vai trò lãnh đạo của Đảng."
      }
    ]
  },
  {
    principle: 3,
    title: "Đại hội Đảng lần thứ IV",
    detail: "Đại hội đại biểu toàn quốc lần thứ IV của Đảng (12/1976), xác định đường lối mới.",
    detailedContent: {
      introduction: "Đại hội IV là đại hội thống nhất đầu tiên của Đảng sau khi đất nước thống nhất.",
      characteristics: [
        "Đại hội thống nhất đầu tiên",
        "Thông qua kế hoạch 5 năm",
        "Xác định đường lối xây dựng XHCN",
        "Bầu Ban Chấp hành Trung ương mới"
      ],
      mechanism: "Đại hội quyết định đường lối, kế hoạch phát triển đất nước."
    },
    examples: [
      {
        title: "Đại biểu tham dự",
        content: "Đại hội có 1.008 đại biểu, thay mặt hơn 1,7 triệu đảng viên.",
        visual: "👥"
      },
      {
        title: "Kế hoạch phát triển",
        content: "Đại hội thông qua Kế hoạch nhà nước 5 năm (1976-1980) và các nghị quyết quan trọng.",
        visual: "📊"
      }
    ],
    questions: [
      {
        question: "Đại hội lần thứ IV của Đảng được tổ chức tại đâu?",
        options: [
          "Thành phố Hồ Chí Minh",
          "Đà Nẵng",
          "Hà Nội",
          "Huế"
        ],
        correct: 2,
        explanation: "Đại hội lần thứ IV của Đảng họp từ ngày 14 đến ngày 20/12/1976 tại Hà Nội."
      },
      {
        question: "Đại hội IV có bao nhiêu đại biểu tham dự?",
        options: [
          "508 đại biểu",
          "1.008 đại biểu",
          "2.008 đại biểu",
          "3.008 đại biểu"
        ],
        correct: 1,
        explanation: "Đại hội có 1.008 đại biểu, thay mặt hơn 1,7 triệu đảng viên."
      },
      {
        question: "Đại hội IV thông qua văn kiện quan trọng nào?",
        options: [
          "Kế hoạch 10 năm",
          "Kế hoạch nhà nước 5 năm (1976-1980)",
          "Chiến lược phát triển 20 năm",
          "Luật Doanh nghiệp"
        ],
        correct: 1,
        explanation: "Đại hội đã thông qua Kế hoạch nhà nước 5 năm (1976-1980)."
      },
      {
        question: "Đại hội IV là đại hội gì sau khi đất nước thống nhất?",
        options: [
          "Đại hội thường lệ",
          "Đại hội thống nhất đầu tiên",
          "Đại hội bất thường",
          "Đại hội kỷ niệm"
        ],
        correct: 1,
        explanation: "Đại hội IV là đại hội thống nhất đầu tiên của Đảng sau khi đất nước thống nhất."
      },
      {
        question: "Đại hội IV xác định đường lối gì cho giai đoạn mới?",
        options: [
          "Xây dựng chủ nghĩa xã hội trên phạm vi cả nước",
          "Tiếp tục chiến tranh",
          "Kinh tế thị trường tự do",
          "Rời bỏ chủ nghĩa xã hội"
        ],
        correct: 0,
        explanation: "Đại hội IV xác định đường lối xây dựng chủ nghĩa xã hội trên phạm vi cả nước."
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
            Đảng lãnh đạo cả nước quá độ lên chủ nghĩa xã hội
            <span className="block text-amber-700 text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl mt-2 sm:mt-4 font-light italic">
              Chương 3: Đảng lãnh đạo cả nước và công cuộc đổi mới (1975 - nay)
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
              className="text-base sm:text-lg md:text-xl text-amber-700 max-w-4xl mx-auto"
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
                      Bấm để tìm hiểu và kiểm tra
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
              Đặc điểm quá trình lãnh đạo của Đảng
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
                        ? '🎉 Tuyệt vời! Bạn đã nắm vững kiến thức về sự lãnh đạo của Đảng!'
                        : score >= principleQuizzes[selectedPrinciple].questions.length * 0.5
                        ? '📚 Tốt! Bạn cần ôn tập thêm một chút nữa.'
                        : '📖 Hãy ôn tập lại kiến thức để hiểu rõ hơn về quá trình lãnh đạo của Đảng nhé!'}
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
