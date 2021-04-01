FROM node:14-alpine

USER root

# Install systems dependencies
RUN apk update && apk add zip unzip iputils

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