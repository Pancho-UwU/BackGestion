import db from '../db/db.js'

export class producto_modelo {
    static async getProductoBarCode({barCode}) { // ✅ Cambiar {input} por {barCode}
        try {
            console.log('Código recibido en modelo:', barCode); // Debug
            
            const producto_db = await db('producto').select(
                'producto.productoId', // Agregué ID
                'producto.nombre',
                'producto.categoria',
                'producto.marca',
                'producto.pais',
                'producto.caracteristicas',
                'producto.precio',
                'producto.stock',
                'producto.estado',
                'barCode.codigoGuardad', // Agregué código
                'barCode.url'
            )
            .join('barCode', 'producto.barCodeId', 'barCode.barCodeId')
            .where('barCode.codigoGuardad', barCode) // ✅ Corregir 'barcode' por 'barCode'
            .andWhere('producto.estado', true) // Solo productos activos
            .first();
            
            console.log('Resultado BD:', producto_db ? 'Encontrado' : 'No encontrado'); // Debug
            return producto_db || null;
            
        } catch(error) {
            console.error('Error al obtener los datos:', error);
            throw new Error('Error en consulta básica: ' + error.message);
        }
    }
    static async getAll(){
        return await db('producto').select(
            'producto.productoId', 
            'producto.nombre',
            'producto.categoria',
            'producto.marca',
            'producto.pais',
            'producto.caracteristicas',
            'producto.precio',
            'producto.stock',
            'producto.estado',
            'barCode.codigoGuardad', 
            'barCode.url'
        )
        .join('barCode','producto.barCodeId','barcode.barCodeId')
    }
}