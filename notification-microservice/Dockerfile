FROM node:20

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm install

COPY . .

EXPOSE 6060

CMD npx prisma generate && npx prisma migrate deploy && node src/index.js
