import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import crypto from 'crypto';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const posiblesPaths = [
  path.join(__dirname, './utils/nombre_total_marca.csv'),
  path.join(__dirname, '../utils/nombre_total_marca.csv'),
  path.join(__dirname, './nombre_total_marca.csv'),
  path.join(__dirname, '../data/nombre_total_marca.csv'),
  './data/nombre_total_marca.csv',
  './utils/nombre_total_marca.csv',
  './nombre_total_marca.csv'
];

const encontrarCSV = () => {
  console.log('🔍 Buscando archivo CSV...');
  console.log('📂 Directorio actual del seeder:', __dirname);
  
  for (const csvPath of posiblesPaths) {
    console.log(`⏳ Verificando: ${csvPath}`);
    if (fs.existsSync(csvPath)) {
      console.log(`✅ ¡Archivo encontrado en: ${csvPath}`);
      return csvPath;
    }
  }
  
  return null;
};

const csvPath = encontrarCSV();

const capitalizar = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Función para generar SOLO el código de barras (sin insertar en BD)
const generarCodigoBarras = (nombre, marca) => {
  // Limpiar y concatenar nombre y marca
  const nombreLimpio = nombre.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const marcaLimpia = marca.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // Crear string base
  const baseString = `${nombreLimpio}_${marcaLimpia}`;
  
  // Generar hash único de 12 dígitos
  const hash = crypto.createHash('md5').update(baseString).digest('hex');
  
  // Tomar los primeros 12 caracteres y convertir a números
  const codigo = hash.substring(0, 12).replace(/[a-f]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 87 + 48); // convertir a-f a números
  }).replace(/[^0-9]/g, '').padEnd(12, '0').substring(0, 12);

  return codigo; // Solo retorna el código, no inserta en BD
};

// Función mejorada para obtener o crear proveedor
const obtenerProveedorId = async (marca) => {
  try {
    console.log(`🔍 Buscando proveedor para marca: "${marca}"`);
    
    // Buscar proveedor existente por empresa/marca (case insensitive)
    const proveedores = await db('proveedor')
      .select('proveedorId', 'empresa')
      .whereRaw('LOWER(empresa) = LOWER(?)', [marca])
      .limit(1);
    
    if (proveedores.length > 0) {
      console.log(`✅ Proveedor encontrado: ID ${proveedores[0].proveedorId} - ${proveedores[0].empresa}`);
      return proveedores[0].proveedorId;
    }
    
    // Si no existe, crear nuevo proveedor para esta marca
    console.log(`🏭 Creando nuevo proveedor para marca: "${marca}"`);
    
    const nuevoProveedor = {
      nombre: `Proveedor ${marca}`,
      empresa: marca,
      fono: '123456789',
      coordenadas: '-33.4489,-70.6693', // Santiago, Chile
      tipoProducto: 'Productos Varios',
      correo: `contacto@${marca.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.com`
    };
    
    const [proveedorId] = await db('proveedor')
      .insert(nuevoProveedor)
      .returning('proveedorId');
    
    console.log(`✅ Nuevo proveedor creado: ID ${proveedorId} - ${marca}`);
    return proveedorId;
    
  } catch (error) {
    console.error(`❌ Error obteniendo/creando proveedor para marca "${marca}":`, error.message);
    
    // Fallback: buscar cualquier proveedor existente
    try {
      console.log('🔄 Intentando usar proveedor existente como fallback...');
      const cualquierProveedor = await db('proveedor').select('proveedorId').limit(1);
      
      if (cualquierProveedor.length > 0) {
        console.log(`⚠️  Usando proveedor existente como fallback: ID ${cualquierProveedor[0].proveedorId}`);
        return cualquierProveedor[0].proveedorId;
      }
    } catch (fallbackError) {
      console.error('❌ Error en fallback:', fallbackError.message);
    }
    
    throw new Error(`No se pudo obtener o crear proveedor para marca: ${marca}`);
  }
};

