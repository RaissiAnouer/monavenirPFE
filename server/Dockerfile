# Use Node.js 22 Alpine as the base image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy all source code and configuration files
COPY . .

# Expose port 5000 (matches PORT in .env)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
