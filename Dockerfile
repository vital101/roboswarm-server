FROM node:14
WORKDIR /usr/src/app
COPY . .
RUN npm install && npm run build
EXPOSE 8080