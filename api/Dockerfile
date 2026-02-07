FROM node:20-alpine

WORKDIR /app


COPY api/package*.json ./

RUN npm install

COPY api/ .


RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
