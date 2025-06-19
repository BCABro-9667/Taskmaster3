
'use server';
import type { Task, User, TaskStatus } from '@/types';
import { format, addDays, subDays } from 'date-fns';
import dbConnect from './db';
import TaskModel, { type ITaskDocument } from '@/models/Task';
import UserModel, { type IUserDocument } from '@/models/User';
import mongoose from 'mongoose';


function toPlainTask(taskDoc: ITaskDocument | null): Task | null {
  if (!taskDoc) return null;
  const taskObject = taskDoc.toObject();
  return {
    ...taskObject,
    id: taskObject.id.toString(),
    assignedTo: taskObject.assignedTo ? taskObject.assignedTo.toString() : undefined,
    // Ensure dates are in ISO string format if not already
    createdAt: taskObject.createdAt instanceof Date ? taskObject.createdAt.toISOString() : taskObject.createdAt,
    updatedAt: taskObject.updatedAt instanceof Date ? taskObject.updatedAt.toISOString() : taskObject.updatedAt,

  };
}

function toPlainUser(userDoc: IUserDocument | null): User | null {
  if (!userDoc) return null;
  const userObject = userDoc.toObject();
  return {
    id: userObject.id.toString(),
    email: userObject.email,
    name: userObject.name,
    designation: userObject.designation,
    profileImageUrl: userObject.profileImageUrl,
  };
}

export async function getTasks(): Promise<Task[]> {
  await dbConnect();
  const taskDocs = await TaskModel.find({}).sort({ createdAt: -1 }).populate('assignedTo');
  return taskDocs.map(doc => {
    const task = doc.toObject() as Task; // toObject applies transforms
    if (doc.assignedTo && doc.assignedTo instanceof mongoose.Model) {
        task.assignedTo = (doc.assignedTo as IUserDocument).toObject() as any; // Use User model's toObject for assignee
    }
    return task;
  });
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
  const taskDoc = await TaskModel.findById(id).populate('assignedTo');
  if (!taskDoc) return undefined;

  const task = taskDoc.toObject() as Task;
  if (taskDoc.assignedTo && taskDoc.assignedTo instanceof mongoose.Model) {
      task.assignedTo = (taskDoc.assignedTo as IUserDocument).toObject() as any;
  }
  return task;
}

export async function createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
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
    newTaskData.assignedTo = undefined; // Explicitly set to undefined if invalid or not provided
  }

  const newTaskDoc = new TaskModel(newTaskData);
  await newTaskDoc.save();
  const populatedTaskDoc = await TaskModel.findById(newTaskDoc._id).populate('assignedTo');
  
  const task = populatedTaskDoc!.toObject() as Task;
  if (populatedTaskDoc!.assignedTo && populatedTaskDoc!.assignedTo instanceof mongoose.Model) {
      task.assignedTo = (populatedTaskDoc!.assignedTo as IUserDocument).toObject() as any;
  }
  return task;
}

export async function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'assignedTo'>> & { assignedTo?: string | null }): Promise<Task | null> {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const updateData: any = { ...updates };
  if (updates.assignedTo === null || updates.assignedTo === 'unassigned' || updates.assignedTo === '') {
    updateData.assignedTo = undefined; // Unassign
  } else if (updates.assignedTo && mongoose.Types.ObjectId.isValid(updates.assignedTo)) {
    updateData.assignedTo = new mongoose.Types.ObjectId(updates.assignedTo);
  } else {
    delete updateData.assignedTo; // Don't update if invalid and not explicitly unassigning
  }
  
  // Ensure `updatedAt` is handled by Mongoose timestamps or set manually if needed.
  // Mongoose timestamps will handle this automatically.

  const updatedTaskDoc = await TaskModel.findByIdAndUpdate(id, updateData, { new: true }).populate('assignedTo');
  if (!updatedTaskDoc) return null;
  
  const task = updatedTaskDoc.toObject() as Task;
  if (updatedTaskDoc.assignedTo && updatedTaskDoc.assignedTo instanceof mongoose.Model) {
      task.assignedTo = (updatedTaskDoc.assignedTo as IUserDocument).toObject() as any;
  }
  return task;
}

export async function deleteTask(id: string): Promise<boolean> {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(id)) return false;
  const result = await TaskModel.findByIdAndDelete(id);
  return !!result;
}


// Functions for Assignable Users (which are also Users in our simplified model)
export async function getAssignableUsers(): Promise<User[]> {
  await dbConnect();
  // For now, all users are considered assignable. You might add a role/flag later.
  const userDocs = await UserModel.find({}).sort({ name: 1 });
  return userDocs.map(doc => doc.toObject() as User);
}

export async function getAssignableUserById(userId: string): Promise<User | null> {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;
  const userDoc = await UserModel.findById(userId);
  return userDoc ? userDoc.toObject() as User : null;
}

export async function createAssignableUser(name: string, designation: string, email?: string): Promise<User> {
  await dbConnect();
  // For assignable users created this way, we might not require a password
  // if they are not intended to log in, or set a default one.
  // For simplicity, we'll use the same User model.
  // A more robust system might differentiate user types or roles.
  
  const userEmail = email || `${name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '')}@taskmaster.example.com`;

  const existingUser = await UserModel.findOne({ email: userEmail });
  if (existingUser) {
    throw new Error(`User with email ${userEmail} already exists. Please use a unique email if providing one, or the generated one might conflict.`);
  }

  const newUserDoc = new UserModel({
    name,
    email: userEmail,
    designation,
    // password: 'defaultPasswordForAssignableUser', // Or handle this differently
    profileImageUrl: '',
  });
  await newUserDoc.save(); // Note: if password field is present and not set, pre-save hook for hashing won't run or might error if password is required by schema logic not shown here.
                        // Current UserSchema does not require password.
  return newUserDoc.toObject() as User;
}

export async function updateAssignableUser(userId: string, updates: { name?: string; designation?: string }): Promise<User | null> {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;
  const userDoc = await UserModel.findByIdAndUpdate(userId, updates, { new: true });
  return userDoc ? userDoc.toObject() as User : null;
}

export async function deleteAssignableUser(userId: string): Promise<boolean> {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(userId)) return false;

  const result = await UserModel.findByIdAndDelete(userId);
  if (result) {
    // Unassign tasks from the deleted user
    await TaskModel.updateMany(
      { assignedTo: new mongoose.Types.ObjectId(userId) },
      { $unset: { assignedTo: "" } } // Or $set: { assignedTo: null } if preferred
    );
    return true;
  }
  return false;
}
