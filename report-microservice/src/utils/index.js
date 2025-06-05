import { consumeReports } from './rabbit.js';
import { analyzeReport } from '../services/aiService.js';
import axios from "axios";

consumeReports(async (report) => {
  console.log('Report recebido do RabbitMQ:', report);

  // Log do que foi analisado
  console.log('Texto analisado:', report.reportText);
  console.log('petId analisado:', report.petId);

  const start = Date.now();
  const result = await analyzeReport(report);
  console.log('Tempo de resposta IA:', Date.now() - start, 'ms');
  console.log('Resultado da IA:', result);

  // Atualiza o status do report na API principal
  try {
    await axios.patch(
    `http://host.docker.internal:4040/api/reports/${report.reportId}/status`,
    { status: result.decision }
  );
    console.log('Status do report atualizado na API principal.');
  } catch (err) {
    console.error('Erro ao atualizar status na API principal:', err.message);
  }
});