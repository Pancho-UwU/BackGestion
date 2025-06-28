/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    return knex.schema.createTable('producto',table =>{
        table.increments('productoId'),
        table.string('nombre').notNullable(),
        table.string('categoria').notNullable(),
        table.string('marca').notNullable(),
        table.string('imagenUrl'),
        table.string('pais').notNullable(),
        table.decimal('precio',10,2).notNullable(),
        table.integer('stock').notNullable(),
        table.boolean('estado').notNullable(),
        table.integer('proveedorId').unsigned().references('proveedor').inTable('proveedorId'),
        table.integer('barCodeId').unsigned().references('barCode').inTable('barCodeId');
    })
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
    return knex.schema.dropTable('producto')
};
