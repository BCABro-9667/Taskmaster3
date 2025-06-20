
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { Task as TaskType } from '@/types';

export interface ITaskDocument extends Omit<TaskType, 'id' | 'assignedTo' | 'createdBy'>, Document {
  assignedTo?: Types.ObjectId;
  createdBy: Types.ObjectId; // Changed to Types.ObjectId and made required
}

const TaskSchema = new Schema<ITaskDocument>({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'Assignee', required: false },
  deadline: { type: String, required: true }, 
  status: { type: String, enum: ['todo', 'inprogress', 'done', 'archived'], default: 'todo' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Added createdBy field
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (_doc, ret) {
      ret.id = ret._id.toString();
      if (ret.assignedTo && typeof ret.assignedTo === 'object' && typeof ret.assignedTo.toJSON === 'function') {
        ret.assignedTo = ret.assignedTo.toJSON();
      } else if (ret.assignedTo) {
        ret.assignedTo = ret.assignedTo.toString();
      }
      // Ensure createdBy is a string if it exists
      if (ret.createdBy) {
        ret.createdBy = ret.createdBy.toString();
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
        ret.assignedTo = ret.assignedTo.toObject();
      } else if (ret.assignedTo) {
        ret.assignedTo = ret.assignedTo.toString();
      }
      // Ensure createdBy is a string if it exists
      if (ret.createdBy) {
        ret.createdBy = ret.createdBy.toString();
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
