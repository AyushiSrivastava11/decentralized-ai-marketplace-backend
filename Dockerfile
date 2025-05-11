# Use official Node image
FROM node:18-alpine

# Set working directory
WORKDIR /src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port (adjust as needed)
EXPOSE 4000

# Run the backend
CMD ["npm", "run", "dev"]
