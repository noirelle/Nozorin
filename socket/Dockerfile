FROM node:20-alpine

WORKDIR /app

COPY socket/package*.json ./

RUN npm install

COPY socket/ .

RUN npm run build

EXPOSE 3002

CMD ["npm", "start"]
