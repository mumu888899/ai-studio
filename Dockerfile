FROM node:18-slim

# Install Python, pip, and tini
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    tini \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set up Python virtual environment
RUN python3 -m venv /app/backend/venv
ENV PATH="/app/backend/venv/bin:$PATH"

# Install frontend dependencies
COPY package*.json ./
RUN npm install

# Install backend dependencies
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r backend/requirements.txt

# Copy project files
COPY . .

# Build the frontend application
RUN npm run build

# Expose necessary ports
EXPOSE 5174 8001

ENTRYPOINT ["/usr/bin/tini", "--"]

CMD ["sh", "start.sh"]