# Use official Node.js image
FROM node:18

# Install Python and pip
RUN apt-get update && apt-get install -y python3 python3-pip

# Create app directory
WORKDIR /app

# Copy Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy Python dependencies
COPY requirements.txt ./
RUN pip3 install -r requirements.txt

# Copy all project files
COPY . .

# Expose your backend port (adjust if using a different port)
EXPOSE 5000

# Run the app
CMD ["node", "server.js"]
