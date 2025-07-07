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
    static async getFilter(input)
    {
        try{
            if(input === undefined){
                return{
                    message: 'Id no encontrada',
                    estado:false
                }
            }
            const prooverdorFilter = await db('proveedor')
                                            .orWhere('nombre','like',`%${input}`)
                                            .orWhere('empresa','like',`%${input}`)
                                            .orWhere('fono','like',`%${input}`)
                                            .orWhere('coordenadas','like',`%${input}`)
                                            .orWhere('tipoProducto','like',`%${input}`);
            return {
                message : "Datos encontrados",
                estado :true,
                data:prooverdorFilter};
        }
        catch(error){
            throw new error('Error al obtener los proveedores' + error.message);
        }
    }
}