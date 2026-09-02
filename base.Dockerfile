# --- Workspace Dependencies ---
FROM node:22-alpine AS dependencies

WORKDIR /app
COPY package*.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN npm ci --include=optional

# --- Frontend Build ---
FROM dependencies AS frontend-build

# Accept build argument for API URL
ARG NEXT_PUBLIC_API_URL=http://localhost:3000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY apps/frontend/ ./apps/frontend/
RUN npm run build:frontend

# --- Backend Build ---
FROM dependencies AS backend-build

WORKDIR /app
COPY apps/backend/ ./apps/backend/
RUN npm run build:backend

# --- Final Frontend Image ---
FROM node:22-alpine AS frontend

WORKDIR /app
COPY --from=frontend-build /app/apps/frontend/.next ./.next
COPY --from=frontend-build /app/apps/frontend/public ./public
COPY --from=frontend-build /app/apps/frontend/package.json ./package.json
COPY --from=frontend-build /app/apps/frontend/next.config.ts ./next.config.ts
COPY --from=frontend-build /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]

# --- Final Backend Image ---
FROM node:22-alpine AS backend

WORKDIR /app
COPY --from=backend-build /app/apps/backend/dist ./dist
COPY --from=backend-build /app/apps/backend/package.json ./package.json
COPY --from=backend-build /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "dist/main"]