const seedProductos = async () => {
  try {
    console.log('🌱 Iniciando seeder de productos...');

    // Verificar que encontramos el archivo CSV
    if (!csvPath) {
      console.log('\n❌ No se encontró el archivo nombre_total_marca.csv en ninguna de estas ubicaciones:');
      posiblesPaths.forEach(p => console.log(`   - ${p}`));
      console.log('\n💡 Coloca tu archivo nombre_total_marca.csv en una de estas rutas o ajusta la ruta en el código.\n');
      throw new Error('Archivo CSV no encontrado');
    }

    console.log(`📁 Usando archivo: ${csvPath}`);

    const productosData = []; // Array para los datos de productos

    // Leer CSV con Promise
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          // Solo mostrar las primeras 3 filas para no saturar la consola
          if (productosData.length < 3) {
            console.log('📄 Fila leída:', row);
          }
          
          const nuevoProducto = {
            nombre: capitalizar(row.nombre || row.Nombre || ''),
            categoria: capitalizar(row.area || row.categoria || ''),
            marca: capitalizar(row.Marca || row.marca || 'Sin Marca'),
            imagenUrl: null,
            pais: capitalizar(row.pais || row.Pais || 'Chile'),
            caracteristicas: row.caracteristica || row.caracteristicas || '',
            precio: parseFloat(row.precio) || 0.0,
            stock: parseInt(row.stock) || 5,
            estado: true
          };

          productosData.push(nuevoProducto);
        })
        .on('end', () => {
          console.log(`📊 ${productosData.length} productos procesados del CSV`);
          resolve();
        })
        .on('error', (error) => {
          console.error('❌ Error leyendo CSV:', error.message);
          reject(error);
        });
    });

    if (productosData.length === 0) {
      console.log('⚠️  No hay datos para insertar');
      console.log('💡 Verifica que tu CSV tenga las columnas: nombre, area, Marca, pais, caracteristica');
      return;
    }

    console.log('📋 Muestra de los primeros datos a insertar:');
    console.log(productosData[0]);

    // Verificar que las tablas existen
    const tablaProductoExiste = await db.schema.hasTable('producto');
    const tablaBarCodeExiste = await db.schema.hasTable('barCode');
    const tablaProveedorExiste = await db.schema.hasTable('proveedor');
    
    if (!tablaProductoExiste) {
      throw new Error('Tabla "producto" no existe. Ejecuta las migraciones primero.');
    }
    
    if (!tablaBarCodeExiste) {
      throw new Error('Tabla "barCode" no existe. Ejecuta las migraciones primero.');
    }
    
    if (!tablaProveedorExiste) {
      throw new Error('Tabla "proveedor" no existe. Ejecuta las migraciones primero.');
    }

    console.log('✅ Todas las tablas encontradas');

    // Mostrar proveedores existentes ANTES de empezar
    console.log('\n📋 Proveedores existentes en la base de datos:');
    const proveedoresExistentes = await db('proveedor').select('proveedorId', 'empresa', 'nombre');
    if (proveedoresExistentes.length > 0) {
      proveedoresExistentes.forEach(p => {
        console.log(`   🏢 ID: ${p.proveedorId} - ${p.empresa} (${p.nombre})`);
      });
    } else {
      console.log('   ⚠️  No hay proveedores existentes - se crearán nuevos');
    }

    // SOLO limpiar productos y códigos de barras (NO proveedores)
    console.log('\n🧹 Limpiando SOLO productos y códigos de barras (conservando proveedores)...');
    await db('producto').del();
    await db('barCode').del();
    console.log('✅ Productos y códigos de barras eliminados - Proveedores conservados');

    console.log('\n📦 Procesando productos y códigos de barras...');
    
    // Cache para proveedores (evitar consultas repetidas)
    const cacheProveedores = new Map();
    let productosInsertados = 0;
    let erroresCount = 0;
    
    // Procesar cada producto
    for (let i = 0; i < productosData.length; i++) {
      const producto = productosData[i];
      
      try {
        // Obtener o crear proveedor (con cache)
        let proveedorId;
        if (cacheProveedores.has(producto.marca)) {
          proveedorId = cacheProveedores.get(producto.marca);
          console.log(`📋 Usando proveedor en cache para "${producto.marca}": ID ${proveedorId}`);
        } else {
          proveedorId = await obtenerProveedorId(producto.marca);
          cacheProveedores.set(producto.marca, proveedorId);
        }

        // Generar código de barras
        const codigoBarras = generarCodigoBarras(producto.nombre, producto.marca);
        
        // URL optimizada para impresora POS 5890F (58mm papel térmico)
        const nombreCorto = producto.nombre.substring(0, 20); // Máximo 20 caracteres para 58mm
        const urlOptimizada = `https://barcode.orcascan.com/?type=code128&data=${codigoBarras}&format=png&width=300&height=80&layout=landscape&text=${encodeURIComponent(nombreCorto)}`;
        
        // Insertar código de barras
        const [barCodeId] = await db('barCode').insert({
          codigoGuardad: codigoBarras,
          formato: 'CODE128',
          url: urlOptimizada // Optimizado para POS 5890F
        }).returning('barCodeId');

        // Insertar producto con referencias
        await db('producto').insert({
          nombre: producto.nombre,
          categoria: producto.categoria,
          marca: producto.marca,
          imagenUrl: producto.imagenUrl,
          pais: producto.pais,
          caracteristicas: producto.caracteristicas,
          precio: producto.precio,
          stock: producto.stock,
          estado: producto.estado,
          proveedorId: proveedorId,
          barCodeId: barCodeId
        });

        productosInsertados++;

        if (productosInsertados % 10 === 0) {
          console.log(`✅ Procesados ${productosInsertados}/${productosData.length} productos...`);
        }

      } catch (error) {
        erroresCount++;
        console.error(`❌ Error procesando producto ${i + 1} "${producto.nombre}" (marca: ${producto.marca}):`, error.message);
        
        // Si hay muchos errores consecutivos, detener
        if (erroresCount > 5 && productosInsertados === 0) {
          console.error('💥 Demasiados errores consecutivos. Deteniendo el proceso.');
          throw new Error('Proceso detenido por múltiples errores');
        }
        
        // Continuar con el siguiente producto
        continue;
      }
    }

    console.log(`\n🎉 Proceso completado:`);
    console.log(`   ✅ Productos insertados: ${productosInsertados}`);
    console.log(`   ❌ Errores: ${erroresCount}`);
    
    if (productosInsertados === 0) {
      console.log('\n⚠️  No se insertó ningún producto. Revisa los errores anteriores.');
      return;
    }
    
    // Mostrar estadísticas finales
    console.log('\n📊 Estadísticas finales:');
    const totalProductos = await db('producto').count('* as total');
    const totalBarCodes = await db('barCode').count('* as total');
    const totalProveedores = await db('proveedor').count('* as total');
    
    console.log(`   🛍️  Productos: ${totalProductos[0].total}`);
    console.log(`   📦 Códigos de barras: ${totalBarCodes[0].total}`);
    console.log(`   🏢 Proveedores: ${totalProveedores[0].total}`);
    
    // Mostrar algunos ejemplos de códigos generados
    console.log('\n📋 Ejemplos de productos insertados:');
    const ejemplos = await db('producto')
      .join('barCode', 'producto.barCodeId', 'barCode.barCodeId')
      .join('proveedor', 'producto.proveedorId', 'proveedor.proveedorId')
      .select('producto.nombre', 'producto.marca', 'barCode.codigoGuardad', 'proveedor.empresa')
      .limit(5);
    
    ejemplos.forEach(ejemplo => {
      console.log(`   📦 ${ejemplo.nombre} (${ejemplo.marca}) → ${ejemplo.codigoGuardad}`);
      console.log(`      🏢 Proveedor: ${ejemplo.empresa}`);
    });

    // Mostrar distribución por proveedores
    console.log('\n🏢 Productos por proveedor:');
    const proveedoresPorProducto = await db('proveedor')
      .select('proveedor.empresa', 'proveedor.proveedorId')
      .count('producto.productoId as total_productos')
      .leftJoin('producto', 'proveedor.proveedorId', 'producto.proveedorId')
      .groupBy('proveedor.proveedorId', 'proveedor.empresa')
      .orderBy('total_productos', 'desc');
    
    proveedoresPorProducto.forEach(prov => {
      console.log(`   🏭 ${prov.empresa}: ${prov.total_productos} productos`);
    });

  } catch (error) {
    console.error('❌ Error en seeder:', error.message);
    throw error;
  } finally {
    // Cerrar conexión a la base de datos
    await db.destroy();
    console.log('\n🔒 Conexión a la base de datos cerrada');
  }
};

