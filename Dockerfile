# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Set environment variable for the backend URL
ENV REACT_APP_API_URL=https://thinkbots-backend-1045152789168.me-west1.run.app

# Build the application
RUN npm run build

# Install serve to run the built application
RUN npm install -g serve

# Expose port 8080 (Cloud Run requirement)
EXPOSE 8080

# Start the application
CMD ["serve", "-s", "build", "-l", "8080"] 