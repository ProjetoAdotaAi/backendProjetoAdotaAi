import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function addFavorite(req, res) {
  /*
    #swagger.tags = ["Favorites"]
    #swagger.summary = "Adiciona um pet aos favoritos do usuário"
    #swagger.responses[201] = {
      description: "Pet adicionado aos favoritos com sucesso"
    }
    #swagger.responses[400] = {
      description: "Pet já está nos favoritos"
    }
    #swagger.responses[404] = {
      description: "Usuário ou pet não encontrado"
    }
  */
  try {
    const { userId, petId } = req.body;

    // Verifica se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    // Verifica se o pet existe
    const pet = await prisma.pet.findUnique({
      where: { id: petId }
    });

    if (!pet) {
      return res.status(404).json({ error: "Pet não encontrado." });
    }

    // Verifica se já está favoritado
    const existingFavorite = await prisma.favoritePet.findUnique({
      where: {
        userId_petId: {
          userId,
          petId
        }
      }
    });

    if (existingFavorite) {
      return res.status(400).json({ error: "Pet já está nos favoritos." });
    }

    // Adiciona aos favoritos
    const favorite = await prisma.favoritePet.create({
      data: {
        userId,
        petId
      },
      include: {
        pet: {
          include: {
            photos: true
          }
        }
      }
    });

    res.status(201).json({
      message: "Pet adicionado aos favoritos com sucesso.",
      favorite
    });

  } catch (error) {
    console.error("Erro ao adicionar favorito:", error);
    res.status(500).json({ error: "Erro ao adicionar pet aos favoritos." });
  }
}

export async function removeFavorite(req, res) {
  /*
    #swagger.tags = ["Favorites"]
    #swagger.summary = "Remove um pet dos favoritos do usuário"
    #swagger.responses[200] = {
      description: "Pet removido dos favoritos com sucesso"
    }
    #swagger.responses[404] = {
      description: "Favorito não encontrado"
    }
  */
  try {
    const { userId, petId } = req.params;

    const favorite = await prisma.favoritePet.delete({
      where: {
        userId_petId: {
          userId,
          petId
        }
      }
    });

    if (!favorite) {
      return res.status(404).json({ error: "Favorito não encontrado." });
    }

    res.json({
      message: "Pet removido dos favoritos com sucesso."
    });

  } catch (error) {
    console.error("Erro ao remover favorito:", error);
    res.status(500).json({ error: "Erro ao remover pet dos favoritos." });
  }
}

export async function getUserFavorites(req, res) {
  /*
    #swagger.tags = ["Favorites"]
    #swagger.summary = "Lista todos os pets favoritos de um usuário"
    #swagger.responses[200] = {
      description: "Lista de favoritos retornada com sucesso"
    }
    #swagger.responses[404] = {
      description: "Usuário não encontrado"
    }
  */
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const favorites = await prisma.favoritePet.findMany({
      where: {
        userId
      },
      include: {
        pet: {
          include: {
            photos: true,
            owner: true
          }
        }
      }
    });

    res.json(favorites);

  } catch (error) {
    console.error("Erro ao listar favoritos:", error);
    res.status(500).json({ error: "Erro ao listar pets favoritos." });
  }
} 