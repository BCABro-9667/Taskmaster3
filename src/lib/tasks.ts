
'use server';
import type { Task, Assignee, TaskStatus } from '@/types'; // Assignee imported
import dbConnect from './db';
import TaskModel, { type ITaskDocument } from '@/models/Task';
import AssigneeModel, { type IAssigneeDocument } from '@/models/Assignee'; // AssigneeModel imported
import mongoose from 'mongoose';

// Helper to convert Mongoose Task document to plain Task object
function toPlainTask(taskDoc: ITaskDocument | null): Task | null {
  if (!taskDoc) return null;
  const taskObject = taskDoc.toObject(); // This uses the TaskModel's toObject transform
  return taskObject as Task;
}

// Helper to convert Mongoose Assignee document to plain Assignee object
function toPlainAssignee(assigneeDoc: IAssigneeDocument | null): Assignee | null {
  if (!assigneeDoc) return null;
  return assigneeDoc.toObject() as Assignee; // This uses the AssigneeModel's toObject transform
}


export async function getTasks(): Promise<Task[]> {
  await dbConnect();
  const taskDocs = await TaskModel.find({}).sort({ createdAt: -1 }).populate('assignedTo');
  return taskDocs.map(doc => {
    const task = doc.toObject() as Task; // TaskModel toObject handles basic structure
    // If assignedTo is populated, it would be an Assignee object (handled by AssigneeModel toObject)
    // If not populated, it's an ObjectId string, which is fine for the Task type
    return task;
  });
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
  const taskDoc = await TaskModel.findById(id).populate('assignedTo');
  if (!taskDoc) return undefined;
  return toPlainTask(taskDoc);
}

export async function createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'assignedTo'> & { assignedTo?: string }): Promise<Task> {
  await dbConnect();
  const newTaskData: Partial<ITaskDocument> = {
    title: taskData.title,
    description: taskData.description || '',
    deadline: taskData.deadline,
    status: taskData.status || 'todo',
  };
  if (taskData.assignedTo && mongoose.Types.ObjectId.isValid(taskData.assignedTo)) {
    newTaskData.assignedTo = new mongoose.Types.ObjectId(taskData.assignedTo);
  } else {
    newTaskData.assignedTo = undefined; 
  }

  const newTaskDoc = new TaskModel(newTaskData);
  await newTaskDoc.save();
  const populatedTaskDoc = await TaskModel.findById(newTaskDoc._id).populate('assignedTo');
  return toPlainTask(populatedTaskDoc)!;
}

export async function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'assignedTo'>> & { assignedTo?: string | null }): Promise<Task | null> {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const updateData: any = { ...updates };
  if (updates.assignedTo === null || updates.assignedTo === 'unassigned' || updates.assignedTo === '') {
    updateData.assignedTo = undefined; 
  } else if (updates.assignedTo && mongoose.Types.ObjectId.isValid(updates.assignedTo)) {
    updateData.assignedTo = new mongoose.Types.ObjectId(updates.assignedTo);
  } else {
    delete updateData.assignedTo; 
  }
  
  const updatedTaskDoc = await TaskModel.findByIdAndUpdate(id, updateData, { new: true }).populate('assignedTo');
  return toPlainTask(updatedTaskDoc);
}

export async function deleteTask(id: string): Promise<boolean> {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(id)) return false;
  const result = await TaskModel.findByIdAndDelete(id);
  return !!result;
}


// Functions for Assignees
export async function getAssignees(): Promise<Assignee[]> {
  await dbConnect();
  const assigneeDocs = await AssigneeModel.find({}).sort({ name: 1 });
  return assigneeDocs.map(doc => toPlainAssignee(doc)!);
}

export async function getAssigneeById(assigneeId: string): Promise<Assignee | null> {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(assigneeId)) return null;
  const assigneeDoc = await AssigneeModel.findById(assigneeId);
  return toPlainAssignee(assigneeDoc);
}

export async function createAssignee(name: string, designation?: string): Promise<Assignee> {
  await dbConnect();
  const newAssigneeDoc = new AssigneeModel({
    name,
    designation: designation || '',
  });
  await newAssigneeDoc.save();
  return toPlainAssignee(newAssigneeDoc)!;
}

export async function updateAssignee(assigneeId: string, updates: { name?: string; designation?: string }): Promise<Assignee | null> {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(assigneeId)) return null;
  const assigneeDoc = await AssigneeModel.findByIdAndUpdate(assigneeId, updates, { new: true });
  return toPlainAssignee(assigneeDoc);
}

export async function deleteAssignee(assigneeId: string): Promise<boolean> {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(assigneeId)) return false;

  const result = await AssigneeModel.findByIdAndDelete(assigneeId);
  if (result) {
    // Unassign tasks from the deleted assignee
    await TaskModel.updateMany(
      { assignedTo: new mongoose.Types.ObjectId(assigneeId) },
      { $unset: { assignedTo: "" } } 
    );
    return true;
  }
  return false;
}
