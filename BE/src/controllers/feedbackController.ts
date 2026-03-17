import { Request, Response } from "express";
import Feedback from "../models/Feedback";
import Account from "../models/Account";
import Appointment from "../models/Appointment";
import Service from "../models/Service";
import mongoose from "mongoose";

// Helper function để cập nhật rating của dịch vụ
async function updateServiceRatingAfterFeedback(serviceId: mongoose.Types.ObjectId | string) {
    try {
        // Lấy tất cả feedback đã được phê duyệt của dịch vụ
        const feedbacks = await Feedback.find({ 
            service_id: serviceId,
            status: "approved"
        });
        
        // Lấy thông tin service
        const service = await Service.findById(serviceId);
        if (!service) return;
        
        // Nếu không có feedback nào, set rating về 0
        if (feedbacks.length === 0) {
            service.rating = 0;
        } else {
            // Tính trung bình cộng rating
            const totalRating = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
            const averageRating = totalRating / feedbacks.length;
            
            // Làm tròn đến 1 chữ số thập phân
            service.rating = Math.round(averageRating * 10) / 10;
        }
        
        // Lưu lại service với rating đã cập nhật
        await service.save();
    } catch (error) {
        console.error("Lỗi khi cập nhật rating service:", error);
    }
}

export const createFeedback = async (req: Request, res: Response) => {
    try {
        const { account_id, appointment_id, service_id, rating, comment } = req.body;

        // Kiểm tra rating hợp lệ
        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating phải là số từ 1 đến 5" });
        }

        const newFeedback = new Feedback({
            account_id,
            appointment_id,
            service_id,
            rating,
            comment,
            status: "approved", // Mặc định là approved hoặc có thể thay đổi theo nhu cầu
            feedback_date: new Date()
        });

        const savedFeedback = await newFeedback.save();
        
        // Cập nhật rating trong service
        await updateServiceRatingAfterFeedback(service_id);
        
        res.status(201).json(savedFeedback);
    } catch (error) {
        console.error("Lỗi khi tạo feedback:", error);
        res.status(500).json({ message: "Lỗi khi tạo feedback", error });
    }
};

export const updateFeedbackStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Trạng thái không hợp lệ" });
        }

        const feedback = await Feedback.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!feedback) {
            return res.status(404).json({ message: "Feedback không tồn tại" });
        }

        // Cập nhật rating trong service khi trạng thái feedback thay đổi
        await updateServiceRatingAfterFeedback(feedback.service_id);

        res.status(200).json(feedback);
    } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái feedback:", error);
        res.status(500).json({ message: "Lỗi khi cập nhật trạng thái feedback", error });
    }
};

export const getAllFeedbacks = async (req: Request, res: Response) => {
    try {
        const feedbacks = await Feedback.find()
            .populate("account_id", "fullName email photoUrl")
            .populate("service_id", "name");
            
        res.status(200).json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy danh sách feedback", error });
    }
};

export const getFeedbackById = async (req: Request, res: Response) => {
    try {
        const feedback = await Feedback.findById(req.params.id)
            .populate("account_id", "fullName email photoUrl")
            .populate("service_id", "name");
            
        if (!feedback) {
            return res.status(404).json({ message: "Feedback không tồn tại" });
        }
        
        res.status(200).json(feedback);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy thông tin feedback", error });
    }
};

export const getFeedbacksByServiceId = async (req: Request, res: Response) => {
    try {
        const feedbacks = await Feedback.find({ service_id: req.params.serviceId })
            .populate("account_id", "fullName email photoUrl")
            .sort({ feedback_date: -1 }); // Sắp xếp theo thời gian mới nhất
            
        res.status(200).json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy feedback theo dịch vụ", error });
    }
};

export const getFeedbacksByAccountId = async (req: Request, res: Response) => {
    try {
        const feedbacks = await Feedback.find({ account_id: req.params.accountId })
            .populate("service_id", "name")
            .sort({ feedback_date: -1 });
            
        res.status(200).json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy feedback theo người dùng", error });
    }
};

export const getFeedbacksByAppointmentId = async (req: Request, res: Response) => {
    try {
        const feedbacks = await Feedback.find({ appointment_id: req.params.appointmentId })
            .populate("account_id", "fullName email photoUrl")
            .sort({ feedback_date: -1 }); // Sắp xếp theo thời gian mới nhất
            
        res.status(200).json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy feedback theo appointment", error });
    }
};