# Base Dockerfile for building both frontend and backend

FROM node:18-alpine as base

# Set working directory
WORKDIR /app

# Copy root package.json and package-lock.json
COPY package*.json ./

# Install root dependencies
RUN npm install

# Copy the entire monorepo context
COPY . .

# Build frontend
RUN npx turbo run build --filter=frontend...

# Build backend
RUN npx turbo run build --filter=backend...

# --- Final image for frontend ---
FROM node:18-alpine as frontend

WORKDIR /app

# Copy built frontend from base
COPY --from=base /app/apps/frontend/.next /app/apps/frontend/.next
COPY --from=base /app/apps/frontend/public /app/apps/frontend/public
COPY --from=base /app/apps/frontend/package.json /app/apps/frontend/package.json
COPY --from=base /app/apps/frontend/next.config.ts /app/apps/frontend/next.config.ts
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/apps/frontend/node_modules /app/apps/frontend/node_modules

WORKDIR /app/apps/frontend
EXPOSE 3000

CMD ["npx", "next", "start", "-p", "3000"]

# --- Final image for backend ---
FROM node:18-alpine as backend

WORKDIR /app

# Copy built backend from base
COPY --from=base /app/apps/backend/dist /app/apps/backend/dist
COPY --from=base /app/apps/backend/package.json /app/apps/backend/package.json
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/apps/backend/node_modules /app/apps/backend/node_modules

EXPOSE 3000

CMD ["node", "apps/backend/dist/main"]
