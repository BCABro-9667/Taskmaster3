'use server';

/**
 * @fileOverview AI-powered deadline suggestion flow.
 *
 * - suggestDeadline - A function that suggests a deadline for a given task.
 * - SuggestDeadlineInput - The input type for the suggestDeadline function.
 * - SuggestDeadlineOutput - The return type for the suggestDeadline function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDeadlineInputSchema = z.object({
  taskDetails: z.string().describe('Details of the task for which a deadline is to be suggested.'),
  currentWorkload: z.string().describe('The current workload of the user.'),
});
export type SuggestDeadlineInput = z.infer<typeof SuggestDeadlineInputSchema>;

const SuggestDeadlineOutputSchema = z.object({
  suggestedDeadline: z.string().describe('The suggested deadline for the task, in ISO 8601 format (YYYY-MM-DD).'),
  reasoning: z.string().describe('The AI reasoning for the suggested deadline.'),
});
export type SuggestDeadlineOutput = z.infer<typeof SuggestDeadlineOutputSchema>;

export async function suggestDeadline(input: SuggestDeadlineInput): Promise<SuggestDeadlineOutput> {
  return suggestDeadlineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDeadlinePrompt',
  input: {schema: SuggestDeadlineInputSchema},
  output: {schema: SuggestDeadlineOutputSchema},
  prompt: `You are a deadline suggestion assistant. Given the task details and current workload, suggest an optimal deadline for the task.

Task Details: {{{taskDetails}}}
Current Workload: {{{currentWorkload}}}

Consider the task complexity and user's workload to accurately estimate a deadline in ISO 8601 format (YYYY-MM-DD) along with a brief explanation.
`,
});

const suggestDeadlineFlow = ai.defineFlow(
  {
    name: 'suggestDeadlineFlow',
    inputSchema: SuggestDeadlineInputSchema,
    outputSchema: SuggestDeadlineOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
