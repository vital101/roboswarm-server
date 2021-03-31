FROM node:14-alpine
WORKDIR /usr/src/app
COPY . .
RUN apk add zip unzip traceoute
RUN npm install && npm run build
EXPOSE 8080