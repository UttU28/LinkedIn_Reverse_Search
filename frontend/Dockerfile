FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Set npm to use a specific platform target and avoid architecture-specific binaries
ENV ROLLUP_SKIP_NODEJS_RESOLUTION=true
ENV npm_config_platform=linux

# Install dependencies with standard npm install instead of npm ci
RUN npm install --no-optional

# Copy the rest of the application
COPY . .

# Expose the port
EXPOSE 3004

# Set the command to run the application with host binding 
CMD ["npm", "run", "dev:docker"] 