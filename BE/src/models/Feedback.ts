import mongoose, { Schema, model } from "mongoose";
export interface IFeedback {
    _id:string;
    account_id:mongoose.Types.ObjectId;
    appointment_id:mongoose.Types.ObjectId;
    service_id:mongoose.Types.ObjectId;
    status:string;
    rating:number;
    comment:string;
    feedback_date:Date;
}
export const FeedbackSchema: Schema = new Schema ({
    account_id: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    appointment_id: { type: Schema.Types.ObjectId, ref: "Appointment", required: true },
    service_id: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    status: { type: String, required: true, default: "approved", enum: ["approved", "rejected"] },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    feedback_date: { type: Date, required: true, default: Date.now },
})
export default model<IFeedback>("Feedback", FeedbackSchema);