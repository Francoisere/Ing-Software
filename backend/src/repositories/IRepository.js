/**
 * PRINCIPIO DIP (SOLID) - Contrato base de repositorio
 * 
 * Los servicios dependen de esta abstracción, NO de MySQL directamente.
 * En producción se inyecta MySqlXxxRepository.
 * En tests se inyecta MockXxxRepository.
 */
class IRepository {
  async findAll()        { throw new Error('findAll() no implementado'); }
  async findById(id)     { throw new Error('findById() no implementado'); }
  async create(data)     { throw new Error('create() no implementado'); }
  async update(id, data) { throw new Error('update() no implementado'); }
  async delete(id)       { throw new Error('delete() no implementado'); }
}

module.exports = { IRepository };
