# Dockerfile for backend

# Use an official Node.js runtime as a parent image
FROM node:18-alpine as build

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY apps/backend/package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the backend application source code
COPY apps/backend/ ./

# Build the app
RUN npm run build

# Use a smaller, more secure image for the production environment
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the built app from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main"]
