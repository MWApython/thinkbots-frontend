# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps

# Force install AJV v6 and compatible ajv-keywords
RUN npm install ajv@6.12.6 ajv-keywords@3.5.2 --legacy-peer-deps

# Copy source code
COPY . .

# Set environment variables
ENV REACT_APP_API_URL=https://thinkbots-backend-1045152789168.me-west1.run.app
ENV NODE_ENV=production
ENV CI=false
ENV GENERATE_SOURCEMAP=false

# Build the application
RUN npm run build

# Install 'serve' to serve the app
RUN npm install -g serve

# Expose Cloud Run port
EXPOSE 8080

# Run the production server
CMD ["serve", "-s", "build", "-l", "8080"]
