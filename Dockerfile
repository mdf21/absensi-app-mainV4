FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY backend/package.json ./
RUN npm install --production
COPY backend/server.js ./
RUN mkdir -p /app/data
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
EXPOSE 3000
CMD ["node", "server.js"]