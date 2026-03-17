import { Request, Response } from "express";
import SlotTime from "../models/SlotTime";
import Appointment from "../models/Appointment";
import Consultant from "../models/Consultant";
import Account from "../models/Account";

export const getAllSlotTime = async (req: Request, res: Response) => {
    try {
        const slotTime = await SlotTime.find();
        res.status(200).json(slotTime);
    } catch (error) {
        res.status(500).json({ message: "Xảy ra lỗi khi lấy tất cả slot time",error });
    }
}
export const getSlotTimeById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const slotTime = await SlotTime.findById(id);
        res.status(200).json(slotTime);
    } catch (error) {
        res.status(500).json({ message: "Xảy ra lỗi khi lấy slot time theo id",error });
    }
}

export const getSlotTimeByConsultantId = async (req: Request, res: Response) => {
    try {
        const { consultant_id } = req.params;
        const slotTime = await SlotTime.find({ consultant_id });
        res.status(200).json(slotTime);
    } catch (error) {
        res.status(500).json({ message: "Xảy ra lỗi khi lấy slot time theo consultant_id",error });
    }
}

// Hàm lấy ngày đầu tuần (thứ 2)
function getStartOfWeek(date: string | Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export const createSlotTime = async (req: Request, res: Response) => {
    try {
        const { consultant_id: tuVanVien_id, slots: danhSachSlot } = req.body;
        // slots: [{ start_time, end_time }]
        if (!Array.isArray(danhSachSlot) || danhSachSlot.length === 0) {
          return res.status(400).json({ message: "Danh sách slot không hợp lệ!" });
        }
        // Lấy ngày đầu tuần của slot đầu tiên
        const dauTuan = getStartOfWeek(danhSachSlot[0].start_time);
        dauTuan.setUTCHours(0, 0, 0, 0);
        const cuoiTuan = new Date(dauTuan);
        cuoiTuan.setUTCDate(dauTuan.getUTCDate() + 6);
        cuoiTuan.setUTCHours(23, 59, 59, 999);
        // Lấy tất cả slot time của tư vấn viên trong tuần này
        const slotDaCo = await SlotTime.find({
          consultant_id: tuVanVien_id,
          start_time: { $gte: dauTuan, $lte: cuoiTuan }
        });
        // Lọc ra các slot thực sự mới (chưa tồn tại trong tuần)
        const slotMoi = danhSachSlot.filter(slot => {
          return !slotDaCo.some(st => new Date(st.start_time).getTime() === new Date(slot.start_time).getTime());
        });
        // LOG DEBUG
        console.log('DEBUG BE: dauTuan =', dauTuan, 'cuoiTuan =', cuoiTuan);
        console.log('DEBUG BE: slotDaCo.length =', slotDaCo.length, 'slotMoi.length =', slotMoi.length);
        console.log('DEBUG BE: slotDaCo =', slotDaCo.map(s => s.start_time));
        console.log('DEBUG BE: slotMoi =', slotMoi.map(s => s.start_time));
        // Tổng slot sau khi thêm slot mới
        // Nếu đã đủ 20 slot thì luôn cho đăng ký thêm slot mới
       
        // Tạo các slot mới (chỉ tạo slot chưa tồn tại)
        const slotTaoMoi = [];
        for (const slot of slotMoi) {
          const newSlot = await SlotTime.create({
            consultant_id: tuVanVien_id,
            start_time: slot.start_time,
            end_time: slot.end_time
          });
          slotTaoMoi.push(newSlot);
        }
        res.status(201).json({ message: "Tạo slot time thành công", data: slotTaoMoi });
    } catch (error) {
        res.status(500).json({ message: "Xảy ra lỗi khi tạo slot time",error });
    }
}
export const updateSlotTime = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { start_time, end_time } = req.body;
        const slotTime = await SlotTime.findByIdAndUpdate(id, { start_time, end_time }, { new: true });
        res.status(200).json({ message: "Slot time updated successfully",data:slotTime });
    } catch (error) {
        res.status(500).json({ message: "Xảy ra lỗi khi cập nhật slot time",error });
    }
}   
export const updateStatusSlotTime = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;  
        const { status, userId } = req.body;
        
        // Lấy thông tin slot hiện tại
        const currentSlot = await SlotTime.findById(id);
        if (!currentSlot) {
            return res.status(404).json({ message: "Không tìm thấy slot time" });
        }
        
        let update: any = { status };
        
        // Validation dựa trên trạng thái mới
        if (status === 'booked') {
            // Chỉ cho phép book slot nếu đang available
            if (currentSlot.status !== 'available') {
                return res.status(400).json({ 
                    message: "Slot này không thể đặt (đã được đặt hoặc không khả dụng)",
                    currentStatus: currentSlot.status 
                });
            }
            
            // Kiểm tra userId được cung cấp
            if (!userId) {
                return res.status(400).json({ message: "Thiếu thông tin userId để hold slot" });
            }
            
            update.holdedBy = userId;
        } 
        else if (status === 'available') {
            // Khi release slot, kiểm tra quyền
            if (currentSlot.status === 'booked' && currentSlot.holdedBy) {
                // Nếu slot đang được hold bởi user khác, không cho phép release
                if (userId && currentSlot.holdedBy.toString() !== userId) {
                    return res.status(403).json({ 
                        message: "Bạn không có quyền release slot này (slot đang được hold bởi user khác)" 
                    });
                }
            }
            
            update.holdedBy = null;
        }
        
        // Sử dụng findOneAndUpdate với điều kiện để tránh race condition
        const slotTime = await SlotTime.findOneAndUpdate(
            { 
                _id: id,
                // Điều kiện bổ sung để đảm bảo atomic update
                ...(status === 'booked' ? { status: 'available' } : {})
            },
            update, 
            { new: true }
        );
        
        if (!slotTime) {
            return res.status(409).json({ 
                message: "Không thể cập nhật slot - có thể đã bị thay đổi bởi user khác. Vui lòng refresh và thử lại." 
            });
        }
        
        res.status(200).json({ 
            message: "Cập nhật trạng thái slot time thành công",
            data: slotTime 
        });
    } catch (error) {
        console.error("Error updating slot status:", error);
        res.status(500).json({ message: "Xảy ra lỗi khi cập nhật trạng thái slot time", error });
    }
}   

