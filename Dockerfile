FROM node:20-alpine

RUN apk add git

WORKDIR /

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "run", "start"]

EXPOSE 3000