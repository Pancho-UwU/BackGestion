import { proveedor_modelo } from "../models/proveedor.js";
export class proveedor_controller {
    static async getAll(req,res){
        try{
            const result = await proveedor_modelo.getAll();
            if(result.length == 0  ){return res.status(404).json({message:'No existen proveedores.'})}
            return res.status(200).json(result)
        }
        catch(error){
            return res.status(500).json({message:'Error en el servidor'+error.message});
        }
    }
}