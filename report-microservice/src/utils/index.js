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
    console.log('Enviando PATCH para API principal:', {
      url: `http://api:4040/api/reports/${report.reportId}/status`,
      status: result.decision,
      reportId: report.reportId
    });

    const response = await axios.patch(
      `http://api:4040/api/reports/${report.reportId}/status`,
      { status: result.decision },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Status do report atualizado na API principal. Response:', response.status);
  } catch (err) {
    console.error('ERRO DETALHADO ao atualizar status na API principal:', {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      url: err.config?.url,
      method: err.config?.method,
      headers: err.config?.headers,
      requestData: err.config?.data
    });
  }
});