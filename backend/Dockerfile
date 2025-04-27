FROM node:18-alpine

WORKDIR /app

# Add project label
LABEL project="link-backend"

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3008

# Command to run the application
CMD ["node", "index.js"] 