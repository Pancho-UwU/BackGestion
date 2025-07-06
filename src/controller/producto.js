
import {producto_modelo} from '../models/producto.js'
export class producto_controlador
{
    static async getProductoBarCode(req,res){
        console.log(req.params)
        const {barCode} = req.params
        if (!barCode){
            return res.status(404).json({message: "Codigo de barra no existe"});
        }
        try{
            const result = await producto_modelo.getProductoBarCode({barCode});
            if (result == null){
                return res.status(401).json({message:'El producto no existe'});
            }
            return res.status(200).json(result)
        }
        catch(error)
        {
            return res.status(500).json({message:'error en la base de datos' + error.message})
        }
    }
    static async getAll(req,res){
        try{
            const result = await producto_modelo.getAll();
            if(result.length == 0){
                return res.status(400).json({message:'problemas al obtener los datos'})
            } 
            return res.status(200).json(result);
        }catch(error)
        {
            return res.status(500).json({message:'error en la base de datos' + error.message})
        }
    }

    static async createProduct(req, res) {
        try {
            let params = req.body;
            console.log("Params: ")
            console.log(params);
            await producto_modelo.create(params.name, 
                params.category,
                params.brand,
                params.country,
                params.characteristic,
                params.price,
                params.stock,
                params.state,
                params.codigoGuardad,
                params.url
            );
            return res.status(200).json(req);
        } catch(error) {
            return res.status(500).json({message:'error en la base de datos ' + error.message});
        }

    }

    
}