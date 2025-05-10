import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import bcrypt from "bcryptjs";

//Criar usuários:
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
    const { name, phone, email, password, instagram, isOng, address } = req.body;

    // Verifica se o email já está cadastrado
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Já existe um usuário com este email." });
    }

    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(password, 10);


    const user = await prisma.user.create({
      data: {
        name,
        phone,
        email,
        password: hashedPassword,
        instagram,
        isOng,
        address: {
          create: {
            cep: address.cep,
            city: address.city,
            state: address.state,
          }
        }
      },
    });

    //Retornos possíveis
    return res.status(201).json({ message: "Usuário criado com sucesso.", user });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return res.status(500).json({ error: "Erro ao criar usuário" });
  }
}

//Listar todos os usuários
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
    return res.status(200).json(users);  // Retorna lista vazia se não houver usuários
  } catch (error) {
    return res.status(500).json({ error: 'Ocorreu um erro ao tentar listar os usuários.' });
  }
}

//Obter um único usuário pelo ID
export async function getUserById(req, res) {
  /*
  #swagger.tags = ["Users"]
  #swagger.summary = "Listar um único usuário"
  #swagger.responses[201]
  */
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });
    if (!user) {
      return res.status(404).json({ error: 'Nenhum usuário encontrado com o ID fornecido.' });
    }
    return res.status(200).json({ message: 'Usuário encontrado com sucesso.', user });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
}

//Atualizar um usuário
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
    const userId = parseInt(id, 10); // Separar a conversão
    await prisma.user.delete({ where: { id: userId } });
    return res.status(200).json({ message: 'Usuário deletado com sucesso.' });
  } catch (error) {
    return res.status(500).json({ error: 'Ocorreu um erro ao tentar deletar o usuário.' });
  }
}
