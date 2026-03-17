import loginImg from '../assets/login2.png';
import { useState } from 'react';
import { registerApi, sendOtpApi, checkOtpApi, loginApi, getAccountByIdApi } from '../api';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [yearOfBirth, setYearOfBirth] = useState<number | ''>('');
  const [gender, setGender] = useState('male');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpResendMsg, setOtpResendMsg] = useState<string | null>(null);

  const validateUsername = (value: string) => {
    if (!value) return 'Vui lòng nhập tên tài khoản';
    if (value.length < 8 || value.length > 30) return 'Tên tài khoản phải có độ dài từ 8 đến 30 ký tự!';
    if (!/^(?:[a-zA-Z0-9_]{8,30})$/.test(value)) return 'Tên tài khoản chỉ được chứa chữ, số, dấu gạch dưới!';
    return '';
  };
  const validateFullName = (value: string) => {
    if (!value) return 'Vui lòng nhập họ và tên';
    if (value.length < 8 || value.length > 50) return 'Họ và tên phải có độ dài từ 8 đến 50 ký tự!';
    if (!/^[a-zA-Z\sÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ]+$/.test(value)) return 'Họ và tên chỉ được chứa chữ cái và khoảng trắng!';
    return '';
  };
  const validatePhoneNumber = (value: string) => {
    if (value && !/^0\d{9}$/.test(value)) return 'Số điện thoại không hợp lệ!';
    return '';
  };
  const validateYearOfBirth = (value: number | '') => {
    if (value && (value < 1920 || value > new Date().getFullYear())) return 'Năm sinh không hợp lệ!';
    return '';
  };
  const validateEmail = (value: string) => {
    if (!value) return 'Vui lòng nhập email';
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)) return 'Email không hợp lệ!';
    return '';
  };
  const validatePassword = (value: string) => {
    if (!value) return 'Vui lòng nhập mật khẩu';
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\]{};':"\\|,.<>/?]).{6,30}$/.test(value)) return 'Mật khẩu phải chứa chữ thường, in hoa, số, ký tự đặc biệt và từ 6 đến 30 ký tự!';
    return '';
  };
  const validateConfirmPassword = (value: string) => {
    if (value !== password) return 'Mật khẩu xác nhận không khớp!';
    return '';
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setFieldErrors(prev => ({ ...prev, username: validateUsername(e.target.value) }));
  };
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setFieldErrors(prev => ({ ...prev, email: validateEmail(e.target.value) }));
  };
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setFieldErrors(prev => ({ ...prev, password: validatePassword(e.target.value) }));
  };
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setFieldErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(e.target.value) }));
  };
  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
    setFieldErrors(prev => ({ ...prev, fullName: validateFullName(e.target.value) }));
  };
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
    setFieldErrors(prev => ({ ...prev, phoneNumber: validatePhoneNumber(e.target.value) }));
  };
  const handleYearOfBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const year = e.target.value === '' ? '' : Number(e.target.value);
    setYearOfBirth(year);
    setFieldErrors(prev => ({ ...prev, yearOfBirth: validateYearOfBirth(year) }));
  };
  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGender(e.target.value);
  };

  const handleEmailBlur = async () => {
    if (validateEmail(email)) return;
    setLoading(true);
    try {
      await registerApi('___dummy___', email, '___dummy___', '___dummy___', 'dummy name');
    } catch (err: unknown) {
      const emailError = getEmailError(err);
      if (emailError) {
        setFieldErrors(prev => ({ ...prev, email: emailError }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    const usernameErr = validateUsername(username);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmPasswordErr = validateConfirmPassword(confirmPassword);
    const fullNameErr = validateFullName(fullName);
    const phoneNumberErr = validatePhoneNumber(phoneNumber);
    const yearOfBirthErr = validateYearOfBirth(yearOfBirth);
    setFieldErrors({ 
      username: usernameErr, 
      email: emailErr, 
      password: passwordErr, 
      confirmPassword: confirmPasswordErr,
      fullName: fullNameErr,
      phoneNumber: phoneNumberErr,
      yearOfBirth: yearOfBirthErr,
    });
    if (usernameErr || emailErr || passwordErr || confirmPasswordErr || fullNameErr || phoneNumberErr || yearOfBirthErr) {
      setLoading(false);
      return;
    }
    try {
      await registerApi(username, email, password, confirmPassword, fullName, phoneNumber, yearOfBirth || undefined, gender);
      setShowOtp(true);
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        (err as { response?: { data?: Record<string, unknown> } }).response?.data
      ) {
        const data = (err as { response: { data: Record<string, unknown> } }).response.data;
        if (data.message) setError(data.message as string);
        setFieldErrors((prev) => ({ ...prev, ...data } as Record<string, string>));
        setLoading(false);
        return;
      }
      setError('Đăng ký thất bại!');
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  // Handle OTP submit
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setOtpError(null);
    setOtpSuccess(null);
    try {
      await checkOtpApi(otp);
      // Sau khi xác thực OTP thành công, tự động đăng nhập
      const loginRes = await loginApi(email, password);
      localStorage.setItem('token', loginRes.data.token);
      localStorage.setItem('userId', loginRes.data.id);
      const user = await getAccountByIdApi(loginRes.data.id);
      localStorage.setItem('userInfo', JSON.stringify(user));
      setOtpSuccess('Xác thực thành công! Đang chuyển hướng...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1200);
    } catch {
      setOtpError('Mã OTP không đúng, đã hết hạn hoặc đăng nhập tự động thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại OTP
  const handleResendOtp = async () => {
    setOtpLoading(true);
    setOtpResendMsg(null);
    setOtpError(null);
    try {
      await sendOtpApi(email, username);
      setOtpResendMsg('Đã gửi lại mã OTP!');
    } catch {
      setOtpError('Không thể gửi lại OTP. Vui lòng thử lại!');
    } finally {
      setOtpLoading(false);
    }
  };

  // Helper to extract error message from axios error
  function getEmailError(err: unknown): string | undefined {
    if (
      typeof err === 'object' &&
      err !== null &&
      'response' in err &&
      (err as { response?: { data?: { email?: string } } }).response?.data?.email
    ) {
      return (err as { response: { data: { email: string } } }).response.data.email;
    }
    return undefined;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      <div className="flex items-center justify-center w-full h-screen lg:w-1/2 lg:h-screen">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm rounded-xl bg-white/70 backdrop-blur-md p-8">
          <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Sign in
            </a>
          </p>
          {!showOtp ? (
            <>
              <div className="mt-10">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-900">
                      Username
                    </label>
                    <div className="mt-2 relative">
                      <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        autoComplete="username"
                        className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border ${fieldErrors.username ? 'border-red-500' : 'border-gray-300'} placeholder:text-gray-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm`}
                        value={username}
                        onChange={handleUsernameChange}
                        disabled={loading}
                      />
                      {fieldErrors.username && (
                        <div className="text-red-500 text-xs mt-1">{fieldErrors.username}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                      Email address
                    </label>
                    <div className="mt-2 relative">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'} placeholder:text-gray-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm`}
                        value={email}
                        onChange={handleEmailChange}
                        onBlur={handleEmailBlur}
                        disabled={loading}
                      />
                      {fieldErrors.email && (
                        <div className="text-red-500 text-xs mt-1">{fieldErrors.email}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                      Password
                    </label>
                    <div className="mt-2 flex items-center relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'} placeholder:text-gray-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm`}
                        value={password}
                        onChange={handlePasswordChange}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                        onClick={() => setShowPassword(v => !v)}
                        disabled={loading}
                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        style={{ pointerEvents: loading ? 'none' : 'auto' }}
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.875-4.575A9.956 9.956 0 0122 9c0 5.523-4.477 10-10 10a9.956 9.956 0 01-4.575-1.125" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm2.021-2.021A9.956 9.956 0 0122 12c0 5.523-4.477 10-10 10S2 17.523 2 12c0-1.657.403-3.22 1.125-4.575M9.879 9.879A3 3 0 0115 12m-6 0a3 3 0 016 0m-6 0a3 3 0 016 0" /></svg>
                        )}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <div className="text-red-500 text-xs mt-1">{fieldErrors.password}</div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900">
                      Confirm Password
                    </label>
                    <div className="mt-2 flex items-center relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} placeholder:text-gray-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm`}
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                        onClick={() => setShowConfirmPassword(v => !v)}
                        disabled={loading}
                        aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        style={{ pointerEvents: loading ? 'none' : 'auto' }}
                      >
                        {showConfirmPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.875-4.575A9.956 9.956 0 0122 9c0 5.523-4.477 10-10 10a9.956 9.956 0 01-4.575-1.125" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm2.021-2.021A9.956 9.956 0 0122 12c0 5.523-4.477 10-10 10S2 17.523 2 12c0-1.657.403-3.22 1.125-4.575M9.879 9.879A3 3 0 0115 12m-6 0a3 3 0 016 0m-6 0a3 3 0 016 0" /></svg>
                        )}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <div className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-900">
                      Họ và tên
                    </label>
                    <div className="mt-2 relative">
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border ${fieldErrors.fullName ? 'border-red-500' : 'border-gray-300'} placeholder:text-gray-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm`}
                        value={fullName}
                        onChange={handleFullNameChange}
                        disabled={loading}
                      />
                      {fieldErrors.fullName && (
                        <div className="text-red-500 text-xs mt-1">{fieldErrors.fullName}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-900">
                      Số điện thoại
                    </label>
                    <div className="mt-2 relative">
                      <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border ${fieldErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'} placeholder:text-gray-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm`}
                        value={phoneNumber}
                        onChange={handlePhoneNumberChange}
                        disabled={loading}
                      />
                      {fieldErrors.phoneNumber && (
                        <div className="text-red-500 text-xs mt-1">{fieldErrors.phoneNumber}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-end gap-4">
                    <div className="flex-grow">
                      <label htmlFor="yearOfBirth" className="block text-sm font-medium text-gray-900">
                        Năm sinh
                      </label>
                      <div className="mt-2 relative">
                        <input
                          id="yearOfBirth"
                          name="yearOfBirth"
                          type="number"
                          placeholder="YYYY"
                          className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border ${fieldErrors.yearOfBirth ? 'border-red-500' : 'border-gray-300'} placeholder:text-gray-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm`}
                          value={yearOfBirth}
                          onChange={handleYearOfBirthChange}
                          disabled={loading}
                        />
                        {fieldErrors.yearOfBirth && (
                          <div className="text-red-500 text-xs mt-1">{fieldErrors.yearOfBirth}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <select
                          id="gender"
                          name="gender"
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm h-full"
                          style={{ height: '2.4rem' }}
                          value={gender}
                          onChange={handleGenderChange}
                          disabled={loading}
                        >
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  {error && (
                    <div className="text-red-500 text-sm mt-2">{error}</div>
                  )}
                  {success && (
                    <div className="text-green-600 text-sm mt-2">{success}</div>
                  )}
                  
                  <div>
                    <button
                      type="submit"
                      className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      disabled={loading}
                    >
                      {loading ? 'Registering...' : 'Register'}
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center mt-10">
              <h2 className="text-2xl font-bold text-indigo-700 mb-2">Xác thực Email</h2>
              <p className="text-gray-600 text-center mb-6">
                Vui lòng nhập mã OTP đã được gửi tới email <span className="font-semibold text-indigo-600">{email}</span> để hoàn tất đăng ký.
              </p>
              <form onSubmit={handleOtpSubmit} className="w-full flex flex-col gap-4">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full text-center text-l tracking-widest border-2 border-indigo-300 rounded-md py-3 px-4 focus:outline-none focus:border-indigo-600 transition"
                  placeholder="Nhập mã OTP 6 số"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  required
                />
                {otpError && <div className="text-red-500 text-center text-sm">{otpError}</div>}
                {otpSuccess && <div className="text-green-600 text-center text-sm">{otpSuccess}</div>}
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-md transition"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? 'Đang xác thực...' : 'Xác nhận'}
                </button>
              </form>
              <button
                type="button"
                className="mt-4 w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-md transition"
                onClick={handleResendOtp}
                disabled={otpLoading}
              >
                {otpLoading ? 'Đang gửi lại...' : 'Gửi lại OTP'}
              </button>
              {otpResendMsg && <div className="text-green-600 text-center text-sm mt-2">{otpResendMsg}</div>}
            </div>
          )}
        </div>
      </div>
      <div className="hidden lg:flex w-full h-screen lg:w-1/2 lg:h-screen">
        <img
          src={loginImg}
          alt="Login Illustration"
          className="w-full h-full object-cover object-left"
        />
      </div>
    </div>
  );
}

export default RegisterPage;
