import swaggerAutogen from "swagger-autogen";

const doc = {
    info: {
        version: "1.0.0",
        title: "API ADOTAÍ",
        description: "Documentação da API ADOTAÍ",
    },
    servers: [
        {
            url: "http://localhost:4040/"
        }
    ],
    components: {
  schemas: {
    InternalServerError: {
      code: 500,
      message: "Erro interno no servidor"
    },
    Auth: {
      name: "",
      email: ""
    },
    User: {
      firabaseId: "",
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
      }
    },
    Pet: {
      name: "Bolt",
      species: "Cachorro",
      size: "Médio",
      age: 3,
      sex: "Macho",
      castrated: true,
      dewormed: true,
      vaccinated: true,
      description: "Muito dócil e brincalhão",
      ownerId: 1,
      photos: [
        { url: "https://exemplo.com/foto1.jpg" },
        { url: "https://exemplo.com/foto2.jpg" }
      ]
    }
  }
}

};

const outputFile = "./config/swagger.json";
const endpointsFiles = ["./src/routes.js"];

swaggerAutogen({ openapi: "3.0.0" })(outputFile, endpointsFiles, doc)
    .then(async () => {
        await import("./server.js");
    })
    .catch((err) => {
        console.error("Erro ao gerar o Swagger JSON:", err);
    });
