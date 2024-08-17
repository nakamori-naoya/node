
FROM node:16


WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
RUN npm install typescript jest ts-jest @types/jest ts-node

COPY . .

RUN npm run build