import mongoose, { Schema, model } from "mongoose";

export interface IPayment {
    _id: string;
    accountId: mongoose.Types.ObjectId;
    appointmentId: mongoose.Types.ObjectId;
    date: Date;
    description: string;
    paymentLinkId: string;
    totalPrice: number;
    status: "pending" | "completed" | "failed";
    paymentMethod: "paypal" | "momo" | "vnpay" | "cash" | "other";
}

export const PaymentSchema: Schema = new Schema({
    accountId: {
        type: Schema.Types.ObjectId,
        ref: "Account",
        required: true
    },
    appointmentId: {
        type: Schema.Types.ObjectId,
        ref: "Appointment",
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    description: {
        type: String,
        required: true
    },
    paymentLinkId: {
        type: String,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true,
        default: "pending",
        enum: ["pending", "completed", "failed"]
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ["paypal", "momo", "vnpay", "cash", "other"],
        default: "other"
    }
}, {
    timestamps: true
});

const Payment = model<IPayment>("Payment", PaymentSchema);

export default Payment;
