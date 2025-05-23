// Function to generate image by calling the backend FastAPI service
export async function generateImageFromBackend(prompt: string): Promise<string | null> {
  try {
    const response = await fetch('http://localhost:8000/generate-image/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Backend error: ${response.status} - ${errorData.detail || response.statusText}`);
    }

    const data = await response.json();
    // The backend returns the image as a base64 string directly
    return data.image;

  } catch (error: any) {
    const serviceErrorMessage = error.message || "Unknown backend error during image generation";
    console.error('Error generating image with backend service:', error);
    // Construct a new error or rethrow the original one, ensuring it's an Error instance
    throw new Error(`Backend image generation failed: ${serviceErrorMessage}`);
  }
}