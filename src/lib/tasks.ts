
'use server';
import type { Task, Assignee, TaskStatus } from '@/types';
import dbConnect from './db';
import TaskModel, { type ITaskDocument } from '@/models/Task';
import AssigneeModel, { type IAssigneeDocument } from '@/models/Assignee';
import mongoose from 'mongoose';

// Helper to reliably convert Mongoose docs to plain objects respecting virtuals
// This is no longer necessary with .lean(), but good to have if we ever need hydrated docs.
function toPlainObject<T>(doc: any): T {
  if (!doc) {
    return doc;
  }
  if (Array.isArray(doc)) {
    return doc.map(item => item.toObject ? item.toObject() : item) as T;
  }
  return (doc.toObject ? doc.toObject() : doc) as T;
}

// Helper to convert lean object ID to string 'id'
function leanToPlain<T extends { _id: mongoose.Types.ObjectId }>(doc: T | null): Omit<T, '_id'> & { id: string } | null {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest } as Omit<T, '_id'> & { id: string };
}

function leanArrayToPlain<T extends { _id: mongoose.Types.ObjectId }>(docs: T[]): (Omit<T, '_id'> & { id: string })[] {
  return docs.map(doc => leanToPlain(doc)!)
}

// Helper to create a plain JS object from a lean query result
// This is necessary because lean results don't have the virtual 'id' field automatically.
function processLeanTask(task: any): Task {
  const plainTask = {
    ...task,
    id: task._id.toString(),
    assignedTo: task.assignedTo ? {
      ...task.assignedTo,
      id: task.assignedTo._id.toString(),
      _id: undefined, // remove mongoose properties
      __v: undefined,
    } : undefined,
    _id: undefined,
    __v: undefined,
  };
  delete plainTask._id;
  delete plainTask.__v;
  if (plainTask.assignedTo) {
      delete plainTask.assignedTo._id;
      delete plainTask.assignedTo.__v;
  }
  return plainTask as Task;
}


export async function getTasks(userId: string): Promise<Task[]> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    console.error('Invalid or missing userId for getTasks');
    return [];
  }
  await dbConnect();
  const taskDocs = await TaskModel.find({ createdBy: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .populate('assignedTo')
    .lean();

  return taskDocs.map(processLeanTask);
}

export async function getTaskById(userId: string, id: string): Promise<Task | undefined> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(id)) {
    return undefined;
  }
  await dbConnect();
  const taskDoc = await TaskModel.findOne({ _id: id, createdBy: new mongoose.Types.ObjectId(userId) })
    .populate('assignedTo')
    .lean();
  if (!taskDoc) return undefined;
  return processLeanTask(taskDoc);
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

  // We can't use .lean() for creation, so we save and then re-fetch with .lean()
  const newTaskDoc = new TaskModel(newTaskData);
  await newTaskDoc.save();
  
  const createdTask = await getTaskById(userId, newTaskDoc._id.toString());
  if(!createdTask) {
    throw new Error('Failed to retrieve newly created task.');
  }
  
  return createdTask;
}

export async function updateTask(userId: string, id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'assignedTo' | 'createdBy'>> & { assignedTo?: string | null }): Promise<Task | null> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(id)) {
        return null;
    }
    await dbConnect();

    // With lean(), we fetch a plain object first to check existence
    const taskExists = await TaskModel.findOne({ _id: id, createdBy: new mongoose.Types.ObjectId(userId) }).select('_id').lean();
    if (!taskExists) {
        return null;
    }
    
    // Prepare the update payload
    const updatePayload: any = { ...updates };
    if (updates.assignedTo === null || updates.assignedTo === 'unassigned' || updates.assignedTo === '') {
        updatePayload.assignedTo = undefined;
    } else if (updates.assignedTo && mongoose.Types.ObjectId.isValid(updates.assignedTo)) {
        updatePayload.assignedTo = new mongoose.Types.ObjectId(updates.assignedTo);
    }

    const updatedTaskDoc = await TaskModel.findOneAndUpdate(
        { _id: id, createdBy: new mongoose.Types.ObjectId(userId) },
        { $set: updatePayload },
        { new: true }
    ).populate('assignedTo').lean();

    return updatedTaskDoc ? processLeanTask(updatedTaskDoc) : null;
}

export async function deleteTask(userId: string, id: string): Promise<{ deletedTaskId: string }> {
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
  }).lean();

  if (!result) {
    throw new Error("Task not found, or you don't have permission to delete it.");
  }
  return { deletedTaskId: id };
}

export async function getAssignees(userId: string): Promise<Assignee[]> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    console.error('Invalid or missing userId for getAssignees');
    return [];
  }
  await dbConnect();
  const assigneeDocs = await AssigneeModel.find({ createdBy: new mongoose.Types.ObjectId(userId) })
    .sort({ name: 1 })
    .lean();
  
  return leanArrayToPlain(assigneeDocs) as unknown as Assignee[];
}

export async function getAssigneeById(userId: string, assigneeId: string): Promise<Assignee | null> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(assigneeId)) {
    return null;
  }
  await dbConnect();
  const assigneeDoc = await AssigneeModel.findOne({ _id: assigneeId, createdBy: new mongoose.Types.ObjectId(userId) }).lean();
  return leanToPlain(assigneeDoc) as unknown as Assignee | null;
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
  ).lean();
  return leanToPlain(assigneeDoc) as unknown as Assignee | null;
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
