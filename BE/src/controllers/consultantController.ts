import { Request, Response } from "express";
import Consultant, { IConsultant } from "../models/Consultant";
import Account from "../models/Account";

export const createConsultant =async(req:Request,res:Response):Promise<void>=>{
    try {
        const consultant = new Consultant(req.body);
        const saved = await consultant.save();
        const populatedConsultant = await Consultant.findById(saved._id).populate('accountId');
        res.status(201).json(populatedConsultant);
    } catch (error) {
        res.status(400).json({ message: "Tạo tư vấn viên thất bại", error });
    }
}
export const getAllConsultants = async(req:Request,res:Response):Promise<void>=>{ 
    try {
        const consultants = await Consultant.find().populate('accountId');
        res.status(200).json(consultants);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy danh sách tư vấn viên", error });
    }
}
export const getConsultantById = async(req:Request,res:Response):Promise<void>=>{   
    try {
        const consultant = await Consultant.findById(req.params.id).populate('accountId');
        if (!consultant) {
            res.status(404).json({ message: "Không tìm thấy tư vấn viên" });
            return;
        }
        res.status(200).json(consultant);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy tư vấn viên", error });
    }
}
export const updateConsultant = async(req:Request,res:Response):Promise<void>=>{
    try {
        const consultant = await Consultant.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('accountId');
        if (!consultant) {
            res.status(404).json({ message: "Không tìm thấy tư vấn viên" });
            return;
        }
        res.status(200).json(consultant);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi cập nhật tư vấn viên", error });
    }
}
export const deleteConsultant = async(req:Request,res:Response):Promise<void>=>{  
    try {
        const consultant = await Consultant.findByIdAndUpdate(req.params.id, { status: "isDeleted" }, { new: true }).populate('accountId');
        res.status(200).json(consultant);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi xóa tư vấn viên", error });
    }
}
export const getConsultantByAccountId = async(req:Request,res:Response):Promise<void>=>{
    try {
        const consultant = await Consultant.findOne({ accountId: req.params.accountId }).populate('accountId');
        if (!consultant) {
            res.status(404).json({ message: "Không tìm thấy tư vấn viên" });
            return;
        }
        res.status(200).json(consultant);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy tư vấn viên", error });
    }
}