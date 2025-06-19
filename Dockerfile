# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies and force correct ajv version
RUN npm install --legacy-peer-deps
RUN npm install ajv@6.12.6 ajv-keywords@3.5.2 --legacy-peer-deps

COPY . .

ENV REACT_APP_API_URL=https://thinkbots-backend-1045152789168.me-west1.run.app
ENV NODE_ENV=production
ENV CI=false
ENV GENERATE_SOURCEMAP=false

RUN npm run build

RUN npm install -g serve

EXPOSE 8080

CMD ["serve", "-s", "build", "-l", "8080"]
