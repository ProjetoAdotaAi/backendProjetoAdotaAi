# Report Microservice

Este microserviço é responsável por receber denúncias de usuários sobre posts, analisar o conteúdo textual e a imagem associada utilizando IA (Google Gemini), e atualizar o status do report na API principal conforme a decisão da análise.

---

## Funcionalidades

- **Receber denúncias** via fila RabbitMQ (enviadas pela API principal).
- **Buscar automaticamente a imagem do pet** no banco, baixar e converter para base64.
- **Analisar texto e imagem** usando IA multimodal (Google Gemini).
- **Atualizar o status do report** na API principal conforme a decisão da IA.
- **Logar o resultado da análise** para auditoria.

---

## Tecnologias Utilizadas

- **Node.js** (Express)
- **Prisma ORM** (PostgreSQL)
- **RabbitMQ** (mensageria)
- **Google Gemini API** (IA multimodal)
- **Axios** (HTTP requests)
- **Docker** (containerização)

---

## Como funciona o fluxo

1. **Usuário faz uma denúncia** na API principal.
2. **API principal salva o report** e envia uma mensagem para a fila do RabbitMQ.
3. **Este microserviço consome a fila**, busca a imagem do pet pelo `petId`, converte para base64 e envia texto + imagem para a IA.
4. **A IA retorna uma decisão**: `REMOVER`, `INATIVAR` ou `MANTER`.
5. **O microserviço atualiza o status do report** na API principal via requisição PATCH.

---

## Como rodar localmente

1. **Clone o repositório** e acesse a pasta do microserviço:

   ```sh
   git clone <repo>
   cd backendProjetoAdotaAi/report-microservice