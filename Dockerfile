FROM node:22-alpine
WORKDIR /app
COPY . .
CMD ["sh", "-c", "cd apps/backend && npm install && npm run start:prod"]
