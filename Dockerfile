# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build --workspace=frontend

# Stage 2: Build Backend
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build --workspace=backend
# Optionally prune dev dependencies to reduce image size
RUN npm prune --production

# Stage 3: Final Production Image
FROM node:20-alpine
WORKDIR /app

# Copy dependencies and backend dist
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=backend-builder /app/package.json ./package.json
COPY --from=backend-builder /app/apps/backend/package.json ./apps/backend/package.json

# Copy frontend dist (served by NestJS ServeStaticModule)
COPY --from=frontend-builder /app/apps/frontend/dist ./apps/frontend/dist

# Expose the single port (3500)
EXPOSE 3500

# Start the application
CMD ["node", "apps/backend/dist/main.js"]
