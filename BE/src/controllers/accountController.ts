import { Request, Response } from "express";
import Account, { IAccount } from "../models/Account";
import Consultant from "../models/Consultant";
import bcrypt from "bcryptjs";
import { isStrongPassword } from "../utils";

// Interface cho request body khi cập nhật account thành consultant
interface IUpdateAccountRequest extends Partial<IAccount> {
  introduction?: string;
  contact?: string;
  experience?: number;
  startDateofWork?: Date;
}

// [POST] /api/accounts – Tạo tài khoản
export const createAccount = async (
  req: Request<{}, {}, IAccount>,
  res: Response
): Promise<void> => {
  try {
    const account = new Account(req.body);
    const saved = await account.save();

    // If creating a consultant account, also create consultant profile
    if (saved.role === "consultant") {
      const newConsultant = new Consultant({
        accountId: saved._id,
        status: "active",
      });
      await newConsultant.save();
    }

    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: "Tạo tài khoản thất bại", error });
  }
};

// [GET] /api/accounts – Lấy danh sách tài khoản
export const getAllAccounts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const accounts = await Account.find();
    res.status(200).json(accounts);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Lấy danh sách tài khoản thất bại", error });
  }
};

// [GET] /api/accounts/:id – Lấy chi tiết tài khoản
export const getAccountById = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const account = await Account.findById(req.params.id).select(
      "fullName email role photoUrl gender yearOfBirth phoneNumber address isVerified"
    );
    if (!account) {
      res.status(404).json({ message: "Không tìm thấy tài khoản" });
      return;
    }
    res.status(200).json(account);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Lấy thông tin tài khoản thất bại", error });
  }
};

// [PUT] /api/accounts/:id – Cập nhật
export const updateAccount = async (
  req: Request<{ id: string }, {}, IUpdateAccountRequest>,
  res: Response
): Promise<void> => {
  try {
    // Lấy account hiện tại trước khi cập nhật
    const currentAccount = await Account.findById(req.params.id);
    if (!currentAccount) {
      res.status(404).json({ message: "Không tìm thấy tài khoản để cập nhật" });
      return;
    }

    // Không cho phép cập nhật email
    if (req.body.email) {
      delete req.body.email;
    }

    // Kiểm tra trùng số điện thoại và validate chỉ khi thay đổi
    if (
      req.body.phoneNumber &&
      req.body.phoneNumber !== currentAccount.phoneNumber
    ) {
      // Kiểm tra trùng
      const existedPhone = await Account.findOne({
        phoneNumber: req.body.phoneNumber,
        _id: { $ne: req.params.id }
      });
      if (existedPhone) {
        res.status(400).json({ message: "Số điện thoại này đã được đăng ký bởi tài khoản khác" });
        return;
      }
      // Validate định dạng
      const phone = req.body.phoneNumber.trim();
      if (!/^0\d{9}$/.test(phone)) {
        res.status(400).json({ message: "Số điện thoại phải 10 số, bắt đầu bằng 0!" });
        return;
      }
    }

    // Validate tên (fullName)
    

    // Kiểm tra nếu đang cố chuyển từ consultant sang customer
    if (currentAccount.role === "consultant" && req.body.role === "customer") {
      res
        .status(400)
        .json({ message: "Không thể chuyển từ tư vấn viên sang khách hàng" });
      return;
    }

    // Nếu hợp lệ, tiến hành cập nhật
    const updated = await Account.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) {
      res.status(404).json({ message: "Không tìm thấy tài khoản để cập nhật" });
      return;
    }

    // Đồng bộ trạng thái consultant nếu là consultant
    let consultantStatusMsg = '';
    if (updated.role === 'consultant' && typeof req.body.isDisabled === 'boolean') {
      const consultant = await Consultant.findOne({ accountId: updated._id });
      if (consultant) {
        consultant.status = req.body.isDisabled ? 'inactive' : 'active';
        await consultant.save();
        consultantStatusMsg = `Trạng thái tư vấn viên đã chuyển thành ${consultant.status === 'inactive' ? 'ngưng hoạt động' : 'hoạt động'}`;
      }
    }

    // Kiểm tra nếu role được cập nhật thành consultant
    if (req.body.role === "consultant") {
      // Kiểm tra xem đã có consultant cho account này chưa
      const existingConsultant = await Consultant.findOne({
        accountId: updated._id,
      });

      if (!existingConsultant) {
        // Kiểm tra thông tin consultant bắt buộc
        const { introduction, contact, experience, startDateofWork } = req.body;
        if (!introduction || !contact || !startDateofWork) {
          res.status(400).json({ 
            message: "Vui lòng nhập đầy đủ thông tin tư vấn viên: giới thiệu, liên hệ và ngày bắt đầu làm việc" 
          });
          return;
        }

        // Tạo consultant mới với thông tin đầy đủ
        const newConsultant = new Consultant({
          accountId: updated._id,
          introduction,
          contact,
          status: "active",
        });
        await newConsultant.save();
      } else {
        // Nếu đã tồn tại, cập nhật thông tin nếu có
        if (req.body.introduction) existingConsultant.introduction = req.body.introduction;
        if (req.body.contact) existingConsultant.contact = req.body.contact;
        existingConsultant.status = "active";
        await existingConsultant.save();
      }
    }
    
    res.status(200).json({
      ...updated.toObject(),
      consultantStatusMsg
    });
  } catch (error) {
    res.status(400).json({ message: "Lỗi khi cập nhật", error });
  }
};

// [DELETE] /api/accounts/:id – Xóa tài khoản
export const deleteAccount = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const deleted = await Account.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: "Không tìm thấy tài khoản để xóa" });
      return;
    }

    // If deleting a consultant account, also update consultant status
    if (deleted.role === "consultant") {
      await Consultant.findOneAndUpdate(
        { accountId: deleted._id },
        { status: "isDeleted" }
      );
    }

    res.status(200).json({ message: "Xóa tài khoản thành công" });
  } catch (error) {
    res.status(400).json({ message: "Xóa tài khoản thất bại", error });
  }
};

// [POST] /api/accounts/change-password – Đổi mật khẩu bằng userId và oldPassword
export const changePassword = async (
  req: Request<{}, {}, { userId: string; oldPassword: string; newPassword: string; confirmPassword: string }>,
  res: Response
): Promise<void> => {
  try {
    const { userId, oldPassword, newPassword, confirmPassword } = req.body;
    if (!userId || !oldPassword || !newPassword || !confirmPassword) {
      res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
      return;
    }
    if (newPassword !== confirmPassword) {
      res.status(400).json({ message: "Mật khẩu xác nhận không khớp!" });
      return;
    }
    if (!isStrongPassword(newPassword)) {
      res.status(400).json({ message: "Mật khẩu phải mạnh (ít nhất 8 ký tự, chữ hoa, thường, số, ký tự đặc biệt)!" });
      return;
    }
    const account = await Account.findById(userId);
    if (!account) {
      res.status(404).json({ message: "Không tìm thấy tài khoản!" });
      return;
    }
    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPassword, account.password);
    if (!isMatch) {
      res.status(400).json({ message: "Mật khẩu cũ không đúng!" });
      return;
    }
    // Đổi mật khẩu
    const hashed = await bcrypt.hash(newPassword, 10);
    account.password = hashed;
    await account.save();
    res.status(200).json({ message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi đổi mật khẩu", error });
  }
};
