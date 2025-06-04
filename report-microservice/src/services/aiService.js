import axios from "axios";
import aiConfig from "../config/aiConfig.js";

export async function analyzeReport({ reportText, imageBase64, imageMimeType }) {
  if (!aiConfig.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não definida");

  const url = `${aiConfig.GEMINI_API_URL}?key=${aiConfig.GEMINI_API_KEY}`;

  const prompt = `
Analise o texto e a imagem abaixo, enviados por um usuário denunciando um post. 
Responda apenas com "REMOVER" se houver qualquer violação das regras (ex: conteúdo não relacionado a animais, imagens impróprias, etc), 
"INATIVAR" se for algo moderado, ou "MANTER" se não houver violação.
Texto: "${reportText}"
`;

  const parts = [{ text: prompt }];

  if (imageBase64 && imageMimeType) {
    parts.push({
      inline_data: {
        mime_type: imageMimeType,
        data: imageBase64
      }
    });
  }

  const response = await axios.post(url, {
    contents: [{ parts }]
  });

  const result = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  return {
    decision: result || "INDETERMINADO",
    raw: response.data
  };
}