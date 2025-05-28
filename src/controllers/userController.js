import { PrismaClient } from '@prisma/client';
import bcrypt from "bcryptjs";
import cloudinary from '../utils/cloudinary.js';

const prisma = new PrismaClient();

export async function createUser(req, res) {
  try {
    const { firebaseId, name, phone, instagram, email, password, address, isOng } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Já existe um usuário com este email." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        firebaseId,
        name,
        phone,
        instagram,
        email,
        password: hashedPassword,
        address: address ? {
          create: {
            cep: address.cep,
            city: address.city,
            state: address.state,
          }
        } : undefined,
        isOng,
      },
    });

    return res.status(201).json({ message: "Usuário criado com sucesso.", user });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return res.status(500).json({ error: "Erro ao criar usuário" });
  }
}

export async function getUsers(req, res) {
  try {
    const users = await prisma.user.findMany();
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Ocorreu um erro ao tentar listar os usuários.' });
  }
}

export async function getUserById(req, res) {
  const { id } = req.params; // id já é string UUID
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return res.status(404).json({ error: 'Nenhum usuário encontrado com o ID fornecido.' });
    }
    return res.status(200).json({ message: 'Usuário encontrado com sucesso.', user });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
}

export async function updateUser(req, res) {
  const { id } = req.params;
  const { name, email, password } = req.body;

  try {
    let updateData = { name, email };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({ message: "Usuário atualizado com sucesso.", updatedUser });
  } catch (error) {
    return res.status(500).json({ error: "Ocorreu um erro ao tentar atualizar o usuário." });
  }
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id } });
    return res.status(200).json({ message: 'Usuário deletado com sucesso.' });
  } catch (error) {
    return res.status(500).json({ error: 'Ocorreu um erro ao tentar deletar o usuário.' });
  }
}

export async function updateProfilePicture(req, res) {
  const { id } = req.params;
  const { profilePicture } = req.body;

  if (!profilePicture || typeof profilePicture !== 'string') {
    return res.status(400).json({ error: "A imagem em base64 é obrigatória." });
  }

  try {
    const uploadResponse = await cloudinary.uploader.upload(profilePicture, {
      folder: 'profile_pictures',
    });

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        profilePicture: uploadResponse.secure_url,
      },
    });

    return res.status(200).json({
      message: "Foto de perfil atualizada com sucesso.",
      profilePictureUrl: uploadResponse.secure_url,
      updatedUser,
    });
  } catch (error) {
    console.error("Erro ao atualizar foto de perfil:", error);
    return res.status(500).json({ error: "Erro ao atualizar foto de perfil." });
  }
}
