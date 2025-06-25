export function generatePetListLinks({ req, page, limit, total }) {
  const totalPages = Math.ceil(total / limit);
  const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
  return {
    self: `${baseUrl}?page=${page}&limit=${limit}`,
    next: page < totalPages ? `${baseUrl}?page=${page + 1}&limit=${limit}` : null,
    prev: page > 1 ? `${baseUrl}?page=${page - 1}&limit=${limit}` : null,
    first: `${baseUrl}?page=1&limit=${limit}`,
    last: `${baseUrl}?page=${totalPages}&limit=${limit}`
  };
}

export function addPetLinks(pet, req) {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return {
    ...pet,
    _links: {
      self: { href: `${baseUrl}/api/pets/${pet.id}` },
      owner: { href: `${baseUrl}/api/users/${pet.ownerId}` }
    }
  };
}

