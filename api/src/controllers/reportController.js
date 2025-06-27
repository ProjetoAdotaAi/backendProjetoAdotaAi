import { PrismaClient } from "@prisma/client";
import { sendReportToQueue } from '../utils/rabbit.js';
import notificationPublisher from '../utils/notificationPublisher.js';

const prisma = new PrismaClient();

export async function createReport(req, res) {
  /*
  #swagger.tags = ["Reports"]
  #swagger.summary = "Cria um novo report e envia para análise"
  #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["petId", "userId", "reportText"],
          properties: {
            petId: { type: "string" },
            userId: { type: "string" },
            reportText: { type: "string" }
          }
        }
      }
    }
  }
  #swagger.responses[201] = {
    description: "Report enviado para análise."
  }
  #swagger.responses[500] = {
    description: "Erro ao enviar report."
  }
  */
  try {
    const { petId, userId, reportText } = req.body;

    const report = await prisma.report.create({
      data: { petId, userId, reportText, status: "PENDING" }
    });

    await sendReportToQueue({
      petId,
      userId,
      reportText,
      reportId: report.id
    });

    return res.status(201).json({ message: "Report enviado para análise.", report });
  } catch (error) {
    console.error("Erro ao enviar report:", error.message);
    return res.status(500).json({ error: "Erro ao enviar report." });
  }
}

export async function updateReportStatus(req, res) {
  /*
  #swagger.tags = ["Reports"]
  #swagger.summary = "Atualiza o status de um report"
  #swagger.parameters['id'] = { description: "ID do report", required: true }
  #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["PENDING", "REMOVER", "INATIVAR", "MANTER"] }
          }
        }
      }
    }
  }
  #swagger.responses[200] = { description: "Status atualizado." }
  #swagger.responses[404] = { description: "Report não encontrado." }
  #swagger.responses[500] = { description: "Erro ao atualizar status." }
  */
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('Atualizando status do report:', { id, status, body: req.body });

    // Verificar se o report existe antes de tentar atualizar
    const existingReport = await prisma.report.findUnique({
      where: { id }
    });

    if (!existingReport) {
      console.log('Report não encontrado:', id);
      return res.status(404).json({ error: "Report não encontrado." });
    }

    console.log('Report encontrado:', existingReport.id);

    const report = await prisma.report.update({
      where: { id },
      data: { status }
    });

    // Buscar informações do pet separadamente
    let pet = null;
    try {
      pet = await prisma.pet.findUnique({
        where: { id: report.petId }
      });
    } catch (petError) {
      console.log('Pet não encontrado ou erro ao buscar:', petError.message);
    }

    // Enviar notificação baseada no status
    let notificationMessage = "";
    let actionTaken = "";

    switch (status) {
      case "REMOVER":
        try {
          await prisma.pet.delete({ where: { id: report.petId } });
          console.log('Pet removido com sucesso:', report.petId);
        } catch (petError) {
          console.error('Erro ao remover pet:', petError.message);
          // Continua mesmo se falhar ao remover o pet
        }
        notificationMessage = "Obrigado pelo seu report! Após análise, o pet foi removido da plataforma por violar nossas diretrizes.";
        actionTaken = "Pet removido";
        break;
      case "INATIVAR":
        try {
          await prisma.pet.update({
            where: { id: report.petId },
            data: { adopted: true }
          });
          console.log('Pet marcado como adotado:', report.petId);
        } catch (petError) {
          console.error('Erro ao marcar pet como adotado:', petError.message);
          // Continua mesmo se falhar ao atualizar o pet
        }
        notificationMessage = "Obrigado pelo seu report! O pet foi marcado como adotado e removido das buscas.";
        actionTaken = "Pet marcado como adotado";
        break;
      case "MANTER":
        notificationMessage = "Obrigado pelo seu report! Após análise, o pet está em conformidade com nossas diretrizes e permanecerá na plataforma.";
        actionTaken = "Pet mantido na plataforma";
        break;
      default:
        notificationMessage = "Seu report foi processado e está sendo analisado.";
        actionTaken = "Report em análise";
    }

    // Enviar notificação para o usuário que fez o report
    if (status !== "PENDING") {
      try {
        await notificationPublisher.sendReportProcessedNotification({
          userId: report.userId,
          reportId: report.id,
          petId: report.petId,
          petName: pet?.name || "Pet",
          action: actionTaken,
          message: notificationMessage
        });
      } catch (notificationError) {
        console.error("Erro ao enviar notificação:", notificationError);
        // Não falha a operação principal se a notificação falhar
      }
    }

    return res.status(200).json({ message: "Status atualizado.", report });
  } catch (error) {
    console.error("ERRO DETALHADO ao atualizar status:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
      reportId: req.params.id,
      status: req.body.status
    });
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Report não encontrado." });
    }
    return res.status(500).json({ 
      error: "Erro ao atualizar status.", 
      details: error.message 
    });
  }
}

export async function listReports(req, res) {
  /*
  #swagger.tags = ["Reports"]
  #swagger.summary = "Lista todos os reports"
  #swagger.responses[200] = { description: "Lista de reports." }
  #swagger.responses[500] = { description: "Erro ao buscar reports." }
  */
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json({ reports });
  } catch (error) {
    console.error("Erro ao buscar reports:", error.message);
    return res.status(500).json({ error: "Erro ao buscar reports." });
  }
}