FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN npm ci --include=optional
COPY apps/backend/ ./apps/backend/
RUN npm run build:backend

FROM node:22-alpine

WORKDIR /app
COPY --from=build /app/apps/backend/dist ./dist
COPY --from=build /app/apps/backend/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
CMD ["node", "dist/main"]
