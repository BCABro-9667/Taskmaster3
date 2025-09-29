'use server';

/**
 * @fileOverview A flow for shortening a URL using the TinyURL API.
 *
 * - shortenUrl - A function that takes a long URL and returns a shortened URL.
 * - ShortenUrlInput - The input type for the shortenUrl function (string).
 * - ShortenUrlOutput - The return type for the shortenUrl function (string).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ShortenUrlInputSchema = z.string().url();
export type ShortenUrlInput = z.infer<typeof ShortenUrlInputSchema>;

const ShortenUrlOutputSchema = z.string().url();
export type ShortenUrlOutput = z.infer<typeof ShortenUrlOutputSchema>;


export async function shortenUrl(longUrl: ShortenUrlInput): Promise<ShortenUrlOutput> {
    return shortenUrlFlow(longUrl);
}

const shortenUrlFlow = ai.defineFlow(
  {
    name: 'shortenUrlFlow',
    inputSchema: ShortenUrlInputSchema,
    outputSchema: ShortenUrlOutputSchema,
  },
  async (longUrl) => {
    try {
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
      if (!response.ok) {
        throw new Error(`TinyURL API failed with status: ${response.status}`);
      }
      const shortUrl = await response.text();
      // The API returns the URL as plain text, sometimes with extra whitespace.
      if (shortUrl && shortUrl.startsWith('https://tinyurl.com/')) {
        return shortUrl.trim();
      } else {
        // If the response is not a valid URL, it might be an error message from the API.
        throw new Error(`TinyURL API returned an invalid response: ${shortUrl}`);
      }
    } catch (error) {
      console.error('Error shortening URL:', error);
      // Re-throw the error to be handled by the caller
      throw new Error('Failed to shorten URL. The URL might be invalid or the service is unavailable.');
    }
  }
);
