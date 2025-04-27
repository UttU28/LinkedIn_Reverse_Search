FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm i

# Copy the rest of the application
COPY . .

# Expose the port
EXPOSE 3009

# Set the command to run the application with host binding 
CMD ["npm", "run", "dev:docker"] 