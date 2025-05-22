from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .stable_diffusion_loader import load_stable_diffusion_model
import base64
from io import BytesIO

app = FastAPI()

# Load the model once when the application starts
# In a production environment, consider using a more robust method
# for managing the model lifecycle and potential resource constraints.
# For this example, we load it directly.
sd_pipeline = load_stable_diffusion_model()

class PromptRequest(BaseModel):
    prompt: str

@app.post("/generate-image/")
async def generate_image(request: PromptRequest):
    if not sd_pipeline:
        raise HTTPException(status_code=500, detail="Stable Diffusion model not loaded.")

    try:
        # Generate image
        # You might want to add more parameters here based on your needs
        image = sd_pipeline(request.prompt).images[0]

        # Convert image to base64 string
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()

        return {"image": img_str}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating image: {e}")

@app.get("/")
async def read_root():
    return {"message": "Stable Diffusion Backend is running"}