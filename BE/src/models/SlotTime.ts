import mongoose from "mongoose";

export interface ISlotTime extends Document {
    consultant_id: mongoose.Types.ObjectId;
    start_time: Date;
    end_time: Date;  
    status: "available" | "booked" | "cancelled" | "deleted";
    holdedBy?: mongoose.Types.ObjectId; // Thêm field này vào interface
}

const SlotTimeSchema = new mongoose.Schema({
    consultant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Consultant", required: true },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    status: { type: String, required: true ,enum: ["available", "booked", "cancelled","deleted"],default: "available"},
    holdedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null }, // Thêm trường này
});
const SlotTime = mongoose.model<ISlotTime>("SlotTime", SlotTimeSchema);

export default SlotTime;