
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { Task as TaskType } from '@/types';
// IAssigneeDocument import was removed as it's not directly used here now,
// but the populated field will be an instance of the Assignee model.

export interface ITaskDocument extends Omit<TaskType, 'id' | 'assignedTo'>, Document {
  assignedTo?: Types.ObjectId;
}

const TaskSchema = new Schema<ITaskDocument>({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'Assignee', required: false },
  deadline: { type: String, required: true }, // Keep as YYYY-MM-DD string
  status: { type: String, enum: ['todo', 'inprogress', 'done', 'archived'], default: 'todo' },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (_doc, ret) {
      ret.id = ret._id.toString();
      if (ret.assignedTo && typeof ret.assignedTo === 'object' && typeof ret.assignedTo.toJSON === 'function') {
        // If assignedTo is a populated Mongoose document, call its toJSON method
        ret.assignedTo = ret.assignedTo.toJSON();
      } else if (ret.assignedTo) {
        // If assignedTo is an ObjectId (or already a string ID), ensure it's a string
        ret.assignedTo = ret.assignedTo.toString();
      }
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
      if (ret.assignedTo && typeof ret.assignedTo === 'object' && typeof ret.assignedTo.toObject === 'function') {
        // If assignedTo is a populated Mongoose document, call its toObject method
        ret.assignedTo = ret.assignedTo.toObject();
      } else if (ret.assignedTo) {
        // If assignedTo is an ObjectId (or already a string ID), ensure it's a string
        ret.assignedTo = ret.assignedTo.toString();
      }
      delete ret._id;
      delete ret.__v;
      if (ret.createdAt) ret.createdAt = new Date(ret.createdAt).toISOString();
      if (ret.updatedAt) ret.updatedAt = new Date(ret.updatedAt).toISOString();
    },
  },
});


const TaskModel = mongoose.models.Task || mongoose.model<ITaskDocument>('Task', TaskSchema);

export default TaskModel as Model<ITaskDocument>;
