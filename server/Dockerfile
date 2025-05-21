FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Set environment variables
ENV MONGO_URI="mongodb+srv://sabermefteh1925:RziZcp9pTY9TwKMJ@cluster0.t5ewe.mongodb.net/eduplatformdb?retryWrites=true&w=majority"
ENV JWT_SECRET="763e46fe3070c4042233510c187eb17bb0af4d4ba2f50d67e9aa9bdf65ab5c7db2f09393ae28ba5a4c74d4388ee5112ef7782e707e400558932739db71d7604c"

# Copy source code
COPY . .

# Expose port 5000
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
