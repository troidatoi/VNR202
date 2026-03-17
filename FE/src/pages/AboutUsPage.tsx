import React from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaRobot, FaCode, FaImage, FaGraduationCap, FaBookOpen } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const AboutUsPage: React.FC = () => {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const teamMembers = [
    {
      name: 'Pham Le Thang Hung',
      studentId: 'SE172380',
      role: 'Full-Stack Developer',
      description: 'Developer - Game & Web Development'
    },
    {
      name: 'Nguyen Thi Hong Hanh',
      studentId: 'SE181585',
      role: 'Full-Stack Developer',
      description: 'Developer - Game & Web Development'
    },
    {
      name: 'Do Hong Phuc',
      studentId: 'SE180567',
      role: 'Content Creator',
      description: 'Magazine Content Creator'
    },
    {
      name: 'Nguyen Manh Cuong',
      studentId: 'SE170070',
      role: 'Content Creator',
      description: 'Magazine Content Creator'
    },
    {
      name: 'Le Thi Anh Hong',
      studentId: 'SE181508',
      role: 'Content Creator',
      description: 'Magazine Content Creator'
    }
  ];

  const aiTools = [
    {
      icon: <FaRobot size={40} />,
      title: 'ChatGPT',
      description: 'Ho tro nghien cuu Quyen con nguoi trong XHCN va tao noi dung tap chi chat luong cao',
      color: 'text-amber-600'
    },
    {
      icon: <FaRobot size={40} />,
      title: 'Gemini Chat',
      description: 'Tro ly AI tich hop san trong website, ho tro tra loi cau hoi ve Quyen con nguoi 24/7',
      color: 'text-purple-600'
    },
    {
      icon: <FaCode size={40} />,
      title: 'Cursor',
      description: 'Cong cu coding AI giup phat trien web tap chi hien dai va toi uu',
      color: 'text-amber-600'
    },
    {
      icon: <FaImage size={40} />,
      title: 'Lovart',
      description: 'Tao hinh anh AI minh hoa cho quyen con nguoi trong XHCN',
      color: 'text-amber-600'
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 via-amber-50/80 to-amber-50/80">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-32 h-32 border border-amber-200 rounded-full"></div>
          <div className="absolute top-40 right-20 w-24 h-24 border border-amber-200 rounded-full"></div>
          <div className="absolute bottom-20 left-1/3 w-28 h-28 border border-amber-200 rounded-full"></div>
          <div className="absolute top-60 left-1/4 w-16 h-16 border border-amber-300 rounded-full"></div>
          <div className="absolute bottom-40 right-1/4 w-20 h-20 border border-amber-300 rounded-full"></div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-amber-400/20 to-amber-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-amber-400/15 to-amber-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-amber-400/20 to-amber-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
      </div>

      <Header />
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-10 pb-16">
        {/* Hero Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.8 }}
        >
          <div className="flex flex-col lg:flex-row items-center justify-between mb-20 gap-12">
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-r from-amber-500/20 to-amber-500/20 rounded-full blur-xl"></div>
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-r from-amber-500/20 to-amber-500/20 rounded-full blur-xl"></div>
                <h1 className="relative text-6xl md:text-8xl font-bold uppercase text-center bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 bg-clip-text text-transparent animate-pulse" style={{ fontFamily: 'Arial, sans-serif' }}>
                  About Us
                </h1>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-6" style={{ fontFamily: 'Arial, sans-serif' }}
              >
                <p className="text-2xl md:text-3xl font-bold text-amber-950 mb-4">
                  Group 3 - MLN131
                </p>
                <p className="text-lg md:text-xl text-amber-800 mb-6">
                  Truong Dai hoc FPT
                </p>
                <div className="inline-block bg-gradient-to-r from-amber-100/50 to-amber-100/50 backdrop-blur-sm rounded-2xl p-6 border border-amber-200 shadow-lg">
                  <p className="text-lg text-amber-900 font-medium">
                    Tap chi so Quyen con nguoi trong XHCN - Tim hieu ve Dan chu XHCN va Nha nuoc XHCN
                  </p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex-1 flex justify-center lg:justify-end relative"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/30 to-amber-400/30 rounded-3xl blur-2xl transform rotate-3"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/30 to-amber-400/30 rounded-3xl blur-2xl transform -rotate-3"></div>
                <div className="relative w-[340px] md:w-[420px] aspect-square bg-amber-900 rounded-3xl shadow-2xl border-2 border-amber-200/50 transform hover:scale-105 transition-all duration-500 flex items-center justify-center text-white text-9xl" style={{ fontFamily: 'Arial, sans-serif' }}>
                  VN
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Team Members Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-amber-500/20 rounded-full blur-3xl"></div>
              <h2 className="relative text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 bg-clip-text text-transparent mb-6" style={{ fontFamily: 'Arial, sans-serif' }}>
                Thanh Vien Nhom
              </h2>
              <p className="text-xl text-amber-900/80 max-w-3xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
                Doi ngu chuyen nong cot trong du an nghien cuu Quyen con nguoi trong XHCN
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {teamMembers.map((member, index) => {
              const bgColors = [
                'from-amber-600/20 to-amber-600/20',
                'from-amber-600/20 to-amber-600/20',
                'from-amber-600/20 to-amber-600/20',
                'from-amber-800/20 to-amber-600/20',
                'from-amber-700/20 to-amber-800/20'
              ];
              const accentColors = [
                'from-amber-600 to-amber-600',
                'from-amber-600 to-amber-600',
                'from-amber-600 to-amber-600',
                'from-amber-800 to-amber-600',
                'from-amber-700 to-amber-800'
              ];

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="group relative h-full"
                  style={{ fontFamily: 'Arial, sans-serif' }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${bgColors[index]} rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500`}></div>
                  <div className="relative bg-white/40 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/20 transition-all duration-500 group-hover:shadow-3xl group-hover:-translate-y-3 h-full flex flex-col">
                    <div className="text-center flex-1 flex flex-col">
                      <div className="relative mb-6">
                        <div className={`w-24 h-24 bg-gradient-to-br ${accentColors[index]} rounded-full flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
                          {member.role.includes('Developer') ? (
                            <FaCode className="text-white" size={32} />
                          ) : member.role.includes('Content Creator') && (member.name.includes('Cuong') || member.name.includes('Hong')) ? (
                            <FaBookOpen className="text-white" size={32} />
                          ) : (
                            <FaUsers className="text-white" size={32} />
                          )}
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                          <span className="text-white text-sm font-bold">{index + 1}</span>
                        </div>
                      </div>
                      <h3 className="font-bold text-xl mb-3 text-amber-950">{member.name}</h3>
                      <p className="font-semibold mb-3 text-sm text-amber-800 border border-amber-200 px-3 py-1 rounded-full inline-block">
                        {member.studentId}
                      </p>
                      <p className="text-sm text-amber-900 mb-4 font-medium">{member.role}</p>
                      <p className="text-sm text-gray-800 leading-relaxed flex-1">{member.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* AI Tools Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="text-center mb-12 mt-24" style={{ fontFamily: 'Arial, sans-serif' }}>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-700 to-amber-950 bg-clip-text text-transparent mb-4">
              Cong Cu AI Dac Luc
            </h2>
            <p className="text-lg text-amber-800 max-w-2xl mx-auto">
              Cac cong cu ho tro xay dung nen tang Tap chi so hien dai
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {aiTools.map((tool, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-amber-400/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-amber-200/50 transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-2">
                  <div className="text-center">
                    <div className="relative mb-6">
                      <div className={`w-16 h-16 ${tool.color.replace('text-', 'bg-').replace('-600', '-100')} rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <div className={tool.color}>{tool.icon}</div>
                      </div>
                    </div>
                    <h3 className="font-bold text-xl mb-3 text-amber-950">{tool.title}</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">{tool.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Mission Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="mt-24 p-10 bg-gradient-to-br from-amber-900 to-amber-950 text-white rounded-3xl border-2 border-amber-500/50 shadow-2xl" style={{ fontFamily: 'Arial, sans-serif' }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-amber-500">Muc Tieu Du An Chuong 4</h2>
            <p className="text-lg md:text-xl mb-6 leading-relaxed">
              Du an MLN131 cua <span className="text-amber-400 font-bold">Group 3</span> khong chi dung lai o viec hoc tap ly thuyet, ma con truyen tai tinh than <span className="text-amber-400 font-bold">Quyen con nguoi trong XHCN</span> thong qua nen tang so hoa. Chung toi mong muon xay dung mot khong gian hoc tap truc quan, sinh dong, noi moi sinh vien co the de dang tiep thu va van dung kien thuc ve dan chu XHCN va nha nuoc XHCN trong cuoc song va cong viec tuong lai.
            </p>
            <div className="flex items-center justify-center mt-8 pt-8 border-t border-white/20">
              <FaGraduationCap size={32} className="mr-4 text-amber-500" />
              <div className="text-left">
                <span className="text-xl font-bold block">Truong Dai hoc FPT</span>
                <span className="text-amber-500 italic">Mon Mac-Lenin (MLN131)</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutUsPage;