// Ejecutar seeder
const ejecutarSeeder = async () => {
  try {
    await seedProductos();
    console.log('🎉 Seeder completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('💥 Error ejecutando seeder:', error.message);
    console.log('\n💡 Sugerencias:');
    console.log('   1. Verifica que las tablas existan (ejecuta migraciones)');
    console.log('   2. Revisa que el archivo CSV tenga las columnas correctas');
    console.log('   3. Verifica la conexión a la base de datos');
    process.exit(1);
  }
};

// Función para ayudar a debug la estructura de carpetas
const mostrarEstructura = () => {
  console.log('\n📁 Estructura de carpetas actual:');
  console.log('   📂 Directorio del seeder:', __dirname);
  
  try {
    const contenido = fs.readdirSync(__dirname);
    console.log('   📂 Contenido del directorio actual:');
    contenido.forEach(item => {
      const itemPath = path.join(__dirname, item);
      const esDirectorio = fs.statSync(itemPath).isDirectory();
      console.log(`      ${esDirectorio ? '📁' : '📄'} ${item}`);
    });
  } catch (error) {
    console.log('   ❌ No se pudo leer el directorio');
  }
  console.log('\n');
};

// Mostrar estructura para debug
mostrarEstructura();

// Ejecutar automáticamente
ejecutarSeeder();