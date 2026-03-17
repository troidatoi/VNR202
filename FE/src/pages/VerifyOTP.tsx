import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios, { AxiosError } from 'axios';
import { motion } from 'framer-motion';
import { Shield, Mail, CheckCircle, AlertCircle } from 'lucide-react';

const VerifyOTP: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();
  const { user, updateUserInfo } = useAuth();

  const handleSendOTP = async () => {
    try {
      setLoading(true);
      setError('');
      await axios.post('/api/auth/send-new-verify-email', {
        email: user?.email,
        username: user?.username
      });
      setSuccess('Mã OTP đã được gửi đến email của bạn');
      setOtpSent(true);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi gửi OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError('Vui lòng nhập mã OTP');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await axios.post('/api/auth/check-otp', { verifyCode: otp });
      await updateUserInfo();
      setSuccess('Xác thực tài khoản thành công');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi xác thực OTP');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.isVerified) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-2xl"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center"
          >
            <Shield className="h-8 w-8 text-blue-600" />
          </motion.div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Xác thực tài khoản
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Để đảm bảo an toàn và chất lượng dịch vụ tư vấn, chúng tôi cần xác thực email của bạn. 
            Việc này giúp chúng tôi có thể liên lạc với bạn khi cần thiết và đảm bảo tính xác thực của các cuộc hẹn tư vấn.
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-50"></div>
          
          <div className="relative">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg flex items-center"
              >
                <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                <p className="text-red-700">{error}</p>
              </motion.div>
            )}
            
            {success && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg flex items-center"
              >
                <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                <p className="text-green-700">{success}</p>
              </motion.div>
            )}

            {!otpSent ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <div className="mb-6">
                  <Mail className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Nhấn nút bên dưới để nhận mã xác thực qua email
                  </p>
                </div>
                <button
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Gửi mã xác thực'
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.form 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6" 
                onSubmit={handleVerify}
              >
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                    Nhập mã xác thực
                  </label>
                  <div className="mt-1">
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Nhập mã OTP từ email của bạn"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Gửi lại mã
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex justify-center items-center py-2 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      'Xác thực'
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOTP; 