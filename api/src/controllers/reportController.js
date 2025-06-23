import { PrismaClient } from "@prisma/client";
import { sendReportToQueue } from '../utils/rabbit.js';

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

    const report = await prisma.report.update({
      where: { id },
      data: { status }
    });

    if (status === "REMOVER") {
      await prisma.pet.delete({ where: { id: report.petId } });
    }
    if (status === "INATIVAR") {
      await prisma.pet.update({
        where: { id: report.petId },
        data: { adopted: true }
      });
    }

    return res.status(200).json({ message: "Status atualizado.", report });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Report não encontrado." });
    }
    console.error("Erro ao atualizar status:", error.message);
    return res.status(500).json({ error: "Erro ao atualizar status." });
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