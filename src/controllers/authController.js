import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.SECRET_KEY;

export async function login(req, res){
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if(!isValidPassword){
            return res.status(401).json({ error: "Email ou senha inválidos" });
        }

        const token = jwt.sign({ id: user.id }, SECRET_KEY, {
            expiresIn: "1h",
        });
        
        return res.status(200).json({ message: "Login bem-sucedido!", token, user });
    } catch (error) {
        console.log("Erro ao fazer login:", error);
        return res.status(500).json({ error: "Erro ao fazer login" });
    }
}