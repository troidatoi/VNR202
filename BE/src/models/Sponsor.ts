import mongoose, { Schema, Document } from 'mongoose';

export interface ISponsor extends Document {
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'isDeleted';
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sponsorSchema = new Schema<ISponsor>({
  name: {
    type: String,
    required: [true, 'Tên nhà tài trợ là bắt buộc'],
    trim: true,
    maxlength: [100, 'Tên nhà tài trợ không được vượt quá 100 ký tự']
  },
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'isDeleted'],
    default: 'active'
  },
  logo: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index để tối ưu truy vấn
sponsorSchema.index({ status: 1 });
sponsorSchema.index({ email: 1 });

export default mongoose.model<ISponsor>('Sponsor', sponsorSchema); 