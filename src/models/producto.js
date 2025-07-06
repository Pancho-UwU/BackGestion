import { error } from 'node:console';
import db from '../db/db.js'
import crypto from 'node:crypto';   // ESM
import { string } from 'zod/v4';

export class producto_modelo {

    static async getProductoBarCode(barCode) { // ✅ Cambiar {input} por {barCode}
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
            .where('barCode.codigoGuardad', barCode.toString()) // ✅ Corregir 'barcode' por 'barCode'
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
        price, stock, url) {
        const generarCodigoBarras = (nombre, marca) => {
        const nombreLimpio = nombre.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const marcaLimpia = marca.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const baseString = `${nombreLimpio}_${marcaLimpia}`;
        const hash = crypto.createHash('md5').update(baseString).digest('hex');
        const codigo = hash.substring(0, 12).replace(/[a-f]/g, (match) => {
            return String.fromCharCode(match.charCodeAt(0) - 87 + 48);
            }).replace(/[^0-9]/g, '').padEnd(12, '0').substring(0, 12);
        return codigo;
        };
        try{
            const productExist = await db('producto').whereRaw('LOWER(producto.nombre) = LOWER(?)',[name]).count({total: '*'}).first();
            if(productExist.total !==0){
                return {
                    estado: false,
                    message: 'El producto ya existe.'
                }
            }
            const marcaExist = await db('proveedor').select('proveedorId').whereRaw('LOWER(proveedor.empresa) = LOWER(?)',[brand]).first();
            if(!marcaExist){
                return {
                    estado: false,
                    message: 'el proveedor no existe, creelo antes.'
                }
            }  
            const codigoGenerado = generarCodigoBarras(name, brand);
            const urlOptimizada = `https://barcode.orcascan.com/?type=code128&data=${codigoGenerado}&format=svg&width=300&height=80&layout=landscape&text=${codigoGenerado}`;
            const codigoBarra = {
                codigoGuardad:codigoGenerado,
                formato: 'CODE128',
                url: urlOptimizada
            }
            const [barCodeId] = await db('barCode').insert(codigoBarra) ;
            const productoInsert= {
                nombre:name,
                categoria: category,
                marca: brand,
                imagenUrl: url|| null,
                pais: country,
                caracteristicas: characteristics,
                precio: price,
                stock: stock,
                estado: true,
                proveedorId: marcaExist.proveedorId,
                barCodeId: barCodeId
            }
            const [productoId] = await db('producto').insert(productoInsert);
            const datosProducto = await db('producto').select('*').where('productoId',productoId)
            return {
                estado:true,
                message:'Datos insertados correctamente',
                data: datosProducto
            }
            
        }
        catch(err){
            throw new Error('Error en la inserción de los datos' + err.message);
        }

    } 
    static async putProduct(nombre,price,stock, productoId){
        try{
            if(productoId === undefined){
                return{
                    message: 'id del producto no enviada',
                    estado: false
                }
            }
            console.log("precio: ",price, " Stock: ",stock )
            const {total} = await db('producto').where('productoId',productoId).count({total:'*'}).first();
            if(Number(total)===0){
                return{message: 'Producto no existe',
                    estado: false
                }
            }
            if(price === 0 && stock ===0 && nombre === ""){
                return{
                    message:'los datos no pueden ser 0 o vacio',
                    estado: false
                }
            }
            const produtoActual = await db('producto').where('productoId',productoId).first()
            await db('producto').where('productoId',productoId).update({
                precio: price!==undefined? price: produtoActual.precio,
                stock: stock!==undefined ? stock: produtoActual.stock,
                nombre: nombre!==undefined ? nombre:produtoActual.nombre
            })

            const produtoya = await db('producto').where('productoId',productoId).first()
            return {
                message:'producto actualizado con exito',
                estado:true,
                data: produtoya
            }
        }catch(err){
            throw new Error('Error actualizar el producto' + err.message)
        }
    }
    static async deleteProducto(productoId){
        try{
            if(productoId === undefined){
                return{
                    message: 'Id no entregada',
                    estado:false
                }
                
            }
        const producto = await db('producto').where('productoId',productoId);
        if(!producto){
            return{
                    message: 'Id no encontrada',
                    estado:false
                }
        }
        await db('producto').where('productoId',productoId).update({estado: !producto.estado})
        return {message:'estado actualizado',
            estado:true
        }
        }catch(err){
            throw new Error('Error actualizar el producto' + err.message)
        }
    }
    static async getProductName(name){
        try{
            if(name === undefined){
                return{
                    message: 'Id no encontrada',
                    estado:false
                }
            }
            const productoSeleccionado = await db('producto').where('nombre',name);
            return {
                message : "Datos encontrados",
                estado :true,
                data:productoSeleccionado};
             
        }catch(err){
            throw new Error('Error obtener el producto' + err.message)
        }
    }

}