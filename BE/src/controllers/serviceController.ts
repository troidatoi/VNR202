import { Request, Response } from "express";
import Service from "../models/Service";
import Feedback from "../models/Feedback";
import mongoose from "mongoose";

export const createService = async(req:Request,res:Response)=>{
    try {
        const {name,description,price,image, status, level} = req.body;
        // Validation thủ công
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({message: "Tên dịch vụ không hợp lệ!"});
        }
        if (!description || typeof description !== 'string' || !description.trim()) {
            return res.status(400).json({message: "Mô tả dịch vụ không hợp lệ!"});
        }
        if (typeof price !== 'number') {
            return res.status(400).json({message: "Giá dịch vụ phải là số!"});
        }
        if (!image || typeof image !== 'string' || !image.trim()) {
            return res.status(400).json({message: "Hình ảnh dịch vụ không hợp lệ!"});
        }
        // Status hợp lệ
        const validStatus = ["active", "inactive", "deleted"];
        const serviceStatus = status && validStatus.includes(status) ? status : "active";
        // Level hợp lệ nếu có
        const validLevels = ["low", "moderate", "high", "critical"];
        if (level && !validLevels.includes(level)) {
            return res.status(400).json({message: "Level dịch vụ không hợp lệ!"});
        }
        const service = new Service({name,description,price,image, status: serviceStatus, ...(level && {level})});
        await service.save();
        res.status(201).json(service);
    } catch (error) {
        res.status(500).json({message:"Lỗi khi tạo dịch vụ",error});
    }
}

export const getAllServices = async(req:Request,res:Response)=>{
    try {
        const services = await Service.find();
        res.status(200).json(services);
    } catch (error) {
        res.status(500).json({message:"Lỗi khi lấy danh sách dịch vụ",error});
    }
}

export const getServiceById = async(req:Request,res:Response)=>{
    try {
        const service = await Service.findById(req.params.id);
        if(!service){
            return res.status(404).json({message:"Dịch vụ không tồn tại"});
        }
        res.status(200).json(service);
    } catch (error) {
        res.status(500).json({message:"Lỗi khi lấy dịch vụ",error});
    }
}

export const updateService = async(req:Request,res:Response)=>{
    try {
        const { level } = req.body;
        if (level) {
            const validLevels = ["low", "moderate", "high", "critical"];
            if (!validLevels.includes(level)) {
                return res.status(400).json({message: "Level dịch vụ không hợp lệ!"});
            }
        }
        const service = await Service.findByIdAndUpdate(req.params.id,req.body,{new:true});
        if(!service){
            return res.status(404).json({message:"Dịch vụ không tồn tại"});
        }
        res.status(200).json({
            message: "Cập nhật dịch vụ thành công",
            data: service
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật dịch vụ:", error);
        res.status(500).json({
            message: "Lỗi khi cập nhật dịch vụ",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
}

export const deleteService = async(req:Request,res:Response)=>{
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if(!service){
            return res.status(404).json({message:"Dịch vụ không tồn tại"});
        }
        res.status(200).json({message:"Dịch vụ đã được xóa"});
    } catch (error) {
        res.status(500).json({message:"Lỗi khi xóa dịch vụ",error});
    }
}

export const getServiceByStatus = async(req:Request,res:Response)=>{
    try {
        const {status} = req.query;
        const services = await Service.find({status});
        res.status(200).json(services);
    } catch (error) {
        res.status(500).json({message:"Lỗi khi lấy dịch vụ theo trạng thái",error});
    }
}

export const getServiceRating = async(req: Request, res: Response) => {
    try {
        const serviceId = req.params.id;
        
        // Kiểm tra ID hợp lệ
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
            return res.status(400).json({ message: "ID dịch vụ không hợp lệ" });
        }
        
        // Kiểm tra dịch vụ tồn tại
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: "Dịch vụ không tồn tại" });
        }
        
        // Tính trung bình rating từ tất cả feedback của dịch vụ này
        const feedbacks = await Feedback.find({ 
            service_id: serviceId,
            status: "approved" // Chỉ tính các feedback đã được phê duyệt
        });
        
        if (feedbacks.length === 0) {
            return res.status(200).json({ 
                serviceId, 
                averageRating: 0, 
                feedbackCount: 0,
                message: "Chưa có đánh giá nào cho dịch vụ này" 
            });
        }
        
        // Tính trung bình cộng
        const totalRating = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
        const averageRating = totalRating / feedbacks.length;
        
        // Làm tròn đến 1 chữ số thập phân
        const roundedRating = Math.round(averageRating * 10) / 10;
        
        res.status(200).json({ 
            serviceId, 
            averageRating: roundedRating, 
            feedbackCount: feedbacks.length,
            message: "Lấy thông tin đánh giá thành công" 
        });
    } catch (error) {
        console.error("Lỗi khi lấy thông tin rating:", error);
        res.status(500).json({ message: "Lỗi khi lấy thông tin rating", error });
    }
};

export const updateServiceRating = async(req: Request, res: Response) => {
    try {
        const serviceId = req.params.id;
        
        // Kiểm tra ID hợp lệ
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
            return res.status(400).json({ message: "ID dịch vụ không hợp lệ" });
        }
        
        // Kiểm tra dịch vụ tồn tại
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: "Dịch vụ không tồn tại" });
        }
        
        // Tính trung bình rating từ tất cả feedback của dịch vụ này
        const feedbacks = await Feedback.find({ 
            service_id: serviceId,
            status: "approved" // Chỉ tính các feedback đã được phê duyệt
        });
        
        // Nếu không có feedback nào, set rating về 0
        if (feedbacks.length === 0) {
            service.rating = 0;
        } else {
            // Tính trung bình cộng
            const totalRating = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
            const averageRating = totalRating / feedbacks.length;
            
            // Làm tròn đến 1 chữ số thập phân
            service.rating = Math.round(averageRating * 10) / 10;
        }
        
        // Lưu service với rating mới
        await service.save();
        
        res.status(200).json({ 
            serviceId, 
            averageRating: service.rating, 
            feedbackCount: feedbacks.length,
            message: "Cập nhật rating thành công" 
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật rating:", error);
        res.status(500).json({ message: "Lỗi khi cập nhật rating", error });
    }
};