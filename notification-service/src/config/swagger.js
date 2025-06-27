import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AdotaAi Notification Service API',
      version: '1.0.0',
      description: `Microserviço de notificações em tempo real do AdotaAi

## Funcionalidades

- **Notificações em Tempo Real**: WebSocket para entrega instantânea
- **Persistência**: Armazenamento em banco de dados PostgreSQL  
- **Integração RabbitMQ**: Recebimento de eventos via message broker
- **Autenticação JWT**: Segurança integrada com a API principal

## APIs Relacionadas

- **API Principal**: [http://localhost:4040/swagger/](http://localhost:4040/swagger/) - Documentação da API principal do AdotaAí

## Como Usar

1. Autentique-se na API principal para obter um token JWT
2. Use o token para acessar os endpoints protegidos
3. Conecte-se ao WebSocket para receber notificações em tempo real`,
      contact: {
        name: 'AdotaAi Team',
        email: 'dev@adotaai.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3003',
        description: 'Servidor de desenvolvimento',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Notification: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único da notificação',
            },
            userId: {
              type: 'string',
              description: 'ID do usuário destinatário',
            },
            type: {
              type: 'string',
              enum: ['REPORT_PROCESSED', 'PET_ADOPTED', 'USER_MESSAGE'],
              description: 'Tipo da notificação',
            },
            title: {
              type: 'string',
              description: 'Título da notificação',
            },
            message: {
              type: 'string',
              description: 'Mensagem da notificação',
            },
            data: {
              type: 'object',
              description: 'Dados adicionais da notificação',
            },
            read: {
              type: 'boolean',
              description: 'Status de leitura da notificação',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de atualização',
            },
          },
        },
        NotificationList: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Notification',
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                pages: { type: 'integer' },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Mensagem de erro',
            },
            error: {
              type: 'string',
              description: 'Detalhes do erro',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              description: 'Mensagem de sucesso',
            },
            data: {
              type: 'object',
              description: 'Dados retornados',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'], // Caminho para arquivos com anotações JSDoc
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
