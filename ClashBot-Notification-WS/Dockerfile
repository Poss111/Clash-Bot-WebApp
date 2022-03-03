FROM node:14.16.1-alpine
WORKDIR /usr/src/app
COPY package*.json ./dist ./
RUN npm install --production
EXPOSE 82
CMD [ "node", "index.js" ]