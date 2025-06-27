# 📱 Microserviço de Notificações - AdotaAi

Microserviço completo para gerenciamento de notificações em tempo real com WebSocket e persistência no banco de dados.

## 🚀 Funcionalidades

- ✅ **Notificações em tempo real** via WebSocket
- ✅ **Persistência no banco** com Prisma + PostgreSQL
- ✅ **Consumer RabbitMQ** para processar notificações
- ✅ **API REST** para gerenciar notificações
- ✅ **Autenticação JWT**
- ✅ **Templates de notificação**
- ✅ **Sistema de tipos** (REPORT_PROCESSED, PET_ADOPTED, etc.)

## 📦 Tecnologias

- **Node.js** + Express
- **Socket.IO** (WebSocket)
- **Prisma** (ORM)
- **PostgreSQL** (Banco de dados)
- **RabbitMQ** (Message Queue)
- **Winston** (Logs)
- **Docker** (Containerização)

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Principal │───▶│    RabbitMQ      │───▶│   Notification  │
│                 │    │                  │    │   Microservice  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                          │
                                                          ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   PostgreSQL    │◀───│   WebSocket     │
                       │   (Notifications)│    │   (Real-time)   │
                       └─────────────────┘    └─────────────────┘
                                                          │
                                                          ▼
                                               ┌─────────────────┐
                                               │  Flutter App    │
                                               │  (Frontend)     │
                                               └─────────────────┘
```

## 🔧 Configuração

### 1. Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

### 2. Banco de Dados

```bash
# Gerar cliente Prisma
npm run prisma:generate

# Aplicar schema ao banco
npm run prisma:push

# Ou usar migrations
npm run prisma:migrate
```

### 3. Executar

```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Com Docker
docker-compose up notification-service
```

## 📡 Endpoints da API

### Autenticação
Todas as rotas requerem header: `Authorization: Bearer <token>`

### Rotas Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/notifications` | Lista notificações do usuário |
| `GET` | `/api/notifications/unread-count` | Conta não lidas |
| `PATCH` | `/api/notifications/:id/read` | Marca como lida |
| `PATCH` | `/api/notifications/read-all` | Marca todas como lidas |
| `DELETE` | `/api/notifications/:id` | Deleta notificação |

### Rotas de Desenvolvimento

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/notifications` | Cria notificação |
| `POST` | `/api/notifications/test` | Envia notificação de teste |
| `GET` | `/api/notifications/stats` | Estatísticas WebSocket |

### Exemplos de Uso

#### Listar Notificações
```bash
curl -H "Authorization: Bearer <token>" \
     "http://localhost:3003/api/notifications?page=1&limit=10"
```

#### Marcar como Lida
```bash
curl -X PATCH \
     -H "Authorization: Bearer <token>" \
     "http://localhost:3003/api/notifications/{id}/read"
```

#### Criar Notificação de Teste
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"userId":"user-id","title":"Teste","message":"Mensagem de teste"}' \
     "http://localhost:3003/api/notifications/test"
```

## 🔌 WebSocket

### Conectar ao WebSocket

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3003');

// Registrar usuário
socket.emit('register', { userId: 'user-id' });

// Escutar notificações
socket.on('report_processed', (data) => {
  console.log('Report processado:', data);
});

socket.on('notification', (data) => {
  console.log('Nova notificação:', data);
});
```

### Eventos WebSocket

| Evento | Direção | Descrição |
|--------|---------|-----------|
| `register` | Client → Server | Registra usuário |
| `registered` | Server → Client | Confirmação de registro |
| `report_processed` | Server → Client | Notificação de report |
| `notification` | Server → Client | Notificação genérica |

## 📨 Tipos de Notificação

### 1. Report Processado
```json
{
  "type": "report_processed",
  "userId": "user-id",
  "reportId": "report-id",
  "petId": "pet-id",
  "petName": "Nome do Pet",
  "action": "REMOVER" // ou "INATIVAR"
}
```

### 2. Pet Adotado
```json
{
  "type": "pet_adopted",
  "userId": "owner-id",
  "petId": "pet-id",
  "petName": "Nome do Pet",
  "adopter": "Nome do Adotante"
}
```

### 3. Mensagem do Usuário
```json
{
  "type": "user_message",
  "userId": "user-id",
  "title": "Título",
  "message": "Mensagem",
  "extraData": {}
}
```

## 🔄 Fluxo de Notificação

1. **API Principal** envia evento para RabbitMQ
2. **Consumer** recebe e processa a mensagem
3. **Notificação** é salva no banco de dados
4. **WebSocket** envia notificação em tempo real
5. **Frontend** recebe e exibe para o usuário

## 🐛 Debug

### Logs
```bash
# Ver logs em tempo real
docker-compose logs -f notification-service

# Ver apenas erros
docker-compose logs notification-service | grep ERROR
```

### Health Check
```bash
curl http://localhost:3003/health
```

### Verificar WebSocket
```bash
# Estatísticas de conexões
curl -H "Authorization: Bearer <token>" \
     http://localhost:3003/api/notifications/stats
```

## 📊 Monitoramento

### Métricas Disponíveis
- Usuários conectados no WebSocket
- Total de notificações por tipo
- Notificações não lidas por usuário
- Performance do RabbitMQ consumer

### Logs Estruturados
Todos os logs são em formato JSON com:
- `timestamp`
- `level` (info, warn, error)
- `service` (notification-service)
- `message`
- `metadata` (dados extras)

## 🚀 Deploy

### Docker
```bash
docker-compose up -d notification-service
```

### Produção
1. Configure variáveis de ambiente
2. Execute migrations do Prisma
3. Inicie o serviço
4. Configure load balancer se necessário

## 📝 Próximos Passos

- [ ] Push notifications para mobile
- [ ] Notificações por email
- [ ] Templates customizáveis
- [ ] Agendamento de notificações
- [ ] Analytics de engajamento
- [ ] Rate limiting por usuário

---

**Desenvolvido com ❤️ para o AdotaAi** 🐾
