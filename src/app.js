import express from "express";
import cors from "cors";
import routes from "./routes.js";
import swaggerUi from 'swagger-ui-express';
import swaggerDocs from './config/swagger.json' with { type: 'json' };

const app = express();

app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' })); // ou o tamanho desejado
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(routes);

export default app;
