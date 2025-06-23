FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm install prisma
RUN npx prisma generate
RUN npm run swagger:gen

EXPOSE 4040

COPY start.sh .

RUN chmod +x start.sh

CMD ["sh", "./start.sh"]
