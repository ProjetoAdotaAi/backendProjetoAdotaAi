# Backend - Projeto AdotaAi

Este é o backend do projeto **AdotaAi**, uma API para gerenciar a adoção de animais.

## Pré-requisitos

- Docker e Docker Compose instalados
- Node.js e npm (opcional, para desenvolvimento local)

## Como rodar o projeto

1. **Suba os containers com Docker Compose:**

   ```bash
   docker compose up --build
   ```

2. **Abra outro terminal e acesse o container da API:**

   ```bash
   docker exec -it api sh
   ```

3. **Rode as migrações do banco de dados (apenas na primeira vez):**

   ```bash
   npx prisma migrate dev --name init
   ```

   > Use o comando acima apenas na primeira execução do projeto para criar as tabelas iniciais no banco de dados.

4. **Para sincronizar o banco de dados nas próximas execuções (sem perder dados):**

   ```bash
   npx prisma migrate deploy
   ```

   > O comando `migrate deploy` aplica apenas as migrações pendentes, preservando os dados existentes.

## Tecnologias utilizadas

- Node.js
- Prisma ORM
- Docker

## Contato

Dúvidas ou sugestões? Sinta-se à vontade para [abrir uma issue](https://github.com/seu-repo/backendProjetoAdotaAi/issues)!
