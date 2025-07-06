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

    static async create(name, category, brand, country, characteristics,
        price, stock, state, code, url) {
        console.log(name);
        console.log(category);
        console.log(name);
        console.log(brand);
        console.log(country);
        console.log(characteristics);
        console.log(price);
        console.log(price);
        console.log(stock);
        console.log(state);
        console.log(code);
        console.log(url);

        db('producto').insert({
            nombre: name,
            categoria: category,
            marca: brand, 
            pais: country,
            caracteristicas: characteristics,
            precio: price,
            stock: stock,
            state: state,
            codigoGuardad: code,
            url: url
        });
    }

}