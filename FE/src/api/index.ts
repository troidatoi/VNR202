import axios from "axios";
import type { Quiz, Question } from "../types/global";

const API_URL = import.meta.env.VITE_API_URL || "https://mln111-1.onrender.com/api";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  registeredCount?: number;
}

interface CheckInResponse {
  success: boolean;
  message: string;
}

interface QuizHistoryItem {
  _id: string;
  quizId: {
    _id: string;
    title: string;
    description: string;
  };
  takenAt: string;
  totalScore: number;
  riskLevel: string;
  suggestedAction: string;
}

// API functions
export const getAllEventsApi = async (): Promise<Event[]> => {
  const response = await axios.get(`${API_URL}/events`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return response.data;
};

export const checkInEventApi = async (
  eventId: string,
  userId: string,
  qrCode: string
): Promise<ApiResponse<CheckInResponse>> => {
  const response = await axios.post(
    `${API_URL}/events/${eventId}/check-in`,
    {
      userId,
      qrCode,
    },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
  return response.data;
};

export const getUserQuizHistoryApi = async (
  userId: string
): Promise<ApiResponse<QuizHistoryItem[]>> => {
  const response = await axios.get(`${API_URL}/quizzes/history/${userId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return { success: true, data: response.data };
};

export const getAllBlogsApi = async (isAdmin?: boolean) => {
  const response = await axios.get(
    `${API_URL}/blogs${isAdmin ? "?isAdmin=true" : ""}`
  );
  return response.data;
};

// Quiz CRUD
export const createQuizApi = async (data: Quiz) => {
  const response = await axios.post(`${API_URL}/quizzes`, data);
  return response.data;
};
export const updateQuizApi = async (id: string, data: Partial<Quiz>) => {
  const response = await axios.put(`${API_URL}/quizzes/${id}`, data);
  return response.data;
};
export const deleteQuizApi = async (id: string) => {
  const response = await axios.delete(`${API_URL}/quizzes/${id}`);
  return response.data;
};
export const getQuizByIdApi = async (id: string) => {
  const response = await axios.get(`${API_URL}/quizzes/${id}`);
  return response.data;
};
// Question CRUD
export const createQuestionApi = async (data: Partial<Question>) => {
  const response = await axios.post(`${API_URL}/questions`, data);
  return response.data;
};
export const updateQuestionApi = async (
  id: string,
  data: Partial<Question>
) => {
  const response = await axios.put(`${API_URL}/questions/${id}`, data);
  return response.data;
};
export const deleteQuestionApi = async (id: string) => {
  const response = await axios.delete(`${API_URL}/questions/${id}`);
  return response.data;
};
export const getQuestionsByQuizApi = async (quizId: string) => {
  const response = await axios.get(`${API_URL}/questions/quiz/${quizId}`);
  return response.data;
};
export const getQuestionByIdApi = async (id: string) => {
  const response = await axios.get(`${API_URL}/questions/${id}`);
  return response.data;
};

export const getAllQuizzesApi = async (
  params?: Record<string, unknown>
): Promise<{ data: Quiz[] }> => {
  const response = await axios.get(`${API_URL}/quizzes`, { params });
  return response.data;
};

export const getQuizResultByIdApi = async (resultId: string) => {
  const response = await axios.get(
    `${API_URL}/quizzes/quiz-results/result/${resultId}`
  );
  return response.data;
};

export const uploadAvatarApi = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append("image", file);
  const response = await axios.post(
    "https://mln111-1.onrender.com/api/uploads/upload",
    form,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
  return response.data.imageUrl; // BE trả về { imageUrl }
};

// Lấy feedback của 1 sự kiện
export const getEventFeedbacksApi = async (eventId: string) => {
  const response = await axios.get(`${API_URL}/event-feedback/${eventId}`);
  return response.data;
};
