import mongoose, { Schema, model } from "mongoose";

interface PaymentDetails {
    transactionNo?: string;
    amount?: number;
    paymentTime?: Date;
    paymentMethod?: 'vnpay' | 'momo'|'paypal';
    failureReason?: string;
}

export interface IAppointment {
    _id: string;
    slotTime_id: mongoose.Types.ObjectId;
    user_id: mongoose.Types.ObjectId;
    consultant_id: mongoose.Types.ObjectId;
    service_id: mongoose.Types.ObjectId;
    dateBooking: Date;
    reason: string;
    note: string;
    status: "pending" | "confirmed" | "cancelled" | "completed"|"rescheduled";
    isRescheduled?: boolean; // true nếu đây là appointment được tạo từ đổi lịch
    paymentDetails?: PaymentDetails;
    meetLink?: string; // Google Meet link do consultant tạo
}

export const AppointmentSchema: Schema = new Schema({
    slotTime_id: { type: Schema.Types.ObjectId, ref: "SlotTime", required: true },
    user_id: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    consultant_id: { type: Schema.Types.ObjectId, ref: "Consultant", required: true },
    service_id: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    dateBooking: { type: Date, required: true },
    reason: { type: String, required: false },
    note: { type: String, required: false },
    status: { type: String, required: true, default: "pending", enum: ["pending", "confirmed", "cancelled", "completed", "rescheduled"] },
    isRescheduled: { type: Boolean, default: false },
    paymentDetails: {
        type: {
            transactionNo: String,
            amount: Number,
            paymentTime: Date,
            paymentMethod: {
                type: String,
                enum: ['vnpay', 'momo','paypal']
            },
            failureReason: String
        },
        required: false
    },
    meetLink: { type: String, required: false } // Google Meet link
});

const Appointment = model<IAppointment>("Appointment", AppointmentSchema);

export default Appointment;