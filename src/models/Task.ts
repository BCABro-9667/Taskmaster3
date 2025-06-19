import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { Task as TaskType } from '@/types';

export interface ITaskDocument extends Omit<TaskType, 'id' | 'assignedTo'>, Document {
  assignedTo?: Types.ObjectId; 
}

const TaskSchema = new Schema<ITaskDocument>({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  deadline: { type: String, required: true }, // Keep as YYYY-MM-DD string
  status: { type: String, enum: ['todo', 'inprogress', 'done', 'archived'], default: 'todo' },
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: {
    virtuals: true,
    transform: function (_doc, ret) {
      ret.id = ret._id.toString();
      if (ret.assignedTo && typeof ret.assignedTo === 'object' && ret.assignedTo._id) {
        // If populated, keep the structure but ensure id is string
        ret.assignedTo.id = ret.assignedTo._id.toString();
        // delete ret.assignedTo._id; // already handled by User model's toJSON
      } else if (ret.assignedTo) {
        // If not populated, convert ObjectId to string
        ret.assignedTo = ret.assignedTo.toString();
      }
      delete ret._id;
      delete ret.__v;
       // Ensure dates are formatted or handled as ISO strings client-side if needed
      if (ret.createdAt) ret.createdAt = new Date(ret.createdAt).toISOString();
      if (ret.updatedAt) ret.updatedAt = new Date(ret.updatedAt).toISOString();
    },
  },
  toObject: {
    virtuals: true,
    transform: function (_doc, ret) {
      ret.id = ret._id.toString();
       if (ret.assignedTo && typeof ret.assignedTo === 'object' && ret.assignedTo._id) {
        ret.assignedTo.id = ret.assignedTo._id.toString();
      } else if (ret.assignedTo) {
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
