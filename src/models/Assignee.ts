import mongoose, { Schema, Document, Model } from 'mongoose';
import type { Assignee as AssigneeType } from '@/types';

// Interface for the Assignee document in MongoDB
export interface IAssigneeDocument extends Omit<AssigneeType, 'id'>, Document {}

// Mongoose schema for Assignees
const AssigneeSchemaFields = {
  name: { type: String, required: true, trim: true },
  designation: { type: String, trim: true, default: '' },
};

const AssigneeSchema = new Schema<IAssigneeDocument>(AssigneeSchemaFields, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: {
    virtuals: true, // Use virtuals to include 'id'
    transform: function (_doc, ret) {
      ret.id = ret._id.toString(); // Convert _id to id string
      delete ret._id;
      delete ret.__v;
       // Ensure dates are formatted as ISO strings
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

// Create and export the Assignee model
const AssigneeModel = mongoose.models.Assignee || mongoose.model<IAssigneeDocument>('Assignee', AssigneeSchema);

export default AssigneeModel as Model<IAssigneeDocument>;
