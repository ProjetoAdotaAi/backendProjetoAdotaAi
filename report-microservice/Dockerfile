FROM node:20

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma      
RUN npm install

COPY . .

EXPOSE 5050

CMD npx prisma migrate deploy && npx prisma generate && npm run start