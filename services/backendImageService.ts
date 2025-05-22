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

  } catch (error) {
    console.error('Error generating image with backend service:', error);
    // Depending on your error handling strategy, you might want to re-throw or return null
    return null;
  }
}