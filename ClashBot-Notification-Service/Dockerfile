FROM node:14.16.1-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 80
CMD [ "node", "index.ts" ]
