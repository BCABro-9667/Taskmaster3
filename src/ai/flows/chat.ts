'use server';

/**
 * @fileoverview A conversational AI agent for managing tasks and notes.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  createNote as createNoteAction,
  deleteNote as deleteNoteAction,
  getNotes as getNotesAction,
} from '@/lib/notes';
import {
  createTask as createTaskAction,
  getTasks as getTasksAction,
  updateTask as updateTaskAction,
  deleteTask as deleteTaskAction,
  getAssignees as getAssigneesAction,
} from '@/lib/tasks';
import { getCurrentUser } from '@/lib/client-auth';
import { MessageData } from 'genkit';

// Tool to get the current user's ID
const getUserId = ai.defineTool(
  {
    name: 'getUserId',
    description: 'Returns the ID of the currently logged-in user.',
    inputSchema: z.object({}),
    outputSchema: z.string(),
  },
  async () => {
    const user = getCurrentUser();
    if (!user) throw new Error('User not logged in');
    return user.id;
  }
);

// Tool to get notes
const getNotes = ai.defineTool(
  {
    name: 'getNotes',
    description: "Retrieves a list of the user's notes.",
    inputSchema: z.object({ userId: z.string() }),
    outputSchema: z.array(z.object({ id: z.string(), title: z.string(), description: z.string() })),
  },
  async ({ userId }) => {
    return getNotesAction(userId);
  }
);

// Tool to create a note
const createNote = ai.defineTool(
  {
    name: 'createNote',
    description: 'Creates a new note with a title and description.',
    inputSchema: z.object({
      userId: z.string(),
      title: z.string(),
      description: z.string().optional(),
    }),
    outputSchema: z.object({ id: z.string(), title: z.string() }),
  },
  async ({ userId, title, description }) => {
    return createNoteAction(userId, { title, description });
  }
);

// Tool to delete a note
const deleteNote = ai.defineTool(
  {
    name: 'deleteNote',
    description: 'Deletes a note based on its ID.',
    inputSchema: z.object({ userId: z.string(), noteId: z.string() }),
    outputSchema: z.object({ deletedNoteId: z.string() }),
  },
  async ({ userId, noteId }) => {
    return deleteNoteAction(userId, noteId);
  }
);

// Tool to get tasks
const getTasks = ai.defineTool(
    {
      name: 'getTasks',
      description: 'Retrieves a list of tasks, optionally filtering by status.',
      inputSchema: z.object({
        userId: z.string(),
        status: z.enum(['todo', 'inprogress', 'done']).optional(),
      }),
      outputSchema: z.array(z.object({
        id: z.string(),
        title: z.string(),
        status: z.string(),
        deadline: z.string(),
        assignedTo: z.object({ name: z.string() }).optional(),
      })),
    },
    async ({ userId, status }) => {
      const tasks = await getTasksAction(userId);
      if (status) {
        return tasks.filter(task => task.status === status);
      }
      return tasks;
    }
  );
  
  // Tool to create a task
  const createTask = ai.defineTool(
    {
      name: 'createTask',
      description: 'Creates a new task. The deadline should be in YYYY-MM-DD format. To assign a task, first get the list of available assignees to find their ID.',
      inputSchema: z.object({
        userId: z.string(),
        title: z.string(),
        deadline: z.string().describe("The deadline for the task in YYYY-MM-DD format."),
        assignedTo: z.string().optional().describe("The ID of the assignee."),
      }),
      outputSchema: z.object({ id: z.string(), title: z.string() }),
    },
    async ({ userId, title, deadline, assignedTo }) => {
      return createTaskAction(userId, { title, deadline, assignedTo });
    }
  );
  
  // Tool to update a task
  const updateTask = ai.defineTool(
    {
      name: 'updateTask',
      description: 'Updates an existing task by its ID.',
      inputSchema: z.object({
        userId: z.string(),
        taskId: z.string(),
        updates: z.object({
          title: z.string().optional(),
          status: z.enum(['todo', 'inprogress', 'done']).optional(),
          deadline: z.string().optional(),
        }),
      }),
      outputSchema: z.object({ id: z.string(), title: z.string(), status: z.string() }),
    },
    async ({ userId, taskId, updates }) => {
      const result = await updateTaskAction(userId, taskId, updates);
      if (!result) throw new Error('Task update failed.');
      return result;
    }
  );
  
  // Tool to delete a task
  const deleteTask = ai.defineTool(
    {
      name: 'deleteTask',
      description: 'Deletes a task by its ID.',
      inputSchema: z.object({ userId: z.string(), taskId: z.string() }),
      outputSchema: z.object({ deletedTaskId: z.string() }),
    },
    async ({ userId, taskId }) => {
      return deleteTaskAction(userId, taskId);
    }
  );

  // Tool to get assignees
  const getAssignees = ai.defineTool(
    {
        name: 'getAssignees',
        description: "Retrieves a list of available assignees.",
        inputSchema: z.object({ userId: z.string() }),
        outputSchema: z.array(z.object({ id: z.string(), name: z.string() })),
    },
    async ({ userId }) => {
        return getAssigneesAction(userId);
    }
  );

const allTools = [
  getUserId,
  getNotes,
  createNote,
  deleteNote,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getAssignees,
];

const chatPrompt = ai.definePrompt(
  {
    name: 'chatbotPrompt',
    system: `You are a helpful assistant for the TaskMaster application.
- Your primary job is to help the user manage their tasks and notes by calling the provided tools.
- Before you can use any tool that requires a 'userId', you MUST call the 'getUserId' tool first to identify the current user. Do not ask the user for their ID.
- When creating a task, if the user doesn't provide a deadline, use a sensible default (e.g., tomorrow's date in YYYY-MM-DD format).
- When a user asks to assign a task, first call getAssignees to show them the available options and get the correct ID. Do not guess assignee IDs.
- Be conversational and friendly.
- Do not make up information. If a tool fails or returns no data, inform the user gracefully.`,
    tools: allTools,
  },
  async (history) => ({
    history,
  })
);

export const sendChatMessage = ai.defineFlow(
  {
    name: 'sendChatMessage',
    inputSchema: z.array(MessageData),
    outputSchema: MessageData,
  },
  async (history) => {
    const { output } = await chatPrompt(history);
    return output!;
  }
);