export const deleteSlotTime = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const slotTime = await SlotTime.findById(id);
        const appointment = await Appointment.find({ slot_time_id: id });
        if (appointment.length > 0) {
            return res.status(400).json({ message: "Không thể xóa slot time đã được đặt",data:slotTime });
        }
        if(slotTime?.status === "booked"){
            return res.status(400).json({ message: "Không thể xóa slot time đã được đặt",data:slotTime });
        }
        if (!slotTime) {
          return res.status(404).json({ message: "Không tìm thấy slot time" });
        }
        // Lấy ngày đầu tuần của slotTime
        const weekStart = getStartOfWeek(slotTime.start_time);
        weekStart.setUTCHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
        weekEnd.setUTCHours(23, 59, 59, 999);
        // Đếm số slot time của consultant trong tuần này (trừ slot chuẩn bị xóa)
        const slotTimes = await SlotTime.find({
          consultant_id: slotTime.consultant_id,
          start_time: { $gte: weekStart, $lte: weekEnd },
          _id: { $ne: id }
        });
       
        await SlotTime.findByIdAndDelete(id);
        res.status(200).json({ message: "Xóa slot time thành công",data:slotTime });
    } catch (error) {
        res.status(500).json({ message: "Xảy ra lỗi khi xóa slot time",error });
    }
}

// API lấy danh sách tư vấn viên rảnh cho từng khung giờ trong một ngày
export const getAvailableConsultantsByDay = async (req: Request, res: Response) => {
    try {
        const { date } = req.params; // yyyy-MM-dd
        if (!date) return res.status(400).json({ message: "Thiếu tham số ngày" });

        // Tính khoảng thời gian theo giờ Việt Nam (GMT+7)
        const startOfDayVN = new Date(date + 'T00:00:00+07:00');
        const endOfDayVN = new Date(date + 'T23:59:59.999+07:00');

        console.log('startOfDayVN:', startOfDayVN);
        console.log('endOfDayVN:', endOfDayVN);

        // Lấy tất cả slot available trong ngày, KHÔNG loại trùng lặp
        const slots = await SlotTime.find({
            start_time: { $gte: startOfDayVN, $lte: endOfDayVN },
            status: "available"
        }).populate({
            path: "consultant_id",
            populate: { path: "accountId", model: "Account" }
        });

        console.log('Filtered slots:', slots);

        // Group lại theo khung giờ chuẩn (08:00, 09:00,...)
        const timeSlots = [
            "08:00", "09:00", "10:00", "11:00",
            "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
        ];

        const result = timeSlots.map(slot => {
            // Tìm tất cả slot có start_time đúng giờ này (theo giờ Việt Nam GMT+7)
            const availableSlots = slots.filter(st => {
                const d = new Date(st.start_time);
                const hourVN = d.getHours();
                const hourStr = hourVN.toString().padStart(2, '0') + ":00";
                return hourStr === slot;
            });

            const availableConsultants = availableSlots.map(st => {
                const consultant = st.consultant_id as any;
                if (!consultant || !consultant.accountId) return null;
                const acc = consultant.accountId as any;
                return {
                    _id: consultant._id,
                    fullName: acc.fullName,
                    photoUrl: acc.photoUrl,
                    email: acc.email,
                    phoneNumber: acc.phoneNumber,
                    gender: acc.gender,
                    introduction: consultant.introduction,
                    experience: consultant.experience,
                    contact: consultant.contact
                };
            }).filter(Boolean);

            return {
                time: slot,
                status: availableConsultants.length > 0 ? "available" : "none",
                availableConsultants
            };
        });

        res.status(200).json({ date, slots: result });
    } catch (error) {
        res.status(500).json({ message: "Xảy ra lỗi khi lấy danh sách tư vấn viên rảnh theo ngày", error });
    }
}