import { Request, Response } from "express";
import Event, { IEvent } from "../models/Event";
import Account from "../models/Account";
import mongoose, { Document, Types } from "mongoose";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import EventRegistration from "../models/EventRegistration";

interface CheckInUser {
  userId: Types.ObjectId;
  checkedInAt: Date;
}

interface RegisteredUser {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// [POST] /api/events - Tạo sự kiện mới
export const createEvent = async (req: Request, res: Response) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: "Lỗi khi tạo sự kiện", error });
  }
};
// [GET] /api/events - Lấy danh sách sự kiện
export const getAllEvents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Populate sponsorId để lấy logo, name
    const events = await Event.find().populate('sponsors.sponsorId');
    
    // Tính toán số người đăng ký cho mỗi event
    const eventsWithRegistrationCount = await Promise.all(
      events.map(async (event) => {
        const registrationCount = await EventRegistration.countDocuments({
          eventId: event._id,
          status: "active"
        });
        const eventObj = event.toObject();
        // Map lại sponsors để trả về đầy đủ thông tin
        const sponsors = (eventObj.sponsors || []).map((s: any) => ({
          sponsorId: s.sponsorId?._id || s.sponsorId || '',
          name: s.sponsorId?.name || '',
          logo: s.sponsorId?.logo || '',
          tier: s.tier,
          donation: s.donation
        }));
        return {
          ...eventObj,
          sponsors,
          registeredCount: registrationCount
        };
      })
    );
    
    res.status(200).json(eventsWithRegistrationCount);
  } catch (error) {
    res.status(400).json({ message: "Lỗi khi lấy danh sách sự kiện", error });
  }
};

// [GET] /api/events/:id - Lấy chi tiết sự kiện
export const getEventById = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id).populate('sponsors.sponsorId');
    if (!event) {
      res.status(404).json({ message: "Không tìm thấy sự kiện" });
      return;
    }
    
    // Tính toán số người đăng ký
    const registrationCount = await EventRegistration.countDocuments({
      eventId: event._id,
      status: "active"
    });
    
    const eventObj = event.toObject();
    // Map lại sponsors để trả về đầy đủ thông tin
    const sponsors = (eventObj.sponsors || []).map((s: any) => ({
      sponsorId: s.sponsorId?._id || s.sponsorId || '',
      name: s.sponsorId?.name || '',
      logo: s.sponsorId?.logo || '',
      tier: s.tier,
      donation: s.donation
    }));
    const eventWithCount = {
      ...eventObj,
      sponsors,
      registeredCount: registrationCount
    };
    res.status(200).json(eventWithCount);
  } catch (error) {
    res.status(400).json({ message: "Lỗi khi lấy thông tin sự kiện", error });
  }
};

// [PUT] /api/events/:id - Cập nhật sự kiện
export const updateEvent = async (req: Request, res: Response) => {
  try {
    let event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Không tìm thấy sự kiện" });
    }
    // Cập nhật các trường từ req.body (trừ status)
    Object.keys(req.body).forEach((key) => {
      if (key !== "status") {
        (event as any)[key] = req.body[key];
      }
    });
    // Nếu status là cancelled thì giữ nguyên
    if (event.status !== "cancelled") {
      const now = new Date();
      if (event.startDate > now) {
        event.status = "upcoming";
      } else if (event.endDate < now) {
        event.status = "completed";
      } else {
        event.status = "ongoing";
      }
    }
    await event.save();
    res.status(200).json(event);
  } catch (error) {
    res.status(400).json({ message: "Lỗi khi cập nhật sự kiện", error });
  }
};

