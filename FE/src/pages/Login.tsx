// Removed background image import
import logo from "/avarta.png";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import type { CredentialResponse } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";
import { sendResetPasswordEmailApi, changePasswordApi } from "../api";
import { Eye, EyeOff } from "lucide-react";
import type { AxiosError } from "axios";
import ColdStartLoading from "../components/ColdStartLoading";

type GoogleJwtPayload = {
  email: string;
  name?: string;
  picture?: string;
  [key: string]: unknown;
};

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showColdStartLoading, setShowColdStartLoading] = useState(false);
  const { login, loginWithGoogle, error: authError, loading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const googleClientId = import.meta.env
    .VITE_GOOGLE_CLIENT_ID as string | undefined;
  const [forgotStep, setForgotStep] = useState<
    "login" | "email" | "otp" | "newpass"
  >("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNew, setForgotNew] = useState("");
  const [forgotConfirm, setForgotConfirm] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showForgotNew, setShowForgotNew] = useState(false);
  const [showForgotConfirm, setShowForgotConfirm] = useState(false);
  const [forgotToast, setForgotToast] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (user.role === "consultant") {
        navigate("/consultants", { replace: true });
      } else {
        const from =
          location.state &&
          typeof location.state === "object" &&
          "from" in location.state
            ? (location.state.from as { pathname: string }).pathname
            : "/";
        navigate(from, { replace: true });
      }
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return; // Prevent double submission

    try {
      setIsLoggingIn(true);
      setShowColdStartLoading(true);
      await login(email, password);
      // Chuyển hướng sẽ được xử lý trong useEffect khi user cập nhật
    } catch (error: unknown) {
      // Check if it's a cold start error
      const err = error as { code?: string; message?: string };
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        console.log("🔄 Server is waking up, showing cold start loading...");
        // Keep showing cold start loading
      } else {
        setShowColdStartLoading(false);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    if (isLoggingIn) return; // Prevent double submission

    try {
      setIsLoggingIn(true);
      setShowColdStartLoading(true);
      if (!credentialResponse.credential) {
        alert("Đăng nhập Google thất bại!");
        return;
      }
      const decoded = jwtDecode<GoogleJwtPayload>(
        credentialResponse.credential
      );
      const email = decoded.email;
      const username = decoded.name || email.split("@")[0];
      const photoUrl = decoded.picture || "";
      await loginWithGoogle(email, username, photoUrl);
      const fromObjGoogle = (location.state as Record<string, unknown>)?.from;
      const fromGoogle =
        typeof fromObjGoogle === "object" &&
        fromObjGoogle &&
        "pathname" in fromObjGoogle
          ? (fromObjGoogle as { pathname: string }).pathname
          : "/";
      navigate(fromGoogle, { replace: true });
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        console.log("🔄 Server is waking up, showing cold start loading...");
      } else {
        setShowColdStartLoading(false);
        alert("Đăng nhập Google thất bại!");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleError = () => {
    alert("Đăng nhập Google thất bại!");
  };

  const handleForgotSendOtp = async () => {
    setForgotError("");
    setForgotLoading(true);
    try {
      if (!forgotEmail) {
        setForgotError("Vui lòng nhập email!");
        return;
      }
      if (
        !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(forgotEmail)
      ) {
        setForgotError("Email không hợp lệ!");
        return;
      }
      await sendResetPasswordEmailApi(forgotEmail);
      setForgotStep("otp");
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setForgotError(
        axiosErr?.response?.data?.message ||
          "Không gửi được OTP, kiểm tra email!"
      );
    }
    setForgotLoading(false);
  };

  const handleForgotVerifyOtp = async () => {
    setForgotError("");
    setForgotLoading(true);
    try {
      if (!forgotOtp) {
        setForgotError("Vui lòng nhập mã OTP!");
        return;
      }
      if (!/^\d{6}$/.test(forgotOtp)) {
        setForgotError("Mã OTP phải có 6 chữ số!");
        return;
      }
      const response = await fetch("/api/auth/check-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifyCode: forgotOtp }),
      });

      if (!response.ok) {
        throw new Error("OTP không đúng hoặc đã hết hạn!");
      }

      setForgotStep("newpass");
    } catch {
      setForgotError("OTP không đúng hoặc đã hết hạn!");
      setForgotOtp(""); // Clear OTP input when wrong
    }
    setForgotLoading(false);
  };

  const handleForgotChangePassword = async () => {
    setForgotError("");
    setForgotLoading(true);
    try {
      await changePasswordApi(forgotEmail, "", forgotNew, forgotConfirm);
      setForgotStep("login");
      setForgotEmail("");
      setForgotOtp("");
      setForgotNew("");
      setForgotConfirm("");
      setForgotToast("Đổi mật khẩu thành công!");
      setTimeout(() => setForgotToast(null), 2000);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setForgotError(
        axiosErr?.response?.data?.message || "Đổi mật khẩu thất bại!"
      );
    }
    setForgotLoading(false);
  };

  const handleColdStartTimeout = () => {
    setShowColdStartLoading(false);
    // Could implement offline mode or retry logic here
    alert("Server đang gặp vấn đề. Vui lòng thử lại sau.");
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-amber-50 overflow-hidden">
      {forgotToast && (
        <div className="fixed top-6 right-6 z-50 px-6 py-3 rounded-lg shadow-lg text-white text-base font-semibold transition-all bg-green-500">
          {forgotToast}
        </div>
      )}
      {forgotStep === "login" && (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 px-2 sm:px-4">
          {/* Khung login */}
          <div className="w-full max-w-lg mx-auto rounded-xl shadow-lg bg-white p-4 sm:p-6 md:p-8 flex flex-col justify-center border border-gray-200">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
              <img
                alt="PhilosoSpace Logo"
                src={logo}
                className="mx-auto h-16 w-auto"
              />
              <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-amber-900">
                Sign in to your account
              </h2>
              <h2 className="text-center text-l tracking-tight text-amber-800">
                Lần đầu sử dụng? Đăng nhập bằng Google để tạo tài khoản
              </h2>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="identifier"
                    className="block text-sm font-medium text-amber-900"
                  >
                    Email hoặc Username
                  </label>
                  <div className="mt-2">
                    <input
                      id="identifier"
                      name="identifier"
                      type="text"
                      autoComplete="username"
                      required
                      className="block w-full rounded-md bg-amber-50 px-3 py-1.5 text-base text-amber-900 border border-amber-300 placeholder:text-amber-500 focus:border-amber-600 focus:ring-2 focus:ring-amber-600 sm:text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading || isLoggingIn}
                      placeholder="Nhập email hoặc username"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-amber-900"
                    >
                      Password
                    </label>
                    <div className="text-sm">
                      <a
                        href="#"
                        className="font-semibold text-amber-600 hover:text-amber-500"
                        onClick={(e) => {
                          e.preventDefault();
                          setForgotStep("email");
                        }}
                      >
                        Forgot password?
                      </a>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="current-password"
                        className="block w-full rounded-md bg-amber-50 px-3 py-1.5 text-base text-amber-900 border border-amber-300 placeholder:text-amber-500 focus:border-amber-600 focus:ring-2 focus:ring-amber-600 sm:text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading || isLoggingIn}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-500"
                        onClick={() => setShowPassword((v) => !v)}
                        disabled={loading || isLoggingIn}
                        aria-label={
                          showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                        }
                      >
                        {showPassword ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.875-4.575A9.956 9.956 0 0122 9c0 5.523-4.477 10-10 10a9.956 9.956 0 01-4.575-1.125"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm2.021-2.021A9.956 9.956 0 0122 12c0 5.523-4.477 10-10 10S2 17.523 2 12c0-1.657.403-3.22 1.125-4.575M9.879 9.879A3 3 0 0115 12m-6 0a3 3 0 016 0m-6 0a3 3 0 016 0"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {authError && (
                  <div className="text-red-500 text-sm">{authError}</div>
                )}

                <div>
                  <button
                    type="submit"
                    className="flex w-full justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
                    disabled={loading || isLoggingIn}
                  >
                    {loading || isLoggingIn ? "Signing in..." : "Sign in"}
                  </button>
                </div>
              </form>
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-amber-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-amber-50 px-2 text-amber-600">
                      Or continue with
                    </span>
                  </div>
                </div>
                <div className="mt-6 w-full">
                  {!googleClientId ? (
                    <div className="text-amber-600 text-sm text-center">
                      <p>Google Sign-In temporarily unavailable</p>
                      <p className="text-xs mt-1">Vui lòng liên hệ admin để được hỗ trợ</p>
                    </div>
                  ) : (
                    <div className="w-full max-w-sm mx-auto">
                      <GoogleOAuthProvider clientId={googleClientId}>
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={handleGoogleError}
                          width="100%"
                          shape="pill"
                          text="signin_with"
                          logo_alignment="center"
                          useOneTap
                        />
                      </GoogleOAuthProvider>
                      <p className="text-xs text-amber-600 mt-2 text-center">
                        Đăng nhập bằng Google để tạo tài khoản mới
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {forgotStep === "email" && (
        <div className="relative z-20 w-full max-w-md mx-auto rounded-xl shadow-lg bg-amber-50/80 backdrop-blur-md p-8 flex flex-col justify-center border border-amber-200">
          <h2 className="text-2xl font-bold mb-6 text-center text-amber-900">Quên mật khẩu</h2>
          <label className="block text-amber-700 text-sm mb-2">Email</label>
          <input
            className="w-full border border-amber-300 rounded px-3 py-2 mb-3 bg-amber-50 text-amber-900 placeholder-amber-500 focus:border-amber-600 focus:ring-2 focus:ring-amber-600"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            placeholder="Nhập email đã đăng ký"
          />
          {forgotError && (
            <div className="text-red-500 text-xs mb-2">{forgotError}</div>
          )}
          <button
            className="w-full bg-amber-600 text-white py-2 rounded font-medium hover:bg-amber-500"
            onClick={handleForgotSendOtp}
            disabled={forgotLoading}
          >
            {forgotLoading ? "Đang gửi..." : "Gửi mã OTP"}
          </button>
          <button
            className="w-full mt-3 text-amber-600 hover:text-amber-700 text-sm"
            onClick={() => setForgotStep("login")}
          >
            Quay lại đăng nhập
          </button>
        </div>
      )}
      {forgotStep === "otp" && (
        <div className="relative z-20 w-full max-w-md mx-auto rounded-xl shadow-lg bg-amber-50/80 backdrop-blur-md p-8 flex flex-col justify-center border border-amber-200">
          <h2 className="text-2xl font-bold mb-6 text-center text-amber-900">Xác thực OTP</h2>
          <label className="block text-amber-700 text-sm mb-2">Mã OTP</label>
          <input
            className="w-full border border-amber-300 rounded px-3 py-2 mb-3 bg-amber-50 text-amber-900 placeholder-amber-500 focus:border-amber-600 focus:ring-2 focus:ring-amber-600"
            value={forgotOtp}
            onChange={(e) => setForgotOtp(e.target.value)}
            placeholder="Nhập mã OTP"
          />
          {forgotError && (
            <div className="text-red-500 text-xs mb-2">{forgotError}</div>
          )}
          <button
            className="w-full bg-amber-600 text-white py-2 rounded font-medium hover:bg-amber-500"
            onClick={handleForgotVerifyOtp}
            disabled={forgotLoading}
          >
            {forgotLoading ? "Đang xác thực..." : "Xác nhận OTP"}
          </button>
          <button
            className="w-full mt-3 text-amber-600 hover:text-amber-700 text-sm"
            onClick={() => setForgotStep("email")}
          >
            Quay lại nhập email
          </button>
        </div>
      )}
      {forgotStep === "newpass" && (
        <div className="relative z-20 w-full max-w-md mx-auto rounded-xl shadow-lg bg-amber-50/80 backdrop-blur-md p-8 flex flex-col justify-center border border-amber-200">
          <h2 className="text-2xl font-bold mb-6 text-center text-amber-900">
            Đặt lại mật khẩu mới
          </h2>
          <label className="block text-amber-700 text-sm mb-2">
            Mật khẩu mới
          </label>
          <div className="relative mb-2">
            <input
              type={showForgotNew ? "text" : "password"}
              className="w-full border border-amber-300 rounded px-3 py-2 pr-10 bg-amber-50 text-amber-900 placeholder-amber-500 focus:border-amber-600 focus:ring-2 focus:ring-amber-600"
              value={forgotNew}
              onChange={(e) => setForgotNew(e.target.value)}
              placeholder="Mật khẩu mới"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-500"
              onClick={() => setShowForgotNew((v) => !v)}
            >
              {showForgotNew ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="relative mb-3">
            <input
              type={showForgotConfirm ? "text" : "password"}
              className="w-full border border-amber-300 rounded px-3 py-2 pr-10 bg-amber-50 text-amber-900 placeholder-amber-500 focus:border-amber-600 focus:ring-2 focus:ring-amber-600"
              value={forgotConfirm}
              onChange={(e) => setForgotConfirm(e.target.value)}
              placeholder="Xác nhận mật khẩu"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-500"
              onClick={() => setShowForgotConfirm((v) => !v)}
            >
              {showForgotConfirm ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {forgotError && (
            <div className="text-red-500 text-xs mb-2">{forgotError}</div>
          )}
          <button
            className="w-full bg-amber-600 text-white py-2 rounded font-medium hover:bg-amber-500"
            onClick={handleForgotChangePassword}
            disabled={forgotLoading}
          >
            {forgotLoading ? "Đang đổi..." : "Đổi mật khẩu"}
          </button>
          <button
            className="w-full mt-3 text-amber-600 hover:text-amber-700 text-sm"
            onClick={() => setForgotStep("login")}
          >
            Quay lại đăng nhập
          </button>
        </div>
      )}
      {showColdStartLoading && (
        <ColdStartLoading onTimeout={handleColdStartTimeout} />
      )}
    </div>
  );
}

export default LoginPage;
