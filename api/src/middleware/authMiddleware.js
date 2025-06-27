import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || process.env.SECRET_KEY;

console.log("SECRET_KEY para verificação:", SECRET_KEY ? "Carregada" : "NÃO CARREGADA ou vazia");
if (!SECRET_KEY) {
  console.error("ALERTA: A SECRET_KEY não está definida nas variáveis de ambiente!");
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  console.log("Conteúdo do req.headers:", req.headers); 
  console.log("Authorization Header recebido:", authHeader); 

   if (!authHeader) {
    console.error("Header 'Authorization' não encontrado na requisição.");
    return res.status(401).json({ error: "Acesso negado. Header de autorização não fornecido." });
  }

  const token = authHeader && authHeader.split(" ")[1];

  console.log("Token extraído:", token); 

  if (!token) {
    return res.status(401).json({ error: "Acesso negado. Token não fornecido." });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido ou expirado." });
    }

    req.user = user;
    next();
  });
}