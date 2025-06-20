
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { Assignee as AssigneeType } from '@/types';

// Interface for the Assignee document in MongoDB
export interface IAssigneeDocument extends Omit<AssigneeType, 'id' | 'createdBy'>, Document {
  createdBy: Types.ObjectId; // Changed to Types.ObjectId and made required
}

// Mongoose schema for Assignees
const AssigneeSchemaFields = {
  name: { type: String, required: true, trim: true },
  designation: { type: String, trim: true, default: '' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Added createdBy field
};

const AssigneeSchema = new Schema<IAssigneeDocument>(AssigneeSchemaFields, {
  timestamps: true, 
  toJSON: {
    virtuals: true, 
    transform: function (_doc, ret) {
      ret.id = ret._id.toString(); 
      delete ret._id;
      delete ret.__v;
       // Ensure createdBy is a string if it exists
      if (ret.createdBy) {
        ret.createdBy = ret.createdBy.toString();
      }
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
      // Ensure createdBy is a string if it exists
      if (ret.createdBy) {
        ret.createdBy = ret.createdBy.toString();
      }
      if (ret.createdAt) ret.createdAt = new Date(ret.createdAt).toISOString();
      if (ret.updatedAt) ret.updatedAt = new Date(ret.updatedAt).toISOString();
    },
  },
});

const AssigneeModel = mongoose.models.Assignee || mongoose.model<IAssigneeDocument>('Assignee', AssigneeSchema);

export default AssigneeModel as Model<IAssigneeDocument>;
