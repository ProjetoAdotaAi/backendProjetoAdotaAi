import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import bcrypt from "bcryptjs";

// Criar um novo usuário
export async function createUser(req, res) {
  try {
    const { name, email, password } = req.body;

    // Verifica se o email já está cadastrado
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email já cadastrado." });
    }


    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return res.status(201).json({ message: "Usuário criado com sucesso!", user });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return res.status(500).json({ error: "Erro ao criar usuário" });
  }
}

// Obter todos os usuários
export async function getUsers(req, res) {
  try {
    const users = await prisma.user.findMany();
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao obter usuários' });
  }
}

// Obter um único usuário pelo ID
export async function getUserById(req, res) {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao obter usuário' });
  }
}

// Atualizar um usuário
export async function updateUser(req, res) {
  const { id } = req.params;
  const { name, email, password } = req.body;

  try {
    let updateData = { name, email };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
}


// Deletar um usuário
export async function deleteUser(req, res) {
  const { id } = req.params;
  try {
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });
    return res.status(200).json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
}