
'use server';
import type { Task, Assignee, TaskStatus } from '@/types';
import dbConnect from './db';
import TaskModel, { type ITaskDocument } from '@/models/Task';
import AssigneeModel, { type IAssigneeDocument } from '@/models/Assignee';
import mongoose from 'mongoose';

// Helper to reliably convert Mongoose docs to plain objects
function toPlainObject<T>(doc: any): T {
  return JSON.parse(JSON.stringify(doc));
}


export async function getTasks(userId: string): Promise<Task[]> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    console.error('Invalid or missing userId for getTasks');
    return [];
  }
  await dbConnect();
  const taskDocs = await TaskModel.find({ createdBy: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .populate('assignedTo');

  return toPlainObject<Task[]>(taskDocs);
}

export async function getTaskById(userId: string, id: string): Promise<Task | undefined> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(id)) {
    return undefined;
  }
  await dbConnect();
  const taskDoc = await TaskModel.findOne({ _id: id, createdBy: new mongoose.Types.ObjectId(userId) })
    .populate('assignedTo');
  if (!taskDoc) return undefined;
  return toPlainObject<Task>(taskDoc);
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

  const populatedTaskDoc = await TaskModel.findById(newTaskDoc._id)
    .populate('assignedTo');
  if (!populatedTaskDoc) {
    throw new Error('Failed to retrieve newly created task for population.');
  }
  return toPlainObject<Task>(populatedTaskDoc);
}

export async function updateTask(userId: string, id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'assignedTo' | 'createdBy'>> & { assignedTo?: string | null }): Promise<Task | null> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  await dbConnect();

  const updateData: any = { ...updates };
  if (updates.assignedTo === null || updates.assignedTo === 'unassigned' || updates.assignedTo === '') {
    updateData.$unset = { assignedTo: 1 };
    delete updateData.assignedTo;
  } else if (updates.assignedTo && mongoose.Types.ObjectId.isValid(updates.assignedTo)) {
    updateData.assignedTo = new mongoose.Types.ObjectId(updates.assignedTo);
  } else {
    delete updateData.assignedTo;
  }
  
  const updatedTaskDoc = await TaskModel.findOneAndUpdate(
    { _id: id, createdBy: new mongoose.Types.ObjectId(userId) },
    updateData,
    { new: true }
  ).populate('assignedTo');
  
  return updatedTaskDoc ? toPlainObject<Task>(updatedTaskDoc) : null;
}

export async function deleteTask(userId: string, id: string): Promise<void> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID provided for deletion.');
  }
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid task ID provided for deletion.');
  }

  await dbConnect();
  const result = await TaskModel.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(id),
    createdBy: new mongoose.Types.ObjectId(userId),
  });

  if (!result) {
    throw new Error("Task not found, or you don't have permission to delete it.");
  }
}

export async function getAssignees(userId: string): Promise<Assignee[]> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    console.error('Invalid or missing userId for getAssignees');
    return [];
  }
  await dbConnect();
  const assigneeDocs = await AssigneeModel.find({ createdBy: new mongoose.Types.ObjectId(userId) })
    .sort({ name: 1 });
  
  return toPlainObject<Assignee[]>(assigneeDocs);
}

export async function getAssigneeById(userId: string, assigneeId: string): Promise<Assignee | null> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(assigneeId)) {
    return null;
  }
  await dbConnect();
  const assigneeDoc = await AssigneeModel.findOne({ _id: assigneeId, createdBy: new mongoose.Types.ObjectId(userId) });
  return assigneeDoc ? toPlainObject<Assignee>(assigneeDoc) : null;
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
  return toPlainObject<Assignee>(newAssigneeDoc);
}

export async function updateAssignee(userId: string, assigneeId: string, updates: { name?: string; designation?: string }): Promise<Assignee | null> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(assigneeId)) {
    return null;
  }
  await dbConnect();
  const assigneeDoc = await AssigneeModel.findOneAndUpdate(
    { _id: assigneeId, createdBy: new mongoose.Types.ObjectId(userId) },
    updates,
    { new: true }
  );
  return assigneeDoc ? toPlainObject<Assignee>(assigneeDoc) : null;
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
