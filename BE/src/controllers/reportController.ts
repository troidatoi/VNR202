import { Request, Response } from "express";
import { Report } from "../models/Report";
import Account from "../models/Account";
import Appointment from "../models/Appointment";


export const createReport = async (req: Request, res: Response) => {
    const { account_id, appointment_id, consultant_id, nameOfPatient, age, gender, condition, notes, recommendations, status } = req.body; // status: approved, pending, rejected
    if (!account_id || !appointment_id || !nameOfPatient || !age || !gender || !condition || !consultant_id) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin, không được để trống" });
    }
    const account = await Account.findById(account_id);
    if (!account) {
        return res.status(404).json({ message: "Tài khoản không tồn tại" });
    }
    const appointment = await Appointment.findById(appointment_id);
    if (!appointment) {
        return res.status(404).json({ message: "Lịch hẹn không tồn tại" });
    }
    if(appointment.status == "cancelled") {
        return res.status(400).json({ message: "Lịch hẹn đã bị hủy" });
    }
    if(appointment.status == "completed") {
        return res.status(400).json({ message: "Lịch hẹn này đã được viết báo cáocáo" });
    }
    if(appointment.status == "pending") {
        return res.status(400).json({ message: "Lịch hẹn đang chờ" });
    }
    const report = new Report({ account_id, appointment_id, consultant_id, nameOfPatient, age, gender, condition, notes, recommendations, status });

     appointment.status = "completed";
    await appointment.save();
    await report.save();
    res.status(201).json(report);
}

export const getReportById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const report = await Report.findById(id);
    res.status(200).json(report);
}

export const updateReport = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nameOfPatient, age, gender, condition, notes, recommendations ,status} = req.body;
    const report = await Report.findByIdAndUpdate(id, { nameOfPatient, age, gender, condition, notes, recommendations ,status}, { new: true });
    if (!report) {
        return res.status(404).json({ message: "Report not found" });
    }
    res.status(200).json(report);
}

export const getReportByAppointmentId = async (req: Request, res: Response) => {
    const { id } = req.params;
    const report = await Report.find({ appointment_id: id });
    res.status(200).json(report);
}

export const getReportByAccountId = async (req: Request, res: Response) => {
    const { id } = req.params;
    const report = await Report.find({ account_id: id });
    if (!report) {
        return res.status(404).json({ message: "Người dùng không có báo cáo" });
    }

    res.status(200).json(report);
}

export const getReportByConsultantId = async (req: Request, res: Response) => {
    const { id } = req.params;
    const report = await Report.find({ consultant_id: id });
    if (!report) {
        return res.status(404).json({ message: "Báo cáo không tồn tại" });
    }
    res.status(200).json(report);
}

