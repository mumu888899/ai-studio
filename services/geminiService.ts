
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


export async function generateImageGemini(prompt: string): Promise<string> {
  if (!API_KEY) {
    throw new Error("Google Gemini API Key (API_KEY) not configured. Image generation cannot proceed.");
  }

  let retries = 0;
  let currentDelay = INITIAL_DELAY_MS;

  while (retries <= MAX_RETRIES) {
    try {
      const response = await ai.models.generateImages({
        model: GEMINI_IMAGE_MODEL,
        prompt: prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/png' },
      });

      if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
      } else {
        // FIX: Replaced non-existent 'errorReason' with a check for 'imageResult.error.message'.
        // This aligns with common Google API error reporting structures for individual items in a batch.
        // Also improved the fallback message if no specific error message is found.
        let additionalInfo = "No image data was returned or an unspecified error occurred."; 
        if (response.generatedImages && response.generatedImages.length > 0) {
            const imageResult = response.generatedImages[0];
            // Check for an 'error' object with a 'message' property on the GeneratedImage object.
            if (imageResult.error && typeof imageResult.error.message === 'string') {
                additionalInfo = ` Image generation failed: ${imageResult.error.message}.`;
            } else if (!imageResult.image) { // Check if the image object itself is missing
                additionalInfo = " Image data is missing. This could be due to safety filters, an invalid prompt, or other generation issues (e.g. content policy).";
            }
            // Consider checking other properties like imageResult.safetyRatings or imageResult.finishReason if available and relevant
        }
        throw new Error(`Gemini API did not return valid image data.${additionalInfo}`);
      }
    } catch (error: any) {
      if (isRetryableErrorGemini(error) && retries < MAX_RETRIES) {
        retries++;
        console.warn(`Gemini image generation failed (attempt ${retries}/${MAX_RETRIES}), retrying in ${currentDelay}ms... Error: ${error.message}`);
        await delay(currentDelay);
        currentDelay *= 2; 
      } else {
        console.error(`Gemini image generation error (final attempt ${retries + 1} or non-retryable):`, error.message, error);
        throw constructFinalError(error, 'image');
      }
    }
  }
   // This line should ideally not be reached, but as a fallback:
  throw new Error(`Gemini image generation failed after ${MAX_RETRIES} attempts due to repeated retryable errors. This indicates a persistent issue.`);
}