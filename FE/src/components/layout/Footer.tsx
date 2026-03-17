import { FaFacebookF, FaTwitter, FaInstagram } from "react-icons/fa";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="relative bg-gradient-to-t from-amber-100 via-amber-50 to-white text-amber-900 pt-16 pb-24 px-4 md:px-20 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 md:gap-0 justify-between items-start">
        {/* Logo và social */}
        <div className="flex-1 min-w-[220px] flex flex-col items-center md:items-start">
          <div className="text-4xl font-semibold font-serif mb-8 text-amber-900">MLN131</div>
          <div className="flex gap-8 mt-2 mb-8">
            <a href="#" className="w-16 h-16 flex items-center justify-center rounded-full bg-amber-200 hover:bg-amber-300 transition text-2xl">
              <FaFacebookF />
            </a>
            <a href="#" className="w-16 h-16 flex items-center justify-center rounded-full bg-amber-200 hover:bg-amber-300 transition text-2xl">
              <FaTwitter />
            </a>
            <a href="#" className="w-16 h-16 flex items-center justify-center rounded-full bg-amber-200 hover:bg-amber-300 transition text-2xl">
              <FaInstagram />
            </a>
          </div>
        </div>
        {/* Menu columns */}
        <div className="flex-[2] grid grid-cols-2 md:grid-cols-4 gap-8 w-full">
          <div>
            <div className="font-bold text-lg mb-4">Menu</div>
            <ul className="space-y-3 text-base">
              <li><Link to="/" className="hover:underline">Trang chủ</Link></li>
              <li><Link to="/blogs" className="hover:underline">Blog</Link></li>
              <li><Link to="/magazine" className="hover:underline">Tạp chí</Link></li>
              <li><Link to="/about-us" className="hover:underline">Giới thiệu</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-lg mb-4">Chủ đề</div>
            <ul className="space-y-3 text-base">
              <li><Link to="/" className="hover:underline">Quyền chính trị</Link></li>
              <li><Link to="/" className="hover:underline">Quyền kinh tế</Link></li>
              <li><Link to="/" className="hover:underline">Quyền xã hội</Link></li>
              <li><Link to="/" className="hover:underline">Quyền văn hóa</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-lg mb-4">Chương trình</div>
            <ul className="space-y-3 text-base">
              <li><Link to="/" className="hover:underline">Chương 4</Link></li>
              <li><Link to="/" className="hover:underline">Dân chủ XHCN</Link></li>
              <li><Link to="/" className="hover:underline">Nhà nước XHCN</Link></li>
              <li><Link to="/login" className="hover:underline">Đăng nhập</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-lg mb-4">Khác</div>
            <ul className="space-y-3 text-base">
              <li><a href="#" className="hover:underline">Tuyên ngôn Nhân quyền</a></li>
              <li><a href="#" className="hover:underline">Lịch sử quyền con người</a></li>
            </ul>
          </div>
        </div>
      </div>
      {/* Copyright & links */}
      <div className="mt-16 border-t border-amber-200 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-amber-800">
        <div>
          @2026 - MLN131. Nền tảng nghiên cứu Quyền con người trong XHCN
        </div>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:underline">Chính sách bảo mật</a>
          <span className="mx-1">|</span>
          <a href="#" className="hover:underline">Điều khoản & điều kiện</a>
        </div>
      </div>
      {/* SVG sóng nước philosophy theme */}
      <div className="absolute left-0 bottom-0 w-full flex justify-center pointer-events-none select-none" style={{ zIndex: 1 }}>
        <svg width="100%" height="120" viewBox="0 0 1440 120" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 80 Q 360 120 720 80 T 1440 80 V120 H0Z" fill="#EBF5FF" fillOpacity="0.7" />
          <path d="M0 100 Q 480 140 960 100 T 1440 100 V120 H0Z" fill="#1E40AF" fillOpacity="0.8" />
        </svg>
      </div>
    </footer>
  );
}

export default Footer;
