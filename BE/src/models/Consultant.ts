import mongoose, { Schema, Document } from "mongoose";

export interface IConsultant extends Document {
    accountId: string; 
    introduction: string;
    contact: string;
    startDateofWork: Date;
    status: "active" | "inactive" | "isDeleted";
}

export const ConsultantSchema: Schema = new Schema({
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    introduction: { type: String, required: false },
    contact: { type: String, required: false },
    startDateofWork: { type: Date, required: false },
    status: { type: String, enum: ["active", "inactive","isDeleted"], default: "active" },
});

const Consultant = mongoose.model<IConsultant>("Consultant", ConsultantSchema);
export default Consultant;