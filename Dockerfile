# Use Node.js LTS as base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN apt-get update && apt-get install -y python3 make g++
RUN corepack enable && yarn install
# Copy the rest of the application code
COPY . .

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "index.js"]