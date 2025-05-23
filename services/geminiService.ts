
import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters } from "@google/genai";
import { GEMINI_TEXT_MODEL, GEMINI_IMAGE_MODEL } from '../constants'; 

const API_KEY = typeof process !== 'undefined' && process.env && process.env.API_KEY;

if (!API_KEY) {
  console.error(
    "%cGoogle Gemini API Key (API_KEY) is not configured in your environment.",
    "color: red; font-weight: bold; font-size: 14px;",
    "\nAI text and image generation features will NOT work.",
    "\nPlease ensure the API_KEY environment variable is set."
  );
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY_PLACEHOLDER" }); 

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isRetryableErrorGemini = (error: any): boolean => {
  if (error && error.message) {
    const message = String(error.message).toLowerCase();
    // Check for 429 explicitly or common retryable status codes/messages
    if (message.includes('429') || message.includes('resource_exhausted') || message.includes('rate limit')) {
      // For 429, we might retry a few times, but if it persists, it's likely a hard quota limit.
      // The retry logic handles this; here we just identify it as potentially retryable initially.
      return true;
    }
    if (message.includes(' 500') || message.includes(' 502') || message.includes(' 503') || message.includes(' 504') || message.includes('server error') || message.includes('backend error')) {
        return true;
    }
  }
  // Check status codes if available on the error object
  if (error && typeof error.status === 'number') {
    if (error.status === 429) return true;
    if (error.status >= 500 && error.status < 600) return true; // Server-side errors
  }
  // Check nested error codes (common in Google API errors)
  if (error && error.error && typeof error.error.code === 'number') {
    if (error.error.code === 429) return true;
    if (error.error.code >= 500 && error.error.code < 600) return true;
  }
  return false;
};

const constructFinalError = (error: any, context: 'text' | 'image'): Error => {
    let finalError = error;
    const errorMessage = String(error?.message || error?.error?.message || "Unknown error").toLowerCase();
    const errorStatus = String(error?.status || error?.error?.code || "");

    if (errorMessage.includes("resource_exhausted") || errorStatus.includes("429")) {
      const specificMessage = error?.error?.message || error?.message || "Quota exceeded or rate limit hit.";
      const docLink = "https://ai.google.dev/gemini-api/docs/rate-limits";
      finalError = new Error(`Gemini API Error: ${specificMessage} This is likely due to exceeding your usage quota or rate limits for ${context} generation. Please check your Google Cloud project's billing and quotas. For more information, visit: ${docLink}`);
    } else if (!(error instanceof Error)) {
      finalError = new Error(String(error?.message || error || `Unknown Gemini ${context} generation error.`));
    }
    return finalError;
};

export async function generateTextGemini(prompt: string, systemInstruction?: string): Promise<string> {
  if (!API_KEY) {
    throw new Error("Google Gemini API Key (API_KEY) not configured. Text generation cannot proceed.");
  }
  let retries = 0;
  let currentDelay = INITIAL_DELAY_MS;

  while (retries <= MAX_RETRIES) {
    try {
      const params: GenerateContentParameters = {
        model: GEMINI_TEXT_MODEL,
        contents: prompt,
      };

      if (systemInstruction) {
        params.config = { systemInstruction: systemInstruction };
      }
      
      const response: GenerateContentResponse = await ai.models.generateContent(params);

      if (typeof response.text === 'string') {
        return response.text;
      } else {
        let additionalInfo = "";
        if (response?.candidates?.[0]?.finishReason === "SAFETY") {
            additionalInfo = " Content was blocked due to safety settings.";
        } else if (!response?.candidates?.length) {
            additionalInfo = " No candidates were returned.";
        }
        throw new Error(`Gemini API returned a response without valid text content.${additionalInfo}`);
      }
    } catch (error: any) {
      if (isRetryableErrorGemini(error) && retries < MAX_RETRIES) {
        retries++;
        console.warn(`Gemini text generation failed (attempt ${retries}/${MAX_RETRIES}), retrying in ${currentDelay}ms... Error: ${error.message}`);
        await delay(currentDelay);
        currentDelay *= 2; 
      } else {
        console.error(`Gemini text generation error (final attempt ${retries + 1} or non-retryable):`, error.message, error);
        throw constructFinalError(error, 'text');
      }
    }
  }
  // This line should ideally not be reached if logic is correct, but as a fallback:
  throw new Error(`Gemini text generation failed after ${MAX_RETRIES} attempts due to repeated retryable errors. This indicates a persistent issue.`);
}