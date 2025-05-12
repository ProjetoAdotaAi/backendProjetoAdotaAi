FROM node:18

# Define o diretório de trabalho no container
WORKDIR /app

# Copia os arquivos de dependências e instala as dependências
COPY package*.json ./
RUN npm install

# Copia o restante do código para dentro do container
COPY . .

# Gera o Prisma Client
RUN npm install prisma
RUN npx prisma generate




# Expõe a porta em que o servidor vai rodar
EXPOSE 4040

# Comando para rodar o servidor na inicialização
CMD ["npm", "run", "dev"]
