import swaggerAutogen from "swagger-autogen";
import dotenv from "dotenv";


dotenv.config();

const doc = {
    info: {
        version: "1.0.0",
        title: "API ADOTAÍ",
        description: "Documentação da API ADOTAÍ\n\n## Microserviços Relacionados\n\n- **Notification Service**: [http://localhost:3003/swagger/](http://localhost:3003/swagger/) - Documentação da API de notificações\n- **Report Microservice**: Serviço de relatórios com moderação por IA",
    },
    servers: [
        {
            url: "http://localhost:4040/"
        }
    ],
    security: [{
        bearerAuth: []
    }],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            }
        },
  schemas: {
    InternalServerError: {
      code: 500,
      message: "Erro interno no servidor"
    },
    Auth: {
      email: "",
      password: ""
    },
    sendOtp: {
      email: "",
    },
    resetPassword: {
      email: "",
      otp: "",
      newPassword: ""
    },
    User: {
      name: "",
      email: "",
      password: "",
      phone: "",
      instagram: "",
      isOng: false,
      address: {
        cep: "",
        city: "",
        state: ""
      },
      firebaseId: "",
      profilePicture: ""
    },
    Pet: {
      name: "",
      species: "",
      size: "",
      age: 3,
      sex: "",
      castrated: true,
      dewormed: true,
      vaccinated: true,
      description: "",
      ownerId: 1,
      photos: [
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z/CfAQADjAKoUu36JQAAAABJRU5ErkJggg=="
  ]

    }
  }
}

};

const outputFile = "./config/swagger.json";
const endpointsFiles = ["./src/routes.js"];

swaggerAutogen({ openapi: "3.0.0" })(outputFile, endpointsFiles, doc)
    .then(() => {
        console.log("Documentação do Swagger gerada com sucesso em " + outputFile);
    })
    .catch((err) => {
        console.error("Erro ao gerar o Swagger JSON:", err);
    });
