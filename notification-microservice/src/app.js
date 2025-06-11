import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

// Rotas de consulta de notificações podem ser adicionadas aqui

export default app;