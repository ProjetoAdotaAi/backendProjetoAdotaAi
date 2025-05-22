#!/bin/sh

echo "📦 Aplicando migrações do Prisma..."
npx prisma migrate deploy

echo "🚀 Iniciando o servidor..."
npm run dev
