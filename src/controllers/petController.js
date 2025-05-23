import { PrismaClient } from '@prisma/client';
import cloudinary from '../config/cloudinary.js';
import { generatePetListLinks } from '../utils/hateos.js';

const prisma = new PrismaClient();

// Criar pet
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

    const ownerIdParsed = parseInt(ownerId);
    if (isNaN(ownerIdParsed)) {
      return res.status(400).json({ error: "ownerId inválido." });
    }

    const owner = await prisma.user.findUnique({ where: { id: ownerIdParsed } });
    if (!owner) {
      return res.status(404).json({ error: "Dono (owner) não encontrado." });
    }

    // Upload das imagens no Cloudinary
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
        owner: { connect: { id: ownerIdParsed } },
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

// Buscar todos os pets
export async function getPets(req, res) {
  /*
    #swagger.tags = ["Pets"]
    #swagger.summary = "Lista todos os pets"
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

// Buscar pet por ID
export async function getPetById(req, res) {
  /*
    #swagger.tags = ["Pets"]
    #swagger.summary = "Busca um pet pelo ID"
    #swagger.parameters['id'] = {
      in: 'path',
      description: 'ID do pet',
      required: true,
      type: 'integer'
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
    const id = parseInt(req.params.id);
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

// Atualizar pet
export async function updatePet(req, res) {
  /*
    #swagger.tags = ["Pets"]
    #swagger.summary = "Atualiza os dados de um pet"
    #swagger.parameters['id'] = {
      in: 'path',
      description: 'ID do pet',
      required: true,
      type: 'integer'
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
    const id = parseInt(req.params.id);
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

    // Deleta fotos antigas do Cloudinary
    for (const photo of existingPet.photos) {
      if (photo.publicId) {
        await cloudinary.uploader.destroy(photo.publicId);
      }
    }

    await prisma.petPhoto.deleteMany({ where: { petId: id } });

    // Upload novas fotos
    let uploadedPhotos = [];
    if (Array.isArray(photos)) {
      const uploadPromises = photos.map(async (photo) => {
        const result = await cloudinary.uploader.upload(photo, { folder: 'pets' });
        return { url: result.secure_url, publicId: result.public_id };
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

// Deletar pet
export async function deletePet(req, res) {
  /*
    #swagger.tags = ["Pets"]
    #swagger.summary = "Deleta um pet pelo ID"
    #swagger.parameters['id'] = {
      in: 'path',
      description: 'ID do pet',
      required: true,
      type: 'integer'
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
    const id = parseInt(req.params.id);

    const pet = await prisma.pet.findUnique({
      where: { id },
      include: { photos: true }
    });

    if (!pet) {
      return res.status(404).json({ error: "Pet não encontrado." });
    }

    // Deleta fotos do Cloudinary
    for (const photo of pet.photos) {
      if (photo.publicId) {
        await cloudinary.uploader.destroy(photo.publicId);
      }
    }

    await prisma.petPhoto.deleteMany({ where: { petId: id } });
    await prisma.pet.delete({ where: { id } });

    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    res.json({
      message: "Pet deletado com sucesso.",
      _links: {
        list: `${baseUrl}/pets`,
        create: `${baseUrl}/pets`
      }
    });

  } catch (error) {
    console.error("Erro ao deletar pet:", error);
    res.status(500).json({ error: "Erro ao deletar pet." });
  }
}
