  import { PrismaClient } from '@prisma/client';
  import bcrypt from "bcryptjs";
  import cloudinary from '../utils/cloudinary.js';

  const prisma = new PrismaClient();

  export async function createUser(req, res) {
      /*
    #swagger.tags = ["Users"]
    #swagger.summary = "Cria um usuário"
    #swagger.requestBody = {
      required: true,
      schema: { $ref: "#/components/schemas/User" }
    }
    #swagger.responses[201]
    */
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
    /*
    #swagger.tags = ["Users"]
    #swagger.summary = "Lista todos os usuários"
    #swagger.responses[200] = {
      description: "Usuários encontrados"
    }
    #swagger.responses[500] = {
      description: "Erro ao buscar usuários"
    }
    */
    try {
      const users = await prisma.user.findMany();
      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({ error: 'Ocorreu um erro ao tentar listar os usuários.' });
    }
  }

  export async function getUserById(req, res) {
    /*
    #swagger.tags = ["Users"]
    #swagger.summary = "Listar um único usuário"
    #swagger.responses[201]
    */
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
    /*
    #swagger.tags = ["Users"]
    #swagger.summary = "Atualiza um usuário"
    #swagger.requestBody = {
      required: true,
      schema: { $ref: "#/components/schemas/User" }
    }
    #swagger.responses[201]
    */
    const { id } = req.params;
    const { name, email, password, phone, instagram, isOng } = req.body;

    try {
      let updateData = { name, email };

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      if (phone) {
        updateData.phone = phone;
      }

      if (instagram) {
        updateData.instagram = instagram;
      }

      if (isOng) {
        updateData.isOng = isOng;
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
    /*
      #swagger.tags = ["Users"]
      #swagger.summary = "Deleta um usuário"
      #swagger.parameters['id'] = {
        in: 'path',
        description: 'ID do usuário',
        required: true,
        type: 'integer'
      }
      #swagger.responses[200] = {
        description: 'Usuário deletado com sucesso'
      }
      #swagger.responses[500] = {
        description: 'Erro ao deletar usuário'
      }
    */
    const { id } = req.params;
    try {
      await prisma.user.delete({ where: { id } });
      return res.status(200).json({ message: 'Usuário deletado com sucesso.' });
    } catch (error) {
      return res.status(500).json({ error: 'Ocorreu um erro ao tentar deletar o usuário.' });
    }
  }

  export async function updateProfilePicture(req, res) {
    /*
      #swagger.tags = ["Users"]
      #swagger.summary = "Atualiza a foto de perfil de um usuário usando Cloudinary"
    */
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

  export async function getAllUsers(req, res) {
    /*
      #swagger.tags = ["Users"]
      #swagger.summary = "Lista todos os usuários"
      #swagger.parameters['isOng'] = {
        in: 'query',
        description: 'Filtra por usuários que são ONGs (true) ou não (false)',
        type: 'boolean',
        required: false
      }
      #swagger.responses[200] = {
        description: "Usuários encontrados com sucesso"
      }
      #swagger.responses[500] = {
        description: "Erro ao buscar usuários"
      }
    */
    try {
      const { isOng } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 15;
      const skip = (page - 1) * limit;

      const where = {};
      if (isOng !== undefined && isOng !== null && isOng !== '') {
        where.isOng = String(isOng).toLowerCase() === 'true';
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isOng: true,
            profilePicture: true,
            address: {
              select: {
                city: true,
                state: true,
              },
            },
          },
        }),
        prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        data: users,
        page,
        limit,
        total,
        totalPages,
      });
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ error: "Erro ao buscar usuários." });
    }
  }

  export async function searchUsers(req, res) {
    /*
    #swagger.tags = ["Users"]
    #swagger.summary = "Pesquisa usuários"
    #swagger.parameters['query'] = {
      in: 'query',
      description: 'Termo de busca',
      type: 'string',
      required: true
    }
    #swagger.responses[200] = {
      description: "Usuários encontrados com sucesso"
    }
    #swagger.responses[500] = {
      description: "Erro ao buscar usuários"
    }
    */
    try {
      const { query } = req.query;
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
          ],
        },
      });
      return res.status(200).json(users);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return res.status(500).json({ error: "Erro ao buscar usuários." });
    }
  }
