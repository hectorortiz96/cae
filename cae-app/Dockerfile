# Multi-stage Docker build for the CAE application (a React/TypeScript frontend).
# Final image only contains Nginx + built assets (much smaller than including Node.js)

# BUILD Stage:
# Starts with Node.js 20 on Alpine Linux (lightweight base image)
# Names this stage "build" for reference in the second stage
FROM node:20-alpine AS build
# Set the working directory inside the container to /app
WORKDIR /app

# Copy package manifests and install the exact locked dependencies.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application code into the working directory
COPY . .
RUN npm run build

# PRODUCTION Stage:
# Start with Nginx 1.27 (web server) on Alpine Linux (lightweight web server)
FROM nginx:1.27-alpine
# Serialize public runtime configuration before Nginx starts.
RUN apk add --no-cache jq
COPY docker-entrypoint.d/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-runtime-config.sh \
    && chmod +x /docker-entrypoint.d/40-runtime-config.sh
# Copies custom nginx.conf configuration file into the container, replacing the default configuration
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
# Copy the built application from the "build" stage to the Nginx web root
COPY --from=build /app/dist /usr/share/nginx/html

# Cloud Run supplies PORT; use 8080 as the local/default container port.
ENV PORT=8080
EXPOSE 8080
# Run Nginx in the foreground (prevents container from exiting)
CMD ["nginx", "-g", "daemon off;"]