// [DELETE] /api/events/:id - Xóa sự kiện
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Kiểm tra sự kiện tồn tại
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Kiểm tra xem có ai đăng ký chưa
    const registrationCount = await EventRegistration.countDocuments({ eventId: id });
    
    if (registrationCount > 0) {
      return res.status(400).json({ 
        message: "Không thể xóa sự kiện có người đăng ký",
        registrationCount 
      });
    }

    // Nếu chưa có ai đăng ký, tiến hành xóa
    await Event.findByIdAndDelete(id);

    res.status(200).json({ 
      message: "Event deleted successfully",
      deletedEventId: id 
    });

  } catch (error) {
    console.error('Error in deleteEvent:', error);
    res.status(500).json({ 
      message: "Error deleting event",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// [POST] /api/events/:id/register - Đăng ký tham gia sự kiện
export const registerEvent = async (
  req: Request<{ id: string }, {}, { userId: string }>,
  res: Response
): Promise<void> => {
  try {
    // Kiểm tra account tồn tại
    const account = await Account.findById(req.body.userId);
    if (!account) {
      res.status(404).json({ message: "Không tìm thấy tài khoản" });
      return;
    }

    // Kiểm tra tài khoản đã xác thực chưa
    if (!account.isVerified) {
      res.status(403).json({ message: "Vui lòng xác thực tài khoản trước khi đăng ký sự kiện" });
      return;
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ message: "Không tìm thấy sự kiện" });
      return;
    }

    // Kiểm tra trạng thái sự kiện
    if (event.status !== "upcoming") {
      res
        .status(400)
        .json({ message: "Chỉ có thể đăng ký sự kiện sắp diễn ra" });
      return;
    }

    // Kiểm tra số lượng đăng ký
    const registrationCount = await EventRegistration.countDocuments({
      eventId: event._id,
      status: "active"
    });
    if (registrationCount >= event.capacity) {
      res.status(400).json({ message: "Sự kiện đã đủ số lượng đăng ký" });
      return;
    }

    // Kiểm tra người dùng đã đăng ký chưa
    const existingRegistration = await EventRegistration.findOne({
      userId: req.body.userId,
      eventId: event._id,
    });

    if (existingRegistration) {
      if (existingRegistration.status === 'cancelled') {
        // Tạo JWT token mới
        const token = jwt.sign(
          {
            userId: req.body.userId,
            eventId: event._id,
            timestamp: new Date().toISOString(),
          },
          JWT_SECRET,
          { expiresIn: "7d" }
        );
        // Tạo QR code mới
        const qrString = await QRCode.toDataURL(token);
        existingRegistration.status = 'active';
        existingRegistration.token = token;
        existingRegistration.qrString = qrString;
        await existingRegistration.save();
        res.status(200).json({
          message: "Đăng ký lại sự kiện thành công",
          data: {
            userName: account.fullName,
            eventName: event.title,
            eventDate: event.startDate,
            qrCode: qrString,
          },
        });
        return;
      }
      res.status(400).json({ message: "Bạn đã đăng ký sự kiện này" });
      return;
    }

    // Tạo JWT token chứa thông tin đăng ký
    const token = jwt.sign(
      {
        userId: req.body.userId,
        eventId: event._id,
        timestamp: new Date().toISOString(),
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Tạo QR code từ token
    const qrString = await QRCode.toDataURL(token);

    // Lưu thông tin đăng ký
    const registration = new EventRegistration({
      userId: req.body.userId,
      eventId: event._id,
      token,
      qrString,
    });

    await registration.save();

    res.status(200).json({
      message: "Đăng ký sự kiện thành công",
      data: {
        userName: account.fullName,
        eventName: event.title,
        eventDate: event.startDate,
        qrCode: qrString,
      },
    });
  } catch (error) {
    res.status(400).json({ message: "Lỗi khi đăng ký sự kiện", error });
  }
};

// [POST] /api/events/:id/unregister - Hủy đăng ký sự kiện
export const unregisterEvent = async (
  req: Request<{ id: string }, {}, { userId: string }>,
  res: Response
): Promise<void> => {
  try {
    const updated = await EventRegistration.findOneAndUpdate(
      { eventId: req.params.id, userId: req.body.userId, status: "active" },
      { status: "cancelled" }
    );
    if (!updated) {
      res.status(404).json({ message: "Không tìm thấy đăng ký để hủy" });
      return;
    }
    res.status(200).json({ message: "Hủy đăng ký thành công" });
  } catch (error) {
    res.status(400).json({ message: "Lỗi khi hủy đăng ký", error });
  }
};

// [GET] /api/events/:id/qr - Lấy QR code cho sự kiện
export const getEventQRCode = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const eventId: string = req.params.id;
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ message: "Không tìm thấy sự kiện" });
      return;
    }

    // Kiểm tra trạng thái sự kiện
    if (event.status !== "ongoing") {
      res.status(400).json({
        message: "Chỉ có thể lấy QR code cho sự kiện đang diễn ra",
      });
      return;
    }

    // Lấy QR code từ registration
    const registration = await EventRegistration.findOne({ eventId });
    if (!registration) {
      res.status(404).json({ message: "Không tìm thấy thông tin đăng ký" });
      return;
    }

    res.status(200).json({ qrCodeUrl: registration.qrString });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy QR code", error });
  }
};

