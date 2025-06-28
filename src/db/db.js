import config from '../../knexfile.js';
import knex from 'knex';

const db =knex(config.development);
export default db;
