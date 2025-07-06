import db from  '../db/db.js'

export class barCode_modole{
    static async obtenerCodigoBarra({barCodeId})
    {
        try{
            console.log('Codigo de barra id es: ' , barCodeId)
            const urlCodigoBarra = await db('barCode')
            .select('barCode.url')
            .join('producto','producto.barCodeId','barCode.barCodeId')
            .where('barCode.barCodeId', barCodeId).first()
            console.log("URL ENCONTRADA: ", urlCodigoBarra ? "encontrada": "no encontrada")
            console.log(urlCodigoBarra)
            return urlCodigoBarra.url || null;
        }
        catch(error){
            console.log(error)
            throw new error('El error encontrado fue ' + error.message);
        }
    }
}