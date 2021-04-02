FROM ubuntu:20.04

# Install systems dependencies
RUN apt update && \
    DEBIAN_FRONTEND=noninteractive apt upgrade -y && \
    apt install -y zip unzip traceroute curl build-essential

# Install node
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt install -y nodejs npm

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