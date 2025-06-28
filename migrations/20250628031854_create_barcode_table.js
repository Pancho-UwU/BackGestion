/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    return knex.schema.createTable('barCode',table=>{
        table.increments('barCodeId').notNullable(),
        table.string('codigoGuardad').notNullable(),
        table.string('formato').notNullable(),
        table.string('url');
    })
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex){
    return knex.schema.dropTable('barcode');
}
