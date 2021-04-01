FROM node:14-alpine
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
# RUN apk update && apk add zip unzip iputils
USER node
RUN npm install
COPY --chown=node:node . .


# COPY package*.json .
# RUN apk update && apk add zip unzip iputils
# RUN npm install && npm run build
# COPY . .
EXPOSE 8080