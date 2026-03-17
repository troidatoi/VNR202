import mongoose, { Schema, Document } from "mongoose";

export interface ICertificate extends Document {
    consultant_id: mongoose.Types.ObjectId;
    title: string;
    type: string;
    issuedBy: number; 
    issueDate: Date;
    expireDate?: Date; // Trường này có thể không bắt buộc
    description?: string; // Trường này có thể không bắt buộc
    fileUrl: string;
}

export const CertificateSchema: Schema = new Schema({
    consultant_id: { type: Schema.Types.ObjectId, ref: "Consultant", required: true },
    title: { type: String, required: true },
    type: { type: String, required: true },
    issuedBy: { type: Number, required: true }, 
    issueDate: { type: Date, required: true },
    expireDate: { type: Date, required: false },
    description: { type: String, required: false },
    fileUrl: { type: String, required: true }
});

const Certificate = mongoose.model<ICertificate>("Certificate", CertificateSchema);

export default Certificate;
