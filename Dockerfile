FROM node:14-alpine

USER root

# Install systems dependencies
RUN apk update && apk add zip unzip iputils

# Create app directory.
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

# Move to working dir and install.
USER node
WORKDIR /home/node/app
COPY package*.json ./
RUN npm install
COPY --chown=node:node . .


# COPY package*.json .
# RUN apk update && apk add zip unzip iputils
# RUN npm install && npm run build
# COPY . .
EXPOSE 8080