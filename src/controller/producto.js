
import {producto_modelo} from '../models/producto.js'
export class producto_controlador
{
    static async getProductoBarCode(req,res){
        
        let params = req.body
        if (!params.barCode){
            return res.status(404).json({message: "Codigo de barra no existe"});
        }
        try{
            const result = await producto_modelo.getProductoBarCode(params.barCode);
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
            const {estado, message,data} =await producto_modelo.create(params.name, 
                params.category,
                params.brand,
                params.country,
                params.characteristic,
                params.price,
                params.stock,
                params.url
            );
            if(!estado) {return res.status(401).json({message: message})}

            return res.status(201).json(data);
        } catch(err) {
            return res.status(500).json({message:'error en la base de datos ' + err.message});
        }

    }
    static async actualizarProducto(req,res){
        try{
            let params= req.body;
            const {estado, message, data} = await producto_modelo.putProduct(params.nombre,params.price,params.stock,params.productoId);
            if(!estado){
                return res.status(404).json({message:message});
            }
            return res.status(200).json(data)
        }catch(err){
            return res.status(500).json('Error en el servidor '+ err.message)
        }
        
    }
    static async deleteProduct(req,res){
        try{
            let params= req.params
            const {estado, message} = await producto_modelo.deleteProducto(params.productoId)
            if(!estado){
                return res.status(404).json(message)
            }
            return res.status(200).json({message:message})
        }
        catch(err){
            return res.status(500).json('Error en el servidor '+ err.message)
        }
    }
    static async getProductByName(req,res){
        try{
            let param= req.body
            const {estado,data,message} = await producto_modelo.getProductName(param.name);
             if(!estado){
                return res.status(404).json(message)
            } 
            return res.status(200).json(data)
        }
        catch(err){
            return res.status(500).json({message:'Error en el servidor '+ err.message})
        }
    }
}