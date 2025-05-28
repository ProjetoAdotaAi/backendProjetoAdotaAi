import { PrismaClient } from '@prisma/client';
import cloudinary from '../config/cloudinary.js';
import { generatePetListLinks } from '../utils/hateos.js';

const prisma = new PrismaClient();

export async function createPet(req, res) {
  try {
    const {
      name, species, size, age, sex,
      castrated, dewormed, vaccinated,
      description, ownerId, photos
    } = req.body;

    if (req.body.id !== undefined) {
      return res.status(400).json({ error: "O campo 'id' não deve ser enviado na criação." });
    }

    const owner = await prisma.user.findUnique({ where: { id: ownerId } });
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
        owner: { connect: { id: ownerId } },
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
  try {
    const id = req.params.id;
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
  try {
    const id = req.params.id;
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

export async function deletePet(req, res) {
  try {
    const id = req.params.id;

    const pet = await prisma.pet.findUnique({
      where: { id },
      include: { photos: true }
    });

    if (!pet) {
      return res.status(404).json({ error: "Pet não encontrado." });
    }

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
