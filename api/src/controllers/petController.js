import { PrismaClient } from '@prisma/client';
import cloudinary from '../config/cloudinary.js';
import { generatePetListLinks } from '../utils/hateos.js';

// Helper function to parse comma-separated string query parameters into an array
const parseMultiValueString = (value) => {
  if (!value || typeof value !== 'string') return [];
  return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
};

const prisma = new PrismaClient();

// Função auxiliar para extrair o publicId de uma URL do Cloudinary
function extractPublicIdFromUrl(url) {
  const parts = url.split('/upload/');
  if (parts.length < 2) return null;
  // Remove parâmetros de query e extensão
  const path = parts[1].split('.')[0];
  return path;
}
//////////////////////////////////////////////////
export async function createPet(req, res) {
  /*
    #swagger.tags = ["Pets"]
    #swagger.summary = "Cadastra um novo pet"
    #swagger.requestBody = {
      required: true,
      schema: { $ref: "#/components/schemas/Pet" }
    }
    #swagger.responses[201] = {
      description: "Pet cadastrado com sucesso"
    }
    #swagger.responses[400] = {
      description: "Dados inválidos"
    }
    #swagger.responses[404] = {
      description: "Dono não encontrado"
    }
    #swagger.responses[500] = {
      description: "Erro ao cadastrar pet"
    }
  */
  try {
    const {
      name, species, size, age, sex,
      castrated, dewormed, vaccinated,
      description, ownerId, photos
    } = req.body;

    if (req.body.id !== undefined) {
      return res.status(400).json({ error: "O campo 'id' não deve ser enviado na criação." });
    }

    // Força ownerId para string (resolve o erro do Prisma)
    const ownerIdStr = String(ownerId);

    const owner = await prisma.user.findUnique({ where: { id: ownerIdStr } });
    if (!owner) {
      return res.status(404).json({ error: "Dono (owner) não encontrado." });
    }

    let uploadedPhotos = [];
    if (Array.isArray(photos)) {
      const uploadPromises = photos.map(async (photo) => {
        const result = await cloudinary.uploader.upload(photo, { folder: 'pets' });
        return { url: result.secure_url, publicId: result.public_id };
      });
      uploadedPhotos = await Promise.all(uploadPromises);
    }

    const pet = await prisma.pet.create({
      data: {
        name, species, size, age, sex,
        castrated, dewormed, vaccinated,
        description,
        owner: { connect: { id: ownerIdStr } },
        photos: {
          create: uploadedPhotos.map(p => ({
            url: p.url,
            publicId: p.publicId
          }))
        }
      },
      include: {
        photos: true,
        owner: true
      }
    });

    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    res.status(201).json({
      message: "Pet cadastrado com sucesso.",
      pet,
      _links: {
        self: `${baseUrl}/pets/${pet.id}`,
        list: `${baseUrl}/pets`,
        update: `${baseUrl}/pets/${pet.id}`,
        delete: `${baseUrl}/pets/${pet.id}`
      }
    });

  } catch (error) {
    console.error("Erro ao cadastrar pet:", error);
    res.status(500).json({ error: "Erro ao cadastrar pet." });
  }
}

export async function getPets(req, res) {
  /*
    #swagger.tags = ["Pets"]
    #swagger.summary = "Lista todos os pets"
    #swagger.security = []
    #swagger.responses[200] = {
      description: "Pets encontrados com sucesso"
    }
    #swagger.responses[500] = {
      description: "Erro ao buscar pets"
    }
  */
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const [pets, total] = await Promise.all([
      prisma.pet.findMany({
        skip,
        take: limit,
        include: { photos: true, owner: true }
      }),
      prisma.pet.count()
    ]);

    const links = generatePetListLinks({ req, page, limit, total });

    res.json({
      data: pets,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      _links: links
    });
  } catch (error) {
    console.error("Erro ao buscar pets:", error);
    res.status(500).json({ error: "Erro ao buscar pets." });
  }
}

