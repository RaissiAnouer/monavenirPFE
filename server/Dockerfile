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

# Create a non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Ensure /home is writable for persistent storage (optional, as Azure manages /home)
RUN mkdir -p /home/uploads /home/public/images && \
    chown -R appuser:appgroup /home/uploads /home/public/images && \
    chmod -R 755 /home/uploads /home/public/images

# Switch to non-root user
USER appuser

# Expose port 5000 (matches PORT in .env and Terraform)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
