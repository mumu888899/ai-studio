from diffusers import StableDiffusionPipeline
import torch

def load_stable_diffusion_model(model_id="runwayml/stable-diffusion-v1-5"):
    """
    Loads the Stable Diffusion model from Hugging Face Hub.

    Args:
        model_id (str): The model identifier on Hugging Face Hub.

    Returns:
        StableDiffusionPipeline: The loaded pipeline.
    """
    # Check if CUDA is available and use it, otherwise use CPU
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")

    # Load the pipeline
    # Using torch_dtype=torch.float16 for potential memory savings on GPU
    # If using CPU, float16 might not be supported or beneficial, remove if needed
    try:
        if device == "cuda":
            pipe = StableDiffusionPipeline.from_pretrained(model_id, torch_dtype=torch.float16)
        else:
            pipe = StableDiffusionPipeline.from_pretrained(model_id)
        pipe = pipe.to(device)
        print(f"Model {model_id} loaded successfully on {device}.")
        return pipe
    except Exception as e:
        print(f"Error loading model {model_id}: {e}")
        return None

# Example usage (optional, can be removed if only importing the function)
# if __name__ == "__main__":
#     sd_pipeline = load_stable_diffusion_model()
#     if sd_pipeline:
#         print("Stable Diffusion pipeline loaded.")
#         # You can now use sd_pipeline to generate images
#         # prompt = "a photo of an astronaut riding a horse on mars"
#         # image = sd_pipeline(prompt).images[0]
#         # image.save("astronaut_rides_horse.png")
#     else:
#         print("Failed to load Stable Diffusion pipeline.")