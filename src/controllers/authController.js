import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { mailOptions } from "../utils/mailOptions.js";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.SECRET_KEY;

export async function login(req, res) {
   /*
    #swagger.tags = ["Login"]
    #swagger.summary = "Autentica um usuário"
    #swagger.requestBody = {
      required: true,
      schema: { $ref: "#/components/schemas/Auth" }
    }
    #swagger.responses[201]
    */
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { address: true },
    });

    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(401).json({ error: "Email ou senha inválidos" });

    if (!SECRET_KEY) return res.status(500).json({ error: "Chave secreta não configurada" });

    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "1h" });

    const { password: _, address, ...userResponse } = user;

    return res.status(200).json({
      message: "Login bem-sucedido!",
      token,
      user: userResponse,
      address,
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return res.status(500).json({ error: "Erro ao fazer login" });
  }
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtp(req, res) {
   /*
    #swagger.tags = ["Login"]
    #swagger.summary = "Envia o código de recuperação de senha ao e-mail"
    #swagger.requestBody = {
      required: true,
      schema: { $ref: "#/components/schemas/sendOtp" }
    }
    #swagger.responses[201]
    */
  const { email } = req.body;
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

  await prisma.passwordReset.create({
    data: {
      email,
      otp,
      expiresAt,
    },
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const options = mailOptions(email, otp);

  transporter.sendMail(options, (error, info) => {
    if (error) {
      console.error("Erro ao enviar e-mail:", error);
      return res.status(500).json({ error: "Erro ao enviar e-mail" });
    }

    return res.json({
      message:
        "Se existir um e-mail cadastrado, você receberá um código para recuperação.",
    });
  });
}

export async function resetPassword(req, res) {
  /*
    #swagger.tags = ["Login"]
    #swagger.summary = "Reseta a senha do usuário"
    #swagger.requestBody = {
      required: true,
      schema: { $ref: "#/components/schemas/resetPassword" }
    }
    #swagger.responses[201]
    */
  const { email, otp, newPassword } = req.body;

  const reset = await prisma.passwordReset.findFirst({
    where: {
      email,
      otp,
      expiresAt: { gte: new Date() },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!reset) {
    return res.status(400).json({ error: "Código inválido ou expirado" });
  }

  const senhaCriptografada = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email },
    data: { password: senhaCriptografada },
  });

  await prisma.passwordReset.deleteMany({ where: { email } });

  return res.json({ message: "Senha redefinida com sucesso!" });
}
