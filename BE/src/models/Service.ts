import mongoose, { Schema, Document } from "mongoose";

export interface IService extends Document {
  name: string;
  description: string;
  price: number;
  image: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  rating: number;
  level?: "low" | "moderate" | "high" | "critical";
}

const ServiceSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    status:{type:String,required:true,enum:["active","inactive","deleted"],default:"active"},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    rating: { type: Number, default: 0 },
    level: { type: String, enum: ["low", "moderate", "high", "critical"], required: false },
});

const Service = mongoose.model<IService>("Service", ServiceSchema);

export default Service;