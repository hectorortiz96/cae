# Multi-stage Docker build for the CAE application (a React/TypeScript frontend).
# Final image only contains Nginx + built assets (much smaller than including Node.js)

# BUILD Stage:
# Starts with Node.js 20 on Alpine Linux (lightweight base image)
# Names this stage "build" for reference in the second stage
FROM node:20-alpine AS build
# Set the working directory inside the container to /app
WORKDIR /app

# Copy package.json and package-lock.json (if present) to the working directory
COPY package*.json ./
# Install NPM dependencies defined in package.json
RUN npm install

# Copy the rest of the application code into the working directory
COPY . .
# Set the VITE_API_BASE_URL environment variable for the build process
ARG VITE_API_BASE_URL=http://localhost:8080
# Use the ARG value to set the ENV variable for the build
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
# Build the application for production, outputting to the /app/dist directory
RUN npm run build

# PRODUCTION Stage:
# Start with Nginx 1.27 (web server) on Alpine Linux (lightweight web server)
FROM nginx:1.27-alpine
# Copies custom nginx.conf configuration file into the container, replacing the default configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy the built application from the "build" stage to the Nginx web root
COPY --from=build /app/dist /usr/share/nginx/html

# Exposes port 80 for HTTP traffic
EXPOSE 80
# Run Nginx in the foreground (prevents container from exiting)
CMD ["nginx", "-g", "daemon off;"]

