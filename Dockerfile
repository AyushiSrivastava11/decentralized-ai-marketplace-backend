# Use official Node image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port (adjust as needed)
ENV PORT 8000

# Run the backend
CMD ["npm", "run", "start"]
