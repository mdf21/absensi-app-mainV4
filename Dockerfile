FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package terlebih dahulu
COPY frontend/package.json frontend/package-lock.json ./

# Install dependency
RUN npm ci

# Copy source frontend
COPY frontend/src ./src
COPY frontend/index.html ./
COPY frontend/vite.config.js ./

# Build frontend
RUN npm run build


# Backend
FROM node:18-alpine

WORKDIR /app

# Copy package backend
COPY backend/package.json ./

# Install production dependency
RUN npm install --omit=dev

# Copy backend
COPY backend/server.js ./

# Folder data
RUN mkdir -p /app/data

# Copy hasil build frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 3000

CMD ["node", "server.js"]
