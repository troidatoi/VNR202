import mongoose, { Schema, Document } from "mongoose";

export interface IEventFeedback extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  rating: number; // 1-5 sao
  createdAt: Date;
}

const eventFeedbackSchema = new Schema<IEventFeedback>({
  eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
  content: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IEventFeedback>("EventFeedback", eventFeedbackSchema); 