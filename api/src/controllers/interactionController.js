import { PrismaClient } from '@prisma/client';
import { generatePetListLinks, addPetLinks } from '../utils/hateos.js';

const prisma = new PrismaClient();

// Helper function to parse comma-separated string query parameters into an array
const parseMultiValueString = (value) => {
  if (!value || typeof value !== 'string') return [];
  return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
};

// Função para embaralhar um array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export async function createInteraction(req, res) {
  /*
    #swagger.tags = ["Interactions"]
    #swagger.summary = "Cria ou atualiza uma interação (favoritar/descartar) com um pet"
    #swagger.security = [{"bearerAuth": []}]
    #swagger.responses[201] = {
      description: "Interação criada/atualizada com sucesso."
    }
  */
  try {
    const { petId, type } = req.body;
    const userId = req.user.id;

    if (!type || (type !== 'FAVORITED' && type !== 'DISCARDED')) {
      return res.status(400).json({ error: "O campo 'type' é obrigatório e deve ser FAVORITED ou DISCARDED." });
    }

    const interaction = await prisma.petInteraction.upsert({
      where: {
        userId_petId: {
          userId,
          petId,
        },
      },
      update: {
        type: type,
      },
      create: {
        userId,
        petId,
        type,
      },
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const response = {
      ...interaction,
      _links: {
        self: { href: `${baseUrl}/api/interactions` },
        pet: { href: `${baseUrl}/api/pets/${interaction.petId}` },
        user: { href: `${baseUrl}/api/users/${interaction.userId}` },
      },
    };

    res.status(201).json(response);
  } catch (error) {
    if (error.code === 'P2003') {
        return res.status(404).json({ error: "Pet não encontrado." });
    }
    console.error("Erro ao criar/atualizar interação:", error);
    res.status(500).json({ error: "Erro ao criar ou atualizar interação." });
  }
}

export async function getPetsForUser(req, res) {
  /*
    #swagger.tags = ["Interactions"]
    #swagger.summary = "Retorna pets para o usuário interagir, com filtros e paginação."
    #swagger.security = [{"bearerAuth": []}]
    #swagger.parameters['species'] = { in: 'query', description: 'Filtro por espécie (ex: Gato,Cachorro)', type: 'string' }
    #swagger.parameters['ageCategory'] = { in: 'query', description: 'Filtro por idade (Filhote,Adulto,Idoso)', type: 'string' }
    #swagger.parameters['sex'] = { in: 'query', description: 'Filtro por sexo (Macho,Femea)', type: 'string' }
    #swagger.parameters['size'] = { in: 'query', description: 'Filtro por porte (Pequeno,Medio,Grande)', type: 'string' }
    #swagger.parameters['isOng'] = { in: 'query', description: 'Filtro por ONG (true/false)', type: 'boolean' }
    #swagger.parameters['page'] = { in: 'query', description: 'Número da página', type: 'integer' }
    #swagger.parameters['limit'] = { in: 'query', description: 'Limite de resultados por página', type: 'integer' }
  */
  try {
    const userId = req.user.id;
    const { species, ageCategory, sex, size, isOng, page, limit } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Busca todas as interações do usuário
    const userInteractions = await prisma.petInteraction.findMany({
      where: { userId },
      select: { petId: true },
    });
    const interactedPetIds = userInteractions.map(i => i.petId);

    // Filtros 
    const andFilters = [
      { adopted: false },
      { ownerId: { not: userId } } // Não mostrar pets do próprio usuário
    ];
 
    if (isOng !== undefined && isOng !== null && isOng !== '') {
      const isOngValue = String(isOng).toLowerCase() === 'true';
      andFilters.push({ owner: { isOng: isOngValue } });
    }
    const speciesValues = parseMultiValueString(species);
    if (speciesValues.length > 0) {
      andFilters.push({ species: { in: speciesValues } });
    }

    const ageCategoryValues = parseMultiValueString(ageCategory);
    if (ageCategoryValues.length > 0) {
      andFilters.push({ age: { in: ageCategoryValues } });
    }

     const sexValues = parseMultiValueString(sex);
    if (sexValues.length > 0) {
      andFilters.push({ sex: { in: sexValues } });
    }
    const sizeValues = parseMultiValueString(size);
    if (sizeValues.length > 0) {
      andFilters.push({ size: { in: sizeValues } });
    }

    // Buscar pets com os quais o usuário AINDA NÃO interagiu
    let whereClause = {
      AND: [
        ...andFilters,
        { id: { notIn: interactedPetIds } },
      ],
    };

    let total = await prisma.pet.count({ where: whereClause });
    let pets = await prisma.pet.findMany({
      where: whereClause,
      include: { photos: true, owner: true },
      skip: skip,
      take: limitNum
    });

    //Se não houver pets novos, busca os descartados (com os mesmos filtros)
    if (pets.length === 0) {
      const discardedInteractions = await prisma.petInteraction.findMany({
        where: { userId, type: 'DISCARDED' },
        select: { petId: true },
      });
      const discardedPetIds = discardedInteractions.map(i => i.petId);

      if (discardedPetIds.length > 0) {
         whereClause = {
          AND: [
            ...andFilters,
            { id: { in: discardedPetIds } },
          ],
        };
        total = await prisma.pet.count({ where: whereClause });
        pets = await prisma.pet.findMany({
          where: whereClause,
          include: { photos: true, owner: true },
          skip: skip,
          take: limitNum
        });
      }
    }

    // Embaralhar a lista de pets da página atual e adicionar links
    const shuffledPets = shuffleArray(pets);
    const petsWithLinks = shuffledPets.map(pet => addPetLinks(pet, req));
    
    const links = generatePetListLinks({ req, page: pageNum, limit: limitNum, total });

    res.json({
        data: petsWithLinks,
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        _links: links,
    });

  } catch (error) {
    console.error("Erro ao buscar pets para o usuário:", error);
    res.status(500).json({ error: "Erro ao buscar pets." });
  }
}

export async function getUserInteractions(req, res) {
  /*
    #swagger.tags = ["Interactions"]
    #swagger.summary = "Lista as interações de um usuário (favoritados ou descartados)"
    #swagger.security = [{"bearerAuth": []}]
    #swagger.parameters['type'] = { in: 'query', description: 'O tipo de interação a ser listada (FAVORITED ou DISCARDED)', required: true, type: 'string' }
    #swagger.parameters['page'] = { in: 'query', description: 'Número da página', type: 'integer' }
    #swagger.parameters['limit'] = { in: 'query', description: 'Limite de resultados por página', type: 'integer' }
  */
  try {
    const userId = req.user.id;
    const { type, page, limit } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    if (!type || (type !== 'FAVORITED' && type !== 'DISCARDED')) {
      return res.status(400).json({ error: "O parâmetro 'type' é obrigatório e deve ser FAVORITED ou DISCARDED." });
    }

    const where = {
      userId,
      type: type,
    };

    const total = await prisma.petInteraction.count({ where });

    const interactions = await prisma.petInteraction.findMany({
      where: where,
      include: {
        pet: {
          include: {
            photos: true,
            owner: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: skip,
      take: limitNum,
    });

    const pets = interactions.map(interaction => addPetLinks(interaction.pet, req));
    const links = generatePetListLinks({ req, page: pageNum, limit: limitNum, total });

    res.json({
      data: pets,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      _links: links,
    });
  } catch (error) {
    console.error("Erro ao listar interações do usuário:", error);
    res.status(500).json({ error: "Erro ao listar interações." });
  }
} 

export async function favoritePet(req, res){
  /*
    #swagger.tags = ["Interactions"]
    #swagger.summary = "Favorita um pet"
    #swagger.security = [{"bearerAuth": []}]
    #swagger.responses[201] = {
      description: "Pet favoritado com sucesso."
    }
    #swagger.responses[400] = {
      description: "Erro ao favoritar pet."
    }
    #swagger.responses[404] = {

  */
  try {
    const {userId, petId, type} = req.body;

    const interaction = await prisma.petInteraction.create({
      data: {
        userId,
        petId,  
        type,
      },
    });

    res.status(201).json(interaction);
  } catch (error) {
    console.error("Erro ao favoritar pet:", error);
    res.status(500).json({ error: "Erro ao favoritar pet." });
  }
  
}