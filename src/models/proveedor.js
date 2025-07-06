import db from '../db/db.js'

export class proveedor_modelo{
    static async getAll(){
        try{
            const proveedores = await db('proveedor').select('*');
            return proveedores;
        }
        catch(error){
            throw new error('Error al obtener los proveedores' + error.message);
        }
    }
}