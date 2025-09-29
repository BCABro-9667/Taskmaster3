
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { UrlCategory as UrlCategoryType } from '@/types';

// Interface for the URL Category document in MongoDB
export interface IUrlCategoryDocument extends Omit<UrlCategoryType, 'id' | 'createdBy'>, Document {
  createdBy: Types.ObjectId;
}

// Mongoose schema for Url Categories
const UrlCategorySchema = new Schema<IUrlCategoryDocument>({
  name: { type: String, required: true, trim: true },
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

UrlCategorySchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const UrlCategoryModel = mongoose.models.UrlCategory || mongoose.model<IUrlCategoryDocument>('UrlCategory', UrlCategorySchema);

export default UrlCategoryModel as Model<IUrlCategoryDocument>;