export async function getPetById(req, res) {
  /*
    #swagger.tags = ["Pets"]
    #swagger.summary = "Busca um pet pelo ID"
    #swagger.security = []
    #swagger.parameters['id'] = {
      in: 'path',
      description: 'ID do pet',
      required: true,
      type: 'string'
    }
    #swagger.responses[200] = {
      description: "Pet encontrado com sucesso"
    }
    #swagger.responses[404] = {
      description: "Pet não encontrado"
    }
    #swagger.responses[500] = {
      description: "Erro ao buscar pet"
    }
  */
  try {
    const id = req.params.id; // já é string
    const pet = await prisma.pet.findUnique({
      where: { id },
      include: {
        photos: true,
        owner: true
      }
    });

    if (!pet) {
      return res.status(404).json({ error: "Pet não encontrado." });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    res.json({
      ...pet,
      _links: {
        self: `${baseUrl}/${pet.id}`,
        list: `${baseUrl}`,
        update: `${baseUrl}/${pet.id}`,
        delete: `${baseUrl}/${pet.id}`
      }
    });

  } catch (error) {
    console.error("Erro ao buscar pet:", error);
    res.status(500).json({ error: "Erro ao buscar pet." });
  }
}

export async function updatePet(req, res) {
  /*
    #swagger.tags = ["Pets"]
    #swagger.summary = "Atualiza os dados de um pet"
    #swagger.parameters['id'] = {
      in: 'path',
      description: 'ID do pet',
      required: true,
      type: 'string'
    }
    #swagger.requestBody = {
      required: true,
      schema: { $ref: "#/components/schemas/Pet" }
    }
    #swagger.responses[200] = {
      description: "Pet atualizado com sucesso"
    }
    #swagger.responses[404] = {
      description: "Pet não encontrado"
    }
    #swagger.responses[500] = {
      description: "Erro ao atualizar pet"
    }
  */
  try {
    const id = req.params.id; // já é string
    const {
      name, species, size, age, sex,
      castrated, dewormed, vaccinated,
      description, photos
    } = req.body;

    const existingPet = await prisma.pet.findUnique({
      where: { id },
      include: { photos: true }
    });

    if (!existingPet) {
      return res.status(404).json({ error: "Pet não encontrado." });
    }

    for (const photo of existingPet.photos) {
      if (photo.publicId) {
        await cloudinary.uploader.destroy(photo.publicId);
      }
    }

    await prisma.petPhoto.deleteMany({ where: { petId: id } });

    let uploadedPhotos = [];
    if (Array.isArray(photos)) {
      const uploadPromises = photos.map(async (photo) => {
        if (typeof photo === 'string' && photo.startsWith('http')) {
          // Extrai o publicId da URL
          const publicId = extractPublicIdFromUrl(photo);
          return { url: photo, publicId };
        } else {
          const result = await cloudinary.uploader.upload(photo, { folder: 'pets' });
          return { url: result.secure_url, publicId: result.public_id };
        }
      });
      uploadedPhotos = await Promise.all(uploadPromises);
    }

    const updatedPet = await prisma.pet.update({
      where: { id },
      data: {
        name, species, size, age, sex,
        castrated, dewormed, vaccinated,
        description,
        photos: {
          create: uploadedPhotos.map(p => ({
            url: p.url,
            publicId: p.publicId
          }))
        }
      },
      include: {
        photos: true,
        owner: true
      }
    });

    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    res.json({
      message: "Pet atualizado com sucesso.",
      pet: updatedPet,
      _links: {
        self: `${baseUrl}/pets/${updatedPet.id}`,
        list: `${baseUrl}/pets`,
        update: `${baseUrl}/pets/${updatedPet.id}`,
        delete: `${baseUrl}/pets/${updatedPet.id}`
      }
    });

  } catch (error) {
    console.error("Erro ao atualizar pet:", error);
    res.status(500).json({ error: "Erro ao atualizar pet." });
  }
}

export async function deletePet(req, res) {
  /*
    #swagger.tags = ["Pets"]
    #swagger.summary = "Deleta um pet pelo ID"
    #swagger.parameters['id'] = {
      in: 'path',
      description: 'ID do pet',
      required: true,
      type: 'string'
    }
    #swagger.responses[200] = {
      description: "Pet deletado com sucesso"
    }
    #swagger.responses[404] = {
      description: "Pet não encontrado"
    }
    #swagger.responses[500] = {
      description: "Erro ao deletar pet"
    }
  */
  try {
    const id = req.params.id;
    const pet = await prisma.pet.findUnique({
      where: { id },
      include: { photos: true }
    });

    if (!pet) {
      return res.status(404).json({ error: "Pet não encontrado." });
    }

    // Delete photos from Cloudinary
    for (const photo of pet.photos) {
      if (photo.publicId) {
        await cloudinary.uploader.destroy(photo.publicId);
      }
    }

    // Delete photos from DB
    await prisma.petPhoto.deleteMany({ where: { petId: id } });
    // Delete pet
    await prisma.pet.delete({ where: { id } });

    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    res.json({
      message: "Pet deletado com sucesso.",
      _links: {
        list: `${baseUrl}/pets`, // Adjusted to list all pets
        create: `${baseUrl}/pets`  // Adjusted to create new pet
      }
    });

  } catch (error) {
    console.error("Erro ao deletar pet:", error);
    res.status(500).json({ error: "Erro ao deletar pet." });
  }
}

export async function searchPetsByPreferences(req, res) {
   /*
    #swagger.tags = ["Pets"]
    #swagger.summary = "Lista pets com base nas preferências do usuário (filtros aceitam múltiplos valores separados por vírgula)"
    #swagger.security = []
    
    #swagger.parameters['isOng'] = {
      in: 'query',
      description: 'Postado por ONG: true ou false',
      type: 'boolean',
      required: false
    }

    #swagger.parameters['species'] = {
      in: 'query',
      description: 'Espécies separadas por vírgula. Ex: Gato,Cachorro',
      type: 'string',
      required: false
    }

    #swagger.parameters['ageCategory'] = {
      in: 'query',
      description: 'Idade: Filhote,Adulto,Idoso (valores separados por vírgula)',
      type: 'string',
      required: false
    }

    #swagger.parameters['sex'] = {
      in: 'query',
      description: 'Sexo: Macho,Femea (valores separados por vírgula)',
      type: 'string',
      required: false
    }

    #swagger.parameters['size'] = {
      in: 'query',
      description: 'Porte: Pequeno,Medio,Grande (valores separados por vírgula)',
      type: 'string',
      required: false
    }

    #swagger.parameters['page'] = {
      in: 'query',
      description: 'Número da página',
      type: 'integer',
      required: false,
      default: 1
    }

    #swagger.parameters['limit'] = {
      in: 'query',
      description: 'Número de itens por página',
      type: 'integer',
      required: false,
      default: 15
    }

    #swagger.responses[200] = {
      description: "Pets encontrados com sucesso"
    }

    #swagger.responses[500] = {
      description: "Erro ao buscar pets"
    }
  */

  try {
    const { species, ageCategory, sex, size } = req.query;
    const isOngQuery = req.query.isOng; 
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const andFilters = [];

    if (isOngQuery !== undefined && isOngQuery !== null && isOngQuery !== '') {
      const isOngValue = String(isOngQuery).toLowerCase() === 'true';
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

    const prismaWhere = andFilters.length > 0 ? { AND: andFilters } : {};

    const [pets, total] = await Promise.all([
      prisma.pet.findMany({
        where: prismaWhere,
        include: {
          photos: true,
          owner: {
            select: { // Mantendo o select 
              id: true,
              name: true,
              email: true,
              phone: true,
              instagram: true,
              isOng: true,
              profilePicture: true,
              address: {
                select: {
                  city: true,
                  state: true,
                  cep: true
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.pet.count({ where: prismaWhere })
    ]);

    res.json({
      data: pets,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error("Erro ao buscar pets por preferências:", error);
    res.status(500).json({ error: "Erro ao buscar pets por preferências." });
  }
}

export async function getPetsByOwner(req, res) {
  /*
    #swagger.tags = ["Pets"]
    #swagger.summary = "Lista todos os pets de um usuário específico"
    #swagger.parameters['ownerId'] = {
      in: 'path',
      description: 'ID do usuário (dono dos pets)',
      required: true,
      type: 'string'
    }
    #swagger.parameters['page'] = {
      in: 'query',
      description: 'Número da página',
      type: 'integer',
      required: false,
      default: 1
    }
    #swagger.parameters['limit'] = {
      in: 'query',
      description: 'Número de itens por página',
      type: 'integer',
      required: false,
      default: 15
    }
    #swagger.responses[200] = {
      description: "Pets do usuário encontrados com sucesso"
    }
    #swagger.responses[404] = {
      description: "Usuário não encontrado"
    }
    #swagger.responses[500] = {
      description: "Erro ao buscar pets do usuário"
    }
  */
  try {
    const { ownerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    // Verificar se o usuário existe
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const where = { ownerId: ownerId };

    const [pets, total] = await Promise.all([
      prisma.pet.findMany({
        where,
        skip,
        take: limit,
        include: { photos: true, owner: true },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.pet.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);
    const baseUrl = `${req.protocol}://${req.get('host')}/api/users/${ownerId}/pets`;

    res.json({
      data: pets,
      page,
      limit,
      total,
      totalPages,
      _links: {
        first: `${baseUrl}?page=1&limit=${limit}`,
        last: `${baseUrl}?page=${totalPages}&limit=${limit}`,
        prev: page > 1 ? `${baseUrl}?page=${page - 1}&limit=${limit}` : null,
        next: page < totalPages ? `${baseUrl}?page=${page + 1}&limit=${limit}` : null,
      }
    });

  } catch (error) {
    console.error("Erro ao buscar pets do usuário:", error);
    res.status(500).json({ error: "Erro ao buscar pets do usuário." });
  }
}
