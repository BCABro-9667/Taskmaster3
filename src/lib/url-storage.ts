
'use server';

import type { Url, UrlCategory } from '@/types';
import dbConnect from './db';
import UrlModel, { IUrlDocument } from '@/models/Url';
import UrlCategoryModel, { IUrlCategoryDocument } from '@/models/UrlCategory';
import mongoose from 'mongoose';

// Helper to process lean query result
function processLean<T extends { _id: any }>(doc: T | null): (Omit<T, '_id'> & { id: string }) | null {
  if (!doc) return null;
  const { _id, __v, ...rest } = doc as any;
  return { id: _id.toString(), ...rest } as Omit<T, '_id'> & { id: string };
}

function processLeanArray<T extends { _id: any }>(docs: T[]): (Omit<T, '_id'> & { id: string })[] {
    return docs.map(doc => processLean(doc)!);
}


// --- URL Functions ---

export async function getUrls(userId: string): Promise<Url[]> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    console.error('Invalid or missing userId for getUrls');
    return [];
  }
  await dbConnect();
  const urlDocs = await UrlModel.find({ createdBy: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .lean();

  return processLeanArray(urlDocs) as unknown as Url[];
}

export async function createUrl(userId: string, urlData: Pick<Url, 'title' | 'url' | 'categoryId'>): Promise<Url> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('User ID is invalid or missing for URL creation.');
  }
  await dbConnect();
  
  const newUrlDoc = new UrlModel({
    ...urlData,
    createdBy: new mongoose.Types.ObjectId(userId),
  });
  await newUrlDoc.save();
  
  const createdUrl = await UrlModel.findById(newUrlDoc._id).lean();
  if(!createdUrl) {
    throw new Error('Failed to retrieve newly created URL.');
  }
  
  return processLean(createdUrl) as unknown as Url;
}

type UrlUpdatePayload = Partial<Pick<Url, 'title' | 'url' | 'categoryId'>>;

export async function updateUrl(userId: string, urlId: string, updates: UrlUpdatePayload): Promise<Url | null> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(urlId)) {
        return null;
    }
    await dbConnect();

    const updatedUrlDoc = await UrlModel.findOneAndUpdate(
        { _id: urlId, createdBy: new mongoose.Types.ObjectId(userId) },
        { $set: updates },
        { new: true }
    ).lean();

    return processLean(updatedUrlDoc) as unknown as Url | null;
}

export async function deleteUrl(userId: string, urlId: string): Promise<{ deletedUrlId: string }> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(urlId)) {
    throw new Error('Invalid ID provided for deletion.');
  }

  await dbConnect();
  const result = await UrlModel.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(urlId),
    createdBy: new mongoose.Types.ObjectId(userId),
  }).lean();

  if (!result) {
    throw new Error("URL not found, or you don't have permission to delete it.");
  }
  return { deletedUrlId: urlId };
}


// --- Category Functions ---

export async function getUrlCategories(userId: string): Promise<UrlCategory[]> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    console.error('Invalid or missing userId for getUrlCategories');
    return [];
  }
  await dbConnect();
  const categoryDocs = await UrlCategoryModel.find({ createdBy: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: 'asc' })
    .lean();

  return processLeanArray(categoryDocs) as unknown as UrlCategory[];
}

export async function createUrlCategory(userId: string, categoryData: Pick<UrlCategory, 'name'>): Promise<UrlCategory> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('User ID is invalid or missing for category creation.');
  }
  await dbConnect();
  
  const newCategoryDoc = new UrlCategoryModel({
    ...categoryData,
    createdBy: new mongoose.Types.ObjectId(userId),
  });
  await newCategoryDoc.save();
  
  const createdCategory = await UrlCategoryModel.findById(newCategoryDoc._id).lean();
   if(!createdCategory) {
    throw new Error('Failed to retrieve newly created category.');
  }
  
  return processLean(createdCategory) as unknown as UrlCategory;
}

export async function updateUrlCategory(userId: string, categoryId: string, updates: Pick<UrlCategory, 'name'>): Promise<UrlCategory | null> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(categoryId)) {
        return null;
    }
    await dbConnect();

    const updatedCategoryDoc = await UrlCategoryModel.findOneAndUpdate(
        { _id: categoryId, createdBy: new mongoose.Types.ObjectId(userId) },
        { $set: updates },
        { new: true }
    ).lean();

    return processLean(updatedCategoryDoc) as unknown as UrlCategory | null;
}

export async function deleteUrlCategory(userId: string, categoryId: string): Promise<{ deletedCategoryId: string }> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new Error('Invalid ID provided for deletion.');
  }

  await dbConnect();
  const result = await UrlCategoryModel.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(categoryId),
    createdBy: new mongoose.Types.ObjectId(userId),
  }).lean();

  if (!result) {
    throw new Error("Category not found, or you don't have permission to delete it.");
  }
  
  // Update URLs that were in the deleted category
  await UrlModel.updateMany(
    { createdBy: new mongoose.Types.ObjectId(userId), categoryId: categoryId },
    { $set: { categoryId: 'uncategorized' } }
  );
  
  return { deletedCategoryId: categoryId };
}