// [POST] /api/events/:id/check-in - Check-in sự kiện
export const checkInEvent = async (
  req: Request<{ id: string }, {}, { qrData: string }>,
  res: Response
): Promise<void> => {
  console.log("[checkInEvent] Nhận request check-in cho eventId:", req.params.id, "qrData:", req.body.qrData?.slice(0, 30));
  try {
    // Giải mã token từ QR code
    let decoded;
    try {
      decoded = jwt.verify(req.body.qrData, JWT_SECRET) as {
        userId: string;
        eventId: string;
        timestamp: string;
      };
      console.log("[checkInEvent] Token giải mã:", decoded);
    } catch (err) {
      console.log("[checkInEvent] Mã QR không hợp lệ", err);
      res.status(400).json({ message: "Mã QR không hợp lệ" });
      return;
    }

    // Kiểm tra event ID có khớp không
    if (decoded.eventId !== req.params.id) {
      console.log("[checkInEvent] Mã QR không khớp với sự kiện", decoded.eventId, req.params.id);
      res.status(400).json({ message: "Mã QR không khớp với sự kiện" });
      return;
    }

    // Tìm thông tin đăng ký
    const registration = await EventRegistration.findOne({
      userId: decoded.userId,
      eventId: decoded.eventId,
      token: req.body.qrData,
    });

    if (!registration) {
      console.log("[checkInEvent] Không tìm thấy thông tin đăng ký", decoded.userId, decoded.eventId);
      res.status(400).json({ message: "Không tìm thấy thông tin đăng ký" });
      return;
    }

    // Kiểm tra đã check-in chưa
    if (registration.checkedInAt) {
      console.log("[checkInEvent] Đã check-in trước đó", registration.checkedInAt);
      res.status(400).json({
        message: "Đã check-in trước đó",
        checkedInAt: registration.checkedInAt,
      });
      return;
    }

    // Cập nhật thời gian check-in
    registration.checkedInAt = new Date();
    await registration.save();
    console.log("[checkInEvent] Check-in thành công cho user", decoded.userId, "event", decoded.eventId);
    res.status(200).json({ message: "Check-in thành công" });
  } catch (error) {
    console.error("[checkInEvent] Lỗi khi check-in:", error);
    res.status(500).json({ message: "Lỗi khi check-in", error });
  }
};

// [GET] /api/events/:id/attendance - Lấy danh sách điểm danh
export const getEventAttendance = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const registrations = await EventRegistration.find({
      eventId: req.params.id,
    }).populate("userId", "fullName email");

    const attendance = registrations.map((reg) => ({
      userId: reg.userId,
      checkedInAt: reg.checkedInAt,
    }));

    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách điểm danh", error });
  }
};

// [GET] /api/events/registered/:userId - Lấy danh sách sự kiện đã đăng ký
export const getRegisteredEvents = async (
  req: Request<{ userId: string }>,
  res: Response
): Promise<void> => {
  try {
    const registrations = await EventRegistration.find({
      userId: req.params.userId,
    }).populate("eventId");

    // Trả về cả status, checkedInAt và qrCode
    const events = registrations.map((reg) => {
      let eventObj = reg.eventId;
      if (
        typeof reg.eventId === "object" &&
        reg.eventId !== null &&
        typeof (reg.eventId as any).toObject === "function"
      ) {
        eventObj = (reg.eventId as any).toObject();
      }
      return {
        ...eventObj,
        checkedInAt: reg.checkedInAt,
        registrationStatus: reg.status,
        isCancelled: reg.status === "cancelled",
        qrCode: reg.qrString,
      };
    });
    res.status(200).json(events);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách sự kiện đã đăng ký", error });
  }
};

// Thêm hàm mới:
export const getCheckInHistory = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const eventId = new mongoose.Types.ObjectId(req.params.id);
    // Lấy các bản ghi check-in thành công, populate userId (fullName) và eventId (title)
    const registrations = await EventRegistration.find({ eventId, status: 'active', checkedInAt: { $ne: null } })
      .populate('userId', 'fullName')
      .populate('eventId', 'title')
      .sort({ checkedInAt: -1 });

    

    const result = registrations.map(r => ({
      userId: r.userId,
      eventId: r.eventId,
      userName: (r.userId as any)?.fullName || r.userId,
      eventName: (r.eventId as any)?.title || r.eventId,
      timestamp: r.checkedInAt,
      status: 'success'
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy lịch sử check-in' });
  }
};

// Thêm hàm mới:

// [PUT] /api/events/:id/cancel - Hủy sự kiện (admin)
export const cancelEvent = async (req: Request, res: Response) => {
 
  try {
    const event = await Event.findById(req.params.id);
  
    if (!event) {
     
      return res.status(404).json({ message: "Không tìm thấy sự kiện" });
    }
    // Đếm số lượng đăng ký active
    const registrationCount = await EventRegistration.countDocuments({ eventId: event._id, status: "active" });
    const maxCapacity = event.capacity || 1;
    if (registrationCount / maxCapacity > 0.3) {
      return res.status(400).json({ message: "Không thể hủy sự kiện vì đã có hơn 30% số lượng đăng ký." });
    }
    if (event.status === "cancelled") {
      
      return res.status(400).json({ message: "Sự kiện đã bị hủy trước đó" });
    }
    event.status = "cancelled";
    await event.save();
    const check = await Event.findById(event._id);
    
    res.status(200).json({ message: "Hủy sự kiện thành công!", event });
  } catch (error) {
   
    res.status(500).json({ message: "Lỗi khi hủy sự kiện", error });
  }
};
