FROM node:14-alpine
WORKDIR /usr/src/app
COPY package*.json .
RUN apk update && apk add zip unzip iputils
RUN npm install && npm run build
COPY . .
EXPOSE 8080