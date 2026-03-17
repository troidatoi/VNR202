import mongoose, { Schema, model }   from "mongoose";
export interface IReport  {
    _id:string;
    account_id:mongoose.Types.ObjectId;
    appointment_id:mongoose.Types.ObjectId;  
    consultant_id:mongoose.Types.ObjectId;
    nameOfPatient:string;
    age:number;
    gender:string;
    condition:string;
    notes:string;
    recommendations:string;
    status:string;
    report_date:Date;
}
export const ReportSchema: Schema = new Schema ({
    account_id: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    appointment_id: { type: Schema.Types.ObjectId, ref: "Appointment", required: true },   
    consultant_id: { type: Schema.Types.ObjectId, ref: "Consultant", required: true },
    nameOfPatient: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    condition: { type: String, required: true },
    notes: { type: String, required: false },
    recommendations: { type: String, required: false },
    status: { type: String, required: true, default: "approved" },
    report_date: { type: Date, required: true, default: Date.now },
})
export const Report = model<IReport>("Report", ReportSchema);