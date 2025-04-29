# Build stage
FROM node:22-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy all source code and configuration files
COPY . .

# Build the application with the environment variable
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Ensure images directory is copied to dist (if needed)
RUN mkdir -p dist/images && cp -r public/images/* dist/images/ || true

# Production stage
FROM nginx:alpine

# Set working directory
WORKDIR /app

# Copy the entire project from the build stage (to preserve structure)
COPY --from=build /app /app

# Copy built assets to Nginx's serve directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx configuration
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
