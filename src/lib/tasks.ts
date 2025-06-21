
'use server';
import type { Task, Assignee, TaskStatus } from '@/types';
import dbConnect from './db';
import TaskModel, { type ITaskDocument } from '@/models/Task';
import AssigneeModel, { type IAssigneeDocument } from '@/models/Assignee';
import mongoose from 'mongoose';

// Using JSON.parse(JSON.stringify(doc)) is a reliable way to get a plain object
// from a Mongoose document, including virtuals and populated fields.

export async function getTasks(userId: string): Promise<Task[]> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    console.error('Invalid or missing userId for getTasks');
    return [];
  }
  await dbConnect();
  const taskDocs = await TaskModel.find({ createdBy: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 }).populate('assignedTo');
  return JSON.parse(JSON.stringify(taskDocs));
}

export async function getTaskById(userId: string, id: string): Promise<Task | undefined> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(id)) {
    return undefined;
  }
  await dbConnect();
  const taskDoc = await TaskModel.findOne({ _id: id, createdBy: new mongoose.Types.ObjectId(userId) }).populate('assignedTo');
  if (!taskDoc) return undefined;
  return JSON.parse(JSON.stringify(taskDoc));
}

export async function createTask(userId: string, taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'assignedTo' | 'createdBy'> & { assignedTo?: string }): Promise<Task> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('User ID is invalid or missing for task creation.');
  }
  await dbConnect();
  const newTaskData: Partial<ITaskDocument> = {
    title: taskData.title,
    description: taskData.description || '',
    deadline: taskData.deadline,
    status: taskData.status || 'todo',
    createdBy: new mongoose.Types.ObjectId(userId),
  };
  if (taskData.assignedTo && mongoose.Types.ObjectId.isValid(taskData.assignedTo)) {
    newTaskData.assignedTo = new mongoose.Types.ObjectId(taskData.assignedTo);
  } else {
    newTaskData.assignedTo = undefined;
  }

  const newTaskDoc = new TaskModel(newTaskData);
  await newTaskDoc.save();
  const populatedTaskDoc = await TaskModel.findById(newTaskDoc._id).populate('assignedTo');
  return JSON.parse(JSON.stringify(populatedTaskDoc));
}

export async function updateTask(userId: string, id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'assignedTo' | 'createdBy'>> & { assignedTo?: string | null }): Promise<Task | null> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  await dbConnect();

  const updateData: any = { ...updates };
  if (updates.assignedTo === null || updates.assignedTo === 'unassigned' || updates.assignedTo === '') {
    updateData.assignedTo = undefined;
  } else if (updates.assignedTo && mongoose.Types.ObjectId.isValid(updates.assignedTo)) {
    updateData.assignedTo = new mongoose.Types.ObjectId(updates.assignedTo);
  } else {
    delete updateData.assignedTo;
  }
  
  const updatedTaskDoc = await TaskModel.findOneAndUpdate({ _id: id, createdBy: new mongoose.Types.ObjectId(userId) }, updateData, { new: true }).populate('assignedTo');
  return JSON.parse(JSON.stringify(updatedTaskDoc));
}

export async function deleteTask(userId: string, id: string): Promise<boolean> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }
  await dbConnect();
  const result = await TaskModel.findOneAndDelete({ _id: id, createdBy: new mongoose.Types.ObjectId(userId) });
  return !!result;
}

export async function getAssignees(userId: string): Promise<Assignee[]> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    console.error('Invalid or missing userId for getAssignees');
    return [];
  }
  await dbConnect();
  const assigneeDocs = await AssigneeModel.find({ createdBy: new mongoose.Types.ObjectId(userId) }).sort({ name: 1 });
  return JSON.parse(JSON.stringify(assigneeDocs));
}

export async function getAssigneeById(userId: string, assigneeId: string): Promise<Assignee | null> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(assigneeId)) {
    return null;
  }
  await dbConnect();
  const assigneeDoc = await AssigneeModel.findOne({ _id: assigneeId, createdBy: new mongoose.Types.ObjectId(userId) });
  return JSON.parse(JSON.stringify(assigneeDoc));
}

export async function createAssignee(userId: string, name: string, designation?: string): Promise<Assignee> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('User ID is invalid or missing for assignee creation.');
  }
  await dbConnect();
  const newAssigneeDoc = new AssigneeModel({
    name,
    designation: designation || '',
    createdBy: new mongoose.Types.ObjectId(userId),
  });
  await newAssigneeDoc.save();
  return JSON.parse(JSON.stringify(newAssigneeDoc));
}

export async function updateAssignee(userId: string, assigneeId: string, updates: { name?: string; designation?: string }): Promise<Assignee | null> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(assigneeId)) {
    return null;
  }
  await dbConnect();
  const assigneeDoc = await AssigneeModel.findOneAndUpdate({ _id: assigneeId, createdBy: new mongoose.Types.ObjectId(userId) }, updates, { new: true });
  return JSON.parse(JSON.stringify(assigneeDoc));
}

export async function deleteAssignee(userId: string, assigneeId: string): Promise<boolean> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(assigneeId)) {
    return false;
  }
  await dbConnect();

  const result = await AssigneeModel.findOneAndDelete({ _id: assigneeId, createdBy: new mongoose.Types.ObjectId(userId) });
  if (result) {
    await TaskModel.updateMany(
      { assignedTo: new mongoose.Types.ObjectId(assigneeId), createdBy: new mongoose.Types.ObjectId(userId) },
      { $unset: { assignedTo: "" } } 
    );
    return true;
  }
  return false;
}
