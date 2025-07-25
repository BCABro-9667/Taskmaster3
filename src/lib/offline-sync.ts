
import { openDB, type IDBPDatabase } from 'idb';
import { createTask, updateTask, deleteTask, createAssignee, updateAssignee, deleteAssignee } from './tasks';

const DB_NAME = 'TaskMasterDB';
const DB_VERSION = 1;
const SYNC_STORE_NAME = 'sync-queue';

interface SyncItem {
  id?: number;
  type: 'create-task' | 'update-task' | 'delete-task' | 'create-assignee' | 'update-assignee' | 'delete-assignee';
  payload: any;
  userId: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
          db.createObjectStore(SYNC_STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

export async function queueSyncAction(item: Omit<SyncItem, 'id'>): Promise<void> {
  const db = await getDb();
  await db.add(SYNC_STORE_NAME, item);
  
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      try {
        await registration.sync.register('sync-offline-changes');
        console.log('Sync event registered');
      } catch (e) {
        console.error('Sync registration failed:', e);
        // If it fails, try to sync directly as a fallback
        syncOfflineChanges();
      }
  } else {
    // Fallback for browsers without background sync
    console.log("Background sync not supported, trying direct sync.");
    syncOfflineChanges();
  }
}

export async function syncOfflineChanges(): Promise<void> {
  if (!navigator.onLine) {
    console.log("Offline, skipping sync.");
    return;
  }
  
  console.log("Attempting to sync offline changes...");
  const db = await getDb();
  const itemsToSync = await db.getAll(SYNC_STORE_NAME);

  if (itemsToSync.length === 0) {
    console.log("No items to sync.");
    return;
  }

  for (const item of itemsToSync) {
    try {
      let success = false;
      switch (item.type) {
        case 'create-task':
          await createTask(item.userId, item.payload);
          success = true;
          break;
        case 'update-task':
          await updateTask(item.userId, item.payload.id, item.payload.updates);
          success = true;
          break;
        case 'delete-task':
          await deleteTask(item.userId, item.payload.taskId);
          success = true;
          break;
        case 'create-assignee':
           await createAssignee(item.userId, item.payload.name, item.payload.designation);
           success = true;
           break;
        case 'update-assignee':
           await updateAssignee(item.userId, item.payload.id, item.payload.updates);
           success = true;
           break;
        case 'delete-assignee':
           await deleteAssignee(item.userId, item.payload.assigneeId);
           success = true;
           break;
      }
      
      if (success) {
        await db.delete(SYNC_STORE_NAME, item.id!);
        console.log(`Successfully synced and removed item ${item.id} from queue.`);
      }
    } catch (error) {
      console.error(`Failed to sync item ${item.id}:`, error);
      // Item remains in the queue for the next attempt
    }
  }
  // After syncing, invalidate queries to refresh UI
   window.dispatchEvent(new CustomEvent('datachanged'));
}
