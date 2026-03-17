import QRCode from "qrcode";
import crypto from "crypto";

// Tạo mã QR code cho sự kiện
export const generateEventQRCode = async (
  eventId: string,
  qrCodeSecret: string
): Promise<string> => {
  // Tạo payload chứa thông tin sự kiện
  const payload = {
    eventId,
    timestamp: Date.now(),
    secret: qrCodeSecret,
  };

  // Tạo chữ ký số để đảm bảo tính toàn vẹn
  const signature = crypto
    .createHmac("sha256", qrCodeSecret)
    .update(`${eventId}:${payload.timestamp}`)
    .digest("hex");

  // Thêm chữ ký vào payload
  const qrData = {
    ...payload,
    signature,
  };

  // Tạo QR code dạng URL
  const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData));
  return qrCodeUrl;
};

// Xác thực QR code
export const verifyQRCode = (
  qrData: string,
  qrCodeSecret: string
): {
  isValid: boolean;
  eventId?: string;
  error?: string;
} => {
  try {
    // Parse dữ liệu QR
    const data = JSON.parse(qrData);
    const { eventId, timestamp, signature } = data;

    // Kiểm tra thời gian hiệu lực (QR code chỉ có giá trị trong 5 phút)
    const now = Date.now();
    if (now - timestamp > 5 * 60 * 1000) {
      return {
        isValid: false,
        error: "QR code đã hết hạn",
      };
    }

    // Tạo lại chữ ký để kiểm tra
    const expectedSignature = crypto
      .createHmac("sha256", qrCodeSecret)
      .update(`${eventId}:${timestamp}`)
      .digest("hex");

    // So sánh chữ ký
    if (signature !== expectedSignature) {
      return {
        isValid: false,
        error: "QR code không hợp lệ",
      };
    }

    return {
      isValid: true,
      eventId,
    };
  } catch (error) {
    return {
      isValid: false,
      error: "QR code không đúng định dạng",
    };
  }
};
