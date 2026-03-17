import React, { createContext, useContext, useState, useEffect } from "react";
import { loginApi, loginWithGoogleApi, getAccountByIdApi } from "../api";

interface User {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  role: "admin" | "consultant" | "customer";
  photoUrl?: string;
  isVerified: boolean;
  isDisabled: boolean;
  phoneNumber?: string;
  gender?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (
    email: string,
    username: string,
    photoUrl: string
  ) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUserInfo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateUserInfo = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (token && userId) {
      try {
        const userData = await getAccountByIdApi(userId);
        setUser(userData);
        localStorage.setItem("userInfo", JSON.stringify(userData));
      } catch (err) {
        console.error("Lỗi khi cập nhật thông tin user:", err);
      }
    }
  };

  useEffect(() => {
    // Kiểm tra token và lấy thông tin user khi component mount
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const cachedUserInfo = localStorage.getItem("userInfo");

    if (token && userId) {
      // Nếu có cached user info, sử dụng ngay để tránh loading
      if (cachedUserInfo) {
        try {
          const userData = JSON.parse(cachedUserInfo);
          setUser(userData);
          setLoading(false);

          // Fetch fresh data in background
          updateUserInfo();
        } catch (err) {
          console.error("Lỗi khi parse cached user info:", err);
          localStorage.removeItem("userInfo");
          // Fallback to API call
          const fetchUser = async () => {
            try {
              const userData = await getAccountByIdApi(userId);
              setUser(userData);
              localStorage.setItem("userInfo", JSON.stringify(userData));
            } catch (err) {
              console.error("Lỗi khi lấy thông tin user:", err);
              localStorage.removeItem("token");
              localStorage.removeItem("userId");
              localStorage.removeItem("userInfo");
            } finally {
              setLoading(false);
            }
          };
          fetchUser();
        }
      } else {
        // Không có cache, gọi API
        const fetchUser = async () => {
          try {
            const userData = await getAccountByIdApi(userId);
            setUser(userData);
            localStorage.setItem("userInfo", JSON.stringify(userData));
          } catch (err) {
            console.error("Lỗi khi lấy thông tin user:", err);
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            localStorage.removeItem("userInfo");
          } finally {
            setLoading(false);
          }
        };
        fetchUser();
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await loginApi(email, password);

      // Cache user info từ response login để tránh gọi API thêm
      const userInfo = {
        _id: data.data.id,
        username: data.data.username,
        email: data.data.email,
        role: data.data.role,
        isVerified: data.data.isVerified,
        // Các field khác sẽ được cập nhật sau
        fullName: data.data.fullName || "",
        photoUrl: data.data.photoUrl || "",
        isDisabled: false,
        phoneNumber: data.data.phoneNumber || "",
        gender: data.data.gender || "",
      };

      localStorage.setItem("token", data.data.token);
      localStorage.setItem("userId", data.data.id);
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
      setUser(userInfo);

      // Fetch complete user info in background
      setTimeout(() => {
        updateUserInfo();
      }, 100);
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (
    email: string,
    username: string,
    photoUrl: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const data = await loginWithGoogleApi(email, username, photoUrl);

      // Cache user info từ response login
      const userInfo = {
        _id: data.data.id,
        username: data.data.username,
        email: data.data.email,
        role: data.data.role,
        isVerified: data.data.isVerified,
        fullName: data.data.fullName || "",
        photoUrl: data.data.photoUrl || photoUrl,
        isDisabled: false,
        phoneNumber: data.data.phoneNumber || "",
        gender: data.data.gender || "",
      };

      localStorage.setItem("token", data.data.token);
      localStorage.setItem("userId", data.data.id);
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
      setUser(userInfo);

      // Fetch complete user info in background
      setTimeout(() => {
        updateUserInfo();
      }, 100);
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng nhập Google thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userInfo");
    setUser(null);
    setError(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        loginWithGoogle,
        logout,
        isAuthenticated,
        updateUserInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
