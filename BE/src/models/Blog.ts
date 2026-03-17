import mongoose, { Document, Schema } from 'mongoose';

interface IComment {
  _id?: mongoose.Types.ObjectId;
  userId: string;
  username: string;
  content: string;
  createdAt: Date;
}

export interface IBlog extends Document {
  title: string;
  content: string;
  authorId: mongoose.Types.ObjectId;
  image?: string;
  thumbnail?: string;
  topics?: string[];
  published: 'draft' | 'published' | 'unpublished' | 'rejected';
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
  anDanh: boolean;
}

const CommentSchema = new Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const BlogSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    image: { type: String },
    thumbnail: { type: String },
    topics: [{ type: String }],
    published: { 
      type: String, 
      enum: ['draft', 'published', 'unpublished', 'rejected'], 
      default: 'draft' 
    },
    comments: [CommentSchema],
    anDanh: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export default mongoose.model<IBlog>('Blog', BlogSchema); 