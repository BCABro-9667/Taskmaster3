
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { Url as UrlType } from '@/types';

// Interface for the URL document in MongoDB
export interface IUrlDocument extends Omit<UrlType, 'id' | 'createdBy'>, Document {
  createdBy: Types.ObjectId;
}

// Mongoose schema for Urls
const UrlSchema = new Schema<IUrlDocument>({
  title: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  categoryId: { type: String, required: true, default: 'uncategorized' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (_doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
    },
  },
  toObject: {
    virtuals: true,
    transform: function (_doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
    },
  },
});

UrlSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const UrlModel = mongoose.models.Url || mongoose.model<IUrlDocument>('Url', UrlSchema);

export default UrlModel as Model<IUrlDocument>;
