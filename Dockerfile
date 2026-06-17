# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies for pdfplumber
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpoppler-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./

# Copy built frontend into static folder
COPY --from=frontend-builder /app/frontend/dist ./static

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
