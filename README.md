# Backend - Projeto AdotaAi

Este é o backend do projeto **AdotaAi**, uma API para gerenciar a adoção de animais.

## Tecnologias utilizadas

- Node.js & Express.js
- Prisma ORM & PostgreSQL
- Docker
- Swagger (para documentação)
- JWT (para autenticação)

## Como rodar com Docker (Recomendado)

1.  **Clone o repositório e suba os containers:**

    O comando `--build` é importante para garantir que todas as dependências sejam instaladas e que a documentação da API seja gerada corretamente.

    ```bash
    docker-compose up --build
    ```

2.  **Rode as migrações do banco de dados (apenas na primeira vez):**

    Em outro terminal, acesse o container da API e execute o comando para criar as tabelas no banco.

    ```bash
    docker exec -it api sh
    npx prisma migrate dev --name init
    ```

    > Para execuções futuras, caso haja novas migrações, use `npx prisma migrate deploy` para atualizar o banco sem perder dados.

## Documentação da API (Swagger)

A documentação da API é gerada automaticamente pelo Swagger e fica acessível em:

- **<http://localhost:4040/swagger>**

### Atualizando a Documentação

A documentação (`swagger.json`) é gerada durante o build da imagem Docker. Se você fizer alterações nas rotas da API ou nos comentários de documentação nos controllers, **você precisa reconstruir a imagem da API** para que as mudanças sejam refletidas:

```bash
docker-compose up --build api
```

## Desenvolvimento Local (Sem Docker)

1.  **Instale as dependências:**
    ```bash
    npm install
    ```

2.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` na raiz do projeto, usando o `.env.example` como base.

3.  **Rode as migrações do banco:**
    ```bash
    npx prisma migrate dev
    ```

4.  **Gere a documentação do Swagger:**
    Este comando precisa ser executado sempre que você alterar as rotas ou a documentação.
    ```bash
    npm run swagger:gen
    ```

5.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

## Contato

Dúvidas ou sugestões? Sinta-se à vontade para [abrir uma issue](https://github.com/ProjetoAdotaAi/backendProjetoAdotaAi/issues)!
