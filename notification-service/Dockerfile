FROM node:18-alpine

WORKDIR /app

# Instala dependências do sistema
RUN apk add --no-cache openssl

# Copia arquivos de dependência
COPY package*.json ./
COPY prisma ./prisma/

# Instala dependências
RUN npm install --production

# Gera cliente Prisma
RUN npx prisma generate

# Copia código fonte
COPY src ./src

# Cria diretório de logs
RUN mkdir -p logs

# Adiciona usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Muda ownership dos arquivos
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expõe a porta
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 3003, path: '/health', timeout: 2000 }; const req = http.get(options, (res) => { if (res.statusCode === 200) process.exit(0); else process.exit(1); }); req.on('error', () => process.exit(1)); req.on('timeout', () => { req.destroy(); process.exit(1); });"

# Comando para iniciar
CMD ["npm", "start"]
