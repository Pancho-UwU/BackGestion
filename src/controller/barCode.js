import { barCode_modole } from "../models/barCode.js";
import fetch from "node-fetch";

export class barcode_controller{
    static async getSVG(req,res)
    {
        const {barCodeId} = req.params
        if(!barCodeId) return res.status(404).json({message:"Id no enviada"});
        try{
            const result = await barCode_modole.obtenerCodigoBarra({barCodeId});
            
            if(result == null) return res.status(404).json({message:"Dato no encontrado"});
            const responde = await fetch(result)
            if(!responde.ok){
                return res.status(500).send('Error al obtener el código de barras');
            }
            let svg = await responde.text();

            // 🧹 Eliminar rectángulo de fondo (espacio blanco)
            svg = svg.replace(/<rect[^>]*fill="#ffffff"[^>]*\/>/gi, '');

        
            res.setHeader("Content-Type", "image/svg+xml");
            return res.send(svg);

        
            
        }catch(error){
            return res.status(500).json({message:"Problemas en el servidor " + error.message})
        }
    }
}