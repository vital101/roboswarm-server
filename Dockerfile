FROM ubuntu:20.04

# Install systems dependencies
RUN apt update && apt install -y zip unzip traceroute build-essentials

# Create app directory.
RUN mkdir -p /home/node/app/node_modules

# Move to working dir and install.
WORKDIR /home/node/app
COPY package*.json ./
RUN npm install
COPY . .

# Build the app
RUN npm run build

# Expose port for app
EXPOSE 8080