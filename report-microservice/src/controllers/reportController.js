import { analyzeReport } from "../services/aiService.js";
import { fetchImageAsBase64 } from "../utils/fetchImageAsBase64.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function handleReport(req, res, next) {
  try {
    const { petId, userId, reportText } = req.body;

    // Busca a primeira foto do pet
    const photo = await prisma.petPhoto.findFirst({ where: { petId } });
    if (!photo) {
      return res.status(404).json({ error: "Foto do pet não encontrada." });
    }

    // Baixa a imagem e converte para base64
    const { base64, mimeType } = await fetchImageAsBase64(photo.url);

    const aiResult = await analyzeReport({
      reportText,
      imageBase64: base64,
      imageMimeType: mimeType
    });

    res.status(200).json({
      petId,
      userId,
      reportText,
      imageUrl: photo.url,
      aiDecision: aiResult.decision,
      aiRaw: aiResult.raw
    });
  } catch (err) {
    next(err);
  }
}