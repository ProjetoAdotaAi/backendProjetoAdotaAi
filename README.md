# Backend - Projeto AdotaAi

Este repositório contém o backend do projeto **AdotaAi**, composto por uma API principal, um microsserviço de relatórios com IA para análise de denúncias de posts, além de um serviço de notificações. Toda a infraestrutura pode ser orquestrada facilmente via Docker Compose.

## Arquitetura

- **API Principal:** Gerencia usuários, pets, interações e autenticação.
- **Report Microservice:** Microsserviço responsável por processar e analisar denúncias, utilizando IA (Gemini API) e banco de dados próprio.
- **Notificações** Microsserviço reponsável por notificar os usuários de atualizações sobre seus pets.
- **RabbitMQ:** Fila de mensagens para comunicação entre a API e o microsserviço.
- **PostgreSQL:** Cada serviço possui seu próprio banco de dados.
- **Adminer:** Interface web para gerenciar o banco da API.

## Tecnologias utilizadas

- Node.js & Express.js
- Prisma ORM & PostgreSQL
- Docker
- RabbitMQ
- Swagger (para documentação)
- JWT (para autenticação)
- Gemini API (IA)

## Como rodar tudo com Docker (Recomendado)

1. **Clone o repositório e suba todos os containers:**

   O comando `--build` garante que todas as dependências estejam atualizadas.

   ```bash
   docker-compose up --build
   ```

2. **Rode as migrações dos bancos de dados:**

Na primeira vez que for rodar o projeto, é necessário abrir um outro terminal rodar as migrations para cada microsserviço, pois seus bancos são separados:

   - **API principal:**
     ```bash
     docker exec -it api sh
     npx prisma migrate deploy
     ```
   - **Report Microservice:**
     ```bash
     docker exec -it report-service sh
     npx prisma migrate deploy
     ```
    - **Report Microservice:**
    ```bash
    docker exec -it notification-service sh
    npx prisma migrate deploy
    ```


   > Para execuções futuras, use sempre `npx prisma migrate deploy` para aplicar novas migrações sem perder dados.

3. **Variáveis de ambiente:**
   - Certifique-se de que os arquivos `.env` estejam presentes em `api/.env` e `report-microservice/.env`.
   - O `report-microservice/.env` deve conter sua chave da Gemini API:
     ```env
     GEMINI_API_KEY="SUA_CHAVE_AQUI"
     ```

## Documentação da API (Swagger)

A documentação da API principal está disponível em:

- **<http://localhost:4040/swagger>**

### Atualizando a Documentação

A documentação (`swagger.json`) é gerada durante o build da imagem Docker da API. Se você fizer alterações nas rotas ou nos comentários de documentação, **reconstrua a imagem da API**:

```bash
docker-compose up --build api
```

## Desenvolvimento Local (Sem Docker)

### API Principal

1.  **Instale as dependências:**
    ```bash
    cd api
    npm install
    ```
2.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` usando o `.env.example` como base.
3.  **Rode as migrações:**
    ```bash
    npx prisma migrate dev
    ```
4.  **Gere a documentação do Swagger:**
    ```bash
    npm run swagger:gen
    ```
5.  **Inicie o servidor:**
    ```bash
    npm run dev
    ```

### Report Microservice

1.  **Instale as dependências:**
    ```bash
    cd report-microservice
    npm install
    ```
2.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` com sua chave Gemini API.
3.  **Rode as migrações:**
    ```bash
    npx prisma migrate dev
    ```
4.  **Inicie o servidor:**
    ```bash
    npm run dev
    ```

## Contato

Dúvidas ou sugestões? Sinta-se à vontade para [abrir uma issue](https://github.com/ProjetoAdotaAi/backendProjetoAdotaAi/issues)! 