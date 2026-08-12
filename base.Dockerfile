# --- Frontend Build ---
FROM node:22-alpine AS frontend-build

# Accept build argument for API URL
ARG NEXT_PUBLIC_API_URL=http://localhost:3000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

WORKDIR /app

COPY apps/frontend/package*.json ./
RUN npm install
COPY apps/frontend/ ./
RUN npm run build

# --- Backend Build ---
FROM node:22-alpine AS backend-build

WORKDIR /app
COPY apps/backend/package*.json ./
RUN npm install
COPY apps/backend/ ./
RUN npm run build

# --- Final Frontend Image ---
FROM node:22-alpine AS frontend

WORKDIR /app
COPY --from=frontend-build /app/.next ./.next
COPY --from=frontend-build /app/public ./public
COPY --from=frontend-build /app/package.json ./package.json
COPY --from=frontend-build /app/next.config.ts ./next.config.ts
COPY --from=frontend-build /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]

# --- Final Backend Image ---
FROM node:22-alpine AS backend

WORKDIR /app
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/package.json ./package.json
COPY --from=backend-build /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "dist/main"]