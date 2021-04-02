FROM ubuntu:20.04

# Install systems dependencies
RUN apt update && apt install -y curl zip unzip traceroute build-essential

# Install Node
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash
RUN apt update && apt install -y nodejs

# Create app directory.
RUN mkdir -p /home/node/app/node_modules

# Move to working dir and install.
WORKDIR /home/node/app
COPY package*.json ./
RUN npm cache clean --force && npm install
COPY . .


# COPY package*.json .
# RUN apk update && apk add zip unzip iputils
# RUN npm install && npm run build
# COPY . .
EXPOSE 8080