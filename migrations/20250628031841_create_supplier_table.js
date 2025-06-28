/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up (knex) {
  return knex.schema.createTable('proveedor', table =>{
    table.increments('proveedorId'),
    table.string('nombre'),
    table.string('empresa').notNullable(),
    table.string('fono'),
    table.string('coordenadas').notNullable(),
    table.string('tipoProducto').notNullable(),
    table.string('correo');
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('proveedor');
};
