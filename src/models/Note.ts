
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { Note as NoteType } from '@/types';

// Interface for the Note document in MongoDB
export interface INoteDocument extends Omit<NoteType, 'id' | 'createdBy'>, Document {
  createdBy: Types.ObjectId;
}

// Mongoose schema for Notes
const NoteSchema = new Schema<INoteDocument>({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (_doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      if (ret.createdAt) ret.createdAt = new Date(ret.createdAt).toISOString();
      if (ret.updatedAt) ret.updatedAt = new Date(ret.updatedAt).toISOString();
    },
  },
  toObject: {
    virtuals: true,
    transform: function (_doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      if (ret.createdAt) ret.createdAt = new Date(ret.createdAt).toISOString();
      if (ret.updatedAt) ret.updatedAt = new Date(ret.updatedAt).toISOString();
    },
  },
});

NoteSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const NoteModel = mongoose.models.Note || mongoose.model<INoteDocument>('Note', NoteSchema);

export default NoteModel as Model<INoteDocument>;
