import { Request, Response } from "express";
import axios from "axios";

export const chatWithAI = async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("❌ GEMINI_API_KEY is missing");
      return res.status(500).json({ message: "Thiếu GEMINI_API_KEY trong file .env" });
    }

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Chuyển đổi history sang định dạng Gemini API REST yêu cầu
    const contents = [];
    if (history && history.length > 0) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role === "model" ? "model" : "user",
          parts: [{ text: h.parts[0].text }]
        });
      });
    }

    // Thêm tin nhắn hiện tại
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    // System prompt cho tro ly hoc tap mon Quyen con nguoi trong XHCN - Chuong 4
    const systemPrompt = `He thong: Ban la tro ly hoc tap chuyen ve mon Mac-Lenin - Chuong 4: Quan he so, Dan chu XHCN va Nha nuoc XHCN.

Nhiem vu cua ban:
- Giai thich cac noi dung thuoc Chuong 4: Quan he so, Dan chu XHCN va Nha nuoc XHCN mot cach chinh xac, ro rang, de hieu.
- Trinh bay theo dung tinh thanh giao trinh Dai hoc tai Viet Nam.
- Uu tien tra loi ngan gon, co the dung gach dau dong khi phu hop.
- Khi can phan tich, phai co mo dau – noi dung – ket luan ro rang.

Pham vi noi dung:
- Quan he so la gi? Dinh nghia va dac diem cua quan he so trong XHCN
- Chu nghia xa hoi la gi? Cac dac diem cua chu nghia xa hoi
- Dan chu XHCN: y nghia, dac diem, nguyen tac hoat dong
- Nha nuoc XHCN: dau hieu nha nuoc XHCN, vai tro cua Nha nuoc
- Quyen con nguoi trong XHCN: quyen chinh tri, quyen kinh te, quyen xa hoi, quyen van hoa
- Quan he giua Nha nuoc va nguoi dan trong XHCN

Nguyen tac tra loi:
- Khong suy dien, khong them quan diem ca nhan.
- Khong ban luan chinh tri hien dai ngoai pham vi hoc thuat.
- Neu cau hoi mo ho, yeu cau nguoi dung lam ro theo huong hoc tap.
- Ngon ngu tieng Viet, van phong hoc thuat vua phai, phu hop sinh vien.

Neu nguoi dung yeu cau:
- "Giai thich": trinh bay de hieu, co vi du minh hoa don gian.
- "Phan tich": trinh bay co luan diem, luan cuu.
- "So sanh": noi diem giong va khac ro rang.
- "Viet bai": viet dung cau truc bai tieu luan mon Mac-Lenin.

`;
    if (contents.length > 0 && contents[0].role === "user") {
      contents[0].parts[0].text = systemPrompt + contents[0].parts[0].text;
    }

    // Sử dụng Gemini 3 Flash Preview - Model mới nhất có sẵn trên v1beta API
    const modelName = "gemini-3-flash-preview";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`🤖 Đang kết nối với: ${modelName}`);

    const response = await axios.post(url, {
      contents: contents
    });

    const data = response.data as any;

    if (data && data.candidates && data.candidates[0].content) {
      const text = data.candidates[0].content.parts[0].text;
      console.log("✅ Phản hồi từ AI thành công");

      res.status(200).json({
        reply: text,
        history: [...contents, { role: "model", parts: [{ text }] }]
      });
    } else {
      throw new Error("Không nhận được phản hồi hợp lệ từ Gemini API");
    }

  } catch (error: any) {
    console.error("❌ GEMINI_REST_ERROR:", error.response?.data || error.message);
    res.status(500).json({
      message: "Lỗi kết nối với AI. Vui lòng thử lại sau.",
      error: error.response?.data?.error?.message || error.message
    });
  }
};
